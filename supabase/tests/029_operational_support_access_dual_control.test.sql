begin;
select plan(20);

select ok(to_regprocedure('app_private.can_read_support_access(uuid)') is not null,'support authorization helper exists');
select ok(to_regprocedure('platform.list_support_access(integer,integer,text,text,uuid)') is not null,'bounded support explorer exists');
select ok(to_regprocedure('platform.list_support_workspaces()') is not null,'eligible workspace explorer exists');
select ok(to_regprocedure('platform.request_support_access(uuid,text,text,text,text,integer,jsonb)') is not null,'bounded request RPC exists');
select ok(to_regprocedure('platform.approve_support_access(uuid,jsonb)') is not null,'dual-control approval RPC exists');
select ok(to_regprocedure('platform.cancel_support_access_request(uuid,text)') is not null,'request cancellation RPC exists');
select ok(to_regprocedure('platform.revoke_support_access(uuid,text)') is not null,'grant revocation RPC exists');
select ok(not has_table_privilege('authenticated','platform.support_access_requests','SELECT'),'raw requests cannot bypass redaction');
select ok(not has_table_privilege('authenticated','platform.support_access_grants','SELECT'),'raw grants cannot bypass redaction');
select ok(not has_table_privilege('authenticated','platform.support_access_requests','INSERT'),'requests are RPC-only');
select ok(not has_table_privilege('authenticated','platform.support_access_grants','INSERT'),'grants are RPC-only');

do $$ declare r record; begin
  for r in select * from (values
    ('16000000-0000-0000-0000-000000000001'::uuid,'16100000-0000-0000-0000-000000000001'::uuid,'SUP-ADM-029','PLATFORM_SUPER_ADMIN'::platform.platform_role_type),
    ('16000000-0000-0000-0000-000000000002'::uuid,'16100000-0000-0000-0000-000000000002'::uuid,'SUP-OPS1-029','PLATFORM_OPERATIONS'::platform.platform_role_type),
    ('16000000-0000-0000-0000-000000000003'::uuid,'16100000-0000-0000-0000-000000000003'::uuid,'SUP-OPS2-029','PLATFORM_OPERATIONS'::platform.platform_role_type),
    ('16000000-0000-0000-0000-000000000004'::uuid,'16100000-0000-0000-0000-000000000004'::uuid,'SUP-AUD-029','PLATFORM_AUDITOR'::platform.platform_role_type),
    ('16000000-0000-0000-0000-000000000005'::uuid,'16100000-0000-0000-0000-000000000005'::uuid,'SUP-FIN-029','PLATFORM_FINANCE'::platform.platform_role_type)
  ) x(auth_id,platform_id,employee_ref,role_name) loop
    insert into auth.users(id,email) values(r.auth_id,lower(r.employee_ref)||'@cladora.test');
    insert into platform.platform_users(id,auth_user_id,employee_ref,display_name,status) values(r.platform_id,r.auth_id,r.employee_ref,r.employee_ref,'active');
    insert into platform.platform_role_assignments(platform_user_id,role,status,grant_reason) values(r.platform_id,r.role_name,'active','Support acceptance');
  end loop;
  insert into platform.tenants(id,legal_name,registration_number) values
    ('16200000-0000-0000-0000-000000000001','Support Tenant One','SUP-029-1'),
    ('16200000-0000-0000-0000-000000000002','Support Tenant Two','SUP-029-2');
  insert into platform.customer_workspaces(id,tenant_id,workspace_type,lifecycle_status,commercial_owner,environment) values
    ('16300000-0000-0000-0000-000000000001','16200000-0000-0000-0000-000000000001','ASSOCIATION','ACTIVE','Support One','PILOT'),
    ('16300000-0000-0000-0000-000000000002','16200000-0000-0000-0000-000000000002','ASSOCIATION','ACTIVE','Support Two','PILOT');
  insert into platform.platform_customer_assignments(platform_user_id,customer_workspace_id,scope_type,status,valid_from,assignment_reason) values
    ('16100000-0000-0000-0000-000000000002','16300000-0000-0000-0000-000000000001','workspace','active',statement_timestamp()-interval '1 day','Ops one'),
    ('16100000-0000-0000-0000-000000000003','16300000-0000-0000-0000-000000000001','workspace','active',statement_timestamp()-interval '1 day','Ops two'),
    ('16100000-0000-0000-0000-000000000004','16300000-0000-0000-0000-000000000001','audit','active',statement_timestamp()-interval '1 day','Auditor');
end $$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1"}',true);
select throws_like($$select platform.request_support_access('16300000-0000-0000-0000-000000000001','TCK-029','Valid support purpose','technical','standard',60,'{"reference":"case"}')$$,'%mfa_required%','AAL1 mutation is denied');

select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}',true);
select lives_ok($$select platform.request_support_access('16300000-0000-0000-0000-000000000001','TCK-029','Valid support purpose','technical','standard',60,'{"reference":"case","token":"hidden"}')$$,'assigned Operations creates a bounded request');
select throws_like($$select platform.request_support_access('16300000-0000-0000-0000-000000000002','TCK-X29','Cross customer purpose','technical','standard',60,'{"reference":"case"}')$$,'%access_denied%','unassigned Operations fails closed');
select throws_like($$select platform.approve_support_access((select request_id from platform.list_support_access(20,0,'TCK-029',null,null)),'{"reference":"approval"}')$$,'%dual_control_violation%','requester cannot self-approve');

select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal2"}',true);
select lives_ok($$select platform.approve_support_access((select request_id from platform.list_support_access(20,0,'TCK-029',null,null)),'{"reference":"independent","secret":"hidden"}')$$,'independent assigned Operations approves');
select ok((select count(*)=1 and max(effective_status)='approved' from platform.list_support_access()),'approved request and grant are listed once');

select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000004","role":"authenticated","aal":"aal2"}',true);
select ok((select count(*)=1 from platform.list_support_access()),'assigned Auditor has read-only visibility');

select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000005","role":"authenticated","aal":"aal2"}',true);
select ok((select count(*)=0 from platform.list_support_access()),'Finance receives no support records');
select throws_like($$select platform.request_support_access('16300000-0000-0000-0000-000000000001','TCK-FIN','Finance cannot request','technical','standard',60,'{"reference":"case"}')$$,'%access_denied%','Finance mutation is denied');

select * from finish();
rollback;
