begin;
set local search_path = public, extensions;

select plan(36);

create temporary table invitation_test_tokens (
  label text primary key,
  invitation_id uuid,
  token text,
  expires_at timestamptz
);

do $$
declare
  v_admin_uid uuid := 'a1000000-0000-0000-0000-000000000001';
  v_ops_uid uuid := 'a1000000-0000-0000-0000-000000000002';
  v_aud_uid uuid := 'a1000000-0000-0000-0000-000000000003';
  v_admin_pu uuid := 'a2000000-0000-0000-0000-000000000001';
  v_ops_pu uuid := 'a2000000-0000-0000-0000-000000000002';
  v_aud_pu uuid := 'a2000000-0000-0000-0000-000000000003';
  v_tenant_a uuid := 'a3000000-0000-0000-0000-000000000001';
  v_tenant_b uuid := 'a3000000-0000-0000-0000-000000000002';
  v_ws_a uuid := 'a4000000-0000-0000-0000-000000000001';
  v_ws_b uuid := 'a4000000-0000-0000-0000-000000000002';
  v_ws_active uuid := 'a4000000-0000-0000-0000-000000000003';
  v_role_a uuid := 'a5000000-0000-0000-0000-000000000001';
  v_role_b uuid := 'a5000000-0000-0000-0000-000000000002';
begin
  insert into auth.users (id,email) values
    (v_admin_uid,'invite-admin@cladora.test'),
    (v_ops_uid,'invite-ops@cladora.test'),
    (v_aud_uid,'invite-auditor@cladora.test');

  insert into platform.platform_users (id,auth_user_id,employee_ref,display_name,status) values
    (v_admin_pu,v_admin_uid,'INV-ADM','Invite Admin','active'),
    (v_ops_pu,v_ops_uid,'INV-OPS','Invite Operations','active'),
    (v_aud_pu,v_aud_uid,'INV-AUD','Invite Auditor','active');

  insert into platform.platform_role_assignments (platform_user_id,role,status,grant_reason) values
    (v_admin_pu,'PLATFORM_SUPER_ADMIN','active','010A fixture'),
    (v_ops_pu,'PLATFORM_OPERATIONS','active','010A fixture'),
    (v_aud_pu,'PLATFORM_AUDITOR','active','010A fixture');

  insert into platform.tenants (id,legal_name,registration_number) values
    (v_tenant_a,'Invitation Tenant A','RO-INV-A'),
    (v_tenant_b,'Invitation Tenant B','RO-INV-B');

  insert into platform.customer_workspaces
    (id,tenant_id,workspace_type,lifecycle_status,commercial_owner,environment)
  values
    (v_ws_a,v_tenant_a,'ASSOCIATION','PROVISIONING','Owner A','PILOT'),
    (v_ws_b,v_tenant_b,'ASSOCIATION','PROVISIONING','Owner B','PILOT'),
    (v_ws_active,v_tenant_a,'ASSOCIATION','ACTIVE','Owner Active','PILOT');

  insert into identity.roles (id,tenant_id,code,name,is_system) values
    (v_role_a,v_tenant_a,'WORKSPACE_OWNER','Workspace Owner',false),
    (v_role_b,v_tenant_b,'WORKSPACE_OWNER','Workspace Owner',false);

  insert into platform.platform_customer_assignments
    (platform_user_id,customer_workspace_id,scope_type,status,assignment_reason)
  values
    (v_ops_pu,v_ws_a,'workspace','active','010A assigned operations fixture');
end;
$$;

select has_table('platform','workspace_invitations','workspace invitations table exists');
select ok((select relrowsecurity from pg_class where oid='platform.workspace_invitations'::regclass),'workspace invitations RLS is enabled');
select ok((select data_type='bytea' from information_schema.columns where table_schema='platform' and table_name='workspace_invitations' and column_name='token_hash'),'only a binary token hash is stored');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1000000-0000-0000-0000-000000000002","role":"authenticated"}',true);

select throws_like(
  $$insert into platform.workspace_invitations
    (customer_workspace_id,normalized_email,role_id,token_hash,expires_at,invited_by,invitation_reason)
    values ('a4000000-0000-0000-0000-000000000001','bypass@example.com','a5000000-0000-0000-0000-000000000001',decode('00','hex'),statement_timestamp()+interval '1 hour','a1000000-0000-0000-0000-000000000002','bypass')$$,
  '%permission denied%','direct invitation INSERT is denied');
