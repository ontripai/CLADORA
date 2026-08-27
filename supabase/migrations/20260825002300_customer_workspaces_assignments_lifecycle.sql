begin;

create type platform.workspace_type as enum ('ASSOCIATION', 'PROPERTY_MANAGER', 'OWNER_PORTFOLIO', 'HYBRID');
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
create type platform.workspace_environment as enum ('PILOT', 'PRODUCTION');

create table platform.customer_workspaces (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references platform.tenants(id) on delete restrict,
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

create index customer_workspaces_tenant_idx on platform.customer_workspaces (tenant_id);
create index customer_workspaces_status_idx on platform.customer_workspaces (lifecycle_status);
create index customer_workspaces_env_idx on platform.customer_workspaces (environment);

create table platform.platform_customer_assignments (
  id uuid primary key default gen_random_uuid(),
  platform_user_id uuid not null references platform.platform_users(id) on delete cascade,
  customer_workspace_id uuid not null references platform.customer_workspaces(id) on delete cascade,
  scope_type text not null default 'workspace' check (scope_type in ('workspace', 'commercial', 'technical', 'support')),
  scope_id text,
  valid_from timestamptz not null default statement_timestamp(),
  valid_until timestamptz,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  assigned_by uuid references auth.users(id) on delete set null,
  assignment_reason text not null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  revoke_reason text,
  created_at timestamptz not null default statement_timestamp()
);

create index platform_customer_assignments_lookup_idx on platform.platform_customer_assignments
  (platform_user_id, customer_workspace_id, status);

create or replace function app_private.has_customer_assignment(
  p_workspace_id uuid,
  p_scope_type text default null
)
returns boolean
language sql stable security definer
set search_path = pg_catalog, platform
as $$
  select exists (
    select 1
    from platform.platform_customer_assignments a
    join platform.platform_users u on u.id = a.platform_user_id
    where u.auth_user_id = auth.uid()
      and u.status = 'active'
      and u.deactivated_at is null
      and a.customer_workspace_id = p_workspace_id
      and a.status = 'active'
      and a.valid_from <= statement_timestamp()
      and (a.valid_until is null or a.valid_until > statement_timestamp())
      and (p_scope_type is null or a.scope_type = p_scope_type or a.scope_type = 'workspace')
  );
$$;
revoke all on function app_private.has_customer_assignment(uuid, text) from public;
grant execute on function app_private.has_customer_assignment(uuid, text) to authenticated, service_role;

create or replace function app_private.can_access_platform_workspace(
  p_workspace_id uuid
)
returns boolean
language sql stable security definer
set search_path = pg_catalog, platform
as $$
  select (
    app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
    or app_private.has_platform_role('PLATFORM_AUDITOR')
    or app_private.has_customer_assignment(p_workspace_id, null)
  );
$$;
revoke all on function app_private.can_access_platform_workspace(uuid) from public;
grant execute on function app_private.can_access_platform_workspace(uuid) to authenticated, service_role;

create or replace function platform.create_customer_workspace(
  p_tenant_id uuid,
  p_workspace_type platform.workspace_type,
  p_commercial_owner text,
  p_environment platform.workspace_environment default 'PILOT'
)
returns platform.customer_workspaces
language plpgsql security definer
set search_path = pg_catalog, platform, audit
as $$
declare
  v_actor_id uuid := auth.uid();
  v_workspace platform.customer_workspaces;
begin
  if not (
    app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
    or app_private.has_platform_role('PLATFORM_OPERATIONS')
  ) then
    raise exception 'access_denied: insufficient privileges to create customer workspace'
      using errcode = '42501';
  end if;

  if length(trim(coalesce(p_commercial_owner, ''))) = 0 then
    raise exception 'invalid_owner: commercial_owner must not be empty'
      using errcode = '22023';
  end if;

  if not exists (select 1 from platform.tenants where id = p_tenant_id) then
    raise exception 'tenant_not_found: %', p_tenant_id
      using errcode = 'P0002';
  end if;

  insert into platform.customer_workspaces (
    tenant_id,
    workspace_type,
    lifecycle_status,
    commercial_owner,
    environment,
    version,
    created_at,
    updated_at
  ) values (
    p_tenant_id,
    p_workspace_type,
    'LEAD',
    trim(p_commercial_owner),
    coalesce(p_environment, 'PILOT'),
    1,
    statement_timestamp(),
    statement_timestamp()
  )
  returning * into v_workspace;

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
    'CUSTOMER_WORKSPACE_CREATED',
    'customer_workspace',
    v_workspace.id,
    jsonb_build_object(
      'tenant_id', v_workspace.tenant_id,
      'workspace_type', v_workspace.workspace_type,
      'lifecycle_status', v_workspace.lifecycle_status,
      'environment', v_workspace.environment,
      'version', v_workspace.version
    ),
    'Created new customer workspace in LEAD status',
    statement_timestamp()
  );

  return v_workspace;
end;
$$;
revoke all on function platform.create_customer_workspace(uuid, platform.workspace_type, text, platform.workspace_environment) from public;
grant execute on function platform.create_customer_workspace(uuid, platform.workspace_type, text, platform.workspace_environment) to authenticated, service_role;

create or replace function platform.update_workspace_metadata(
  p_workspace_id uuid,
  p_commercial_owner text,
  p_reason text
)
returns platform.customer_workspaces
language plpgsql security definer
set search_path = pg_catalog, platform, audit
as $$
declare
  v_actor_id uuid := auth.uid();
  v_workspace platform.customer_workspaces;
  v_before_owner text;
