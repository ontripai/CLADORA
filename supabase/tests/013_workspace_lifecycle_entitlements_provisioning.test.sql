begin;
set local search_path = public, extensions;

select plan(16);

-- Test fixture setup
do $$
declare
  v_tenant_id uuid;
  v_prod_tenant_id uuid;
  v_ws_id uuid;
  v_prod_ws_id uuid;
  v_auth_uid uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
  v_plat_user_id uuid;
  v_res platform.customer_workspaces;
begin
  -- 1. Create mock auth user and platform super admin
  insert into auth.users (id, email) values (v_auth_uid, 'admin@cladora.test') on conflict (id) do nothing;

  insert into platform.platform_users (id, auth_user_id, employee_ref, display_name, status)
  values ('b0000000-0000-0000-0000-000000000001'::uuid, v_auth_uid, 'EMP-TEST-001', 'Test Admin', 'active')
  returning id into v_plat_user_id;

  insert into platform.platform_role_assignments (platform_user_id, role, status, grant_reason)
  values (v_plat_user_id, 'PLATFORM_SUPER_ADMIN', 'active', 'Test fixture');

  -- 2. Create mock tenants and workspaces
  insert into platform.tenants (id, legal_name, registration_number)
  values ('c0000000-0000-0000-0000-000000000001'::uuid, 'Test Tenant Pilot SRL', 'RO-PILOT-001')
  returning id into v_tenant_id;

  insert into platform.customer_workspaces (id, tenant_id, workspace_type, lifecycle_status, commercial_owner, environment, version)
  values ('d0000000-0000-0000-0000-000000000001'::uuid, v_tenant_id, 'ASSOCIATION', 'LEAD', 'Test Association Owner', 'PILOT', 1)
  returning id into v_ws_id;

  insert into platform.tenants (id, legal_name, registration_number)
  values ('c0000000-0000-0000-0000-000000000002'::uuid, 'Test Tenant Prod SRL', 'RO-PROD-002')
  returning id into v_prod_tenant_id;

  insert into platform.customer_workspaces (id, tenant_id, workspace_type, lifecycle_status, commercial_owner, environment, version)
  values ('d0000000-0000-0000-0000-000000000002'::uuid, v_prod_tenant_id, 'ASSOCIATION', 'PROVISIONING', 'Test Prod Owner', 'PRODUCTION', 1)
  returning id into v_prod_ws_id;

  -- 3. Create mock entitlement
  insert into platform.workspace_entitlements (customer_workspace_id, entitlement_key, value_type, numeric_value)
  values (v_ws_id, 'ocr_meter_quota', 'numeric', 100);
end;
$$;

-- Assertion 1: Unauthenticated cannot transition lifecycle
select throws_like(
  $$ select platform.transition_workspace_lifecycle('d0000000-0000-0000-0000-000000000001'::uuid, 'UNDER_REVIEW', 1, 'Anonymous attempt') $$,
  '%access_denied%',
  'unauthenticated session is denied lifecycle transition'
);

-- Set authenticated session claims
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-0000-0000-000000000001"}', true);

-- Assertion 2: Valid transition LEAD -> UNDER_REVIEW succeeds
select ok(
  (select (platform.transition_workspace_lifecycle('d0000000-0000-0000-0000-000000000001'::uuid, 'UNDER_REVIEW', 1, 'Starting review')).lifecycle_status = 'UNDER_REVIEW'),
  'valid lifecycle transition from LEAD to UNDER_REVIEW succeeds'
);

-- Assertion 3: Concurrency protection - Stale expected_version fails
select throws_like(
  $$ select platform.transition_workspace_lifecycle('d0000000-0000-0000-0000-000000000001'::uuid, 'APPROVED', 1, 'Stale version attempt') $$,
  '%concurrency_conflict%',
  'stale expected_version triggers concurrency conflict error'
);

-- Assertion 4: Invalid jump LEAD/UNDER_REVIEW -> ACTIVE fails
select throws_like(
  $$ select platform.transition_workspace_lifecycle('d0000000-0000-0000-0000-000000000001'::uuid, 'ACTIVE', 2, 'Invalid jump') $$,
  '%illegal_transition%',
  'invalid jump from UNDER_REVIEW directly to ACTIVE fails'
);

