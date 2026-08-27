begin;

create type platform.workspace_invitation_status as enum (
  'draft',
  'sent',
  'accepted',
  'expired',
  'revoked'
);

create table platform.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  customer_workspace_id uuid not null references platform.customer_workspaces(id) on delete cascade,
  normalized_email text not null,
  role_id uuid not null references identity.roles(id) on delete restrict,
  scope_type identity.scope_type not null default 'tenant',
  token_hash bytea not null unique,
  status platform.workspace_invitation_status not null default 'sent',
  expires_at timestamptz not null,
  invited_by uuid not null references auth.users(id) on delete restrict,
  invitation_reason text not null,
  accepted_by uuid references auth.users(id) on delete restrict,
  accepted_at timestamptz,
  revoked_by uuid references auth.users(id) on delete restrict,
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  check (normalized_email = lower(trim(normalized_email))),
  check (normalized_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  check (expires_at > created_at),
  check (
    (status = 'accepted' and accepted_by is not null and accepted_at is not null and revoked_at is null)
    or (status = 'revoked' and revoked_by is not null and revoked_at is not null and length(trim(coalesce(revoke_reason, ''))) > 0)
    or (status in ('draft','sent','expired') and accepted_by is null and accepted_at is null)
  )
);

create unique index workspace_invitations_active_unique
  on platform.workspace_invitations (
    customer_workspace_id,
    normalized_email,
    role_id,
    scope_type
  )
  where status in ('draft','sent');

create index workspace_invitations_workspace_status_idx
  on platform.workspace_invitations (customer_workspace_id, status, expires_at);
create index workspace_invitations_role_id_idx
  on platform.workspace_invitations (role_id);
create index workspace_invitations_invited_by_idx
  on platform.workspace_invitations (invited_by);
create index workspace_invitations_accepted_by_idx
  on platform.workspace_invitations (accepted_by);
create index workspace_invitations_revoked_by_idx
  on platform.workspace_invitations (revoked_by);

create trigger workspace_invitations_updated_at
before update on platform.workspace_invitations
for each row execute function app_private.set_updated_at();

