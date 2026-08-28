begin;
set local search_path = public, extensions;

select plan(26);

-- Test fixture setup (as superuser)
do $$
declare
  v_admin_uid uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
  v_ops_uid uuid := 'a0000000-0000-0000-0000-000000000002'::uuid;
  v_aud_uid uuid := 'a0000000-0000-0000-0000-000000000003'::uuid;

  v_plat_admin uuid := 'b0000000-0000-0000-0000-000000000001'::uuid;
  v_plat_ops uuid := 'b0000000-0000-0000-0000-000000000002'::uuid;
  v_plat_aud uuid := 'b0000000-0000-0000-0000-000000000003'::uuid;
begin
  -- 1. Create mock auth users
  insert into auth.users (id, email) values
    (v_admin_uid, 'admin@cladora.test'),
    (v_ops_uid, 'ops@cladora.test'),
    (v_aud_uid, 'auditor@cladora.test')
  on conflict (id) do nothing;

  -- 2. Create platform users and roles
  insert into platform.platform_users (id, auth_user_id, employee_ref, display_name, status) values
    (v_plat_admin, v_admin_uid, 'EMP-TEST-ADM', 'Test Admin', 'active'),
    (v_plat_ops, v_ops_uid, 'EMP-TEST-OPS', 'Test Ops', 'active'),
    (v_plat_aud, v_aud_uid, 'EMP-TEST-AUD', 'Test Auditor', 'active');

  insert into platform.platform_role_assignments (platform_user_id, role, status, grant_reason) values
    (v_plat_admin, 'PLATFORM_SUPER_ADMIN', 'active', 'Fixture Admin'),
    (v_plat_ops, 'PLATFORM_OPERATIONS', 'active', 'Fixture Ops'),
    (v_plat_aud, 'PLATFORM_AUDITOR', 'active', 'Fixture Auditor');

  -- 3. Create mock tenants and workspaces
  insert into platform.tenants (id, legal_name, registration_number) values
    ('c0000000-0000-0000-0000-000000000001'::uuid, 'Test Tenant Pilot SRL', 'RO-PILOT-001'),
    ('c0000000-0000-0000-0000-000000000002'::uuid, 'Test Tenant Prod SRL', 'RO-PROD-002'),
    ('c0000000-0000-0000-0000-000000000003'::uuid, 'Test Tenant Other SRL', 'RO-OTHER-003');

  insert into platform.customer_workspaces (id, tenant_id, workspace_type, lifecycle_status, commercial_owner, environment, version) values
    ('d0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'ASSOCIATION', 'LEAD', 'Test Association Owner', 'PILOT', 1),
    ('d0000000-0000-0000-0000-000000000002'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'ASSOCIATION', 'PROVISIONING', 'Test Prod Owner', 'PRODUCTION', 1),
    ('d0000000-0000-0000-0000-000000000003'::uuid, 'c0000000-0000-0000-0000-000000000003'::uuid, 'ASSOCIATION', 'ACTIVE', 'Test Other Owner', 'PILOT', 1);

  -- 4. Assign Operations user ONLY to Workspace 1
  insert into platform.platform_customer_assignments (platform_user_id, customer_workspace_id, scope_type, status, assignment_reason)
  values (v_plat_ops, 'd0000000-0000-0000-0000-000000000001'::uuid, 'workspace', 'active', 'Ops Assignment 1');

  -- 5. Create mock entitlements
  insert into platform.workspace_entitlements (customer_workspace_id, entitlement_key, value_type, numeric_value) values
    ('d0000000-0000-0000-0000-000000000001'::uuid, 'ocr_meter_quota', 'numeric', 100),
    ('d0000000-0000-0000-0000-000000000003'::uuid, 'ocr_meter_quota', 'numeric', 50);
end;
$$;

-- Switch to authenticated role for all subsequent client tests
set local role authenticated;

-- Assertion 1: Unauthenticated direct UPDATE on customer_workspaces is denied
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select throws_like(
  $$ update platform.customer_workspaces set lifecycle_status = 'ARCHIVED' where id = 'd0000000-0000-0000-0000-000000000001'::uuid $$,
  '%permission denied%',
  'unauthenticated session is denied direct UPDATE on customer_workspaces'
);

-- Set authenticated session claims to Operations user
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-0000-0000-000000000002", "role": "authenticated", "aal": "aal2"}', true);

-- Assertion 2: Assigned Operations direct UPDATE on lifecycle fields is denied
select throws_like(
  $$ update platform.customer_workspaces set lifecycle_status = 'ACTIVE' where id = 'd0000000-0000-0000-0000-000000000001'::uuid $$,
  '%permission denied%',
  'assigned operations user is denied direct UPDATE on customer_workspaces'
);

-- Assertion 3: Assigned Operations direct DELETE is denied
select throws_like(
  $$ delete from platform.customer_workspaces where id = 'd0000000-0000-0000-0000-000000000001'::uuid $$,
  '%permission denied%',
  'assigned operations user is denied direct DELETE on customer_workspaces'
);

-- Set authenticated session claims to Auditor user
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-0000-0000-000000000003", "role": "authenticated", "aal": "aal2"}', true);

-- Assertion 4: Auditor direct UPDATE is denied
select throws_like(
  $$ update platform.customer_workspaces set commercial_owner = 'Auditor Hijack' where id = 'd0000000-0000-0000-0000-000000000001'::uuid $$,
  '%permission denied%',
  'auditor user is denied direct UPDATE on customer_workspaces'
);

-- Set authenticated session claims to Super Admin user
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated", "aal": "aal2"}', true);

-- Assertion 5: Valid RPC transition LEAD -> UNDER_REVIEW succeeds
select ok(
  (select (platform.transition_workspace_lifecycle('d0000000-0000-0000-0000-000000000001'::uuid, 'UNDER_REVIEW', 1, 'Starting review')).lifecycle_status = 'UNDER_REVIEW'),
  'valid lifecycle transition from LEAD to UNDER_REVIEW succeeds'
);

-- Assertion 6: Concurrency protection - Stale expected_version fails
select throws_like(
  $$ select platform.transition_workspace_lifecycle('d0000000-0000-0000-0000-000000000001'::uuid, 'APPROVED', 1, 'Stale version attempt') $$,
  '%concurrency_conflict%',
  'stale expected_version triggers concurrency conflict error'
);

-- Assertion 7: Invalid jump UNDER_REVIEW -> ACTIVE fails
select throws_like(
  $$ select platform.transition_workspace_lifecycle('d0000000-0000-0000-0000-000000000001'::uuid, 'ACTIVE', 2, 'Invalid jump') $$,
  '%illegal_transition%',
  'invalid jump from UNDER_REVIEW directly to ACTIVE fails'
);

-- Assertion 8: Direct transition to ARCHIVED fails
select throws_like(
  $$ select platform.transition_workspace_lifecycle('d0000000-0000-0000-0000-000000000001'::uuid, 'ARCHIVED', 2, 'Direct archive attempt') $$,
  '%illegal_transition%',
  'direct transition from UNDER_REVIEW to ARCHIVED is rejected'
);

-- Assertion 9: PRODUCTION workspace activation blocked pending ENG-010
select throws_like(
  $$ select platform.transition_workspace_lifecycle('d0000000-0000-0000-0000-000000000002'::uuid, 'ACTIVE', 1, 'Production activation') $$,
  '%activation_blocked%',
  'production workspace activation is blocked pending ENG-010 onboarding'
);

-- Transition Workspace 1: UNDER_REVIEW -> TERMINATED -> ARCHIVED
select platform.transition_workspace_lifecycle('d0000000-0000-0000-0000-000000000001'::uuid, 'TERMINATED', 2, 'Terminating workspace');

-- Assertion 10: TERMINATED -> ARCHIVED authorized archival succeeds
select ok(
  (select (platform.transition_workspace_lifecycle('d0000000-0000-0000-0000-000000000001'::uuid, 'ARCHIVED', 3, 'Archiving terminated workspace')).lifecycle_status = 'ARCHIVED'),
  'authorized transition from TERMINATED to ARCHIVED succeeds'
);

-- Assertion 11 & 12: Verify audit snapshots before_snapshot and after_snapshot (read under Super Admin)
select ok(
  (select (before_snapshot->>'status') = 'LEAD' from audit.events where entity_id = 'd0000000-0000-0000-0000-000000000001'::uuid and action = 'WORKSPACE_LIFECYCLE_TRANSITION' order by occurred_at asc limit 1),
  'audit before_snapshot captures accurate prior status LEAD'
);

select ok(
  (select (after_snapshot->>'status') = 'UNDER_REVIEW' from audit.events where entity_id = 'd0000000-0000-0000-0000-000000000001'::uuid and action = 'WORKSPACE_LIFECYCLE_TRANSITION' order by occurred_at asc limit 1),
  'audit after_snapshot captures accurate subsequent status UNDER_REVIEW'
);

-- Assertion 13: Entitlements: Zero quantity is rejected
select throws_like(
  $$ select platform.enforce_entitlement_quota('d0000000-0000-0000-0000-000000000003'::uuid, 'ocr_meter_quota', 0, 'tx-0', 'Zero consumption') $$,
  '%invalid_quantity%',
  'zero quantity is rejected'
);

-- Assertion 14: Entitlements: Negative quantity is rejected
select throws_like(
  $$ select platform.enforce_entitlement_quota('d0000000-0000-0000-0000-000000000003'::uuid, 'ocr_meter_quota', -5, 'tx-neg', 'Negative consumption') $$,
  '%invalid_quantity%',
  'negative quantity is rejected'
);

-- Assertion 15: Entitlements: Empty reason is rejected
select throws_like(
  $$ select platform.enforce_entitlement_quota('d0000000-0000-0000-0000-000000000003'::uuid, 'ocr_meter_quota', 5, 'tx-1', '   ') $$,
  '%invalid_reason%',
  'empty reason is rejected'
);

-- Switch to Operations user (assigned only to Workspace 1)
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-0000-0000-000000000002", "role": "authenticated", "aal": "aal2"}', true);

-- Assertion 16: Operations cannot consume quota in unassigned Workspace 3
select throws_like(
  $$ select platform.enforce_entitlement_quota('d0000000-0000-0000-0000-000000000003'::uuid, 'ocr_meter_quota', 10, 'tx-unassigned', 'Cross workspace attempt') $$,
  '%access_denied%',
  'operations user cannot consume quota in unassigned workspace'
);

-- Switch to Auditor user
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-0000-0000-000000000003", "role": "authenticated", "aal": "aal2"}', true);

-- Assertion 17: Auditor cannot consume quota
select throws_like(
  $$ select platform.enforce_entitlement_quota('d0000000-0000-0000-0000-000000000003'::uuid, 'ocr_meter_quota', 10, 'tx-aud', 'Auditor attempt') $$,
  '%access_denied%',
  'auditor user cannot consume quota'
);

-- Switch to Super Admin
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated", "aal": "aal2"}', true);

-- Assertion 18: Quota consumption in ARCHIVED workspace is rejected
select throws_like(
  $$ select platform.enforce_entitlement_quota('d0000000-0000-0000-0000-000000000001'::uuid, 'ocr_meter_quota', 10, 'tx-archived', 'Archived attempt') $$,
  '%workspace_inactive%',
  'quota consumption in archived workspace is rejected'
);

-- Assertion 19: Valid consumption in ACTIVE workspace succeeds
select ok(
  platform.enforce_entitlement_quota('d0000000-0000-0000-0000-000000000003'::uuid, 'ocr_meter_quota', 20, 'tx-valid-01', 'Batch 1 ocr consumption'),
  'valid entitlement quota consumption succeeds'
);

-- Assertion 20: Duplicate idempotency key does not double-consume
select ok(
  platform.enforce_entitlement_quota('d0000000-0000-0000-0000-000000000003'::uuid, 'ocr_meter_quota', 20, 'tx-valid-01', 'Duplicate call'),
  'duplicate idempotency key returns true without double-consuming quota'
);

-- Assertion 21: Usage ledger total is exactly 20
select ok(
  (select coalesce(sum(delta), 0) = 20 from platform.entitlement_usage_ledger where customer_workspace_id = 'd0000000-0000-0000-0000-000000000003'::uuid and entitlement_key = 'ocr_meter_quota'),
  'usage ledger recorded exactly 20 units'
);

-- Assertion 22: Over-quota consumption rolls back
select throws_like(
  $$ select platform.enforce_entitlement_quota('d0000000-0000-0000-0000-000000000003'::uuid, 'ocr_meter_quota', 40, 'tx-over', 'Over limit') $$,
  '%quota_exceeded%',
  'consumption exceeding remaining capacity throws quota_exceeded'
);

-- Assertion 23: Provisioning run creation succeeds
select ok(
  (select (platform.create_provisioning_run('d0000000-0000-0000-0000-000000000003'::uuid, 'run-idemp-101', array['create_tenant','stage_invites'])).status = 'pending'),
  'provisioning run creation creates pending run'
);

-- Assertion 24: Provisioning tasks created with correct count
select ok(
  (select count(*) = 2 from platform.provisioning_tasks where run_id = (select id from platform.provisioning_runs where idempotency_key = 'run-idemp-101')),
  'provisioning tasks created exactly matching task_types array length'
);

-- Assertion 25: Duplicate provisioning run idempotency key does not duplicate tasks
select ok(
  (select (platform.create_provisioning_run('d0000000-0000-0000-0000-000000000003'::uuid, 'run-idemp-101', array['create_tenant','stage_invites'])).id = (select id from platform.provisioning_runs where idempotency_key = 'run-idemp-101')),
  'duplicate provisioning run request returns existing run'
);

-- Assertion 26: Task count remains 2
select ok(
  (select count(*) = 2 from platform.provisioning_tasks where run_id = (select id from platform.provisioning_runs where idempotency_key = 'run-idemp-101')),
  'provisioning tasks not duplicated on duplicate run request'
);

select * from finish();
rollback;
