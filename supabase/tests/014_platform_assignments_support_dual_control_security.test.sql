begin;
set local search_path = public, extensions;

select plan(53);

-- Fixture setup (as superuser)
do $$
declare
  v_admin_uid uuid := 'e0000000-0000-0000-0000-000000000001'::uuid;
  v_ops_uid uuid := 'e0000000-0000-0000-0000-000000000002'::uuid;
  v_supp_uid uuid := 'e0000000-0000-0000-0000-000000000003'::uuid;
  v_fin_uid uuid := 'e0000000-0000-0000-0000-000000000004'::uuid;
  v_aud_uid uuid := 'e0000000-0000-0000-0000-000000000005'::uuid;

  v_plat_admin uuid := 'f0000000-0000-0000-0000-000000000001'::uuid;
  v_plat_ops uuid := 'f0000000-0000-0000-0000-000000000002'::uuid;
  v_plat_supp uuid := 'f0000000-0000-0000-0000-000000000003'::uuid;
  v_plat_fin uuid := 'f0000000-0000-0000-0000-000000000004'::uuid;
  v_plat_aud uuid := 'f0000000-0000-0000-0000-000000000005'::uuid;

  v_tenant_a uuid := '10000000-0000-0000-0000-000000000001'::uuid;
  v_tenant_b uuid := '10000000-0000-0000-0000-000000000002'::uuid;

  v_ws_a uuid := '20000000-0000-0000-0000-000000000001'::uuid;
  v_ws_b uuid := '20000000-0000-0000-0000-000000000002'::uuid;

  v_plan_id uuid := '30000000-0000-0000-0000-000000000001'::uuid;
begin
  -- Auth Users
  insert into auth.users (id, email) values
    (v_admin_uid, 'admin@cladora.test'),
    (v_ops_uid, 'ops@cladora.test'),
    (v_supp_uid, 'supp@cladora.test'),
    (v_fin_uid, 'finance@cladora.test'),
    (v_aud_uid, 'auditor@cladora.test')
  on conflict (id) do nothing;

  -- Platform Users & Roles
  insert into platform.platform_users (id, auth_user_id, employee_ref, display_name, status) values
    (v_plat_admin, v_admin_uid, 'EMP-ADM-01', 'Platform Admin', 'active'),
    (v_plat_ops, v_ops_uid, 'EMP-OPS-02', 'Platform Ops', 'active'),
    (v_plat_supp, v_supp_uid, 'EMP-SUP-03', 'Platform Supp', 'active'),
    (v_plat_fin, v_fin_uid, 'EMP-FIN-04', 'Platform Finance', 'active'),
    (v_plat_aud, v_aud_uid, 'EMP-AUD-05', 'Platform Auditor', 'active');

  insert into platform.platform_role_assignments (platform_user_id, role, status, grant_reason) values
    (v_plat_admin, 'PLATFORM_SUPER_ADMIN', 'active', 'Fixture Admin'),
    (v_plat_ops, 'PLATFORM_OPERATIONS', 'active', 'Fixture Ops'),
    (v_plat_supp, 'PLATFORM_SUPPORT', 'active', 'Fixture Supp'),
    (v_plat_fin, 'PLATFORM_FINANCE', 'active', 'Fixture Finance'),
    (v_plat_aud, 'PLATFORM_AUDITOR', 'active', 'Fixture Auditor');

  -- Workspaces
  insert into platform.tenants (id, legal_name, registration_number) values
    (v_tenant_a, 'Tenant A SRL', 'RO-TENANT-A'),
    (v_tenant_b, 'Tenant B SRL', 'RO-TENANT-B');

  insert into platform.customer_workspaces (id, tenant_id, workspace_type, lifecycle_status, commercial_owner, environment) values
    (v_ws_a, v_tenant_a, 'ASSOCIATION', 'ACTIVE', 'Owner A', 'PILOT'),
    (v_ws_b, v_tenant_b, 'ASSOCIATION', 'ACTIVE', 'Owner B', 'PILOT');

  -- Subscription Plan fixture
  insert into platform.subscription_plans (id, plan_code, version, display_name, status) values
    (v_plan_id, 'PLAN-CORE-ASSOC', 1, 'Core Association Plan', 'active');
