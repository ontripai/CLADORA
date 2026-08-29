begin;
select plan(22);

select ok(to_regprocedure('app_private.redact_audit_json(jsonb)') is not null,'recursive audit JSON redactor exists');
select ok(to_regprocedure('app_private.redact_audit_text(text)') is not null,'audit reason redactor exists');
select ok(to_regprocedure('app_private.audit_event_workspace_id(text,uuid,jsonb,jsonb)') is not null,'event workspace resolver exists');
select ok(to_regprocedure('app_private.can_read_audit_event(uuid,text)') is not null,'assignment-scoped audit authorization exists');
select ok(to_regprocedure('platform.list_audit_events(integer,integer,text,text,text,text,uuid,timestamptz,timestamptz)') is not null,'bounded audit explorer RPC exists');
select ok((select c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='audit' and c.relname='events'),'audit event RLS remains enabled');
select ok(not has_table_privilege('authenticated','audit.events','SELECT'),'authenticated cannot bypass redaction with direct SELECT');
select ok(not has_table_privilege('authenticated','audit.events','INSERT'),'audit trail is not directly insertable');
select ok(not has_table_privilege('authenticated','audit.events','UPDATE'),'audit trail is not directly mutable');
select ok(not has_table_privilege('authenticated','audit.events','DELETE'),'audit trail is not directly deletable');
select ok(has_function_privilege('authenticated','platform.list_audit_events(integer,integer,text,text,text,text,uuid,timestamptz,timestamptz)','EXECUTE'),'authenticated can call protected explorer RPC');

do $$ declare r record; begin
  for r in select * from (values
    ('15000000-0000-0000-0000-000000000001'::uuid,'15100000-0000-0000-0000-000000000001'::uuid,'AUD-ADM-028','PLATFORM_SUPER_ADMIN'::platform.platform_role_type),
    ('15000000-0000-0000-0000-000000000002'::uuid,'15100000-0000-0000-0000-000000000002'::uuid,'AUD-OPS-028','PLATFORM_OPERATIONS'::platform.platform_role_type),
    ('15000000-0000-0000-0000-000000000003'::uuid,'15100000-0000-0000-0000-000000000003'::uuid,'AUD-AUD-028','PLATFORM_AUDITOR'::platform.platform_role_type),
    ('15000000-0000-0000-0000-000000000004'::uuid,'15100000-0000-0000-0000-000000000004'::uuid,'AUD-FIN-028','PLATFORM_FINANCE'::platform.platform_role_type),
    ('15000000-0000-0000-0000-000000000005'::uuid,'15100000-0000-0000-0000-000000000005'::uuid,'AUD-NONE-028','PLATFORM_AUDITOR'::platform.platform_role_type)
  ) x(auth_id,platform_id,employee_ref,role_name) loop
    insert into auth.users(id,email) values(r.auth_id,lower(r.employee_ref)||'@cladora.test');
    insert into platform.platform_users(id,auth_user_id,employee_ref,display_name,status)
      values(r.platform_id,r.auth_id,r.employee_ref,r.employee_ref,'active');
    insert into platform.platform_role_assignments(platform_user_id,role,status,grant_reason)
      values(r.platform_id,r.role_name,'active','Audit acceptance fixture');
  end loop;

  insert into platform.tenants(id,legal_name,registration_number) values
    ('15200000-0000-0000-0000-000000000001','Audit Tenant One','AUD-028-1'),
    ('15200000-0000-0000-0000-000000000002','Audit Tenant Two','AUD-028-2');
  insert into platform.customer_workspaces(id,tenant_id,workspace_type,lifecycle_status,commercial_owner,environment) values
    ('15300000-0000-0000-0000-000000000001','15200000-0000-0000-0000-000000000001','ASSOCIATION','ACTIVE','Audit One','PILOT'),
    ('15300000-0000-0000-0000-000000000002','15200000-0000-0000-0000-000000000002','ASSOCIATION','ACTIVE','Audit Two','PILOT');
  insert into platform.platform_customer_assignments(platform_user_id,customer_workspace_id,scope_type,status,valid_from,assignment_reason) values
    ('15100000-0000-0000-0000-000000000002','15300000-0000-0000-0000-000000000001','workspace','active',statement_timestamp()-interval '1 day','Operations audit fixture'),
    ('15100000-0000-0000-0000-000000000003','15300000-0000-0000-0000-000000000001','audit','active',statement_timestamp()-interval '1 day','Auditor fixture'),
    ('15100000-0000-0000-0000-000000000004','15300000-0000-0000-0000-000000000001','commercial','active',statement_timestamp()-interval '1 day','Finance fixture');

  insert into audit.events(tenant_id,actor_id,actor_role,action,entity_type,entity_id,reason,before_snapshot,after_snapshot,occurred_at) values
    ('15200000-0000-0000-0000-000000000001','15000000-0000-0000-0000-000000000001','PLATFORM_SUPER_ADMIN','PROVISIONING_RUN_CREATED','customer_workspace','15300000-0000-0000-0000-000000000001','Operational acceptance','{"status":"failed"}','{"status":"queued","token":"do-not-leak","nested":{"password":"hidden","safe":"visible"}}',statement_timestamp()-interval '5 minutes'),
    ('15200000-0000-0000-0000-000000000001','15000000-0000-0000-0000-000000000001','PLATFORM_SUPER_ADMIN','WORKSPACE_CONTRACT_ACTIVATED','customer_workspace','15300000-0000-0000-0000-000000000001','Commercial acceptance','{"status":"signed"}','{"status":"active"}',statement_timestamp()-interval '4 minutes'),
    ('15200000-0000-0000-0000-000000000001','15000000-0000-0000-0000-000000000001','PLATFORM_SUPER_ADMIN','SECURITY_REVIEW_COMPLETED','customer_workspace','15300000-0000-0000-0000-000000000001','Session token rotated','{}','{"result":"passed"}',statement_timestamp()-interval '3 minutes'),
    ('15200000-0000-0000-0000-000000000002','15000000-0000-0000-0000-000000000001','PLATFORM_SUPER_ADMIN','PROVISIONING_RUN_CREATED','customer_workspace','15300000-0000-0000-0000-000000000002','Other customer','{}','{"status":"queued"}',statement_timestamp()-interval '2 minutes'),
    (null,'15000000-0000-0000-0000-000000000001','PLATFORM_SUPER_ADMIN','SUBSCRIPTION_PLAN_ACTIVATED','subscription_plan','15400000-0000-0000-0000-000000000001','Global plan event','{}','{"status":"active"}',statement_timestamp()-interval '1 minute');
