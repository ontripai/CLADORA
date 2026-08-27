begin;

create type platform.workspace_type as enum (
  'ASSOCIATION',
  'PROPERTY_MANAGER',
  'OWNER_PORTFOLIO',
  'HYBRID'
);

create type platform.workspace_lifecycle_status as enum (
  'LEAD',
  'UNDER_REVIEW',
  'APPROVED',
  'CONTRACT_PENDING',
  'PAYMENT_PENDING',
  'PROVISIONING',
  'ACTIVE',
  'PAST_DUE',
  'SUSPENDED',
  'TERMINATED',
  'ARCHIVED'
);

create type platform.workspace_environment as enum (
  'PILOT',
  'PRODUCTION'
);

create table platform.customer_workspaces (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references platform.tenants(id) on delete restrict,
  workspace_type platform.workspace_type not null,
  lifecycle_status platform.workspace_lifecycle_status not null default 'LEAD',
  commercial_owner text not null,
  environment platform.workspace_environment not null default 'PILOT',
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  activated_at timestamptz,
  suspended_at timestamptz,
  terminated_at timestamptz,
  archived_at timestamptz
);

create index customer_workspaces_status_idx on platform.customer_workspaces (lifecycle_status, environment);
create index customer_workspaces_tenant_idx on platform.customer_workspaces (tenant_id);

create trigger customer_workspaces_updated_at before update on platform.customer_workspaces for each row execute function app_private.set_updated_at();

create table platform.platform_customer_assignments (
  id uuid primary key default gen_random_uuid(),
  platform_user_id uuid not null references platform.platform_users(id) on delete cascade,
  customer_workspace_id uuid not null references platform.customer_workspaces(id) on delete cascade,
  scope_type text not null default 'workspace' check (scope_type in ('workspace','commercial','technical','support','audit')),
  scope_id uuid,
  valid_from timestamptz not null default statement_timestamp(),
  valid_until timestamptz,
  status text not null default 'active' check (status in ('active','revoked','expired')),
  assigned_by uuid references auth.users(id) on delete restrict,
  assignment_reason text not null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete restrict,
  revoke_reason text,
  created_at timestamptz not null default statement_timestamp(),
  check (valid_until is null or valid_until > valid_from)
);

create index platform_customer_assignments_lookup_idx on platform.platform_customer_assignments (platform_user_id, customer_workspace_id, status, scope_type);
create index platform_customer_assignments_validity_idx on platform.platform_customer_assignments (valid_from, valid_until);

create or replace function app_private.has_customer_assignment(target_workspace uuid, required_scope text default 'workspace')
returns boolean language sql stable security definer
set search_path = pg_catalog, platform
as $$
  select exists (
    select 1 from platform.platform_customer_assignments ca
    join platform.platform_users pu on pu.id = ca.platform_user_id
    where pu.auth_user_id = auth.uid()
      and pu.status = 'active'
      and pu.deactivated_at is null
      and ca.customer_workspace_id = target_workspace
      and ca.status = 'active'
      and (ca.scope_type = required_scope or ca.scope_type = 'workspace')
      and ca.valid_from <= statement_timestamp()
      and (ca.valid_until is null or ca.valid_until > statement_timestamp())
  );
$$;
revoke all on function app_private.has_customer_assignment(uuid, text) from public;
grant execute on function app_private.has_customer_assignment(uuid, text) to authenticated, service_role;

create or replace function app_private.can_access_platform_workspace(target_workspace uuid, required_role platform.platform_role_type default null)
returns boolean language plpgsql stable security definer
set search_path = pg_catalog, platform
as $$
declare
  v_user_id uuid;
  v_status platform.workspace_lifecycle_status;
begin
  v_user_id := app_private.current_platform_user_id();
  if v_user_id is null then
    return false;
  end if;

  if required_role is not null and not app_private.has_platform_role(required_role) then
    return false;
  end if;

  select lifecycle_status into v_status from platform.customer_workspaces where id = target_workspace;
  if v_status is null then
    return false;
  end if;

  if app_private.has_platform_role('PLATFORM_SUPER_ADMIN') or app_private.has_platform_role('PLATFORM_AUDITOR') then
    return true;
  end if;

  return app_private.has_customer_assignment(target_workspace, 'workspace');
