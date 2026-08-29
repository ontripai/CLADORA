begin;

create or replace function app_private.can_read_platform_user(p_target_user_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, platform, app_private
as $$
  select app_private.has_platform_aal2() and (
    p_target_user_id = app_private.current_platform_user_id()
    or app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
    or exists (
      select 1
      from platform.platform_customer_assignments actor_assignment
      join platform.platform_customer_assignments target_assignment
        on target_assignment.customer_workspace_id = actor_assignment.customer_workspace_id
      where actor_assignment.platform_user_id = app_private.current_platform_user_id()
        and target_assignment.platform_user_id = p_target_user_id
        and actor_assignment.status = 'active'
        and target_assignment.status = 'active'
        and actor_assignment.valid_from <= statement_timestamp()
        and (actor_assignment.valid_until is null or actor_assignment.valid_until > statement_timestamp())
        and target_assignment.valid_from <= statement_timestamp()
        and (target_assignment.valid_until is null or target_assignment.valid_until > statement_timestamp())
        and (
          (app_private.has_platform_role('PLATFORM_OPERATIONS') and actor_assignment.scope_type = 'workspace')
          or (app_private.has_platform_role('PLATFORM_FINANCE') and actor_assignment.scope_type in ('workspace', 'commercial'))
          or (app_private.has_platform_role('PLATFORM_SUPPORT') and actor_assignment.scope_type in ('workspace', 'support', 'technical'))
          or (app_private.has_platform_role('PLATFORM_AUDITOR') and actor_assignment.scope_type in ('workspace', 'audit'))
        )
    )
  );
$$;
revoke all on function app_private.can_read_platform_user(uuid) from public;
grant execute on function app_private.can_read_platform_user(uuid) to authenticated, service_role;

drop policy if exists platform_users_read on platform.platform_users;
create policy platform_users_read on platform.platform_users for select to authenticated
using (app_private.can_read_platform_user(id));

drop policy if exists platform_roles_read on platform.platform_role_assignments;
create policy platform_roles_read on platform.platform_role_assignments for select to authenticated
using (app_private.can_read_platform_user(platform_user_id));

drop policy if exists platform_customer_assignments_select on platform.platform_customer_assignments;
create policy platform_customer_assignments_select on platform.platform_customer_assignments for select to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(customer_workspace_id, 'workspace'))
  or (app_private.has_platform_role('PLATFORM_FINANCE') and app_private.has_customer_assignment(customer_workspace_id, 'commercial'))
  or (app_private.has_platform_role('PLATFORM_SUPPORT') and (
    app_private.has_customer_assignment(customer_workspace_id, 'support')
    or app_private.has_customer_assignment(customer_workspace_id, 'technical')
  ))
  or (app_private.has_platform_role('PLATFORM_AUDITOR') and app_private.has_customer_assignment(customer_workspace_id, 'audit'))
  or (
    platform_user_id = app_private.current_platform_user_id()
    and (
      not app_private.has_platform_role('PLATFORM_AUDITOR')
      or scope_type in ('workspace', 'audit')
    )
  )
);

create index if not exists platform_customer_assignments_active_workspace_user_idx
on platform.platform_customer_assignments
  (customer_workspace_id, platform_user_id, scope_type, valid_from, valid_until)
where status = 'active';

drop function if exists platform.grant_customer_assignment(uuid, uuid, text, text, timestamptz, text);
create function platform.grant_customer_assignment(
  p_platform_user_id uuid,
  p_customer_workspace_id uuid,
  p_scope_type text default 'workspace',
  p_scope_id text default null,
  p_valid_from timestamptz default statement_timestamp(),
  p_valid_until timestamptz default null,
  p_reason text default 'Administrative assignment'
)
returns platform.platform_customer_assignments
language plpgsql security definer
set search_path = pg_catalog, platform, audit, app_private
as $$
declare
  v_actor_id uuid := auth.uid();
  v_assignment platform.platform_customer_assignments;
  v_valid_from timestamptz := coalesce(p_valid_from, statement_timestamp());
