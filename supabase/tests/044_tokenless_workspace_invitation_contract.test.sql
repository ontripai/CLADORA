begin;
set local search_path = public, extensions;

select plan(45);

do $$
declare
  v_invitee uuid := 'f1000000-0000-0000-0000-000000000001';
  v_other uuid := 'f1000000-0000-0000-0000-000000000002';
  v_unconfirmed uuid := 'f1000000-0000-0000-0000-000000000003';
  v_tenant_a uuid := 'f2000000-0000-0000-0000-000000000001';
  v_tenant_b uuid := 'f2000000-0000-0000-0000-000000000002';
  v_workspace_a uuid := 'f3000000-0000-0000-0000-000000000001';
  v_workspace_b uuid := 'f3000000-0000-0000-0000-000000000002';
  v_role_a uuid := 'f4000000-0000-0000-0000-000000000001';
  v_role_b uuid := 'f4000000-0000-0000-0000-000000000002';
begin
  insert into auth.users (id, email, email_confirmed_at) values
    (v_invitee, 'tokenless.invitee@cladora.test', statement_timestamp()),
    (v_other, 'tokenless.other@cladora.test', statement_timestamp()),
    (v_unconfirmed, 'tokenless.unconfirmed@cladora.test', null);

  insert into platform.tenants (id, legal_name, registration_number) values
    (v_tenant_a, 'Tokenless Tenant A', 'RO-TOKENLESS-A'),
    (v_tenant_b, 'Tokenless Tenant B', 'RO-TOKENLESS-B');

  insert into platform.customer_workspaces
    (id, tenant_id, workspace_type, lifecycle_status, commercial_owner, environment)
  values
    (v_workspace_a, v_tenant_a, 'ASSOCIATION', 'PROVISIONING', 'Workspace Alpha', 'PILOT'),
    (v_workspace_b, v_tenant_b, 'PROPERTY_MANAGER', 'PROVISIONING', 'Workspace Beta', 'PRODUCTION');

  insert into identity.roles (id, tenant_id, code, name, is_system) values
    (v_role_a, v_tenant_a, 'WORKSPACE_OWNER', 'Workspace owner', false),
    (v_role_b, v_tenant_b, 'WORKSPACE_ADMIN', 'Workspace administrator', false);

  insert into platform.workspace_invitations (
    id, customer_workspace_id, normalized_email, role_id, scope_type,
    token_hash, status, expires_at, created_at, invited_by, invitation_reason,
    accepted_by, accepted_at, revoked_by, revoked_at, revoke_reason
  ) values
    ('f5000000-0000-0000-0000-000000000001', v_workspace_a, 'tokenless.invitee@cladora.test', v_role_a, 'tenant', digest('valid-a', 'sha256'), 'sent', statement_timestamp() + interval '2 hours', statement_timestamp(), v_other, 'valid A', null, null, null, null, null),
    ('f5000000-0000-0000-0000-000000000002', v_workspace_b, 'tokenless.invitee@cladora.test', v_role_b, 'tenant', digest('valid-b', 'sha256'), 'sent', statement_timestamp() + interval '2 hours', statement_timestamp(), v_other, 'valid B', null, null, null, null, null),
    ('f5000000-0000-0000-0000-000000000003', v_workspace_a, 'tokenless.invitee@cladora.test', v_role_a, 'tenant', digest('expired', 'sha256'), 'expired', statement_timestamp() - interval '1 minute', statement_timestamp() - interval '2 hours', v_other, 'expired', null, null, null, null, null),
    ('f5000000-0000-0000-0000-000000000004', v_workspace_a, 'tokenless.invitee@cladora.test', v_role_a, 'tenant', digest('revoked', 'sha256'), 'revoked', statement_timestamp() + interval '2 hours', statement_timestamp(), v_other, 'cancelled maps to revoked', null, null, v_other, statement_timestamp(), 'cancelled fixture'),
    ('f5000000-0000-0000-0000-000000000005', v_workspace_a, 'tokenless.other@cladora.test', v_role_a, 'tenant', digest('other-email', 'sha256'), 'sent', statement_timestamp() + interval '2 hours', statement_timestamp(), v_other, 'email mismatch', null, null, null, null, null),
    ('f5000000-0000-0000-0000-000000000006', v_workspace_a, 'tokenless.invitee@cladora.test', v_role_b, 'tenant', digest('cross-tenant-role', 'sha256'), 'sent', statement_timestamp() + interval '2 hours', statement_timestamp(), v_other, 'cross tenant role', null, null, null, null, null),
    ('f5000000-0000-0000-0000-000000000007', v_workspace_a, 'tokenless.invitee@cladora.test', v_role_a, 'tenant', digest('used', 'sha256'), 'accepted', statement_timestamp() + interval '2 hours', statement_timestamp(), v_other, 'already used', v_other, statement_timestamp(), null, null, null);
end;
$$;