end;
$$;
revoke all on function app_private.can_access_platform_workspace(uuid, platform.platform_role_type) from public;
grant execute on function app_private.can_access_platform_workspace(uuid, platform.platform_role_type) to authenticated, service_role;

create or replace function platform.grant_customer_assignment(
  p_platform_user_id uuid,
  p_customer_workspace_id uuid,
  p_scope_type text default 'workspace',
  p_scope_id uuid default null,
  p_valid_until timestamptz default null,
  p_reason text default 'standard assignment'
)
returns platform.platform_customer_assignments
language plpgsql security definer
set search_path = pg_catalog, platform, audit
as $$
declare
  v_actor_id uuid := auth.uid();
  v_assignment platform.platform_customer_assignments;
  v_target_user platform.platform_users;
begin
  if not (
    app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
    or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(p_customer_workspace_id, 'workspace'))
  ) then
    raise exception 'access_denied: insufficient privileges to grant customer assignment'
      using errcode = '42501';
  end if;

  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'invalid_reason: assignment reason must not be empty'
      using errcode = '22023';
  end if;

  if p_valid_until is not null and p_valid_until <= statement_timestamp() then
    raise exception 'invalid_validity: valid_until must be in the future'
      using errcode = '22023';
  end if;

  select * into v_target_user from platform.platform_users
  where id = p_platform_user_id and status = 'active' and deactivated_at is null;

  if not found then
    raise exception 'target_user_not_found_or_inactive: %', p_platform_user_id
      using errcode = 'P0002';
  end if;

  if not exists (select 1 from platform.customer_workspaces where id = p_customer_workspace_id) then
    raise exception 'workspace_not_found: %', p_customer_workspace_id
      using errcode = 'P0002';
  end if;

  insert into platform.platform_customer_assignments (
    platform_user_id,
    customer_workspace_id,
    scope_type,
    scope_id,
    valid_from,
    valid_until,
    status,
    assigned_by,
    assignment_reason
  ) values (
    p_platform_user_id,
    p_customer_workspace_id,
    p_scope_type,
    p_scope_id,
    statement_timestamp(),
    p_valid_until,
    'active',
    v_actor_id,
    p_reason
  )
  returning * into v_assignment;

  insert into audit.events (
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    after_snapshot,
    reason,
    occurred_at
  ) values (
    v_actor_id,
    'PLATFORM_CONTROL_PLANE',
    'CUSTOMER_ASSIGNMENT_GRANTED',
    'platform_customer_assignment',
    v_assignment.id,
    jsonb_build_object(
      'platform_user_id', p_platform_user_id,
      'customer_workspace_id', p_customer_workspace_id,
      'scope_type', p_scope_type
    ),
    p_reason,
    statement_timestamp()
  );

  return v_assignment;
end;
$$;
revoke all on function platform.grant_customer_assignment(uuid, uuid, text, uuid, timestamptz, text) from public;
grant execute on function platform.grant_customer_assignment(uuid, uuid, text, uuid, timestamptz, text) to authenticated, service_role;

create or replace function platform.revoke_customer_assignment(
  p_assignment_id uuid,
  p_reason text
)
returns platform.platform_customer_assignments
language plpgsql security definer
set search_path = pg_catalog, platform, audit
as $$
declare
  v_actor_id uuid := auth.uid();
  v_assignment platform.platform_customer_assignments;
begin
  select * into v_assignment from platform.platform_customer_assignments
  where id = p_assignment_id
  for update;

  if not found then
    raise exception 'assignment_not_found: %', p_assignment_id
      using errcode = 'P0002';
  end if;

  if not (
    app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
    or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(v_assignment.customer_workspace_id, 'workspace'))
  ) then
    raise exception 'access_denied: insufficient privileges to revoke customer assignment'
      using errcode = '42501';
  end if;

  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'invalid_reason: revoke reason must not be empty'
      using errcode = '22023';
  end if;

  update platform.platform_customer_assignments
  set status = 'revoked',
      revoked_at = statement_timestamp(),
      revoked_by = v_actor_id,
      revoke_reason = p_reason
  where id = p_assignment_id
  returning * into v_assignment;

  insert into audit.events (
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    before_snapshot,
    after_snapshot,
    reason,
    occurred_at
  ) values (
    v_actor_id,
    'PLATFORM_CONTROL_PLANE',
    'CUSTOMER_ASSIGNMENT_REVOKED',
    'platform_customer_assignment',
    v_assignment.id,
    jsonb_build_object('status', 'active'),
    jsonb_build_object('status', 'revoked'),
    p_reason,
    statement_timestamp()
  );

  return v_assignment;
