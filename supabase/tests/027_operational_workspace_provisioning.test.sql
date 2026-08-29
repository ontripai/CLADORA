begin;
select plan(31);

select ok(to_regprocedure('app_private.can_read_provisioning_run(uuid)') is not null,'scoped provisioning read helper exists');
select ok(to_regprocedure('platform.list_provisionable_workspaces()') is not null,'eligible workspace lookup exists');
select ok(to_regprocedure('platform.cancel_provisioning_run(uuid,text)') is not null,'controlled cancellation exists');
select ok(to_regprocedure('platform.retry_provisioning_task(uuid,text)') is not null,'controlled retry exists');
select ok((select c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='provisioning_runs'),'run RLS remains enabled');
select ok((select c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='provisioning_tasks'),'task RLS remains enabled');
select ok(not has_table_privilege('authenticated','platform.provisioning_runs','INSERT'),'authenticated cannot insert runs directly');
select ok(not has_table_privilege('authenticated','platform.provisioning_runs','UPDATE'),'authenticated cannot update runs directly');
select ok(not has_table_privilege('authenticated','platform.provisioning_tasks','INSERT'),'authenticated cannot insert tasks directly');
select ok(not has_table_privilege('authenticated','platform.provisioning_tasks','UPDATE'),'authenticated cannot update tasks directly');
select ok(to_regclass('platform.provisioning_runs_one_live_workspace_idx') is not null,'one live run index exists');

do $$ declare r record; begin
  for r in select * from (values
    ('14000000-0000-0000-0000-000000000001'::uuid,'14100000-0000-0000-0000-000000000001'::uuid,'PROV-ADM-027','PLATFORM_SUPER_ADMIN'::platform.platform_role_type),
    ('14000000-0000-0000-0000-000000000002'::uuid,'14100000-0000-0000-0000-000000000002'::uuid,'PROV-OPS-027','PLATFORM_OPERATIONS'::platform.platform_role_type),
    ('14000000-0000-0000-0000-000000000003'::uuid,'14100000-0000-0000-0000-000000000003'::uuid,'PROV-AUD-027','PLATFORM_AUDITOR'::platform.platform_role_type),
    ('14000000-0000-0000-0000-000000000004'::uuid,'14100000-0000-0000-0000-000000000004'::uuid,'PROV-FIN-027','PLATFORM_FINANCE'::platform.platform_role_type),
    ('14000000-0000-0000-0000-000000000005'::uuid,'14100000-0000-0000-0000-000000000005'::uuid,'PROV-AUD2-027','PLATFORM_AUDITOR'::platform.platform_role_type)
  ) x(auth_id,platform_id,employee_ref,role_name) loop
    insert into auth.users(id,email) values(r.auth_id,lower(r.employee_ref)||'@cladora.test');
    insert into platform.platform_users(id,auth_user_id,employee_ref,display_name,status) values(r.platform_id,r.auth_id,r.employee_ref,r.employee_ref,'active');
    insert into platform.platform_role_assignments(platform_user_id,role,status,grant_reason) values(r.platform_id,r.role_name,'active','Provisioning acceptance fixture');
  end loop;
  insert into platform.tenants(id,legal_name,registration_number) values
    ('14200000-0000-0000-0000-000000000001','Provisioning Tenant','PROV-027-1'),
    ('14200000-0000-0000-0000-000000000002','Provisioning Hidden','PROV-027-2');
  insert into platform.customer_workspaces(id,tenant_id,workspace_type,lifecycle_status,commercial_owner,environment) values
    ('14300000-0000-0000-0000-000000000001','14200000-0000-0000-0000-000000000001','ASSOCIATION','PROVISIONING','Eligible','PILOT'),
    ('14300000-0000-0000-0000-000000000002','14200000-0000-0000-0000-000000000002','ASSOCIATION','PROVISIONING','Hidden','PILOT');
  insert into platform.subscription_plans(id,plan_code,version,display_name,status,effective_from) values
    ('14400000-0000-0000-0000-000000000001','PROVISION_027',1,'Provision plan','active',statement_timestamp()-interval '1 day');
  insert into platform.workspace_contracts(id,customer_workspace_id,plan_id,contract_ref,status,start_date) values
    ('14500000-0000-0000-0000-000000000001','14300000-0000-0000-0000-000000000001','14400000-0000-0000-0000-000000000001','PROV-CONTRACT-027-1','active',current_date-1),
    ('14500000-0000-0000-0000-000000000002','14300000-0000-0000-0000-000000000002','14400000-0000-0000-0000-000000000001','PROV-CONTRACT-027-2','active',current_date-1);
  insert into platform.workspace_entitlements(customer_workspace_id,contract_id,entitlement_key,value_type,boolean_value,valid_from) values
    ('14300000-0000-0000-0000-000000000001','14500000-0000-0000-0000-000000000001','provisioning','boolean',true,statement_timestamp()-interval '1 day'),
    ('14300000-0000-0000-0000-000000000002','14500000-0000-0000-0000-000000000002','provisioning','boolean',true,statement_timestamp()-interval '1 day');
  insert into platform.platform_customer_assignments(platform_user_id,customer_workspace_id,scope_type,status,valid_from,assignment_reason) values
    ('14100000-0000-0000-0000-000000000002','14300000-0000-0000-0000-000000000001','workspace','active',statement_timestamp()-interval '1 day','Operations fixture'),
    ('14100000-0000-0000-0000-000000000003','14300000-0000-0000-0000-000000000001','audit','active',statement_timestamp()-interval '1 day','Auditor fixture'),
    ('14100000-0000-0000-0000-000000000004','14300000-0000-0000-0000-000000000001','commercial','active',statement_timestamp()-interval '1 day','Finance fixture');