-- Assertion 5: Direct transition to ARCHIVED fails
select throws_like(
  $$ select platform.transition_workspace_lifecycle('d0000000-0000-0000-0000-000000000001'::uuid, 'ARCHIVED', 2, 'Direct archive attempt') $$,
  '%illegal_transition%',
  'direct transition from UNDER_REVIEW to ARCHIVED is rejected'
);

-- Assertion 6: PRODUCTION workspace activation blocked pending ENG-010
select throws_like(
  $$ select platform.transition_workspace_lifecycle('d0000000-0000-0000-0000-000000000002'::uuid, 'ACTIVE', 1, 'Production activation') $$,
  '%activation_blocked%',
  'production workspace activation is blocked pending ENG-010 onboarding'
);

-- Assertion 7 & 8: Verify audit snapshots before_snapshot and after_snapshot
select ok(
  (select (before_snapshot->>'status') = 'LEAD' from audit.events where entity_id = 'd0000000-0000-0000-0000-000000000001'::uuid and action = 'WORKSPACE_LIFECYCLE_TRANSITION' limit 1),
  'audit before_snapshot captures accurate prior status LEAD'
);

select ok(
  (select (after_snapshot->>'status') = 'UNDER_REVIEW' from audit.events where entity_id = 'd0000000-0000-0000-0000-000000000001'::uuid and action = 'WORKSPACE_LIFECYCLE_TRANSITION' limit 1),
  'audit after_snapshot captures accurate subsequent status UNDER_REVIEW'
);

-- Assertion 9: Entitlement consumption within quota succeeds
select ok(
  platform.enforce_entitlement_quota('d0000000-0000-0000-0000-000000000001'::uuid, 'ocr_meter_quota', 40, 'tx-idemp-001', 'Batch 1 ocr consumption'),
  'entitlement quota consumption within limit succeeds'
);

-- Assertion 10: Duplicate idempotency key does not double-consume
select ok(
  platform.enforce_entitlement_quota('d0000000-0000-0000-0000-000000000001'::uuid, 'ocr_meter_quota', 40, 'tx-idemp-001', 'Duplicate call'),
  'duplicate idempotency key call returns true without double-consuming quota'
);

-- Assertion 11: Total consumed is still 40 (not 80)
select ok(
  (select coalesce(sum(delta), 0) = 40 from platform.entitlement_usage_ledger where customer_workspace_id = 'd0000000-0000-0000-0000-000000000001'::uuid and entitlement_key = 'ocr_meter_quota'),
  'usage ledger recorded exactly 40 units despite duplicate call'
);

-- Assertion 12: Over-quota consumption rolls back
select throws_like(
  $$ select platform.enforce_entitlement_quota('d0000000-0000-0000-0000-000000000001'::uuid, 'ocr_meter_quota', 70, 'tx-idemp-002', 'Over limit') $$,
  '%quota_exceeded%',
  'consumption exceeding remaining capacity throws quota_exceeded'
);

-- Assertion 13: Provisioning run creation succeeds
select ok(
  (select (platform.create_provisioning_run('d0000000-0000-0000-0000-000000000001'::uuid, 'run-idemp-101', array['create_tenant','stage_invites'])).status = 'pending'),
  'provisioning run creation creates pending run'
);

-- Assertion 14: Provisioning tasks created with correct count
select ok(
  (select count(*) = 2 from platform.provisioning_tasks where run_id = (select id from platform.provisioning_runs where idempotency_key = 'run-idemp-101')),
  'provisioning tasks created exactly matching task_types array length'
);

-- Assertion 15: Duplicate provisioning run idempotency key does not duplicate tasks
select ok(
  (select (platform.create_provisioning_run('d0000000-0000-0000-0000-000000000001'::uuid, 'run-idemp-101', array['create_tenant','stage_invites'])).id = (select id from platform.provisioning_runs where idempotency_key = 'run-idemp-101')),
  'duplicate provisioning run request returns existing run'
);

-- Assertion 16: Task count remains 2
select ok(
  (select count(*) = 2 from platform.provisioning_tasks where run_id = (select id from platform.provisioning_runs where idempotency_key = 'run-idemp-101')),
  'provisioning tasks not duplicated on duplicate run request'
);

select * from finish();
rollback;
