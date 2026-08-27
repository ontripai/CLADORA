begin;
set local search_path = public, extensions;

select plan(30);

create temporary table acceptance_tokens (
  token text primary key,
  invitation_id uuid
);
grant all on acceptance_tokens to authenticated;

do $$
declare
  v_admin_uid uuid := 'b1000000-0000-0000-0000-000000000001';
  v_invitee_uid uuid := 'b1000000-0000-0000-0000-000000000002';
  v_other_uid uuid := 'b1000000-0000-0000-0000-000000000003';
  v_unconfirmed_uid uuid := 'b1000000-0000-0000-0000-000000000004';
  v_admin_pu uuid := 'b2000000-0000-0000-0000-000000000001';
  v_tenant uuid := 'b3000000-0000-0000-0000-000000000001';
  v_ws uuid := 'b4000000-0000-0000-0000-000000000001';
  v_ws_active uuid := 'b4000000-0000-0000-0000-000000000002';
  v_owner_role uuid := 'b5000000-0000-0000-0000-000000000001';
  v_tenant_role uuid := 'b5000000-0000-0000-0000-000000000002';
begin
  insert into auth.users (id,email,email_confirmed_at) values
    (v_admin_uid,'accept-admin@cladora.test',statement_timestamp()),
    (v_invitee_uid,'primary.admin@cladora.test',statement_timestamp()),
    (v_other_uid,'other.person@cladora.test',statement_timestamp()),
    (v_unconfirmed_uid,'unconfirmed@cladora.test',null);

  insert into platform.platform_users (id,auth_user_id,employee_ref,display_name,status)
  values (v_admin_pu,v_admin_uid,'ACC-ADM','Acceptance Admin','active');
  insert into platform.platform_role_assignments (platform_user_id,role,status,grant_reason)
  values (v_admin_pu,'PLATFORM_SUPER_ADMIN','active','010B fixture');

  insert into platform.tenants (id,legal_name,registration_number)
  values (v_tenant,'Acceptance Tenant','RO-ACC');

  insert into platform.customer_workspaces
    (id,tenant_id,workspace_type,lifecycle_status,commercial_owner,environment)
  values
    (v_ws,v_tenant,'ASSOCIATION','PROVISIONING','Acceptance Owner','PRODUCTION'),
    (v_ws_active,v_tenant,'ASSOCIATION','ACTIVE','Active Owner','PILOT');

  insert into identity.roles (id,tenant_id,code,name,is_system) values
    (v_owner_role,v_tenant,'WORKSPACE_OWNER','Workspace Owner',false),
    (v_tenant_role,v_tenant,'TENANT','Tenant',false);
end;
$$;

select ok((select count(*)=4 from information_schema.columns where table_schema='platform' and table_name='customer_workspaces' and column_name in ('primary_admin_user_id','primary_admin_membership_id','primary_admin_accepted_at','onboarding_completed_at')),'workspace primary admin and onboarding columns exist');
select ok((select count(*)=1 from information_schema.columns where table_schema='platform' and table_name='workspace_invitations' and column_name='accepted_membership_id'),'invitation accepted membership column exists');
select ok(to_regclass('platform.customer_workspaces_primary_admin_user_idx') is not null,'primary admin user foreign key is indexed');
select ok(to_regclass('platform.customer_workspaces_primary_admin_membership_idx') is not null,'primary admin membership foreign key is indexed');
select ok(to_regclass('platform.workspace_invitations_accepted_membership_idx') is not null,'accepted invitation membership foreign key is indexed');
select ok(not has_function_privilege('public','platform.accept_primary_admin_invitation(text,text,text,text)','execute'),'PUBLIC cannot execute primary admin acceptance');
select ok(has_function_privilege('authenticated','platform.accept_primary_admin_invitation(text,text,text,text)','execute'),'authenticated can execute guarded acceptance RPC');
select ok((select p.prosecdef and coalesce(array_to_string(p.proconfig,','),'') like '%search_path=%' from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='platform' and p.proname='accept_primary_admin_invitation'),'acceptance RPC is security definer with fixed search path');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"b1000000-0000-0000-0000-000000000001","role":"authenticated"}',true);

insert into acceptance_tokens(token,invitation_id)
select invitation_token,invitation_id
from platform.create_workspace_invitation(
  'b4000000-0000-0000-0000-000000000001',
  'primary.admin@cladora.test',
  'b5000000-0000-0000-0000-000000000001',
  'tenant',
  interval '72 hours',
  'Primary administrator acceptance fixture'
);

select set_config('request.jwt.claims','{"role":"authenticated"}',true);
select throws_like(
  $$select * from platform.accept_primary_admin_invitation((select token from acceptance_tokens limit 1),'Primary Admin','ro','Europe/Bucharest')$$,
  '%authentication_required%','unauthenticated acceptance is rejected');

select set_config('request.jwt.claims','{"sub":"b1000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select throws_like(
  $$select * from platform.accept_primary_admin_invitation('short','Primary Admin','ro','Europe/Bucharest')$$,
  '%invalid_invitation%','short token is rejected');
select throws_like(
  $$select * from platform.accept_primary_admin_invitation((select token from acceptance_tokens limit 1),' ','ro','Europe/Bucharest')$$,
  '%invalid_display_name%','blank display name is rejected');
select throws_like(
  $$select * from platform.accept_primary_admin_invitation((select token from acceptance_tokens limit 1),'Primary Admin','de','Europe/Bucharest')$$,
  '%invalid_locale%','unsupported locale is rejected');
