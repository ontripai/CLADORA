begin;
select plan(17);
select ok(to_regprocedure('platform.get_control_plane_overview()') is not null,'overview projection RPC exists');
select ok(has_function_privilege('authenticated','platform.get_control_plane_overview()','EXECUTE'),'authenticated may execute protected projection');
select ok(not has_function_privilege('anon','platform.get_control_plane_overview()','EXECUTE'),'anonymous callers cannot execute projection');

do $$ declare r record; begin
 for r in select * from(values
 ('17000000-0000-0000-0000-000000000001'::uuid,'17100000-0000-0000-0000-000000000001'::uuid,'OV-ADM-030','PLATFORM_SUPER_ADMIN'::platform.platform_role_type),
 ('17000000-0000-0000-0000-000000000002','17100000-0000-0000-0000-000000000002','OV-OPS-030','PLATFORM_OPERATIONS'),
 ('17000000-0000-0000-0000-000000000003','17100000-0000-0000-0000-000000000003','OV-FIN-030','PLATFORM_FINANCE'),
 ('17000000-0000-0000-0000-000000000004','17100000-0000-0000-0000-000000000004','OV-AUD-030','PLATFORM_AUDITOR'),
 ('17000000-0000-0000-0000-000000000005','17100000-0000-0000-0000-000000000005','OV-UNA-030','PLATFORM_AUDITOR'))x(auth_id,platform_id,employee_ref,role_name) loop
  insert into auth.users(id,email)values(r.auth_id,lower(r.employee_ref)||'@cladora.test');
  insert into platform.platform_users(id,auth_user_id,employee_ref,display_name,status)values(r.platform_id,r.auth_id,r.employee_ref,r.employee_ref,'active');
  insert into platform.platform_role_assignments(platform_user_id,role,status,grant_reason)values(r.platform_id,r.role_name,'active','Overview acceptance');
 end loop;
 insert into platform.tenants(id,legal_name,registration_number)values('17200000-0000-0000-0000-000000000001','Overview One','OV-030-1'),('17200000-0000-0000-0000-000000000002','Overview Two','OV-030-2');
 insert into platform.customer_workspaces(id,tenant_id,workspace_type,lifecycle_status,commercial_owner,environment)values
 ('17300000-0000-0000-0000-000000000001','17200000-0000-0000-0000-000000000001','ASSOCIATION','ACTIVE','Overview One','PILOT'),
 ('17300000-0000-0000-0000-000000000002','17200000-0000-0000-0000-000000000002','ASSOCIATION','ACTIVE','Overview Two','PILOT');
 insert into platform.platform_customer_assignments(platform_user_id,customer_workspace_id,scope_type,status,valid_from,valid_until,assignment_reason)values
 ('17100000-0000-0000-0000-000000000002','17300000-0000-0000-0000-000000000001','workspace','active',statement_timestamp()-interval '1 day',null,'Ops'),
 ('17100000-0000-0000-0000-000000000003','17300000-0000-0000-0000-000000000001','commercial','active',statement_timestamp()-interval '1 day',null,'Finance'),
 ('17100000-0000-0000-0000-000000000004','17300000-0000-0000-0000-000000000001','audit','active',statement_timestamp()-interval '1 day',null,'Auditor'),
 ('17100000-0000-0000-0000-000000000005','17300000-0000-0000-0000-000000000001','audit','active',statement_timestamp()-interval '2 days',statement_timestamp()-interval '1 day','Expired auditor');
 insert into platform.subscription_plans(id,plan_code,version,display_name,status)values('17400000-0000-0000-0000-000000000001','OVERVIEW',1,'Overview','active');
 insert into platform.workspace_contracts(id,customer_workspace_id,plan_id,contract_ref,status,start_date,end_date)values
 ('17500000-0000-0000-0000-000000000001','17300000-0000-0000-0000-000000000001','17400000-0000-0000-0000-000000000001','OV-1','active',current_date-1,current_date+10),
 ('17500000-0000-0000-0000-000000000002','17300000-0000-0000-0000-000000000002','17400000-0000-0000-0000-000000000001','OV-2','active',current_date-1,current_date+10);
 insert into platform.provisioning_runs(id,customer_workspace_id,idempotency_key,status,started_at)values
 ('17600000-0000-0000-0000-000000000001','17300000-0000-0000-0000-000000000001','overview-one','failed',statement_timestamp()-interval '1 hour'),
 ('17600000-0000-0000-0000-000000000002','17300000-0000-0000-0000-000000000002','overview-two','failed',statement_timestamp()-interval '1 hour');
 insert into audit.events(action,entity_type,entity_id,reason,occurred_at)values
 ('PROVISIONING_RUN_FAILED','customer_workspace','17300000-0000-0000-0000-000000000001','safe',statement_timestamp()),
 ('WORKSPACE_CONTRACT_ACTIVATED','customer_workspace','17300000-0000-0000-0000-000000000002','secret token',statement_timestamp());
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"17000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',true);
select ok((platform.get_control_plane_overview()#>>'{kpis,workspaces}')::int=2,'Super Admin sees all workspaces');
select ok((platform.get_control_plane_overview()#>>'{kpis,contracts}')::int=2,'Super Admin sees all contracts');
select ok(jsonb_array_length(platform.get_control_plane_overview()->'attention')=4,'Super Admin sees bounded cross-domain attention');
select set_config('request.jwt.claims','{"sub":"17000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}',true);
select ok((platform.get_control_plane_overview()#>>'{kpis,workspaces}')::int=1,'Operations sees assigned workspace only');
select ok(platform.get_control_plane_overview()#>'{kpis,contracts}'='null'::jsonb,'Operations receives no commercial count');
select ok((platform.get_control_plane_overview()#>>'{kpis,provisioning_attention}')::int=1,'Operations sees assigned operational attention');
select set_config('request.jwt.claims','{"sub":"17000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal2"}',true);
select ok((platform.get_control_plane_overview()#>>'{kpis,contracts}')::int=1,'Finance sees assigned commercial count');
select ok(platform.get_control_plane_overview()#>'{kpis,provisioning}'='null'::jsonb,'Finance receives no operational count');
select ok(jsonb_array_length(platform.get_control_plane_overview()->'attention')=1,'Finance queue contains only assigned commercial attention');
select set_config('request.jwt.claims','{"sub":"17000000-0000-0000-0000-000000000004","role":"authenticated","aal":"aal2"}',true);
select ok((platform.get_control_plane_overview()#>>'{kpis,workspaces}')::int=1,'Auditor is assignment scoped');
select ok(jsonb_array_length(platform.get_control_plane_overview()->'recent_events')=1,'Auditor recent events exclude other customers');
select set_config('request.jwt.claims','{"sub":"17000000-0000-0000-0000-000000000005","role":"authenticated","aal":"aal2"}',true);
select ok((platform.get_control_plane_overview()#>>'{kpis,workspaces}')::int=0,'expired Auditor assignment sees zero workspaces');
select ok(jsonb_array_length(platform.get_control_plane_overview()->'attention')=0,'expired Auditor assignment sees no queue');
select set_config('request.jwt.claims','{"sub":"17000000-0000-0000-0000-000000000004","role":"authenticated","aal":"aal1"}',true);
select throws_like($$select platform.get_control_plane_overview()$$,'%mfa_required%','AAL1 fails closed');
select * from finish();
rollback;
