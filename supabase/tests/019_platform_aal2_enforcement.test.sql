begin;
set local search_path = public, extensions;

select plan(12);

do $$
declare
  v_actor uuid := 'd1000000-0000-0000-0000-000000000001';
  v_platform_user uuid := 'd2000000-0000-0000-0000-000000000001';
  v_tenant uuid := 'd3000000-0000-0000-0000-000000000001';
  v_workspace uuid := 'd4000000-0000-0000-0000-000000000001';
begin
  insert into auth.users (id, email, email_confirmed_at)
    values (v_actor, 'aal2.platform@cladora.test', statement_timestamp());
  insert into platform.platform_users (id, auth_user_id, employee_ref, display_name, status)
    values (v_platform_user, v_actor, 'AAL2-PLATFORM', 'AAL2 Platform Actor', 'active');
  insert into platform.platform_role_assignments (platform_user_id, role, status, grant_reason)
    values (v_platform_user, 'PLATFORM_SUPER_ADMIN', 'active', 'AAL2 enforcement fixture');
  insert into platform.tenants (id, legal_name, registration_number)
    values (v_tenant, 'AAL2 Test Tenant', 'RO-AAL2');
  insert into platform.customer_workspaces
    (id, tenant_id, workspace_type, lifecycle_status, commercial_owner, environment)
    values (v_workspace, v_tenant, 'ASSOCIATION', 'LEAD', 'AAL2 Test Owner', 'PILOT');
end;
$$;

select ok(not has_function_privilege('public', 'app_private.has_platform_aal2()', 'execute'), 'PUBLIC cannot invoke the AAL2 helper');
select ok(has_function_privilege('authenticated', 'app_private.has_platform_aal2()', 'execute'), 'authenticated callers can invoke the guarded AAL2 helper');
select ok((select p.prosecdef and coalesce(array_to_string(p.proconfig, ','), '') like '%search_path=%' from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'app_private' and p.proname = 'has_platform_aal2'), 'AAL2 helper is security definer with fixed search path');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d1000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}', true);
select ok(not app_private.has_platform_aal2(), 'AAL1 session fails the platform assurance boundary');
select ok(not app_private.has_platform_role('PLATFORM_SUPER_ADMIN'), 'AAL1 session cannot resolve an assigned platform role');
select ok((select count(*) = 0 from platform.customer_workspaces), 'AAL1 platform actor cannot read customer workspaces through RLS');
select throws_like($$select platform.transition_workspace_lifecycle('d4000000-0000-0000-0000-000000000001', 'UNDER_REVIEW', 1, 'AAL1 transition must fail')$$, '%access_denied%', 'AAL1 platform actor cannot invoke a privileged lifecycle RPC');

select set_config('request.jwt.claims', '{"sub":"d1000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}', true);
select ok(app_private.has_platform_aal2(), 'AAL2 session satisfies the platform assurance boundary');
select ok(app_private.has_platform_role('PLATFORM_SUPER_ADMIN'), 'AAL2 session resolves the active platform role');
select ok((select count(*) = 1 from platform.customer_workspaces where id = 'd4000000-0000-0000-0000-000000000001'), 'AAL2 platform actor can read authorized workspace data');
select ok((select (platform.transition_workspace_lifecycle('d4000000-0000-0000-0000-000000000001', 'UNDER_REVIEW', 1, 'AAL2 verified lifecycle transition')).lifecycle_status = 'UNDER_REVIEW'), 'AAL2 platform actor can execute an authorized lifecycle transition');

reset role;
select ok((select count(*) = 1 from audit.events where action = 'WORKSPACE_LIFECYCLE_TRANSITION' and entity_id = 'd4000000-0000-0000-0000-000000000001'), 'successful AAL2 lifecycle transition remains audited');

select * from finish();
rollback;