select ok(to_regclass('platform.workspace_invitations_claimable_email_idx') is not null, 'claimable invitation lookup index exists');
select ok(to_regclass('identity.context_grants_open_tenant_unique') is not null, 'open tenant context uniqueness index exists');
select ok((select indisunique from pg_index where indexrelid = 'identity.context_grants_open_tenant_unique'::regclass), 'tenant context index is unique');
select ok((select pg_get_expr(indpred, indrelid) like '%ends_at IS NULL%' from pg_index where indexrelid = 'identity.context_grants_open_tenant_unique'::regclass), 'tenant context uniqueness is partial for open grants');
select ok((select pg_get_expr(indpred, indrelid) like '%status = ''sent''%' from pg_index where indexrelid = 'platform.workspace_invitations_claimable_email_idx'::regclass), 'claimable lookup index covers sent invitations');

select ok(not has_function_privilege('public', 'platform.list_my_claimable_workspace_invitations()', 'execute'), 'PUBLIC cannot list claimable invitations');
select ok(not has_function_privilege('anon', 'platform.list_my_claimable_workspace_invitations()', 'execute'), 'anon cannot list claimable invitations');
select ok(not has_function_privilege('service_role', 'platform.list_my_claimable_workspace_invitations()', 'execute'), 'service role is excluded from application list RPC');
select ok(has_function_privilege('authenticated', 'platform.list_my_claimable_workspace_invitations()', 'execute'), 'authenticated can execute guarded list RPC');
select ok(not has_function_privilege('public', 'platform.claim_workspace_invitation(uuid,text,text,text)', 'execute'), 'PUBLIC cannot claim invitations');
select ok(not has_function_privilege('anon', 'platform.claim_workspace_invitation(uuid,text,text,text)', 'execute'), 'anon cannot claim invitations');
select ok(not has_function_privilege('service_role', 'platform.claim_workspace_invitation(uuid,text,text,text)', 'execute'), 'service role is excluded from application claim RPC');
select ok(has_function_privilege('authenticated', 'platform.claim_workspace_invitation(uuid,text,text,text)', 'execute'), 'authenticated can execute guarded claim RPC');
select ok((select prosecdef and array_to_string(proconfig, ',') like '%search_path=%' from pg_proc where oid = 'platform.claim_workspace_invitation(uuid,text,text,text)'::regprocedure), 'claim RPC is SECURITY DEFINER with explicit empty search path');
select ok((select prosecdef and array_to_string(proconfig, ',') like '%search_path=%' from pg_proc where oid = 'platform.list_my_claimable_workspace_invitations()'::regprocedure), 'list RPC is SECURITY DEFINER with explicit empty search path');

set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select throws_like($$select * from platform.list_my_claimable_workspace_invitations()$$, '%authentication_required%', 'missing auth UID cannot list invitations');
select throws_like($$select * from platform.claim_workspace_invitation('f5000000-0000-0000-0000-000000000001','Invitee','ro','Europe/Bucharest')$$, '%authentication_required%', 'missing auth UID cannot claim invitations');

select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select throws_like($$select * from platform.list_my_claimable_workspace_invitations()$$, '%verified_identity_required%', 'unconfirmed email cannot list invitations');
select throws_like($$select * from platform.claim_workspace_invitation('f5000000-0000-0000-0000-000000000001','Unconfirmed','ro','Europe/Bucharest')$$, '%verified_identity_required%', 'unconfirmed email cannot claim invitations');

select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select ok((select count(*) = 2 from platform.list_my_claimable_workspace_invitations()), 'exactly two valid invitations are listed for the verified email');
select ok((select count(*) = 0 from platform.list_my_claimable_workspace_invitations() where invitation_id in ('f5000000-0000-0000-0000-000000000003','f5000000-0000-0000-0000-000000000004','f5000000-0000-0000-0000-000000000005','f5000000-0000-0000-0000-000000000006','f5000000-0000-0000-0000-000000000007')), 'expired, revoked, mismatched, invalid-role, and used invitations are absent');
select ok((select count(*) = 0 from platform.workspace_invitations), 'RLS prevents direct invitation enumeration by the invitee');
select throws_like($$select * from platform.claim_workspace_invitation('00000000-0000-0000-0000-000000000000','Invitee','ro','Europe/Bucharest')$$, '%invitation_unavailable%', 'random invitation selector fails closed');
select throws_like($$select * from platform.claim_workspace_invitation('f5000000-0000-0000-0000-000000000003','Invitee','ro','Europe/Bucharest')$$, '%invitation_unavailable%', 'expired invitation fails closed');
select throws_like($$select * from platform.claim_workspace_invitation('f5000000-0000-0000-0000-000000000004','Invitee','ro','Europe/Bucharest')$$, '%invitation_unavailable%', 'revoked or cancelled invitation fails closed');
select throws_like($$select * from platform.claim_workspace_invitation('f5000000-0000-0000-0000-000000000005','Invitee','ro','Europe/Bucharest')$$, '%invitation_unavailable%', 'email mismatch fails closed');
select throws_like($$select * from platform.claim_workspace_invitation('f5000000-0000-0000-0000-000000000006','Invitee','ro','Europe/Bucharest')$$, '%invitation_authorization_mismatch%', 'cross-tenant stored role fails closed');
select throws_like($$select * from platform.claim_workspace_invitation('f5000000-0000-0000-0000-000000000007','Invitee','ro','Europe/Bucharest')$$, '%invitation_unavailable%', 'invitation used by another user fails closed');
select ok((select claim_status = 'claimed' from platform.claim_workspace_invitation('f5000000-0000-0000-0000-000000000001','Verified Invitee','fa','Europe/Bucharest')), 'valid pending invitation is claimed without a bearer token');
select ok((select claim_status = 'already_claimed_by_you' from platform.claim_workspace_invitation('f5000000-0000-0000-0000-000000000001','Verified Invitee','fa','Europe/Bucharest')), 'same-user retry is idempotent');
select ok((select count(*) = 1 from platform.list_my_claimable_workspace_invitations()), 'claimed invitation leaves only the second pending choice');