select throws_like(
  $$select * from platform.accept_primary_admin_invitation((select token from acceptance_tokens limit 1),'Primary Admin','ro',' ')$$,
  '%invalid_timezone%','blank timezone is rejected');

select set_config('request.jwt.claims','{"sub":"b1000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select throws_like(
  $$select * from platform.accept_primary_admin_invitation((select token from acceptance_tokens limit 1),'Other Person','en','Europe/Bucharest')$$,
  '%invitation_email_mismatch%','different authenticated email cannot accept invitation');

select set_config('request.jwt.claims','{"sub":"b1000000-0000-0000-0000-000000000004","role":"authenticated"}',true);
select throws_like(
  $$select * from platform.accept_primary_admin_invitation((select token from acceptance_tokens limit 1),'Unconfirmed User','en','Europe/Bucharest')$$,
  '%email_not_confirmed%','unconfirmed email cannot accept invitation');

select set_config('request.jwt.claims','{"sub":"b1000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
insert into acceptance_tokens(token,invitation_id)
select invitation_token,invitation_id
from platform.create_workspace_invitation(
  'b4000000-0000-0000-0000-000000000001',
  'other.person@cladora.test',
  'b5000000-0000-0000-0000-000000000002',
  'tenant',
  interval '1 hour',
  'Invalid primary role fixture'
);

select set_config('request.jwt.claims','{"sub":"b1000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select throws_like(
  $$select * from platform.accept_primary_admin_invitation((select token from acceptance_tokens where invitation_id=(select id from platform.workspace_invitations where normalized_email='other.person@cladora.test')),'Other Person','en','Europe/Bucharest')$$,
  '%invalid_primary_admin_role%','non-admin role cannot become primary administrator');

select set_config('request.jwt.claims','{"sub":"b1000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select ok((
  select count(*)=1
  from platform.accept_primary_admin_invitation(
    (select token from acceptance_tokens where invitation_id=(select id from platform.workspace_invitations where normalized_email='primary.admin@cladora.test')),
    'Primary Administrator','ro','Europe/Bucharest'
  )
),'matching confirmed user accepts primary admin invitation');

reset role;

select ok((select count(*)=1 from identity.profiles where user_id='b1000000-0000-0000-0000-000000000002' and display_name='Primary Administrator' and locale='ro'),'acceptance creates the identity profile');
select ok((select count(*)=1 from identity.memberships where tenant_id='b3000000-0000-0000-0000-000000000001' and user_id='b1000000-0000-0000-0000-000000000002' and status='active'),'acceptance creates one active membership');
select ok((select count(*)=1 from identity.context_grants cg join identity.memberships m on m.id=cg.membership_id where m.user_id='b1000000-0000-0000-0000-000000000002' and cg.scope_type='tenant'),'acceptance creates tenant context grant');
select ok((select status='accepted' and accepted_by='b1000000-0000-0000-0000-000000000002' and accepted_membership_id is not null from platform.workspace_invitations where normalized_email='primary.admin@cladora.test'),'invitation becomes accepted and binds membership');
select ok((select primary_admin_user_id='b1000000-0000-0000-0000-000000000002' and primary_admin_membership_id is not null and primary_admin_accepted_at is not null from platform.customer_workspaces where id='b4000000-0000-0000-0000-000000000001'),'workspace records the primary administrator');
select ok((select onboarding_completed_at is null from platform.customer_workspaces where id='b4000000-0000-0000-0000-000000000001'),'onboarding remains incomplete after invitation acceptance');
select ok((select count(*)=1 from audit.events where action='PRIMARY_ADMIN_INVITATION_ACCEPTED'),'acceptance is recorded in audit events');
select ok((select count(*)=1 from identity.memberships where tenant_id='b3000000-0000-0000-0000-000000000001' and user_id='b1000000-0000-0000-0000-000000000002' and role_id='b5000000-0000-0000-0000-000000000001'),'primary administrator receives the invited role');
select ok((select count(*)=1 from audit.events where action='PRIMARY_ADMIN_INVITATION_ACCEPTED' and coalesce(reason,'') not like '%'||(select token from acceptance_tokens where invitation_id=(select id from platform.workspace_invitations where normalized_email='primary.admin@cladora.test'))||'%' and before_snapshot::text not like '%'||(select token from acceptance_tokens where invitation_id=(select id from platform.workspace_invitations where normalized_email='primary.admin@cladora.test'))||'%' and after_snapshot::text not like '%'||(select token from acceptance_tokens where invitation_id=(select id from platform.workspace_invitations where normalized_email='primary.admin@cladora.test'))||'%'),'raw invitation token is never written to audit data');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"b1000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select ok((
  select count(*)=1
  from platform.accept_primary_admin_invitation(
    (select token from acceptance_tokens where invitation_id=(select id from platform.workspace_invitations where normalized_email='primary.admin@cladora.test')),
    'Primary Administrator','ro','Europe/Bucharest'
  )
),'same actor retry is idempotent');

reset role;
select ok((select count(*)=1 from identity.memberships where tenant_id='b3000000-0000-0000-0000-000000000001' and user_id='b1000000-0000-0000-0000-000000000002' and status='active'),'idempotent retry does not duplicate membership');
select ok((select count(*)=1 from identity.context_grants cg join identity.memberships m on m.id=cg.membership_id where m.user_id='b1000000-0000-0000-0000-000000000002' and cg.scope_type='tenant'),'idempotent retry does not duplicate context grant');
select ok((select version=2 from platform.customer_workspaces where id='b4000000-0000-0000-0000-000000000001'),'idempotent retry does not increment workspace version twice');

select * from finish();
rollback;