end;
$$;

-- Switch to authenticated role for all subsequent tests
set local role authenticated;

-- 1. Direct INSERT on platform_customer_assignments is denied
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000002", "role": "authenticated", "aal": "aal2"}', true);

select throws_like(
  $$ insert into platform.platform_customer_assignments (platform_user_id, customer_workspace_id, assignment_reason) values ('f0000000-0000-0000-0000-000000000002'::uuid, '20000000-0000-0000-0000-000000000002'::uuid, 'Bypass') $$,
  '%permission denied%',
  'direct INSERT into platform_customer_assignments is denied'
);

-- 2. Direct UPDATE on platform_customer_assignments is denied
select throws_like(
  $$ update platform.platform_customer_assignments set status = 'revoked' where id is not null $$,
  '%permission denied%',
  'direct UPDATE on platform_customer_assignments is denied'
);

-- 3. Direct DELETE on platform_customer_assignments is denied
select throws_like(
  $$ delete from platform.platform_customer_assignments where id is not null $$,
  '%permission denied%',
  'direct DELETE on platform_customer_assignments is denied'
);

-- 4. Unassigned Operations user attempting to assign itself to Workspace B fails
select throws_like(
  $$ select platform.grant_customer_assignment('f0000000-0000-0000-0000-000000000002'::uuid, '20000000-0000-0000-0000-000000000002'::uuid, 'workspace', null, null, null, 'Self escalation attempt') $$,
  '%access_denied%',
  'unassigned operations user cannot self-assign to customer workspace B'
);

-- 5, 6, 7. Super Admin grants assignment on Workspace A to Operations, Support, and Finance
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000001", "role": "authenticated", "aal": "aal2"}', true);

select ok(
  (select (platform.grant_customer_assignment('f0000000-0000-0000-0000-000000000002'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'workspace', null, null, null, 'Legitimate Ops assignment')).status = 'active'),
  'super admin can grant customer assignment on Workspace A to operations'
);

select ok(
  (select (platform.grant_customer_assignment('f0000000-0000-0000-0000-000000000003'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'support', null, null, null, 'Legitimate Support assignment')).status = 'active'),
  'super admin can grant customer assignment on Workspace A to support'
);

select ok(
  (select (platform.grant_customer_assignment('f0000000-0000-0000-0000-000000000004'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'commercial', null, null, null, 'Legitimate Finance assignment')).status = 'active'),
  'super admin can grant commercial assignment on Workspace A to finance'
);

-- 8. Operations user cannot delegate sub-assignment on Workspace A
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000002", "role": "authenticated", "aal": "aal2"}', true);

select throws_like(
  $$ select platform.grant_customer_assignment('f0000000-0000-0000-0000-000000000003'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'technical', null, null, null, 'Delegated technical assignment') $$,
  '%access_denied%',
  'assigned operations user cannot delegate customer assignments'
);

-- 9. Super Admin creates and revokes the technical assignment
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000001", "role": "authenticated", "aal": "aal2"}', true);

do $$ begin
  perform platform.grant_customer_assignment(
    'f0000000-0000-0000-0000-000000000003'::uuid,
    '20000000-0000-0000-0000-000000000001'::uuid,
    'technical', null, null, null, 'Administrative technical assignment'
  );
end $$;

select ok(
  (select (platform.revoke_customer_assignment(
    (select id from platform.platform_customer_assignments where customer_workspace_id = '20000000-0000-0000-0000-000000000001'::uuid and scope_type = 'technical' limit 1),
    'Revoking delegated technical assignment'
  )).status = 'revoked'),
  'revocation of customer assignment succeeds'
);

-- Switch to Auditor to inspect audit.events
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000005", "role": "authenticated", "aal": "aal2"}', true);

-- 10. Revocation is audited
select ok(
  (select count(*) > 0 from audit.events where action = 'CUSTOMER_ASSIGNMENT_REVOKED'),
  'customer assignment revocation is recorded in audit.events'
);

