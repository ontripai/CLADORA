begin;
select plan(23);

select ok(to_regprocedure('finance.get_customer_ledger(uuid,text,text,text,date,date,integer,integer,uuid)') is not null,'ledger RPC exists');
select ok(has_function_privilege('authenticated','finance.get_customer_ledger(uuid,text,text,text,date,date,integer,integer,uuid)','EXECUTE'),'authenticated may execute ledger RPC');
select ok(not has_function_privilege('anon','finance.get_customer_ledger(uuid,text,text,text,date,date,integer,integer,uuid)','EXECUTE'),'anonymous ledger execution is denied');
select has_table('finance','accounting_periods','accounting periods exist');

do $$
declare permission_id uuid;
begin
  insert into auth.users(id,email) values
    ('19000000-0000-0000-0000-000000000001','admin-019@cladora.test'),
    ('19000000-0000-0000-0000-000000000002','owner-019@cladora.test'),
    ('19000000-0000-0000-0000-000000000003','resident-019@cladora.test'),
    ('19000000-0000-0000-0000-000000000004','denied-019@cladora.test'),
    ('19000000-0000-0000-0000-000000000005','other-019@cladora.test');
  insert into platform.tenants(id,legal_name,registration_number,status) values
    ('19100000-0000-0000-0000-000000000001','Ledger Tenant','ENG019-1','active'),
    ('19100000-0000-0000-0000-000000000002','Other Ledger Tenant','ENG019-2','active');
  insert into identity.roles(id,tenant_id,code,name) values
    ('19200000-0000-0000-0000-000000000001','19100000-0000-0000-0000-000000000001','association_admin','Administrator'),
    ('19200000-0000-0000-0000-000000000002','19100000-0000-0000-0000-000000000001','owner','Owner'),
    ('19200000-0000-0000-0000-000000000003','19100000-0000-0000-0000-000000000001','tenant_resident','Tenant resident'),
    ('19200000-0000-0000-0000-000000000004','19100000-0000-0000-0000-000000000001','censor','Censor without permission'),
    ('19200000-0000-0000-0000-000000000005','19100000-0000-0000-0000-000000000002','association_admin','Other administrator');
  select id into permission_id from identity.permissions where code='finance.ledger.read';
  insert into identity.role_permissions(role_id,permission_id,effect) values
    ('19200000-0000-0000-0000-000000000001',permission_id,'allow'),
    ('19200000-0000-0000-0000-000000000002',permission_id,'allow'),
    ('19200000-0000-0000-0000-000000000003',permission_id,'allow'),
    ('19200000-0000-0000-0000-000000000005',permission_id,'allow');
  insert into identity.memberships(id,tenant_id,user_id,role_id,status,starts_at) values
    ('19300000-0000-0000-0000-000000000001','19100000-0000-0000-0000-000000000001','19000000-0000-0000-0000-000000000001','19200000-0000-0000-0000-000000000001','active',statement_timestamp()-interval '1 day'),
    ('19300000-0000-0000-0000-000000000002','19100000-0000-0000-0000-000000000001','19000000-0000-0000-0000-000000000002','19200000-0000-0000-0000-000000000002','active',statement_timestamp()-interval '1 day'),
    ('19300000-0000-0000-0000-000000000003','19100000-0000-0000-0000-000000000001','19000000-0000-0000-0000-000000000003','19200000-0000-0000-0000-000000000003','active',statement_timestamp()-interval '1 day'),
    ('19300000-0000-0000-0000-000000000004','19100000-0000-0000-0000-000000000001','19000000-0000-0000-0000-000000000004','19200000-0000-0000-0000-000000000004','active',statement_timestamp()-interval '1 day'),
    ('19300000-0000-0000-0000-000000000005','19100000-0000-0000-0000-000000000002','19000000-0000-0000-0000-000000000005','19200000-0000-0000-0000-000000000005','active',statement_timestamp()-interval '1 day');
  insert into portfolio.properties(id,tenant_id,type,name,status) values
    ('19500000-0000-0000-0000-000000000001','19100000-0000-0000-0000-000000000001','condominium','Ledger Property','active'),
    ('19500000-0000-0000-0000-000000000002','19100000-0000-0000-0000-000000000002','condominium','Other Property','active');
  insert into portfolio.buildings(id,tenant_id,property_id,code,name,status) values
    ('19600000-0000-0000-0000-000000000001','19100000-0000-0000-0000-000000000001','19500000-0000-0000-0000-000000000001','B1','Building 1','active'),
    ('19600000-0000-0000-0000-000000000002','19100000-0000-0000-0000-000000000002','19500000-0000-0000-0000-000000000002','B2','Building 2','active');
  insert into portfolio.units(id,tenant_id,building_id,code,status) values
    ('19700000-0000-0000-0000-000000000001','19100000-0000-0000-0000-000000000001','19600000-0000-0000-0000-000000000001','U1','active'),
    ('19700000-0000-0000-0000-000000000002','19100000-0000-0000-0000-000000000002','19600000-0000-0000-0000-000000000002','U2','active');
  insert into identity.context_grants(id,membership_id,tenant_id,scope_type,unit_id,starts_at,ends_at) values
    ('19400000-0000-0000-0000-000000000001','19300000-0000-0000-0000-000000000001','19100000-0000-0000-0000-000000000001','tenant',null,statement_timestamp()-interval '1 day',null),
    ('19400000-0000-0000-0000-000000000002','19300000-0000-0000-0000-000000000002','19100000-0000-0000-0000-000000000001','unit','19700000-0000-0000-0000-000000000001',statement_timestamp()-interval '1 day',null),
    ('19400000-0000-0000-0000-000000000003','19300000-0000-0000-0000-000000000003','19100000-0000-0000-0000-000000000001','unit','19700000-0000-0000-0000-000000000001',statement_timestamp()-interval '1 day',null),
    ('19400000-0000-0000-0000-000000000004','19300000-0000-0000-0000-000000000004','19100000-0000-0000-0000-000000000001','tenant',null,statement_timestamp()-interval '1 day',null),
    ('19400000-0000-0000-0000-000000000005','19300000-0000-0000-0000-000000000005','19100000-0000-0000-0000-000000000002','tenant',null,statement_timestamp()-interval '1 day',null),
    ('19400000-0000-0000-0000-000000000006','19300000-0000-0000-0000-000000000001','19100000-0000-0000-0000-000000000001','tenant',null,statement_timestamp()-interval '2 days',statement_timestamp()-interval '1 day');
  insert into platform.customer_workspaces(id,tenant_id,workspace_type,lifecycle_status,commercial_owner,environment,version) values
    ('19800000-0000-0000-0000-000000000001','19100000-0000-0000-0000-000000000001','ASSOCIATION','ACTIVE','Ledger owner','PILOT',1),
    ('19800000-0000-0000-0000-000000000002','19100000-0000-0000-0000-000000000002','ASSOCIATION','ACTIVE','Other owner','PILOT',1);
  insert into platform.workspace_entitlements(customer_workspace_id,entitlement_key,value_type,boolean_value) values
    ('19800000-0000-0000-0000-000000000001','module.accounting','boolean',true),
    ('19800000-0000-0000-0000-000000000002','module.accounting','boolean',false);
  insert into portfolio.parties(id,tenant_id,type,legal_name) values
    ('19900000-0000-0000-0000-000000000001','19100000-0000-0000-0000-000000000001','person','Owner Party'),
    ('19900000-0000-0000-0000-000000000002','19100000-0000-0000-0000-000000000001','person','Tenant Party');
  insert into identity.membership_parties(membership_id,tenant_id,party_id) values
    ('19300000-0000-0000-0000-000000000002','19100000-0000-0000-0000-000000000001','19900000-0000-0000-0000-000000000001'),
    ('19300000-0000-0000-0000-000000000003','19100000-0000-0000-0000-000000000001','19900000-0000-0000-0000-000000000002');
  insert into portfolio.ownerships(tenant_id,unit_id,party_id,share,valid_from) values
    ('19100000-0000-0000-0000-000000000001','19700000-0000-0000-0000-000000000001','19900000-0000-0000-0000-000000000001',1,current_date-1);
  insert into occupancy.leases(tenant_id,unit_id,landlord_party_id,tenant_party_id,starts_on,status) values
    ('19100000-0000-0000-0000-000000000001','19700000-0000-0000-0000-000000000001','19900000-0000-0000-0000-000000000001','19900000-0000-0000-0000-000000000002',current_date-1,'active');
  insert into finance.accounts(id,tenant_id,property_id,code,name,type,currency) values
    ('19a00000-0000-0000-0000-000000000001','19100000-0000-0000-0000-000000000001','19500000-0000-0000-0000-000000000001','101','Cash','asset','RON'),
    ('19a00000-0000-0000-0000-000000000002','19100000-0000-0000-0000-000000000001','19500000-0000-0000-0000-000000000001','401','Revenue','income','RON');
  insert into finance.journals(id,tenant_id,property_id,occurred_on,currency,description,source_type) values
    ('19b00000-0000-0000-0000-000000000001','19100000-0000-0000-0000-000000000001','19500000-0000-0000-0000-000000000001',current_date,'RON','Monthly charge','invoice');
  insert into finance.journal_entries(tenant_id,journal_id,account_id,unit_id,party_id,side,amount,memo) values
    ('19100000-0000-0000-0000-000000000001','19b00000-0000-0000-0000-000000000001','19a00000-0000-0000-0000-000000000001','19700000-0000-0000-0000-000000000001','19900000-0000-0000-0000-000000000002','debit',100,'Debit'),
    ('19100000-0000-0000-0000-000000000001','19b00000-0000-0000-0000-000000000001','19a00000-0000-0000-0000-000000000002','19700000-0000-0000-0000-000000000001','19900000-0000-0000-0000-000000000002','credit',100,'Credit');
  update finance.journals set status='posted',posted_at=statement_timestamp() where id='19b00000-0000-0000-0000-000000000001';
  insert into finance.accounting_periods(id,tenant_id,property_id,starts_on,ends_on,status,closed_at,snapshot_json) values
    ('19c00000-0000-0000-0000-000000000001','19100000-0000-0000-0000-000000000001','19500000-0000-0000-0000-000000000001',current_date-30,current_date-1,'closed',statement_timestamp(),'{"balanced":true}');
