begin;
set local search_path = public, extensions;

select plan(10);

do $$
declare
  v_auth_user uuid := 'aa000000-0000-0000-0000-000000000024'::uuid;
  v_platform_user uuid := 'bb000000-0000-0000-0000-000000000024'::uuid;
begin
  insert into auth.users (id, email)
  values (v_auth_user, 'assignment-auditor@cladora.test')
  on conflict (id) do nothing;

  insert into platform.platform_users (id, auth_user_id, employee_ref, display_name, status)
  values (v_platform_user, v_auth_user, 'EMP-AUD-SCOPE-024', 'Assignment Auditor', 'active');

  insert into platform.platform_role_assignments (platform_user_id, role, status, grant_reason)
  values (v_platform_user, 'PLATFORM_AUDITOR', 'active', 'Assignment-scoped auditor fixture');

  insert into platform.tenants (id, legal_name, registration_number) values
    ('cc000000-0000-0000-0000-000000000241'::uuid, 'Audit Scope Tenant', 'AUD-SCOPE-024-1'),
    ('cc000000-0000-0000-0000-000000000242'::uuid, 'Workspace Scope Tenant', 'AUD-SCOPE-024-2'),
    ('cc000000-0000-0000-0000-000000000243'::uuid, 'Commercial Scope Tenant', 'AUD-SCOPE-024-3'),
    ('cc000000-0000-0000-0000-000000000244'::uuid, 'Expired Scope Tenant', 'AUD-SCOPE-024-4');

  insert into platform.customer_workspaces
    (id, tenant_id, workspace_type, lifecycle_status, commercial_owner, environment, version)
  values
    ('dd000000-0000-0000-0000-000000000241'::uuid, 'cc000000-0000-0000-0000-000000000241'::uuid, 'ASSOCIATION', 'ACTIVE', 'Audit Owner', 'PILOT', 1),
    ('dd000000-0000-0000-0000-000000000242'::uuid, 'cc000000-0000-0000-0000-000000000242'::uuid, 'ASSOCIATION', 'ACTIVE', 'Workspace Owner', 'PILOT', 1),
    ('dd000000-0000-0000-0000-000000000243'::uuid, 'cc000000-0000-0000-0000-000000000243'::uuid, 'ASSOCIATION', 'ACTIVE', 'Commercial Owner', 'PILOT', 1),
    ('dd000000-0000-0000-0000-000000000244'::uuid, 'cc000000-0000-0000-0000-000000000244'::uuid, 'ASSOCIATION', 'ACTIVE', 'Expired Owner', 'PILOT', 1);

  insert into platform.platform_customer_assignments
    (platform_user_id, customer_workspace_id, scope_type, status, valid_from, valid_until, assignment_reason)
  values
    (v_platform_user, 'dd000000-0000-0000-0000-000000000241'::uuid, 'audit', 'active', statement_timestamp() - interval '1 day', null, 'Active audit scope'),
    (v_platform_user, 'dd000000-0000-0000-0000-000000000242'::uuid, 'workspace', 'active', statement_timestamp() - interval '1 day', null, 'Active workspace scope'),
    (v_platform_user, 'dd000000-0000-0000-0000-000000000243'::uuid, 'commercial', 'active', statement_timestamp() - interval '1 day', null, 'Wrong scope for auditor'),
    (v_platform_user, 'dd000000-0000-0000-0000-000000000244'::uuid, 'audit', 'active', statement_timestamp() - interval '2 days', statement_timestamp() - interval '1 day', 'Expired audit scope');

  insert into platform.workspace_contracts
    (customer_workspace_id, contract_ref, currency, status, start_date)
  select id, 'AUD-SCOPE-' || right(id::text, 3), 'EUR', 'active', current_date
  from platform.customer_workspaces
  where id in (
    'dd000000-0000-0000-0000-000000000241'::uuid,
    'dd000000-0000-0000-0000-000000000242'::uuid,
    'dd000000-0000-0000-0000-000000000243'::uuid,
    'dd000000-0000-0000-0000-000000000244'::uuid
  );

  insert into platform.workspace_entitlements
    (customer_workspace_id, entitlement_key, value_type, boolean_value)
  select id, 'auditor_scope_feature', 'boolean', true
  from platform.customer_workspaces
  where id::text like 'dd000000-0000-0000-0000-00000000024%';

  insert into platform.entitlement_usage_ledger
    (customer_workspace_id, entitlement_key, delta, reason)
  select id, 'auditor_scope_feature', 1, 'Auditor scope fixture'
  from platform.customer_workspaces
  where id::text like 'dd000000-0000-0000-0000-00000000024%';
end;
$$;

select ok(
  exists(select 1 from platform.platform_customer_assignments where scope_type = 'audit'),
  'audit is an accepted customer assignment scope'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aa000000-0000-0000-0000-000000000024","role":"authenticated","aal":"aal2"}', true);

select ok(
  (select count(*) = 2 from platform.customer_workspaces where id::text like 'dd000000-0000-0000-0000-00000000024%'),
  'auditor sees only workspaces covered by active audit or workspace assignments'
);
select ok(
  exists(select 1 from platform.customer_workspaces where id = 'dd000000-0000-0000-0000-000000000241'::uuid),
  'active audit assignment grants workspace visibility'
);
select ok(
  exists(select 1 from platform.customer_workspaces where id = 'dd000000-0000-0000-0000-000000000242'::uuid),
  'active workspace assignment grants auditor visibility'
);
select ok(
  not exists(select 1 from platform.customer_workspaces where id = 'dd000000-0000-0000-0000-000000000243'::uuid),
  'commercial-only assignment does not grant auditor visibility'
);
select ok(
  not exists(select 1 from platform.customer_workspaces where id = 'dd000000-0000-0000-0000-000000000244'::uuid),
  'expired audit assignment does not grant auditor visibility'
);
select ok(
  (select count(*) = 2 from platform.workspace_contracts where contract_ref like 'AUD-SCOPE-%'),
  'contract RLS follows auditor assignment scope'
);
select ok(
  (select count(*) = 2 from platform.workspace_entitlements where entitlement_key = 'auditor_scope_feature'),
  'entitlement RLS follows auditor assignment scope'
);
select ok(
  (select count(*) = 2 from platform.entitlement_usage_ledger where entitlement_key = 'auditor_scope_feature'),
  'entitlement usage RLS follows auditor assignment scope'
);
select throws_like(
  $$ update platform.workspace_contracts set status = 'suspended' where contract_ref like 'AUD-SCOPE-%' $$,
  '%permission denied%',
  'assignment-scoped auditor remains read-only'
);

select * from finish();
rollback;