-- 11. Direct INSERT on support_access_grants is denied
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000002", "role": "authenticated", "aal": "aal2"}', true);

select throws_like(
  $$ insert into platform.support_access_grants (request_id, customer_workspace_id, approver_id, expires_at) values (gen_random_uuid(), '20000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000002'::uuid, statement_timestamp() + interval '1 hour') $$,
  '%permission denied%',
  'direct INSERT into support_access_grants is denied'
);

-- 12. Direct UPDATE on support_access_grants is denied
select throws_like(
  $$ update platform.support_access_grants set expires_at = statement_timestamp() + interval '10 days' where id is not null $$,
  '%permission denied%',
  'direct UPDATE on support_access_grants is denied'
);

-- 13. Direct DELETE on support_access_grants is denied
select throws_like(
  $$ delete from platform.support_access_grants where id is not null $$,
  '%permission denied%',
  'direct DELETE on support_access_grants is denied'
);

-- 14. Direct INSERT on support_access_requests is denied
select throws_like(
  $$ insert into platform.support_access_requests (customer_workspace_id, ticket_ref, purpose, requester_id) values ('20000000-0000-0000-0000-000000000001'::uuid, 'TCK-BYPASS', 'Bypass test', 'e0000000-0000-0000-0000-000000000002'::uuid) $$,
  '%permission denied%',
  'direct INSERT into support_access_requests is denied'
);

-- 15. Direct UPDATE on support_access_requests is denied
select throws_like(
  $$ update platform.support_access_requests set status = 'approved' where id is not null $$,
  '%permission denied%',
  'direct UPDATE on support_access_requests is denied'
);

-- 16. Direct DELETE on support_access_requests is denied
select throws_like(
  $$ delete from platform.support_access_requests where id is not null $$,
  '%permission denied%',
  'direct DELETE on support_access_requests is denied'
);

-- 17. Support Access: Support user requests access for assigned Workspace A
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000003", "role": "authenticated", "aal": "aal2"}', true);

select ok(
  (select (platform.request_support_access('20000000-0000-0000-0000-000000000001'::uuid, 'TCK-2026-DUR', 'Duration test case', 'technical', 'standard')).status = 'requested'),
  'assigned support user creates support access request TCK-2026-DUR'
);

-- 18. Unassigned Support user request on Workspace B is rejected
select throws_like(
  $$ select platform.request_support_access('20000000-0000-0000-0000-000000000002'::uuid, 'TCK-2026-002', 'Investigating B', 'technical', 'standard') $$,
  '%access_denied%',
  'unassigned support user cannot create support access request on unassigned Workspace B'
);

-- 19. Dual-control: Requester (Support user) cannot approve own request
select throws_like(
  $$ select platform.approve_support_access((select id from platform.support_access_requests where ticket_ref = 'TCK-2026-DUR' limit 1)) $$,
  '%access_denied%',
  'support user cannot approve support request'
);

-- 20. Dual-control: Super Admin who creates request cannot approve own request
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000001", "role": "authenticated", "aal": "aal2"}', true);

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

-- 21. Support Duration Test: Independent authorized Operations approver with 5 hours duration fails with invalid_duration
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000002", "role": "authenticated", "aal": "aal2"}', true);

select throws_like(
  $$ select platform.approve_support_access((select id from platform.support_access_requests where ticket_ref = 'TCK-2026-DUR' limit 1), interval '5 hours') $$,
  '%invalid_duration%',
  'independent approver with > 4 hours duration fails with invalid_duration'
);

-- 22. Support Duration Test: Zero duration fails with invalid_duration
select throws_like(
  $$ select platform.approve_support_access((select id from platform.support_access_requests where ticket_ref = 'TCK-2026-DUR' limit 1), interval '0 hours') $$,
  '%invalid_duration%',
  'zero duration fails with invalid_duration'
);

-- 23. Support Duration Test: Negative duration fails with invalid_duration
select throws_like(
  $$ select platform.approve_support_access((select id from platform.support_access_requests where ticket_ref = 'TCK-2026-DUR' limit 1), interval '-1 hours') $$,
  '%invalid_duration%',
  'negative duration fails with invalid_duration'
);

