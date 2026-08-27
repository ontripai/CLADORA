begin;

alter table platform.customer_workspaces
  add column onboarding_completed_by uuid references auth.users(id) on delete restrict;

create index customer_workspaces_onboarding_completed_by_idx
  on platform.customer_workspaces (onboarding_completed_by);

alter table platform.customer_workspaces
  add constraint customer_workspaces_onboarding_completion_consistency check (
    (onboarding_completed_at is null and onboarding_completed_by is null)
    or (onboarding_completed_at is not null and onboarding_completed_by is not null)
  );

create or replace function platform.complete_primary_admin_onboarding(
  p_workspace_id uuid,
  p_expected_version integer,
  p_reason text
)
returns platform.customer_workspaces
language plpgsql
security definer
set search_path = pg_catalog, platform, identity, audit, auth
as $$
declare
  v_actor uuid := auth.uid();
  v_ws platform.customer_workspaces;
  v_now timestamptz := statement_timestamp();
  v_before_version integer;
begin
  if v_actor is null then
    raise exception 'authentication_required: authenticated primary administrator required' using errcode = '42501';
  end if;
  if coalesce((select auth.jwt()->>'aal'), 'aal1') <> 'aal2' then
    raise exception 'mfa_required: an AAL2 session is required to complete onboarding' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_reason, ''))) < 10 or length(trim(p_reason)) > 500 then
    raise exception 'invalid_reason: onboarding reason must contain 10 to 500 characters' using errcode = '22023';
  end if;

  select * into v_ws
  from platform.customer_workspaces
  where id = p_workspace_id
  for update;

  if not found then
    raise exception 'workspace_not_found: %', p_workspace_id using errcode = 'P0002';
  end if;
  if v_ws.version <> p_expected_version then
    raise exception 'concurrency_conflict: expected version % does not match actual %', p_expected_version, v_ws.version using errcode = 'P0001';
  end if;
  if v_ws.lifecycle_status <> 'PROVISIONING' then
    raise exception 'workspace_not_provisioning: onboarding completion requires PROVISIONING state' using errcode = '55000';
  end if;
  if v_ws.primary_admin_user_id <> v_actor or v_ws.primary_admin_membership_id is null or v_ws.primary_admin_accepted_at is null then
    raise exception 'access_denied: caller is not the accepted primary administrator' using errcode = '42501';
  end if;
  if not exists (
    select 1 from identity.memberships m
    where m.id = v_ws.primary_admin_membership_id
      and m.tenant_id = v_ws.tenant_id
      and m.user_id = v_actor
      and m.status = 'active'
      and m.starts_at <= v_now
      and (m.ends_at is null or m.ends_at > v_now)
  ) then
    raise exception 'membership_inactive: primary administrator membership is not active' using errcode = '42501';
  end if;
  if not exists (select 1 from auth.users u where u.id = v_actor and u.email_confirmed_at is not null) then
    raise exception 'email_not_confirmed: primary administrator email must be confirmed' using errcode = '42501';
  end if;
  if not exists (select 1 from auth.mfa_factors f where f.user_id = v_actor and f.status = 'verified') then
    raise exception 'mfa_not_enrolled: a verified MFA factor is required' using errcode = '42501';
  end if;
  if not exists (select 1 from identity.profiles p where p.user_id = v_actor and length(trim(p.display_name)) >= 2) then
    raise exception 'profile_incomplete: primary administrator profile is incomplete' using errcode = '55000';
  end if;
  if not exists (
    select 1 from identity.context_grants cg
    where cg.membership_id = v_ws.primary_admin_membership_id
      and cg.tenant_id = v_ws.tenant_id
      and cg.scope_type = 'tenant'
      and cg.starts_at <= v_now
      and (cg.ends_at is null or cg.ends_at > v_now)
  ) then
    raise exception 'context_incomplete: tenant-level context grant is required' using errcode = '55000';
  end if;

  if v_ws.onboarding_completed_at is not null then
    return v_ws;
  end if;

  v_before_version := v_ws.version;
  update platform.customer_workspaces
  set onboarding_completed_at = v_now,
      onboarding_completed_by = v_actor,
      updated_at = v_now,
      version = version + 1
  where id = p_workspace_id
  returning * into v_ws;

  insert into audit.events (tenant_id, actor_id, actor_role, action, entity_type, entity_id, reason, before_snapshot, after_snapshot, occurred_at)
  values (
    v_ws.tenant_id, v_actor, 'CUSTOMER_PRIMARY_ADMIN', 'PRIMARY_ADMIN_ONBOARDING_COMPLETED',
    'customer_workspace', v_ws.id, trim(p_reason),
    jsonb_build_object('version', v_before_version, 'onboarding_completed_at', null),
    jsonb_build_object('version', v_ws.version, 'onboarding_completed_at', v_ws.onboarding_completed_at), v_now
  );
  return v_ws;
