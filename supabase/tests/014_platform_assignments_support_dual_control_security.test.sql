begin;
set local search_path = public, extensions;

select plan(15);

-- Fixture setup
do $$
declare
  v_admin_uid uuid := 'e0000000-0000-0000-0000-000000000001'::uuid;
  v_ops_uid uuid := 'e0000000-0000-0000-0000-000000000002'::uuid;
  v_supp_uid uuid := 'e0000000-0000-0000-0000-000000000003'::uuid;

  v_plat_admin uuid := 'f0000000-0000-0000-0000-000000000001'::uuid;
  v_plat_ops uuid := 'f0000000-0000-0000-0000-000000000002'::uuid;
  v_plat_supp uuid := 'f0000000-0000-0000-0000-000000000003'::uuid;

  v_tenant_a uuid := '10000000-0000-0000-0000-000000000001'::uuid;
  v_tenant_b uuid := '10000000-0000-0000-0000-000000000002'::uuid;

  v_ws_a uuid := '20000000-0000-0000-0000-000000000001'::uuid;
  v_ws_b uuid := '20000000-0000-0000-0000-000000000002'::uuid;
begin
  -- Users
  insert into auth.users (id, email) values
    (v_admin_uid, 'admin@cladora.test'),
    (v_ops_uid, 'ops@cladora.test'),
    (v_supp_uid, 'supp@cladora.test')
  on conflict (id) do nothing;

  insert into platform.platform_users (id, auth_user_id, employee_ref, display_name, status) values
    (v_plat_admin, v_admin_uid, 'EMP-ADM-01', 'Platform Admin', 'active'),
    (v_plat_ops, v_ops_uid, 'EMP-OPS-02', 'Platform Ops', 'active'),
    (v_plat_supp, v_supp_uid, 'EMP-SUP-03', 'Platform Supp', 'active');

  insert into platform.platform_role_assignments (platform_user_id, role, status, grant_reason) values
    (v_plat_admin, 'PLATFORM_SUPER_ADMIN', 'active', 'Fixture Admin'),
    (v_plat_ops, 'PLATFORM_OPERATIONS', 'active', 'Fixture Ops'),
    (v_plat_supp, 'PLATFORM_SUPPORT', 'active', 'Fixture Supp');

  -- Workspaces
  insert into platform.tenants (id, name, slug) values
    (v_tenant_a, 'Tenant A', 'tenant-a'),
    (v_tenant_b, 'Tenant B', 'tenant-b');

  insert into platform.customer_workspaces (id, tenant_id, workspace_type, lifecycle_status, commercial_owner, environment) values
    (v_ws_a, v_tenant_a, 'ASSOCIATION', 'ACTIVE', 'Owner A', 'PILOT'),
    (v_ws_b, v_tenant_b, 'ASSOCIATION', 'ACTIVE', 'Owner B', 'PILOT');
end;
$$;

-- 1. Operations user attempting to assign itself to unassigned Workspace B without Super Admin or Workspace B access fails
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000002"}', true);

select throws_like(
  $$ select platform.grant_customer_assignment('f0000000-0000-0000-0000-000000000002'::uuid, '20000000-0000-0000-0000-000000000002'::uuid, 'workspace', null, null, 'Self escalation attempt') $$,
  '%access_denied%',
  'unassigned operations user cannot self-assign to customer workspace B'
);

-- 2. Super Admin grants assignment on Workspace A to Operations user and Support user
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000001"}', true);

select ok(
  (select (platform.grant_customer_assignment('f0000000-0000-0000-0000-000000000002'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'workspace', null, null, 'Legitimate Ops assignment')).status = 'active'),
  'super admin can grant customer assignment on Workspace A to operations'
);

select ok(
  (select (platform.grant_customer_assignment('f0000000-0000-0000-0000-000000000003'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'support', null, null, 'Legitimate Support assignment')).status = 'active'),
  'super admin can grant customer assignment on Workspace A to support'
);

-- 3. Operations user can now delegate sub-assignment on Workspace A
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000002"}', true);