-- 24 & 25. After failed duration attempts, request remains in 'requested' state and no grant exists
select ok(
  (select status = 'requested' from platform.support_access_requests where ticket_ref = 'TCK-2026-DUR' limit 1),
  'request remains in requested state after failed duration validation'
);

select ok(
  (select count(*) = 0 from platform.support_access_grants where request_id = (select id from platform.support_access_requests where ticket_ref = 'TCK-2026-DUR' limit 1)),
  'no grant row created after failed duration validation'
);

-- 26. Valid independent approval with 2 hours duration succeeds
select ok(
  (select (platform.approve_support_access(
    (select id from platform.support_access_requests where ticket_ref = 'TCK-2026-DUR' limit 1),
    interval '2 hours',
    '{"approved": true}'::jsonb
  )).expires_at > statement_timestamp()),
  'assigned operations user independently approves support access request with 2 hours duration'
);

-- Switch to Auditor to inspect audit.events
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000005", "role": "authenticated", "aal": "aal2"}', true);

-- 27. Support access approval is audited
select ok(
  (select count(*) > 0 from audit.events where action = 'SUPPORT_ACCESS_GRANT_APPROVED'),
  'support access approval is recorded in audit.events'
);

-- Switch back to Operations user
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000002", "role": "authenticated", "aal": "aal2"}', true);

-- 28. Support access revocation terminates active grant
select ok(
  (select (platform.revoke_support_access(
    (select id from platform.support_access_grants where customer_workspace_id = '20000000-0000-0000-0000-000000000001'::uuid and revoked_at is null limit 1),
    'Early case resolution'
  )).revoked_at is not null),
  'support access revocation terminates active grant'
);

-- Switch to Auditor to inspect audit.events
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000005", "role": "authenticated", "aal": "aal2"}', true);

-- 29. Support access revocation is audited
select ok(
  (select count(*) > 0 from audit.events where action = 'SUPPORT_ACCESS_GRANT_REVOKED'),
  'support access grant revocation is recorded in audit.events'
);

-- 30. Direct INSERT on workspace_contracts is denied
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000002", "role": "authenticated", "aal": "aal2"}', true);

select throws_like(
  $$ insert into platform.workspace_contracts (customer_workspace_id, contract_ref, start_date) values ('20000000-0000-0000-0000-000000000001'::uuid, 'CTR-BYPASS', current_date) $$,
  '%permission denied%',
  'direct INSERT on workspace_contracts is denied'
);

-- 31. Direct INSERT on workspace_entitlements is denied
select throws_like(
  $$ insert into platform.workspace_entitlements (customer_workspace_id, entitlement_key, value_type) values ('20000000-0000-0000-0000-000000000001'::uuid, 'bypass_key', 'numeric') $$,
  '%permission denied%',
  'direct INSERT on workspace_entitlements is denied'
);

-- 32. Direct INSERT on entitlement_usage_ledger is denied
select throws_like(
  $$ insert into platform.entitlement_usage_ledger (customer_workspace_id, entitlement_key, delta, reason) values ('20000000-0000-0000-0000-000000000001'::uuid, 'ocr', 10, 'bypass') $$,
  '%permission denied%',
  'direct INSERT on entitlement_usage_ledger is denied'
);

-- Switch to Finance user (assigned to Workspace A)
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000004", "role": "authenticated", "aal": "aal2"}', true);

-- 33. Contract creation with non-null Plan UUID succeeds and records plan_id
select ok(
  (select (platform.create_workspace_contract(
    '20000000-0000-0000-0000-000000000001'::uuid,
    'CTR-2026-PLAN-UUID',
    '30000000-0000-0000-0000-000000000001'::uuid,
    'EUR',
    current_date,
    null,
    '{"terms": "standard"}'::jsonb
  )).plan_id = '30000000-0000-0000-0000-000000000001'::uuid),
  'creating contract linked to non-null Plan UUID records matching plan_id'
);

