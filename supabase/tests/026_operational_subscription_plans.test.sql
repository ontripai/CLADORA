begin;
set local search_path = public, extensions;
select plan(26);
select ok(to_regprocedure('app_private.can_read_subscription_plan(uuid)') is not null, 'assignment-scoped plan read helper exists');
select ok(to_regprocedure('platform.get_plan_dependency_counts(uuid[])') is not null, 'scoped dependency counter exists');
select ok(to_regprocedure('platform.create_subscription_plan_version(text,text,jsonb,jsonb,timestamptz,timestamptz,text)') is not null, 'version creation RPC exists');
select ok(to_regprocedure('platform.activate_subscription_plan(uuid,text)') is not null, 'activation RPC exists');
select ok(to_regprocedure('platform.retire_subscription_plan(uuid,text)') is not null, 'retirement RPC exists');
select ok(exists(select 1 from pg_policies where schemaname='platform' and tablename='subscription_plans' and policyname='subscription_plans_select' and qual like '%can_read_subscription_plan%'), 'plan RLS delegates to scoped helper');
select ok(exists(select 1 from pg_indexes where schemaname='platform' and indexname='subscription_plans_one_active_code_idx'), 'one-active-version index exists');
select ok(exists(select 1 from pg_trigger where tgname='subscription_plans_protect_published' and not tgisinternal), 'published plan immutability trigger exists');
select ok(has_table_privilege('authenticated','platform.subscription_plans','SELECT'), 'authenticated may select through RLS');
select ok(not has_table_privilege('authenticated','platform.subscription_plans','INSERT'), 'authenticated cannot insert plans directly');
select ok(not has_table_privilege('authenticated','platform.subscription_plans','UPDATE'), 'authenticated cannot update plans directly');
select ok(not has_table_privilege('authenticated','platform.subscription_plans','DELETE'), 'authenticated cannot delete plans directly');
do $$ declare r record; begin
  for r in select * from (values
    ('13000000-0000-0000-0000-000000000001'::uuid,'13100000-0000-0000-0000-000000000001'::uuid,'PLAN-OPS-026','PLATFORM_OPERATIONS'::platform.platform_role_type),
    ('13000000-0000-0000-0000-000000000002'::uuid,'13100000-0000-0000-0000-000000000002'::uuid,'PLAN-FIN-026','PLATFORM_FINANCE'::platform.platform_role_type),
    ('13000000-0000-0000-0000-000000000003'::uuid,'13100000-0000-0000-0000-000000000003'::uuid,'PLAN-AUD-026','PLATFORM_AUDITOR'::platform.platform_role_type),
    ('13000000-0000-0000-0000-000000000004'::uuid,'13100000-0000-0000-0000-000000000004'::uuid,'PLAN-ADM-026','PLATFORM_SUPER_ADMIN'::platform.platform_role_type)
  ) x(auth_id,platform_id,employee_ref,role_name) loop
    insert into auth.users(id,email) values(r.auth_id,lower(r.employee_ref)||'@cladora.test');
    insert into platform.platform_users(id,auth_user_id,employee_ref,display_name,status) values(r.platform_id,r.auth_id,r.employee_ref,r.employee_ref,'active');
    insert into platform.platform_role_assignments(platform_user_id,role,status,grant_reason) values(r.platform_id,r.role_name,'active','Plan catalogue acceptance fixture');
  end loop;
  insert into platform.tenants(id,legal_name,registration_number) values ('13200000-0000-0000-0000-000000000001','Plan Assigned Tenant','PLAN-026-1'),('13200000-0000-0000-0000-000000000002','Plan Hidden Tenant','PLAN-026-2');
  insert into platform.customer_workspaces(id,tenant_id,workspace_type,lifecycle_status,commercial_owner,environment) values ('13300000-0000-0000-0000-000000000001','13200000-0000-0000-0000-000000000001','ASSOCIATION','ACTIVE','Assigned','PILOT'),('13300000-0000-0000-0000-000000000002','13200000-0000-0000-0000-000000000002','ASSOCIATION','ACTIVE','Hidden','PILOT');
  insert into platform.subscription_plans(id,plan_code,version,display_name,status) values ('13400000-0000-0000-0000-000000000001','ACCEPT_ASSIGNED',1,'Assigned plan','active'),('13400000-0000-0000-0000-000000000002','ACCEPT_HIDDEN',1,'Hidden plan','active');
  insert into platform.workspace_contracts(customer_workspace_id,plan_id,contract_ref,status,start_date) values ('13300000-0000-0000-0000-000000000001','13400000-0000-0000-0000-000000000001','PLAN-ASSIGNED-026','active',current_date),('13300000-0000-0000-0000-000000000002','13400000-0000-0000-0000-000000000002','PLAN-HIDDEN-026','active',current_date);
  insert into platform.platform_customer_assignments(platform_user_id,customer_workspace_id,scope_type,status,valid_from,assignment_reason) values
    ('13100000-0000-0000-0000-000000000001','13300000-0000-0000-0000-000000000001','workspace','active',statement_timestamp()-interval '1 day','Operations plan fixture'),
    ('13100000-0000-0000-0000-000000000002','13300000-0000-0000-0000-000000000001','commercial','active',statement_timestamp()-interval '1 day','Finance plan fixture'),
    ('13100000-0000-0000-0000-000000000003','13300000-0000-0000-0000-000000000001','audit','active',statement_timestamp()-interval '1 day','Auditor plan fixture');
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"13000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',true);
select ok((select count(*)=1 from platform.subscription_plans where plan_code like 'ACCEPT_%'),'Operations sees only workspace-assigned plans');
select set_config('request.jwt.claims','{"sub":"13000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}',true);
select ok((select count(*)=1 from platform.subscription_plans where plan_code like 'ACCEPT_%'),'Finance sees only commercial-assigned plans');
select set_config('request.jwt.claims','{"sub":"13000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal2"}',true);
select ok((select count(*)=1 from platform.subscription_plans where plan_code like 'ACCEPT_%'),'Auditor sees only audit-assigned plans');
select set_config('request.jwt.claims','{"sub":"13000000-0000-0000-0000-000000000004","role":"authenticated","aal":"aal2"}',true);
select lives_ok($$select platform.create_subscription_plan_version('LIFECYCLE_026','Lifecycle plan','["feature_a"]','{"max_units":10}',statement_timestamp(),null,'Create lifecycle fixture')$$,'Super Admin creates a draft version');
select ok((select status='draft' from platform.subscription_plans where plan_code='LIFECYCLE_026'),'new version is draft');
select lives_ok($$select platform.activate_subscription_plan((select id from platform.subscription_plans where plan_code='LIFECYCLE_026'),'Activate lifecycle fixture')$$,'Super Admin activates a draft');
select ok((select status='active' from platform.subscription_plans where plan_code='LIFECYCLE_026'),'draft transitions to active');
select lives_ok($$select platform.retire_subscription_plan((select id from platform.subscription_plans where plan_code='LIFECYCLE_026'),'Retire lifecycle fixture')$$,'Super Admin retires an active version');
select ok((select status='retired' from platform.subscription_plans where plan_code='LIFECYCLE_026'),'active transitions to retired');
reset role;
select ok((select count(*)=3 from audit.events where entity_type='subscription_plan' and entity_id=(select id from platform.subscription_plans where plan_code='LIFECYCLE_026')),'each lifecycle mutation records an audit event');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000013","role":"authenticated","aal":"aal1"}',true);
select ok(not app_private.can_read_subscription_plan('00000000-0000-0000-0000-000000000014'), 'AAL1 plan read fails closed');
select throws_like($$select platform.create_subscription_plan_version('TEST_PLAN','Test plan','[]','{}',statement_timestamp(),null,'Unauthorized create')$$,'%access_denied%','non-Super Admin cannot create plan versions');
select throws_like($$select platform.activate_subscription_plan('00000000-0000-0000-0000-000000000014','Unauthorized activation')$$,'%access_denied%','non-Super Admin cannot activate plans');
select throws_like($$select platform.retire_subscription_plan('00000000-0000-0000-0000-000000000014','Unauthorized retirement')$$,'%access_denied%','non-Super Admin cannot retire plans');
select * from finish();
rollback;
