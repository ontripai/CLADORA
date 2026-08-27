begin;

alter table platform.customer_workspaces
  add column primary_admin_user_id uuid references auth.users(id) on delete restrict,
  add column primary_admin_membership_id uuid references identity.memberships(id) on delete restrict,
  add column primary_admin_accepted_at timestamptz,
  add column onboarding_completed_at timestamptz;

alter table platform.customer_workspaces
  add constraint customer_workspaces_primary_admin_consistency check (
    (
      primary_admin_user_id is null
      and primary_admin_membership_id is null
      and primary_admin_accepted_at is null
    )
    or (
      primary_admin_user_id is not null
      and primary_admin_membership_id is not null
      and primary_admin_accepted_at is not null
    )
  );

create index customer_workspaces_primary_admin_user_idx
  on platform.customer_workspaces (primary_admin_user_id);
create index customer_workspaces_primary_admin_membership_idx
  on platform.customer_workspaces (primary_admin_membership_id);

alter table platform.workspace_invitations
  add column accepted_membership_id uuid references identity.memberships(id) on delete restrict;

create index workspace_invitations_accepted_membership_idx
  on platform.workspace_invitations (accepted_membership_id);

create or replace function platform.accept_primary_admin_invitation(
  p_token text,
  p_display_name text,
  p_locale text default 'ro',
  p_timezone text default 'Europe/Bucharest'
)
returns table (
  customer_workspace_id uuid,
  membership_id uuid,
  onboarding_required boolean
)
language plpgsql
security definer
set search_path = pg_catalog, platform, identity, audit, app_private, extensions, auth
as $$
declare
  v_actor uuid := auth.uid();
  v_auth_email text;
  v_email_confirmed_at timestamptz;
  v_invitation platform.workspace_invitations;
  v_workspace platform.customer_workspaces;
  v_role identity.roles;
  v_membership identity.memberships;
  v_existing_context uuid;