end $$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"15000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',true);
select ok((select count(*)=5 from platform.list_audit_events()),'Super Admin sees scoped and global audit events');
select ok((select after_snapshot->>'token'='[REDACTED]' from platform.list_audit_events() where action='PROVISIONING_RUN_CREATED' and workspace_id='15300000-0000-0000-0000-000000000001'),'top-level secret value is redacted');
select ok((select after_snapshot#>>'{nested,password}'='[REDACTED]' and after_snapshot#>>'{nested,safe}'='visible' from platform.list_audit_events() where action='PROVISIONING_RUN_CREATED' and workspace_id='15300000-0000-0000-0000-000000000001'),'nested secret is redacted without hiding safe values');
select ok((select reason='[REDACTED]' from platform.list_audit_events() where action='SECURITY_REVIEW_COMPLETED'),'sensitive reason text is fully redacted');
select ok((select count(*)=1 and max(total_count)=3 from platform.list_audit_events(1,0,null,null,null,null,'15300000-0000-0000-0000-000000000001',null,null)),'pagination preserves scoped total count');
select ok((select count(*)=1 from platform.list_audit_events(20,0,'CONTRACT','WORKSPACE_CONTRACT_ACTIVATED',null,'customer_workspace',null,null,null)),'search and exact filters compose');

select set_config('request.jwt.claims','{"sub":"15000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}',true);
select ok((select count(*)=1 from platform.list_audit_events()),'assigned Operations sees only operational events');

select set_config('request.jwt.claims','{"sub":"15000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal2"}',true);
select ok((select count(*)=3 from platform.list_audit_events()),'assigned Auditor sees all assigned customer event categories');

select set_config('request.jwt.claims','{"sub":"15000000-0000-0000-0000-000000000004","role":"authenticated","aal":"aal2"}',true);
select ok((select count(*)=1 from platform.list_audit_events()),'assigned Finance sees only commercial events');

select set_config('request.jwt.claims','{"sub":"15000000-0000-0000-0000-000000000005","role":"authenticated","aal":"aal2"}',true);
select ok((select count(*)=0 from platform.list_audit_events()),'unassigned Auditor sees no events');

select set_config('request.jwt.claims','{"sub":"15000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal1"}',true);
select ok((select count(*)=0 from platform.list_audit_events()),'AAL1 audit reads fail closed');

select * from finish();
rollback;