end $$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"14000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',true);
select ok((select count(*)=2 from platform.list_provisionable_workspaces()),'Super Admin sees eligible workspaces');
select lives_ok($$select platform.create_provisioning_run('14300000-0000-0000-0000-000000000001','prov:027:first',array['validate_workspace','validate_contract'])$$,'Super Admin queues eligible run');
select ok((select status='queued' from platform.provisioning_runs where idempotency_key='prov:027:first'),'new run is queued');
select ok((select count(*)=2 from platform.provisioning_tasks where run_id=(select id from platform.provisioning_runs where idempotency_key='prov:027:first')),'approved task catalogue materialized');
select lives_ok($$select platform.create_provisioning_run('14300000-0000-0000-0000-000000000001','prov:027:first',array['validate_workspace','validate_contract'])$$,'same idempotency key returns existing run');
select ok((select count(*)=1 from platform.provisioning_runs where idempotency_key='prov:027:first'),'idempotency prevents duplicate run');
select throws_like($$select platform.create_provisioning_run('14300000-0000-0000-0000-000000000001','prov:027:other',array['validate_workspace'])$$,'%concurrent_provisioning_run%','concurrent live run rejected');
select throws_like($$select platform.create_provisioning_run('14300000-0000-0000-0000-000000000002','prov:027:bad',array['unknown_task'])$$,'%invalid_task_catalogue%','unknown task type rejected');
select lives_ok($$select platform.cancel_provisioning_run((select id from platform.provisioning_runs where idempotency_key='prov:027:first'),'Acceptance cancellation')$$,'controlled cancellation succeeds');
select ok((select status='cancelled' from platform.provisioning_runs where idempotency_key='prov:027:first'),'run reaches cancelled terminal state');
select ok((select count(*)=2 from audit.events where action in ('PROVISIONING_RUN_CREATED','PROVISIONING_RUN_CANCELLED') and entity_id=(select id from platform.provisioning_runs where idempotency_key='prov:027:first')),'create and cancel are audited');

select set_config('request.jwt.claims','{"sub":"14000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}',true);
select lives_ok($$select platform.create_provisioning_run('14300000-0000-0000-0000-000000000001','prov:027:ops',array['validate_workspace'])$$,'assigned Operations can queue run');
select ok((select count(*)=2 from platform.provisioning_runs where idempotency_key like 'prov:027:%'),'Operations sees assigned runs only');

select set_config('request.jwt.claims','{"sub":"14000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal2"}',true);
select ok((select count(*)=1 from platform.provisioning_runs where idempotency_key='prov:027:ops'),'assigned Auditor can read run');
select throws_like($$select platform.cancel_provisioning_run((select id from platform.provisioning_runs where idempotency_key='prov:027:ops'),'Auditor cannot cancel')$$,'%access_denied%','Auditor cannot cancel');

select set_config('request.jwt.claims','{"sub":"14000000-0000-0000-0000-000000000005","role":"authenticated","aal":"aal2"}',true);
select ok((select count(*)=0 from platform.provisioning_runs),'unassigned Auditor sees no runs');

select set_config('request.jwt.claims','{"sub":"14000000-0000-0000-0000-000000000004","role":"authenticated","aal":"aal2"}',true);
select ok((select count(*)=0 from platform.provisioning_runs),'Finance sees no provisioning runs');
select throws_like($$select platform.create_provisioning_run('14300000-0000-0000-0000-000000000001','prov:027:fin',array['validate_workspace'])$$,'%access_denied%','Finance cannot queue provisioning');

select set_config('request.jwt.claims','{"sub":"14000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1"}',true);
select ok((select count(*)=0 from platform.provisioning_runs),'AAL1 reads fail closed');
select throws_like($$select platform.create_provisioning_run('14300000-0000-0000-0000-000000000001','prov:027:aal1',array['validate_workspace'])$$,'%mfa_required%','AAL1 mutation rejected');

select * from finish();
rollback;