begin
  if v_actor is null then
    raise exception 'authentication_required: authenticated invitation session required'
      using errcode = '42501';
  end if;

  if length(coalesce(p_token, '')) < 40 then
    raise exception 'invalid_invitation: token is invalid'
      using errcode = '22023';
  end if;

  if length(trim(coalesce(p_display_name, ''))) < 2
     or length(trim(p_display_name)) > 120 then
    raise exception 'invalid_display_name: display name must contain 2 to 120 characters'
      using errcode = '22023';
  end if;

  if p_locale not in ('ro','en','fa') then
    raise exception 'invalid_locale: supported locales are ro, en, and fa'
      using errcode = '22023';
  end if;

  if length(trim(coalesce(p_timezone, ''))) = 0
     or length(trim(p_timezone)) > 100 then
    raise exception 'invalid_timezone: timezone is required'
      using errcode = '22023';
  end if;

  select lower(trim(email)), email_confirmed_at
  into v_auth_email, v_email_confirmed_at
  from auth.users
  where id = v_actor;

  if not found or v_auth_email is null then
    raise exception 'authenticated_user_not_found: Auth user record is unavailable'
      using errcode = 'P0002';
  end if;

  if v_email_confirmed_at is null then
    raise exception 'email_not_confirmed: invitation email must be confirmed'
      using errcode = '42501';
  end if;

  select * into v_invitation
  from platform.workspace_invitations
  where token_hash = extensions.digest(p_token, 'sha256')
  for update;

  if not found then
    raise exception 'invalid_invitation: token is invalid'
      using errcode = 'P0002';
  end if;

  if v_invitation.status = 'accepted'
     and v_invitation.accepted_by = v_actor
     and v_invitation.accepted_membership_id is not null then
    return query
    select v_invitation.customer_workspace_id,
           v_invitation.accepted_membership_id,
           cw.onboarding_completed_at is null
    from platform.customer_workspaces as cw
    where cw.id = v_invitation.customer_workspace_id;
    return;
  end if;

  if v_invitation.status <> 'sent' then
    raise exception 'invalid_invitation_state: invitation is not active'
      using errcode = '55000';
  end if;

  if v_invitation.expires_at <= statement_timestamp() then
    raise exception 'invitation_expired: invitation has expired'
      using errcode = '55000';
  end if;

  if v_invitation.normalized_email <> v_auth_email then
    raise exception 'invitation_email_mismatch: authenticated email does not match invitation'
      using errcode = '42501';
  end if;

  select * into v_workspace
  from platform.customer_workspaces
  where id = v_invitation.customer_workspace_id
  for update;

  if not found then
    raise exception 'workspace_not_found: invitation workspace is unavailable'
      using errcode = 'P0002';
  end if;

  if v_workspace.lifecycle_status <> 'PROVISIONING' then
    raise exception 'workspace_not_provisioning: primary admin acceptance requires PROVISIONING state'
      using errcode = '55000';
  end if;

  if v_workspace.primary_admin_user_id is not null
     and v_workspace.primary_admin_user_id <> v_actor then
    raise exception 'primary_admin_already_assigned: workspace already has a different primary admin'
      using errcode = '23505';
  end if;

  select * into v_role
  from identity.roles
  where id = v_invitation.role_id;

  if not found
     or (v_role.tenant_id is not null and v_role.tenant_id <> v_workspace.tenant_id) then
    raise exception 'invalid_invitation_role: role does not belong to workspace tenant'
      using errcode = '22023';
  end if;

  if v_role.code not in ('WORKSPACE_OWNER','WORKSPACE_ADMIN') then
    raise exception 'invalid_primary_admin_role: primary administrator requires owner or admin role'
      using errcode = '22023';
  end if;

  insert into identity.profiles (
    user_id,
    display_name,
    locale,
    timezone
  ) values (
    v_actor,
    trim(p_display_name),
    p_locale,
    trim(p_timezone)
  )
  on conflict (user_id) do nothing;

  select * into v_membership
  from identity.memberships
  where tenant_id = v_workspace.tenant_id
    and user_id = v_actor
    and role_id = v_invitation.role_id
    and status in ('invited','active')
  order by created_at
  limit 1
  for update;

  if found then
    if v_membership.status = 'invited' then
      update identity.memberships
      set status = 'active',
          starts_at = least(starts_at, statement_timestamp()),
          updated_at = statement_timestamp()
      where id = v_membership.id
      returning * into v_membership;
    end if;
  else
    insert into identity.memberships (
      tenant_id,
      user_id,
      role_id,
      status,
      starts_at
    ) values (
      v_workspace.tenant_id,
      v_actor,
      v_invitation.role_id,
      'active',
      statement_timestamp()
    )
    returning * into v_membership;
  end if;

  select id into v_existing_context
  from identity.context_grants as cg
  where cg.membership_id = v_membership.id
    and cg.tenant_id = v_workspace.tenant_id
    and cg.scope_type = 'tenant'
    and cg.property_id is null
    and cg.building_id is null
    and cg.unit_id is null
    and cg.starts_at <= statement_timestamp()
    and (cg.ends_at is null or cg.ends_at > statement_timestamp())
  limit 1;

  if not found then
    insert into identity.context_grants (
      membership_id,
      tenant_id,
      scope_type,
      starts_at
    ) values (
      v_membership.id,
      v_workspace.tenant_id,
      'tenant',
      statement_timestamp()
    );
  end if;

  update platform.workspace_invitations
  set status = 'accepted',
      accepted_by = v_actor,
      accepted_at = statement_timestamp(),
      accepted_membership_id = v_membership.id
  where id = v_invitation.id
  returning * into v_invitation;

  update platform.customer_workspaces
  set primary_admin_user_id = v_actor,
      primary_admin_membership_id = v_membership.id,
      primary_admin_accepted_at = coalesce(primary_admin_accepted_at, statement_timestamp()),
      updated_at = statement_timestamp(),
      version = version + 1
  where id = v_workspace.id
  returning * into v_workspace;

  insert into audit.events (
    tenant_id,
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    reason,
    before_snapshot,
    after_snapshot,
    occurred_at
  ) values (
    v_workspace.tenant_id,
    v_actor,
    'CUSTOMER_PRIMARY_ADMIN',
    'PRIMARY_ADMIN_INVITATION_ACCEPTED',
    'workspace_invitation',
    v_invitation.id,
    'Primary administrator accepted workspace invitation',
    jsonb_build_object('invitation_status','sent','workspace_version',v_workspace.version - 1),
    jsonb_build_object(
      'invitation_status','accepted',
      'workspace_version',v_workspace.version,
      'membership_id',v_membership.id
    ),
    statement_timestamp()
  );

  return query
  select v_workspace.id, v_membership.id, true;
end;
$$;

revoke all on function platform.accept_primary_admin_invitation(text, text, text, text) from public;
grant execute on function platform.accept_primary_admin_invitation(text, text, text, text)
  to authenticated, service_role;

commit;
