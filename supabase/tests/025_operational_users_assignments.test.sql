begin;
set local search_path = public, extensions;
select plan(12);

select ok(to_regprocedure('app_private.can_read_platform_user(uuid)') is not null, 'scoped platform user read helper exists');
select ok(to_regprocedure('platform.grant_customer_assignment(uuid,uuid,text,text,timestamptz,timestamptz,text)') is not null, 'time-bounded grant RPC exists');
select ok(to_regprocedure('platform.grant_customer_assignment(uuid,uuid,text,text,timestamptz,text)') is null, 'legacy grant RPC signature is removed');
select ok(to_regprocedure('platform.revoke_customer_assignment(uuid,text)') is not null, 'controlled revoke RPC exists');
select ok(exists(select 1 from pg_indexes where schemaname='platform' and indexname='platform_customer_assignments_active_workspace_user_idx'), 'active assignment browse index exists');
select ok(exists(select 1 from pg_policies where schemaname='platform' and tablename='platform_users' and policyname='platform_users_read'), 'platform user scoped RLS exists');
select ok(exists(select 1 from pg_policies where schemaname='platform' and tablename='platform_role_assignments' and policyname='platform_roles_read'), 'platform role scoped RLS exists');
select ok(exists(select 1 from pg_policies where schemaname='platform' and tablename='platform_customer_assignments' and policyname='platform_customer_assignments_select'), 'assignment scoped RLS exists');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000012","role":"authenticated","aal":"aal1"}', true);
select ok(not app_private.has_platform_aal2(), 'AAL1 fails closed');
select ok(not app_private.can_read_platform_user('00000000-0000-0000-0000-000000000012'::uuid), 'AAL1 cannot read platform user records');
select throws_like(
  $$ select platform.grant_customer_assignment('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000013','workspace',null,statement_timestamp(),null,'Unauthorized grant attempt') $$,
  '%access_denied%', 'unauthorized caller cannot grant an assignment'
);
select throws_like(
  $$ select platform.revoke_customer_assignment('00000000-0000-0000-0000-000000000014','Unauthorized revoke attempt') $$,
  '%access_denied%', 'unauthorized caller cannot revoke an assignment'
);

select * from finish();
rollback;
