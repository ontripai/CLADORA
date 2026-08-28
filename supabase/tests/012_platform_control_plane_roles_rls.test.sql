begin;
set local search_path = public, extensions;

select plan(32);

select has_table('platform','platform_users','platform_users table exists');
select has_table('platform','platform_role_assignments','platform_role_assignments table exists');
select has_table('platform','customer_workspaces','customer_workspaces table exists');
select has_table('platform','platform_customer_assignments','platform_customer_assignments table exists');
select has_table('platform','subscription_plans','subscription_plans table exists');
select has_table('platform','workspace_contracts','workspace_contracts table exists');
select has_table('platform','workspace_entitlements','workspace_entitlements table exists');
select has_table('platform','entitlement_usage_ledger','entitlement_usage_ledger table exists');
select has_table('platform','provisioning_runs','provisioning_runs table exists');
select has_table('platform','provisioning_tasks','provisioning_tasks table exists');
select has_table('platform','support_access_requests','support_access_requests table exists');
select has_table('platform','support_access_grants','support_access_grants table exists');

select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='platform_users'),'platform_users RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='platform_role_assignments'),'platform_role_assignments RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='customer_workspaces'),'customer_workspaces RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='platform_customer_assignments'),'platform_customer_assignments RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='subscription_plans'),'subscription_plans RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='workspace_contracts'),'workspace_contracts RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='workspace_entitlements'),'workspace_entitlements RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='entitlement_usage_ledger'),'entitlement_usage_ledger RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='provisioning_runs'),'provisioning_runs RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='provisioning_tasks'),'provisioning_tasks RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='support_access_requests'),'support_access_requests RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='support_access_grants'),'support_access_grants RLS enabled');

-- Unauthenticated checks
select ok(
  (select not app_private.is_platform_user()),
  'anonymous/unauthenticated caller is not a platform user'
);

select ok(
  (select app_private.current_platform_user_id() is null),
  'current platform user ID is null for unauthenticated session'
);

select ok(
  (select not app_private.has_platform_role('PLATFORM_SUPER_ADMIN')),
  'unauthenticated session does not possess PLATFORM_SUPER_ADMIN role'
);

select ok(
  (select not app_private.has_platform_role('PLATFORM_AUDITOR')),
  'unauthenticated session does not possess PLATFORM_AUDITOR role'
);

-- Behavioral fixture for inactive user and revoked role
do $$
declare
  v_inact_uid uuid := '80000000-0000-0000-0000-000000000001'::uuid;
  v_rev_uid uuid := '80000000-0000-0000-0000-000000000002'::uuid;
  v_plat_inact uuid := '90000000-0000-0000-0000-000000000001'::uuid;
  v_plat_rev uuid := '90000000-0000-0000-0000-000000000002'::uuid;
begin
  insert into auth.users (id, email) values
    (v_inact_uid, 'inactive@cladora.test'),
    (v_rev_uid, 'revoked@cladora.test')
  on conflict (id) do nothing;

  insert into platform.platform_users (id, auth_user_id, employee_ref, display_name, status, deactivated_at)
  values (v_plat_inact, v_inact_uid, 'EMP-INACT-01', 'Inactive User', 'suspended', statement_timestamp());

  insert into platform.platform_role_assignments (platform_user_id, role, status, grant_reason)
  values (v_plat_inact, 'PLATFORM_SUPER_ADMIN', 'active', 'Fixture');

  insert into platform.platform_users (id, auth_user_id, employee_ref, display_name, status)
  values (v_plat_rev, v_rev_uid, 'EMP-REV-02', 'Revoked User', 'active');

  insert into platform.platform_role_assignments (platform_user_id, role, status, grant_reason, revoked_at, revoke_reason)
  values (v_plat_rev, 'PLATFORM_SUPER_ADMIN', 'revoked', 'Fixture', statement_timestamp(), 'Security policy');
end;
$$;

-- Inactive platform user is denied
select set_config('request.jwt.claims', '{"sub": "80000000-0000-0000-0000-000000000001", "role": "authenticated", "aal": "aal2"}', true);
select ok(
  (select not app_private.is_platform_user()),
  'inactive platform user is not recognized as active platform user'
);
select ok(
  (select not app_private.has_platform_role('PLATFORM_SUPER_ADMIN')),
  'inactive platform user does not possess active PLATFORM_SUPER_ADMIN role'
);

-- Revoked role assignment is denied
select set_config('request.jwt.claims', '{"sub": "80000000-0000-0000-0000-000000000002", "role": "authenticated", "aal": "aal2"}', true);
select ok(
  (select app_private.is_platform_user()),
  'platform user with revoked role is recognized as user'
);
select ok(
  (select not app_private.has_platform_role('PLATFORM_SUPER_ADMIN')),
  'revoked role assignment is not recognized as active role'
);

select * from finish();
rollback;