end;
$$;
revoke all on function platform.revoke_customer_assignment(uuid, text) from public;
grant execute on function platform.revoke_customer_assignment(uuid, text) to authenticated, service_role;

create or replace function platform.transition_workspace_lifecycle(
  p_workspace_id uuid,
  p_target_status platform.workspace_lifecycle_status,
  p_expected_version integer,
  p_reason text
)
returns platform.customer_workspaces
language plpgsql security definer
set search_path = pg_catalog, platform, audit
as $$
declare
  v_actor_id uuid := auth.uid();
  v_ws platform.customer_workspaces;
  v_before_status platform.workspace_lifecycle_status;
  v_before_version integer;
  v_valid_transition boolean := false;
  v_activated timestamptz;
  v_suspended timestamptz;
  v_terminated timestamptz;
  v_archived timestamptz;
begin
  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'invalid_reason: lifecycle transition reason must not be empty'
      using errcode = '22023';
  end if;

  if p_target_status = 'ARCHIVED' then
    if not app_private.has_platform_role('PLATFORM_SUPER_ADMIN') then
      raise exception 'access_denied: only PLATFORM_SUPER_ADMIN can archive a workspace'
        using errcode = '42501';
    end if;
  else
    if not (
      app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
      or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(p_workspace_id, 'workspace'))
    ) then
      raise exception 'access_denied: insufficient privileges to transition workspace lifecycle'
        using errcode = '42501';
    end if;
  end if;

  select * into v_ws from platform.customer_workspaces
  where id = p_workspace_id
  for update;

  if not found then
    raise exception 'workspace_not_found: %', p_workspace_id
      using errcode = 'P0002';
  end if;

  if v_ws.version <> p_expected_version then
    raise exception 'concurrency_conflict: expected version % does not match actual %', p_expected_version, v_ws.version
      using errcode = 'P0004';
  end if;

  if v_ws.lifecycle_status = 'ARCHIVED' then
    raise exception 'illegal_transition: archived workspaces are immutable'
      using errcode = '22000';
  end if;

  if v_ws.lifecycle_status = 'TERMINATED' and p_target_status <> 'ARCHIVED' then
    raise exception 'illegal_transition: terminated workspaces can only transition to ARCHIVED'
      using errcode = '22000';
  end if;

  case v_ws.lifecycle_status
    when 'LEAD' then
      v_valid_transition := p_target_status in ('UNDER_REVIEW', 'TERMINATED');
    when 'UNDER_REVIEW' then
      v_valid_transition := p_target_status in ('APPROVED', 'LEAD', 'TERMINATED');
    when 'APPROVED' then
      v_valid_transition := p_target_status in ('CONTRACT_PENDING', 'TERMINATED');
    when 'CONTRACT_PENDING' then
      v_valid_transition := p_target_status in ('PAYMENT_PENDING', 'APPROVED', 'TERMINATED');
    when 'PAYMENT_PENDING' then
      v_valid_transition := p_target_status in ('PROVISIONING', 'CONTRACT_PENDING', 'TERMINATED');
    when 'PROVISIONING' then
      v_valid_transition := p_target_status in ('ACTIVE', 'PAYMENT_PENDING', 'SUSPENDED', 'TERMINATED');
    when 'ACTIVE' then
      v_valid_transition := p_target_status in ('PAST_DUE', 'SUSPENDED', 'TERMINATED');
    when 'PAST_DUE' then
      v_valid_transition := p_target_status in ('ACTIVE', 'SUSPENDED', 'TERMINATED');
    when 'SUSPENDED' then
      v_valid_transition := p_target_status in ('ACTIVE', 'PAST_DUE', 'TERMINATED');
    when 'TERMINATED' then
      v_valid_transition := p_target_status = 'ARCHIVED';
    else
      v_valid_transition := false;
  end case;

  if not v_valid_transition then
    raise exception 'illegal_transition: cannot transition workspace from % to %', v_ws.lifecycle_status, p_target_status
      using errcode = '22000';
  end if;

  if p_target_status = 'ACTIVE' then
    if v_ws.environment = 'PRODUCTION' then
      raise exception 'activation_blocked: ENG-010 invitation prerequisite must be completed for PRODUCTION activation'
        using errcode = '55000';
    end if;
  end if;

  v_before_status := v_ws.lifecycle_status;
  v_before_version := v_ws.version;

  v_activated := case when p_target_status = 'ACTIVE' and v_ws.activated_at is null then statement_timestamp() else v_ws.activated_at end;
  v_suspended := case when p_target_status = 'SUSPENDED' then statement_timestamp() else v_ws.suspended_at end;
  v_terminated := case when p_target_status = 'TERMINATED' then statement_timestamp() else v_ws.terminated_at end;
  v_archived := case when p_target_status = 'ARCHIVED' then statement_timestamp() else v_ws.archived_at end;

  update platform.customer_workspaces
  set lifecycle_status = p_target_status,
      version = v_ws.version + 1,
      activated_at = v_activated,
      suspended_at = v_suspended,
      terminated_at = v_terminated,
      archived_at = v_archived,
      updated_at = statement_timestamp()
  where id = p_workspace_id
  returning * into v_ws;

  insert into audit.events (
    tenant_id,
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    before_snapshot,
    after_snapshot,
    reason,
    occurred_at
  ) values (
    v_ws.tenant_id,
    v_actor_id,
    'PLATFORM_CONTROL_PLANE',
    'WORKSPACE_LIFECYCLE_TRANSITION',
    'customer_workspace',
    v_ws.id,
    jsonb_build_object('status', v_before_status, 'version', v_before_version),
    jsonb_build_object('status', p_target_status, 'version', v_ws.version),
    p_reason,
    statement_timestamp()
  );

  return v_ws;