begin
  if not (
    app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
    or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(p_workspace_id, 'workspace'))
  ) then
    raise exception 'access_denied: insufficient privileges to update workspace metadata'
      using errcode = '42501';
  end if;

  if length(trim(coalesce(p_commercial_owner, ''))) = 0 then
    raise exception 'invalid_owner: commercial_owner must not be empty'
      using errcode = '22023';
  end if;

  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'invalid_reason: update reason must not be empty'
      using errcode = '22023';
  end if;

  select * into v_workspace from platform.customer_workspaces
  where id = p_workspace_id
  for update;

  if not found then
    raise exception 'workspace_not_found: %', p_workspace_id
      using errcode = 'P0002';
  end if;

  v_before_owner := v_workspace.commercial_owner;

  update platform.customer_workspaces
  set commercial_owner = trim(p_commercial_owner),
      updated_at = statement_timestamp()
  where id = p_workspace_id
  returning * into v_workspace;

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
    'WORKSPACE_METADATA_UPDATED',
    'customer_workspace',
    v_workspace.id,
    jsonb_build_object('commercial_owner', v_before_owner),
    jsonb_build_object('commercial_owner', v_workspace.commercial_owner),
    p_reason,
    statement_timestamp()
  );

  return v_workspace;
end;
$$;
revoke all on function platform.update_workspace_metadata(uuid, text, text) from public;
grant execute on function platform.update_workspace_metadata(uuid, text, text) to authenticated, service_role;

create or replace function platform.grant_customer_assignment(
  p_platform_user_id uuid,
  p_customer_workspace_id uuid,
  p_scope_type text default 'workspace',
  p_scope_id text default null,
  p_valid_until timestamptz default null,
  p_reason text default 'Administrative assignment'
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
    raise exception 'invalid_target_user: user % not active or found', p_platform_user_id
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
    coalesce(p_scope_type, 'workspace'),
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
      'platform_user_id', v_assignment.platform_user_id,
      'customer_workspace_id', v_assignment.customer_workspace_id,
      'scope_type', v_assignment.scope_type,
      'status', v_assignment.status
    ),
    p_reason,
    statement_timestamp()
  );

  return v_assignment;
end;
$$;
revoke all on function platform.grant_customer_assignment(uuid, uuid, text, text, timestamptz, text) from public;
grant execute on function platform.grant_customer_assignment(uuid, uuid, text, text, timestamptz, text) to authenticated, service_role;

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
  where id = p_assignment_id and status = 'active'
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
set search_path = pg_catalog, platform, audit, app_private
as $$
declare
  v_ws platform.customer_workspaces;
  v_valid_transition boolean := false;
  v_actor uuid := auth.uid();
  v_now timestamptz := statement_timestamp();
  v_before_status platform.workspace_lifecycle_status;
  v_before_version integer;
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
      using errcode = 'P0001';
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
    raise exception 'illegal_transition: cannot transition from % to %', v_ws.lifecycle_status, p_target_status
      using errcode = '22000';
  end if;

  if v_ws.environment = 'PRODUCTION' and p_target_status = 'ACTIVE' then
    raise exception 'activation_blocked: ENG-010 invitation prerequisite must be completed for PRODUCTION activation'
      using errcode = '55000';
  end if;

  v_before_status := v_ws.lifecycle_status;
  v_before_version := v_ws.version;

  update platform.customer_workspaces
  set
    lifecycle_status = p_target_status,
    version = version + 1,
    updated_at = v_now,
    activated_at = case when p_target_status = 'ACTIVE' and activated_at is null then v_now else activated_at end,
    suspended_at = case when p_target_status = 'SUSPENDED' then v_now else suspended_at end,
    terminated_at = case when p_target_status = 'TERMINATED' then v_now else terminated_at end,
    archived_at = case when p_target_status = 'ARCHIVED' then v_now else archived_at end
  where id = p_workspace_id
  returning * into v_ws;

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
    v_actor,
    'PLATFORM_CONTROL_PLANE',
    'WORKSPACE_LIFECYCLE_TRANSITION',
    'customer_workspace',
    v_ws.id,
    jsonb_build_object('status', v_before_status, 'version', v_before_version),
    jsonb_build_object('status', v_ws.lifecycle_status, 'version', v_ws.version),
    p_reason,
    v_now
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
  or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(id, 'workspace'))
  or (app_private.has_platform_role('PLATFORM_FINANCE') and app_private.has_customer_assignment(id, 'commercial'))
  or (app_private.has_platform_role('PLATFORM_SUPPORT') and (app_private.has_customer_assignment(id, 'support') or app_private.has_customer_assignment(id, 'workspace')))
);

create policy platform_customer_assignments_select on platform.platform_customer_assignments for select to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_AUDITOR')
  or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(customer_workspace_id, 'workspace'))
  or platform_user_id = app_private.current_platform_user_id()
);

create policy service_customer_workspaces_all on platform.customer_workspaces for all to service_role using (true) with check (true);
create policy service_platform_assignments_all on platform.platform_customer_assignments for all to service_role using (true) with check (true);

grant select on platform.customer_workspaces, platform.platform_customer_assignments to authenticated;
grant all on platform.customer_workspaces, platform.platform_customer_assignments to service_role;

commit;