-- 34. Contract creation with unknown Plan UUID fails with plan_not_found
select throws_like(
  $$ select platform.create_workspace_contract('20000000-0000-0000-0000-000000000001'::uuid, 'CTR-UNKNOWN-PLAN', '30000000-0000-0000-0000-999999999999'::uuid) $$,
  '%plan_not_found%',
  'unknown Plan UUID fails with plan_not_found'
);

-- 35. Finance without assignment cannot create contract on Workspace B
select throws_like(
  $$ select platform.create_workspace_contract('20000000-0000-0000-0000-000000000002'::uuid, 'CTR-UNASSIGNED', null) $$,
  '%access_denied%',
  'finance user without assignment cannot create contract on Workspace B'
);

-- 36. Contract activation: Unknown contract denied
select throws_like(
  $$ select platform.activate_workspace_contract('99999999-9999-9999-9999-999999999999'::uuid, 'Activation') $$,
  '%contract_not_found%',
  'activating unknown contract is denied'
);

-- 37. Contract activation: Valid activation succeeds
select ok(
  (select (platform.activate_workspace_contract(
    (select id from platform.workspace_contracts where contract_ref = 'CTR-2026-PLAN-UUID' limit 1),
    'Signed contract executed'
  )).status = 'active'),
  'valid draft contract activation succeeds'
);

-- 38. Contract activation: Repeated activation fails with already_active
select throws_like(
  $$ select platform.activate_workspace_contract((select id from platform.workspace_contracts where contract_ref = 'CTR-2026-PLAN-UUID' limit 1), 'Re-activate') $$,
  '%already_active%',
  'activating already active contract fails with already_active'
);