end $$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"19000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',true);
select ok((finance.get_customer_ledger('19400000-0000-0000-0000-000000000001')#>>'{total}')::int=1,'administrator sees tenant journal');
select ok((finance.get_customer_ledger('19400000-0000-0000-0000-000000000001')#>>'{trial_balance,balanced}')::boolean,'trial balance is balanced');
select ok((finance.get_customer_ledger('19400000-0000-0000-0000-000000000001','Monthly')#>>'{total}')::int=1,'search finds journal');
select ok((finance.get_customer_ledger('19400000-0000-0000-0000-000000000001','missing')#>>'{total}')::int=0,'search excludes non-match');
select ok((finance.get_customer_ledger('19400000-0000-0000-0000-000000000001',null,'posted')#>>'{total}')::int=1,'status filter is applied');
select ok(jsonb_array_length(finance.get_customer_ledger('19400000-0000-0000-0000-000000000001',null,null,null,null,null,25,0,'19b00000-0000-0000-0000-000000000001')#>'{detail}')=2,'journal detail contains balanced entries');
select throws_like($$select finance.get_customer_ledger('19400000-0000-0000-0000-000000000005')$$,'%customer_context_access_denied%','cross-tenant context is denied');
select throws_like($$select finance.get_customer_ledger('19400000-0000-0000-0000-000000000006')$$,'%customer_context_access_denied%','expired context is denied');
select set_config('request.jwt.claims','{"sub":"19000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}',true);
select ok((finance.get_customer_ledger('19400000-0000-0000-0000-000000000002')#>>'{total}')::int=1,'owner sees owned unit journal');
select ok((finance.get_customer_ledger('19400000-0000-0000-0000-000000000002')#>>'{trial_balance,debit}')::numeric=100,'owner balance is unit scoped');
select set_config('request.jwt.claims','{"sub":"19000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal2"}',true);
select ok((finance.get_customer_ledger('19400000-0000-0000-0000-000000000003')#>>'{total}')::int=1,'tenant sees leased unit journal');
select set_config('request.jwt.claims','{"sub":"19000000-0000-0000-0000-000000000004","role":"authenticated","aal":"aal2"}',true);
select throws_like($$select finance.get_customer_ledger('19400000-0000-0000-0000-000000000004')$$,'%ledger_permission_required%','missing permission is denied');
select set_config('request.jwt.claims','{"sub":"19000000-0000-0000-0000-000000000005","role":"authenticated","aal":"aal2"}',true);
select throws_like($$select finance.get_customer_ledger('19400000-0000-0000-0000-000000000005')$$,'%ledger_entitlement_required%','disabled entitlement is denied');
select set_config('request.jwt.claims','{"sub":"19000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}',true);
select throws_like($$select finance.get_customer_ledger('19400000-0000-0000-0000-000000000001')$$,'%mfa_required%','AAL1 is denied');
select set_config('request.jwt.claims','{"sub":"19000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',true);
select ok(jsonb_array_length(finance.get_customer_ledger('19400000-0000-0000-0000-000000000001',null,null,'asset')#>'{accounts}')=1,'account type filter is applied');
select ok((finance.get_customer_ledger('19400000-0000-0000-0000-000000000001',null,null,null,current_date,current_date)#>>'{total}')::int=1,'date range is applied');
select ok((finance.get_customer_ledger('19400000-0000-0000-0000-000000000001')#>>'{read_only}')::boolean,'ledger projection is read only');
select ok(jsonb_array_length(finance.get_customer_ledger('19400000-0000-0000-0000-000000000001')#>'{periods}')=1,'period status is returned without snapshot payload');
reset role;
select throws_like($$update finance.accounting_periods set ends_on=current_date where id='19c00000-0000-0000-0000-000000000001'$$,'%closed_accounting_period_is_immutable%','closed financial snapshot is immutable');

select * from finish();
rollback;