reset role;
select ok((select count(*) = 1 from identity.profiles where user_id = 'f1000000-0000-0000-0000-000000000001' and locale = 'fa'), 'claim creates the verified user profile');
select ok((select count(*) = 1 from identity.memberships where tenant_id = 'f2000000-0000-0000-0000-000000000001' and user_id = 'f1000000-0000-0000-0000-000000000001' and role_id = 'f4000000-0000-0000-0000-000000000001' and status = 'active'), 'claim creates exactly one active membership');
select ok((select count(*) = 1 from identity.context_grants as cg join identity.memberships as m on m.id = cg.membership_id where m.user_id = 'f1000000-0000-0000-0000-000000000001' and cg.tenant_id = 'f2000000-0000-0000-0000-000000000001' and cg.scope_type = 'tenant' and cg.ends_at is null), 'claim creates exactly one open tenant context grant');
select ok((select status = 'accepted' and accepted_by = 'f1000000-0000-0000-0000-000000000001' and accepted_membership_id is not null from platform.workspace_invitations where id = 'f5000000-0000-0000-0000-000000000001'), 'claim atomically binds invitation to the verified Auth user');
select ok((select primary_admin_user_id = 'f1000000-0000-0000-0000-000000000001' from platform.customer_workspaces where id = 'f3000000-0000-0000-0000-000000000001'), 'stored owner role binds the workspace primary administrator');
select ok((select count(*) = 1 from audit.events where action = 'WORKSPACE_INVITATION_CLAIMED' and entity_id = 'f5000000-0000-0000-0000-000000000001'), 'first claim writes one audit event');
select ok((select count(*) = 0 from audit.events where action = 'WORKSPACE_INVITATION_CLAIMED' and (coalesce(reason, '') ilike '%tokenless.invitee@cladora.test%' or coalesce(before_snapshot::text, '') ilike '%tokenless.invitee@cladora.test%' or coalesce(after_snapshot::text, '') ilike '%tokenless.invitee@cladora.test%')), 'audit contains no invitation email PII');
select ok((select count(*) = 1 from audit.events where action = 'WORKSPACE_INVITATION_CLAIMED' and entity_id = 'f5000000-0000-0000-0000-000000000001'), 'idempotent retry does not duplicate audit evidence');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select throws_like($$select * from platform.claim_workspace_invitation('f5000000-0000-0000-0000-000000000002','Other User','ro','Europe/Bucharest')$$, '%invitation_unavailable%', 'selector belonging to another verified email is rejected');

select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select ok((select claim_status = 'claimed' from platform.claim_workspace_invitation('f5000000-0000-0000-0000-000000000002','Verified Invitee','en','Europe/Bucharest')), 'same verified user can claim a second authorized workspace');

reset role;
select ok((select count(*) = 2 from identity.memberships where user_id = 'f1000000-0000-0000-0000-000000000001' and status = 'active'), 'multi-workspace claims preserve membership uniqueness per tenant and role');
select ok((select count(*) = 2 from identity.context_grants as cg join identity.memberships as m on m.id = cg.membership_id where m.user_id = 'f1000000-0000-0000-0000-000000000001' and cg.scope_type = 'tenant' and cg.ends_at is null), 'multi-workspace claims preserve one open context per membership');
select ok((select position('p_token' in pg_get_functiondef('platform.claim_workspace_invitation(uuid,text,text,text)'::regprocedure)) = 0 and position('token_hash' in pg_get_functiondef('platform.claim_workspace_invitation(uuid,text,text,text)'::regprocedure)) = 0), 'tokenless claim function contains no raw-token or digest input');
select ok((select position('p_workspace_id' in pg_get_functiondef('platform.claim_workspace_invitation(uuid,text,text,text)'::regprocedure)) = 0 and position('p_role_id' in pg_get_functiondef('platform.claim_workspace_invitation(uuid,text,text,text)'::regprocedure)) = 0), 'client cannot supply workspace or role authorization inputs');

select * from finish();
rollback;