select throws_like($$update platform.workspace_invitations set status='accepted' where id is not null$$,'%permission denied%','direct invitation UPDATE is denied');
select throws_like($$delete from platform.workspace_invitations where id is not null$$,'%permission denied%','direct invitation DELETE is denied');

set local role anon;
select ok((select count(*)=0 from platform.validate_workspace_invitation('invalid-token-value-that-is-long-enough-for-validation')),'invalid anonymous token reveals no invitation');
select ok(not has_table_privilege('anon','platform.workspace_invitations','select'),'anon has no direct invitation table access');

set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated"}',true);
select throws_like(
  $$select * from platform.create_workspace_invitation('a4000000-0000-0000-0000-000000000001','person@example.com','a5000000-0000-0000-0000-000000000001','tenant',interval '72 hours','No actor')$$,
  '%access_denied%','missing authenticated actor is denied');

select set_config('request.jwt.claims','{"sub":"a1000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select throws_like(
  $$select * from platform.create_workspace_invitation('a4000000-0000-0000-0000-000000000001','invalid email','a5000000-0000-0000-0000-000000000001','tenant',interval '72 hours','Invalid email')$$,
  '%invalid_email%','invalid email is rejected');
select throws_like(
  $$select * from platform.create_workspace_invitation('a4000000-0000-0000-0000-000000000001','long@example.com','a5000000-0000-0000-0000-000000000001','tenant',interval '73 hours','Too long')$$,
  '%invalid_expiry%','expiry over 72 hours is rejected');
select throws_like(
  $$select * from platform.create_workspace_invitation('a4000000-0000-0000-0000-000000000001','short@example.com','a5000000-0000-0000-0000-000000000001','tenant',interval '14 minutes','Too short')$$,
  '%invalid_expiry%','expiry under 15 minutes is rejected');
select throws_like(
  $$select * from platform.create_workspace_invitation('a4000000-0000-0000-0000-000000000001','reason@example.com','a5000000-0000-0000-0000-000000000001','tenant',interval '72 hours','   ')$$,
  '%invalid_reason%','blank invitation reason is rejected');
select throws_like(
  $$select * from platform.create_workspace_invitation('a4000000-0000-0000-0000-000000000003','active@example.com','a5000000-0000-0000-0000-000000000001','tenant',interval '72 hours','Wrong lifecycle')$$,
  '%workspace_not_provisioning%','non-provisioning workspace is rejected');
select throws_like(
  $$select * from platform.create_workspace_invitation('a4000000-0000-0000-0000-000000000001','mismatch@example.com','a5000000-0000-0000-0000-000000000002','tenant',interval '72 hours','Wrong tenant role')$$,
  '%role_workspace_mismatch%','cross-tenant role is rejected');

select set_config('request.jwt.claims','{"sub":"a1000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select throws_like(
  $$select * from platform.create_workspace_invitation('a4000000-0000-0000-0000-000000000002','unassigned@example.com','a5000000-0000-0000-0000-000000000002','tenant',interval '72 hours','Unassigned')$$,
  '%access_denied%','unassigned operations user cannot invite');