begin
  if not app_private.has_platform_role('PLATFORM_SUPER_ADMIN') then
    raise exception 'access_denied: Super Admin role required' using errcode = '42501';
  end if;
  if p_scope_type not in ('workspace', 'commercial', 'technical', 'support', 'audit') then
    raise exception 'invalid_scope: unsupported scope type' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_reason, ''))) < 8 or length(p_reason) > 500 then
    raise exception 'invalid_reason: assignment reason must contain 8 to 500 characters' using errcode = '22023';
  end if;
  if p_valid_until is not null and p_valid_until <= v_valid_from then
    raise exception 'invalid_validity: valid_until must be later than valid_from' using errcode = '22023';
  end if;
  if not exists (
    select 1 from platform.platform_users
    where id = p_platform_user_id and status = 'active' and deactivated_at is null
  ) then
    raise exception 'invalid_target_user: user not active or found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from platform.customer_workspaces where id = p_customer_workspace_id) then
    raise exception 'workspace_not_found: %', p_customer_workspace_id using errcode = 'P0002';
  end if;
  if exists (
    select 1 from platform.platform_customer_assignments a
    where a.platform_user_id = p_platform_user_id
      and a.customer_workspace_id = p_customer_workspace_id
      and a.scope_type = p_scope_type
      and a.scope_id is not distinct from nullif(trim(p_scope_id), '')
      and a.status = 'active'
      and tstzrange(a.valid_from, coalesce(a.valid_until, 'infinity'::timestamptz), '[)')
          && tstzrange(v_valid_from, coalesce(p_valid_until, 'infinity'::timestamptz), '[)')
  ) then
    raise exception 'duplicate_assignment: overlapping active assignment exists' using errcode = '23505';
  end if;

  insert into platform.platform_customer_assignments
    (platform_user_id, customer_workspace_id, scope_type, scope_id, valid_from, valid_until, status, assigned_by, assignment_reason)
  values
    (p_platform_user_id, p_customer_workspace_id, p_scope_type, nullif(trim(p_scope_id), ''), v_valid_from, p_valid_until, 'active', v_actor_id, trim(p_reason))
  returning * into v_assignment;

  insert into audit.events
    (actor_id, actor_role, action, entity_type, entity_id, after_snapshot, reason, occurred_at)
  values
    (v_actor_id, 'PLATFORM_CONTROL_PLANE', 'CUSTOMER_ASSIGNMENT_GRANTED', 'platform_customer_assignment', v_assignment.id,
     jsonb_build_object('platform_user_id', v_assignment.platform_user_id, 'customer_workspace_id', v_assignment.customer_workspace_id,
                        'scope_type', v_assignment.scope_type, 'scope_id', v_assignment.scope_id,
                        'valid_from', v_assignment.valid_from, 'valid_until', v_assignment.valid_until),
     trim(p_reason), statement_timestamp());
  return v_assignment;
end;
$$;
revoke all on function platform.grant_customer_assignment(uuid, uuid, text, text, timestamptz, timestamptz, text) from public;
grant execute on function platform.grant_customer_assignment(uuid, uuid, text, text, timestamptz, timestamptz, text) to authenticated, service_role;

create or replace function platform.revoke_customer_assignment(p_assignment_id uuid, p_reason text)
returns platform.platform_customer_assignments
language plpgsql security definer
set search_path = pg_catalog, platform, audit, app_private
as $$
declare
  v_actor_id uuid := auth.uid();
  v_assignment platform.platform_customer_assignments;
begin
  if not app_private.has_platform_role('PLATFORM_SUPER_ADMIN') then
    raise exception 'access_denied: Super Admin role required' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_reason, ''))) < 8 or length(p_reason) > 500 then
    raise exception 'invalid_reason: revoke reason must contain 8 to 500 characters' using errcode = '22023';
  end if;
  select * into v_assignment from platform.platform_customer_assignments
  where id = p_assignment_id and status = 'active' for update;
  if not found then
    raise exception 'assignment_not_found: %', p_assignment_id using errcode = 'P0002';
  end if;
  update platform.platform_customer_assignments
  set status = 'revoked', revoked_at = statement_timestamp(), revoked_by = v_actor_id, revoke_reason = trim(p_reason)
  where id = p_assignment_id returning * into v_assignment;
  insert into audit.events
    (actor_id, actor_role, action, entity_type, entity_id, before_snapshot, after_snapshot, reason, occurred_at)
  values
    (v_actor_id, 'PLATFORM_CONTROL_PLANE', 'CUSTOMER_ASSIGNMENT_REVOKED', 'platform_customer_assignment', v_assignment.id,
     jsonb_build_object('status', 'active'), jsonb_build_object('status', 'revoked'), trim(p_reason), statement_timestamp());
  return v_assignment;
end;
$$;
revoke all on function platform.revoke_customer_assignment(uuid, text) from public;
grant execute on function platform.revoke_customer_assignment(uuid, text) to authenticated, service_role;

comment on function app_private.can_read_platform_user(uuid) is
  'AAL2-only user visibility: self, Super Admin, or operators sharing an active permitted customer scope.';
comment on function platform.grant_customer_assignment(uuid, uuid, text, text, timestamptz, timestamptz, text) is
  'Super Admin-only assignment grant with explicit scope, time window, overlap prevention, and audit event.';

commit;