create or replace function platform.create_workspace_invitation(
  p_workspace_id uuid,
  p_email text,
  p_role_id uuid,
  p_scope_type identity.scope_type default 'tenant',
  p_expires_in interval default interval '72 hours',
  p_reason text default null
)
returns table (
  invitation_id uuid,
  invitation_token text,
  invitation_expires_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, platform, identity, audit, app_private, extensions
as $$
declare
  v_actor uuid := auth.uid();
  v_platform_user_id uuid := app_private.current_platform_user_id();
  v_workspace platform.customer_workspaces;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_token text;
  v_token_hash bytea;
  v_invitation platform.workspace_invitations;
  v_role_tenant uuid;
begin
  if v_actor is null or v_platform_user_id is null then
    raise exception 'access_denied: authenticated platform user required'
      using errcode = '42501';
  end if;

  if not (
    app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
    or (
      app_private.has_platform_role('PLATFORM_OPERATIONS')
      and app_private.has_customer_assignment(p_workspace_id, 'workspace')
    )
  ) then
    raise exception 'access_denied: insufficient workspace invitation privileges'
      using errcode = '42501';
  end if;

  select * into v_workspace
  from platform.customer_workspaces
  where id = p_workspace_id
  for update;

  if not found then
    raise exception 'workspace_not_found: %', p_workspace_id
      using errcode = 'P0002';
  end if;

  if v_workspace.lifecycle_status <> 'PROVISIONING' then
    raise exception 'workspace_not_provisioning: workspace must be in PROVISIONING state'
      using errcode = '55000';
  end if;

  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'invalid_email: normalized email is invalid'
      using errcode = '22023';
  end if;

  if p_expires_in < interval '15 minutes' or p_expires_in > interval '72 hours' then
    raise exception 'invalid_expiry: invitation lifetime must be between 15 minutes and 72 hours'
      using errcode = '22023';
  end if;

  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'invalid_reason: invitation reason is required'
      using errcode = '22023';
  end if;

  select tenant_id into v_role_tenant
  from identity.roles
  where id = p_role_id;

  if not found then
    raise exception 'role_not_found: %', p_role_id
      using errcode = 'P0002';
  end if;

  if v_role_tenant is not null and v_role_tenant <> v_workspace.tenant_id then
    raise exception 'role_workspace_mismatch: role does not belong to workspace tenant'
      using errcode = '22023';
  end if;

  update platform.workspace_invitations
  set status = 'expired'
  where customer_workspace_id = p_workspace_id
    and normalized_email = v_email
    and role_id = p_role_id
    and scope_type = p_scope_type
    and status in ('draft','sent')
    and expires_at <= statement_timestamp();

  if exists (
    select 1 from platform.workspace_invitations
    where customer_workspace_id = p_workspace_id
      and normalized_email = v_email
      and role_id = p_role_id
      and scope_type = p_scope_type
      and status in ('draft','sent')
      and expires_at > statement_timestamp()
  ) then
    raise exception 'active_invitation_exists: an active invitation already exists'
      using errcode = '23505';
  end if;

  v_token := replace(replace(replace(
    encode(extensions.gen_random_bytes(32), 'base64'),
    '+', '-'
  ), '/', '_'), '=', '');
  v_token_hash := extensions.digest(v_token, 'sha256');

  insert into platform.workspace_invitations (
    customer_workspace_id,
    normalized_email,
    role_id,
    scope_type,
    token_hash,
    status,
    expires_at,
    invited_by,
    invitation_reason
  ) values (
    p_workspace_id,
    v_email,
    p_role_id,
    p_scope_type,
    v_token_hash,
    'sent',
    statement_timestamp() + p_expires_in,
    v_actor,
    trim(p_reason)
  )
  returning * into v_invitation;

  insert into audit.events (
    tenant_id,
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    reason,
    occurred_at
  ) values (
    v_workspace.tenant_id,
    v_actor,
    'PLATFORM_CONTROL_PLANE',
    'WORKSPACE_INVITATION_CREATED',
    'workspace_invitation',
    v_invitation.id,
    trim(p_reason),
    statement_timestamp()
  );

  return query
  select v_invitation.id, v_token, v_invitation.expires_at;
end;
$$;

revoke all on function platform.create_workspace_invitation(uuid, text, uuid, identity.scope_type, interval, text) from public;
grant execute on function platform.create_workspace_invitation(uuid, text, uuid, identity.scope_type, interval, text)
  to authenticated, service_role;

create or replace function platform.validate_workspace_invitation(
  p_token text
)
returns table (
  invitation_id uuid,
  customer_workspace_id uuid,
  invitation_status platform.workspace_invitation_status,
  invitation_expires_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, platform, extensions
as $$
  select i.id, i.customer_workspace_id, i.status, i.expires_at
  from platform.workspace_invitations i
  where length(coalesce(p_token, '')) >= 40
    and i.token_hash = extensions.digest(p_token, 'sha256')
    and i.status = 'sent'
    and i.expires_at > statement_timestamp()
  limit 1;
$$;

revoke all on function platform.validate_workspace_invitation(text) from public;
grant usage on schema platform to anon;
grant execute on function platform.validate_workspace_invitation(text)
  to anon, authenticated, service_role;

create or replace function platform.revoke_workspace_invitation(
  p_invitation_id uuid,
  p_reason text
)
returns platform.workspace_invitations
language plpgsql
security definer
set search_path = pg_catalog, platform, audit, app_private
as $$
declare
  v_actor uuid := auth.uid();
  v_invitation platform.workspace_invitations;
  v_workspace platform.customer_workspaces;
begin
  if v_actor is null or app_private.current_platform_user_id() is null then
    raise exception 'access_denied: authenticated platform user required'
      using errcode = '42501';
  end if;

  select * into v_invitation
  from platform.workspace_invitations
  where id = p_invitation_id
  for update;

  if not found then
    raise exception 'invitation_not_found: %', p_invitation_id
      using errcode = 'P0002';
  end if;

  if not (
    app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
    or (
      app_private.has_platform_role('PLATFORM_OPERATIONS')
      and app_private.has_customer_assignment(v_invitation.customer_workspace_id, 'workspace')
    )
  ) then
    raise exception 'access_denied: insufficient invitation revoke privileges'
      using errcode = '42501';
  end if;

  if v_invitation.status not in ('draft','sent') or v_invitation.expires_at <= statement_timestamp() then
    raise exception 'invalid_invitation_state: invitation is not active'
      using errcode = '55000';
  end if;

  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'invalid_reason: revoke reason is required'
      using errcode = '22023';
  end if;

  update platform.workspace_invitations
  set status = 'revoked',
      revoked_by = v_actor,
      revoked_at = statement_timestamp(),
      revoke_reason = trim(p_reason)
  where id = p_invitation_id
  returning * into v_invitation;

  select * into v_workspace
  from platform.customer_workspaces
  where id = v_invitation.customer_workspace_id;

  insert into audit.events (
    tenant_id,
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    reason,
    occurred_at
  ) values (
    v_workspace.tenant_id,
    v_actor,
    'PLATFORM_CONTROL_PLANE',
    'WORKSPACE_INVITATION_REVOKED',
    'workspace_invitation',
    v_invitation.id,
    trim(p_reason),
    statement_timestamp()
  );

  return v_invitation;
end;
$$;

revoke all on function platform.revoke_workspace_invitation(uuid, text) from public;
grant execute on function platform.revoke_workspace_invitation(uuid, text)
  to authenticated, service_role;

alter table platform.workspace_invitations enable row level security;

create policy workspace_invitations_platform_read
on platform.workspace_invitations
for select
to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_AUDITOR')
  or (
    app_private.has_platform_role('PLATFORM_OPERATIONS')
    and app_private.has_customer_assignment(customer_workspace_id, 'workspace')
  )
);

create policy workspace_invitations_service_all
on platform.workspace_invitations
for all
to service_role
using (true)
with check (true);

revoke all on platform.workspace_invitations from anon, authenticated;
grant select on platform.workspace_invitations to authenticated;
grant all on platform.workspace_invitations to service_role;

commit;