end;
$$;
revoke all on function platform.transition_workspace_lifecycle(uuid, platform.workspace_lifecycle_status, integer, text) from public;
grant execute on function platform.transition_workspace_lifecycle(uuid, platform.workspace_lifecycle_status, integer, text) to authenticated, service_role;

alter table platform.customer_workspaces enable row level security;
alter table platform.platform_customer_assignments enable row level security;

create policy customer_workspaces_select on platform.customer_workspaces for select to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_AUDITOR')
  or app_private.has_customer_assignment(id, 'workspace')
  or app_private.has_customer_assignment(id, 'commercial')
  or app_private.has_customer_assignment(id, 'technical')
  or app_private.has_customer_assignment(id, 'support')
  or app_private.has_customer_assignment(id, 'audit')
);

create policy customer_workspaces_insert on platform.customer_workspaces for insert to authenticated
with check (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_OPERATIONS')
);

create policy customer_workspaces_update on platform.customer_workspaces for update to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(id, 'workspace'))
)
with check (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(id, 'workspace'))
);

create policy platform_customer_assignments_select on platform.platform_customer_assignments for select to authenticated
using (
  platform_user_id = app_private.current_platform_user_id()
  or app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_AUDITOR')
  or (
    app_private.has_platform_role('PLATFORM_OPERATIONS')
    and app_private.has_customer_assignment(customer_workspace_id, 'workspace')
  )
);

create policy service_customer_workspaces_all on platform.customer_workspaces for all to service_role using (true) with check (true);
create policy service_customer_assignments_all on platform.platform_customer_assignments for all to service_role using (true) with check (true);

grant select on platform.customer_workspaces, platform.platform_customer_assignments to authenticated;
grant insert, update on platform.customer_workspaces to authenticated;
grant all on platform.customer_workspaces, platform.platform_customer_assignments to service_role;

commit;