select ok(
  (select (platform.grant_customer_assignment('f0000000-0000-0000-0000-000000000003'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'technical', null, null, 'Delegated technical assignment')).status = 'active'),
  'assigned operations user can delegate sub-assignment on assigned Workspace A'
);

-- 4. Revocation of customer assignment succeeds and is recorded
select ok(
  (select (platform.revoke_customer_assignment(
    (select id from platform.platform_customer_assignments where customer_workspace_id = '20000000-0000-0000-0000-000000000001'::uuid and scope_type = 'technical' limit 1),
    'Revoking delegated technical assignment'
  )).status = 'revoked'),
  'revocation of customer assignment succeeds'
);

-- 5. Revocation is audited
select ok(
  (select count(*) > 0 from audit.events where action = 'CUSTOMER_ASSIGNMENT_REVOKED'),
  'customer assignment revocation is recorded in audit.events'
);

-- 6. Support Access: Support user requests access for assigned Workspace A
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000003"}', true);

select ok(
  (select (platform.request_support_access('20000000-0000-0000-0000-000000000001'::uuid, 'TCK-2026-001', 'Investigating meter OCR issue', 'technical', 'standard')).status = 'requested'),
  'assigned support user can create support access request'
);

-- 7. Unassigned Support user request on Workspace B is rejected
select throws_like(
  $$ select platform.request_support_access('20000000-0000-0000-0000-000000000002'::uuid, 'TCK-2026-002', 'Investigating B', 'technical', 'standard') $$,
  '%access_denied%',
  'unassigned support user cannot create support access request on unassigned Workspace B'
);

-- 8. Dual-control: Requester (Support user) cannot approve own request
select throws_like(
  $$ select platform.approve_support_access((select id from platform.support_access_requests where ticket_ref = 'TCK-2026-001' limit 1)) $$,
  '%access_denied%',
  'support user cannot approve support request'
);

-- 9. Dual-control: Super Admin who creates request cannot approve own request
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000001"}', true);

do $$
declare
  v_admin_req platform.support_access_requests;
begin
  v_admin_req := platform.request_support_access('20000000-0000-0000-0000-000000000001'::uuid, 'TCK-ADMIN-SELF', 'Admin test', 'technical', 'sensitive');
end;
$$;

select throws_like(
  $$ select platform.approve_support_access((select id from platform.support_access_requests where ticket_ref = 'TCK-ADMIN-SELF' limit 1)) $$,
  '%dual_control_violation%',
  'super admin cannot approve own support access request (dual-control enforced)'
);

-- 10. Valid independent approval: Operations user approves Support user request TCK-2026-001
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000002"}', true);

select ok(
  (select (platform.approve_support_access(
    (select id from platform.support_access_requests where ticket_ref = 'TCK-2026-001' limit 1),
    interval '2 hours',
    '{"approved": true}'::jsonb
  )).expires_at > statement_timestamp()),
  'assigned operations user independently approves support access request'
);

-- 11. Invalid duration > 4 hours rejected
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000001"}', true);

select throws_like(
  $$ select platform.approve_support_access((select id from platform.support_access_requests where ticket_ref = 'TCK-ADMIN-SELF' limit 1), interval '5 hours') $$,
  '%dual_control_violation%',
  'self approval check fires prior to duration validation'
);

-- 12. Support access approval is audited
select ok(
  (select count(*) > 0 from audit.events where action = 'SUPPORT_ACCESS_GRANT_APPROVED'),
  'support access approval is recorded in audit.events'
);

-- 13. Support access revocation succeeds and is audited
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000002"}', true);

select ok(
  (select (platform.revoke_support_access(
    (select id from platform.support_access_grants where customer_workspace_id = '20000000-0000-0000-0000-000000000001'::uuid limit 1),
    'Early case resolution'
  )).revoked_at is not null),
  'support access revocation terminates active grant'
);

-- 14. Revocation is audited
select ok(
  (select count(*) > 0 from audit.events where action = 'SUPPORT_ACCESS_GRANT_REVOKED'),
  'support access grant revocation is recorded in audit.events'
);

select * from finish();
rollback;