-- Setup fixture contracts for invalid state transitions (as superuser)
set local role postgres;
do $$
begin
  insert into platform.workspace_contracts (id, customer_workspace_id, contract_ref, status, start_date, end_date) values
    ('40000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'CTR-TERMINATED', 'terminated', current_date - 30, null),
    ('40000000-0000-0000-0000-000000000002'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'CTR-EXPIRED', 'expired', current_date - 60, current_date - 10),
    ('40000000-0000-0000-0000-000000000003'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'CTR-SUPERSEDED', 'superseded', current_date - 30, null),
    ('40000000-0000-0000-0000-000000000004'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'CTR-PAST-END', 'draft', current_date - 30, current_date - 5),
    ('40000000-0000-0000-0000-000000000005'::uuid, '20000000-0000-0000-0000-000000000002'::uuid, 'CTR-WS-B', 'draft', current_date, null);
end;
$$;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000004", "role": "authenticated", "aal": "aal2"}', true);

-- 39. Terminated contract cannot be activated
select throws_like(
  $$ select platform.activate_workspace_contract('40000000-0000-0000-0000-000000000001'::uuid, 'Activating terminated') $$,
  '%invalid_state_transition%',
  'terminated contract cannot be activated'
);

-- 40. Expired contract cannot be activated
select throws_like(
  $$ select platform.activate_workspace_contract('40000000-0000-0000-0000-000000000002'::uuid, 'Activating expired') $$,
  '%invalid_state_transition%',
  'expired contract cannot be activated'
);

-- 41. Superseded contract cannot be activated
select throws_like(
  $$ select platform.activate_workspace_contract('40000000-0000-0000-0000-000000000003'::uuid, 'Activating superseded') $$,
  '%invalid_state_transition%',
  'superseded contract cannot be activated'
);

-- 42. Past-end-date contract cannot be activated
select throws_like(
  $$ select platform.activate_workspace_contract('40000000-0000-0000-0000-000000000004'::uuid, 'Activating past end date') $$,
  '%contract_expired%',
  'past-end-date contract cannot be activated'
);

-- 43. Auditor cannot activate contract
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000005", "role": "authenticated", "aal": "aal2"}', true);

select throws_like(
  $$ select platform.activate_workspace_contract('40000000-0000-0000-0000-000000000004'::uuid, 'Auditor activation') $$,
  '%access_denied%',
  'auditor cannot activate workspace contract'
);

-- 44. Finance without assignment on Workspace B cannot activate contract on Workspace B
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000004", "role": "authenticated", "aal": "aal2"}', true);

select throws_like(
  $$ select platform.activate_workspace_contract('40000000-0000-0000-0000-000000000005'::uuid, 'Finance unassigned activation') $$,
  '%access_denied%',
  'finance without assignment cannot activate contract on Workspace B'
);

-- 45. Entitlement override without reason is denied
select throws_like(
  $$ select platform.set_workspace_entitlement('20000000-0000-0000-0000-000000000001'::uuid, 'ocr_limit', 'numeric', 100, null, null, null, '{"numeric_value": 200}'::jsonb, '   ', statement_timestamp() + interval '1 day') $$,
  '%invalid_override%',
  'entitlement override without reason is denied'
);

-- 46. Entitlement override without expiry is denied
select throws_like(
  $$ select platform.set_workspace_entitlement('20000000-0000-0000-0000-000000000001'::uuid, 'ocr_limit', 'numeric', 100, null, null, null, '{"numeric_value": 200}'::jsonb, 'Valid Reason', null) $$,
  '%invalid_override%',
  'entitlement override without expiry is denied'
);

-- 47. Entitlement override with past expiry is denied
select throws_like(
  $$ select platform.set_workspace_entitlement('20000000-0000-0000-0000-000000000001'::uuid, 'ocr_limit', 'numeric', 100, null, null, null, '{"numeric_value": 200}'::jsonb, 'Valid Reason', statement_timestamp() - interval '1 hour') $$,
  '%invalid_override%',
  'entitlement override with past expiry is denied'
);

-- 48. Valid future time-bound override succeeds
select ok(
  (select (platform.set_workspace_entitlement(
    '20000000-0000-0000-0000-000000000001'::uuid,
    'ocr_limit',
    'numeric',
    100,
    null,
    null,
    null,
    '{"numeric_value": 200}'::jsonb,
    'Promotional increase',
    statement_timestamp() + interval '7 days'
  )).numeric_value = 100),
  'valid future time-bound entitlement override succeeds'
);

-- 49. Stored override_approved_by equals auth.uid()
select ok(
  (select override_approved_by = 'e0000000-0000-0000-0000-000000000004'::uuid from platform.workspace_entitlements where customer_workspace_id = '20000000-0000-0000-0000-000000000001'::uuid and entitlement_key = 'ocr_limit'),
  'stored override_approved_by matches auth.uid()'
);

-- Switch to Auditor user
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000005", "role": "authenticated", "aal": "aal2"}', true);

-- 50. Auditor cannot create an override
select throws_like(
  $$ select platform.set_workspace_entitlement('20000000-0000-0000-0000-000000000001'::uuid, 'ocr_limit', 'numeric', 100, null, null, null, '{"numeric_value": 300}'::jsonb, 'Auditor override', statement_timestamp() + interval '1 day') $$,
  '%access_denied%',
  'auditor cannot create entitlement override'
);

-- Switch to Finance user
select set_config('request.jwt.claims', '{"sub": "e0000000-0000-0000-0000-000000000004", "role": "authenticated", "aal": "aal2"}', true);

-- 51. Finance without assignment on Workspace B cannot create override on Workspace B
select throws_like(
  $$ select platform.set_workspace_entitlement('20000000-0000-0000-0000-000000000002'::uuid, 'ocr_limit', 'numeric', 100, null, null, null, '{"numeric_value": 300}'::jsonb, 'Unassigned override', statement_timestamp() + interval '1 day') $$,
  '%access_denied%',
  'finance without assignment cannot create override on Workspace B'
);

-- 52. Direct UPDATE on audit.events is denied
select throws_like(
  $$ update audit.events set reason = 'Tampered' where id > 0 $$,
  '%permission denied%',
  'direct UPDATE on audit.events is denied (immutable audit trail)'
);

-- 53. Direct DELETE on audit.events is denied
select throws_like(
  $$ delete from audit.events where id > 0 $$,
  '%permission denied%',
  'direct DELETE on audit.events is denied (immutable audit trail)'
);

select * from finish();
rollback;
