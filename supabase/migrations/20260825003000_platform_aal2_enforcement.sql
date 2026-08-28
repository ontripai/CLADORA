begin;

create or replace function app_private.has_platform_aal2()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, auth
as $$
  select auth.uid() is not null
    and coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2';
$$;

revoke all on function app_private.has_platform_aal2() from public;
grant execute on function app_private.has_platform_aal2() to authenticated, service_role;

create or replace function app_private.has_platform_role(required_role platform.platform_role_type)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, platform, app_private
as $$
  select app_private.has_platform_aal2()
    and exists (
      select 1
      from platform.platform_role_assignments ra
      join platform.platform_users pu on pu.id = ra.platform_user_id
      where pu.auth_user_id = auth.uid()
        and pu.status = 'active'
        and pu.deactivated_at is null
        and ra.role = required_role
        and ra.status = 'active'
        and ra.valid_from <= statement_timestamp()
        and (ra.valid_until is null or ra.valid_until > statement_timestamp())
    );
$$;

revoke all on function app_private.has_platform_role(platform.platform_role_type) from public;
grant execute on function app_private.has_platform_role(platform.platform_role_type) to authenticated, service_role;

comment on function app_private.has_platform_aal2() is
  'Fail-closed AAL2 boundary for CLADORA Platform Control Plane authorization.';

comment on function app_private.has_platform_role(platform.platform_role_type) is
  'Returns an active platform role only when the signed caller session is currently AAL2.';

commit;