end;
$$;

revoke all on function platform.complete_primary_admin_onboarding(uuid, integer, text) from public;
grant execute on function platform.complete_primary_admin_onboarding(uuid, integer, text) to authenticated, service_role;

create or replace function platform.assert_workspace_activation_ready(p_workspace_id uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = pg_catalog, platform, identity, auth
as $$
declare v_ws platform.customer_workspaces;
begin
  select * into v_ws from platform.customer_workspaces where id = p_workspace_id;
  if not found then return false; end if;
  return v_ws.onboarding_completed_at is not null
    and v_ws.onboarding_completed_by = v_ws.primary_admin_user_id
    and v_ws.primary_admin_accepted_at is not null
    and exists (
      select 1 from identity.memberships m
      where m.id = v_ws.primary_admin_membership_id and m.user_id = v_ws.primary_admin_user_id
        and m.tenant_id = v_ws.tenant_id and m.status = 'active'
        and m.starts_at <= statement_timestamp()
        and (m.ends_at is null or m.ends_at > statement_timestamp())
    )
    and exists (
      select 1 from auth.mfa_factors f
      where f.user_id = v_ws.primary_admin_user_id and f.status = 'verified'
    );
end;
$$;

revoke all on function platform.assert_workspace_activation_ready(uuid) from public, anon, authenticated;
grant execute on function platform.assert_workspace_activation_ready(uuid) to service_role;

-- Replace the earlier temporary ENG-010 block with a precise completion gate.
create or replace function platform.enforce_workspace_activation_gate()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, platform
as $$
begin
  if new.environment = 'PRODUCTION'
     and new.lifecycle_status = 'ACTIVE'
     and old.lifecycle_status is distinct from 'ACTIVE'
     and not platform.assert_workspace_activation_ready(new.id) then
    raise exception 'activation_blocked: primary admin acceptance, active membership, verified MFA, and completed onboarding are required'
      using errcode = '55000';
  end if;
  return new;
end;
$$;

drop trigger if exists customer_workspaces_activation_gate on platform.customer_workspaces;
create trigger customer_workspaces_activation_gate
before update of lifecycle_status on platform.customer_workspaces
for each row execute function platform.enforce_workspace_activation_gate();

-- The transition RPC's original unconditional ENG-010 guard is removed by replacing
-- that exact branch; the trigger above is the authoritative fail-closed gate.
do $$
declare v_definition text;
begin
  select pg_get_functiondef('platform.transition_workspace_lifecycle(uuid,platform.workspace_lifecycle_status,integer,text)'::regprocedure)
  into v_definition;
  v_definition := replace(
    v_definition,
    E'  if v_ws.environment = \'PRODUCTION\' and p_target_status = \'ACTIVE\' then\n    raise exception \'activation_blocked: ENG-010 invitation prerequisite must be completed for PRODUCTION activation\'\n      using errcode = \'55000\';\n  end if;',
    E'  -- Production activation is enforced by customer_workspaces_activation_gate.'
  );
  if position('ENG-010 invitation prerequisite' in v_definition) > 0 then
    raise exception 'migration_guard_failed: lifecycle function definition did not match expected source';
  end if;
  execute v_definition;
end;
$$;

commit;