select set_config('request.jwt.claims','{"sub":"a1000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
insert into invitation_test_tokens(label,invitation_id,token,expires_at)
select 'admin', invitation_id, invitation_token, invitation_expires_at
from platform.create_workspace_invitation(
  'a4000000-0000-0000-0000-000000000001',
  ' Primary.Owner@Example.COM ',
  'a5000000-0000-0000-0000-000000000001',
  'tenant',
  interval '72 hours',
  'Primary administrator onboarding'
);

select ok((select length(token)>=40 from invitation_test_tokens where label='admin'),'created invitation returns one strong opaque token');
select ok((select i.token_hash <> convert_to(t.token,'UTF8') from platform.workspace_invitations i join invitation_test_tokens t on t.invitation_id=i.id where t.label='admin'),'raw invitation token is never stored');
select ok((select count(*)=1 from invitation_test_tokens t cross join lateral platform.validate_workspace_invitation(t.token) v where t.label='admin' and v.invitation_id=t.invitation_id),'valid token resolves exactly one active invitation');
select ok((select count(*)=0 from platform.validate_workspace_invitation('wrong-token-value-that-is-long-enough-to-be-tested-safely')),'wrong token resolves no invitation');
select ok((select normalized_email='primary.owner@example.com' from platform.workspace_invitations i join invitation_test_tokens t on t.invitation_id=i.id where t.label='admin'),'invitation email is normalized');
select throws_like(
  $$select * from platform.create_workspace_invitation('a4000000-0000-0000-0000-000000000001','primary.owner@example.com','a5000000-0000-0000-0000-000000000001','tenant',interval '72 hours','Duplicate')$$,
  '%active_invitation_exists%','duplicate active invitation is rejected');

select set_config('request.jwt.claims','{"sub":"a1000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select ok((select count(*)=1 from audit.events where action='WORKSPACE_INVITATION_CREATED'),'invitation creation is audited');

select set_config('request.jwt.claims','{"sub":"a1000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
insert into invitation_test_tokens(label,invitation_id,token,expires_at)
select 'ops', invitation_id, invitation_token, invitation_expires_at
from platform.create_workspace_invitation(
  'a4000000-0000-0000-0000-000000000001',
  'ops.invitee@example.com',
  'a5000000-0000-0000-0000-000000000001',
  'tenant',
  interval '1 hour',
  'Assigned operations invitation'
);
select ok((select count(*)=1 from invitation_test_tokens where label='ops'),'assigned operations user can create invitation');
select throws_like(
  $$select platform.revoke_workspace_invitation((select invitation_id from invitation_test_tokens where label='ops'),'   ')$$,
  '%invalid_reason%','blank revoke reason is rejected');
select ok((
  select (platform.revoke_workspace_invitation(
    (select invitation_id from invitation_test_tokens where label='ops'),
    'Invitation no longer required'
  )).status='revoked'
),'assigned operations user can revoke invitation');
select ok((select count(*)=0 from invitation_test_tokens t cross join lateral platform.validate_workspace_invitation(t.token) v where t.label='ops'),'revoked token no longer validates');

select set_config('request.jwt.claims','{"sub":"a1000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select ok((select count(*)=1 from audit.events where action='WORKSPACE_INVITATION_REVOKED'),'invitation revocation is audited');

select set_config('request.jwt.claims','{"sub":"a1000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select throws_like(
  $$select platform.revoke_workspace_invitation((select invitation_id from invitation_test_tokens where label='ops'),'Second revoke')$$,
  '%invalid_invitation_state%','revoked invitation cannot be revoked again');

reset role;
select ok(not has_function_privilege('public','platform.create_workspace_invitation(uuid,text,uuid,identity.scope_type,interval,text)','execute'),'PUBLIC cannot execute invitation creation');
select ok(not has_function_privilege('public','platform.revoke_workspace_invitation(uuid,text)','execute'),'PUBLIC cannot execute invitation revocation');
select ok(has_function_privilege('anon','platform.validate_workspace_invitation(text)','execute'),'anon can execute minimal token validation');
select ok((select count(*)=1 from pg_policies where schemaname='platform' and tablename='workspace_invitations' and policyname='workspace_invitations_platform_read'),'platform invitation read policy exists');
select ok((select count(*)=0 from information_schema.role_table_grants where table_schema='platform' and table_name='workspace_invitations' and grantee='authenticated' and privilege_type in ('INSERT','UPDATE','DELETE')),'authenticated has no direct invitation mutation privileges');
select ok((select count(*)=3 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='platform' and p.proname in ('create_workspace_invitation','validate_workspace_invitation','revoke_workspace_invitation') and p.prosecdef and coalesce(array_to_string(p.proconfig,','),'') like '%search_path=%'),'all invitation RPCs are security definer with fixed search paths');
select ok((select count(*)=5 from pg_indexes where schemaname='platform' and tablename='workspace_invitations' and indexname in ('workspace_invitations_workspace_status_idx','workspace_invitations_role_id_idx','workspace_invitations_invited_by_idx','workspace_invitations_accepted_by_idx','workspace_invitations_revoked_by_idx')),'all invitation foreign-key and lookup indexes exist');

select * from finish();
rollback;
