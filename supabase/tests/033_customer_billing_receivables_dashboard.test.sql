begin;
select plan(23);
select ok(to_regprocedure('billing.get_customer_billing(uuid,text,text,date,date,integer,integer,uuid)') is not null,'billing RPC exists');
select ok(has_function_privilege('authenticated','billing.get_customer_billing(uuid,text,text,date,date,integer,integer,uuid)','EXECUTE'),'authenticated may execute billing RPC');
select ok(not has_function_privilege('anon','billing.get_customer_billing(uuid,text,text,date,date,integer,integer,uuid)','EXECUTE'),'anonymous billing execution is denied');
select ok(exists(select 1 from identity.permissions where code='billing.receivables.read'),'billing read permission exists');

do $$ declare permission_id uuid; begin
insert into auth.users(id,email) values
 ('20000000-0000-0000-0000-000000000001','admin-020@cladora.test'),('20000000-0000-0000-0000-000000000002','tenant-020@cladora.test'),
 ('20000000-0000-0000-0000-000000000003','denied-020@cladora.test'),('20000000-0000-0000-0000-000000000004','other-020@cladora.test');
insert into platform.tenants(id,legal_name,registration_number,status) values
 ('20100000-0000-0000-0000-000000000001','Billing Tenant','ENG020-1','active'),('20100000-0000-0000-0000-000000000002','Other Billing Tenant','ENG020-2','active');
insert into identity.roles(id,tenant_id,code,name) values
 ('20200000-0000-0000-0000-000000000001','20100000-0000-0000-0000-000000000001','association_admin','Administrator'),
 ('20200000-0000-0000-0000-000000000002','20100000-0000-0000-0000-000000000001','tenant_resident','Tenant'),
 ('20200000-0000-0000-0000-000000000003','20100000-0000-0000-0000-000000000001','censor','Denied censor'),
 ('20200000-0000-0000-0000-000000000004','20100000-0000-0000-0000-000000000002','association_admin','Other administrator');
select id into permission_id from identity.permissions where code='billing.receivables.read';
insert into identity.role_permissions(role_id,permission_id,effect) values
 ('20200000-0000-0000-0000-000000000001',permission_id,'allow'),('20200000-0000-0000-0000-000000000002',permission_id,'allow'),('20200000-0000-0000-0000-000000000004',permission_id,'allow');
insert into identity.memberships(id,tenant_id,user_id,role_id,status,starts_at) values
 ('20300000-0000-0000-0000-000000000001','20100000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','20200000-0000-0000-0000-000000000001','active',statement_timestamp()-interval '1 day'),
 ('20300000-0000-0000-0000-000000000002','20100000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','20200000-0000-0000-0000-000000000002','active',statement_timestamp()-interval '1 day'),
 ('20300000-0000-0000-0000-000000000003','20100000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003','20200000-0000-0000-0000-000000000003','active',statement_timestamp()-interval '1 day'),
 ('20300000-0000-0000-0000-000000000004','20100000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000004','20200000-0000-0000-0000-000000000004','active',statement_timestamp()-interval '1 day');
insert into portfolio.properties(id,tenant_id,type,name,status) values
 ('20500000-0000-0000-0000-000000000001','20100000-0000-0000-0000-000000000001','condominium','Billing Property','active'),
 ('20500000-0000-0000-0000-000000000002','20100000-0000-0000-0000-000000000002','condominium','Other Property','active');
insert into portfolio.buildings(id,tenant_id,property_id,code,name,status) values
 ('20600000-0000-0000-0000-000000000001','20100000-0000-0000-0000-000000000001','20500000-0000-0000-0000-000000000001','B1','Building 1','active'),
 ('20600000-0000-0000-0000-000000000002','20100000-0000-0000-0000-000000000002','20500000-0000-0000-0000-000000000002','B2','Building 2','active');
insert into portfolio.units(id,tenant_id,building_id,code,status) values
 ('20700000-0000-0000-0000-000000000001','20100000-0000-0000-0000-000000000001','20600000-0000-0000-0000-000000000001','U1','active'),
 ('20700000-0000-0000-0000-000000000002','20100000-0000-0000-0000-000000000002','20600000-0000-0000-0000-000000000002','U2','active');
insert into identity.context_grants(id,membership_id,tenant_id,scope_type,unit_id,starts_at,ends_at) values
 ('20400000-0000-0000-0000-000000000001','20300000-0000-0000-0000-000000000001','20100000-0000-0000-0000-000000000001','tenant',null,statement_timestamp()-interval '1 day',null),
 ('20400000-0000-0000-0000-000000000002','20300000-0000-0000-0000-000000000002','20100000-0000-0000-0000-000000000001','unit','20700000-0000-0000-0000-000000000001',statement_timestamp()-interval '1 day',null),
 ('20400000-0000-0000-0000-000000000003','20300000-0000-0000-0000-000000000003','20100000-0000-0000-0000-000000000001','tenant',null,statement_timestamp()-interval '1 day',null),
 ('20400000-0000-0000-0000-000000000004','20300000-0000-0000-0000-000000000004','20100000-0000-0000-0000-000000000002','tenant',null,statement_timestamp()-interval '1 day',null),
 ('20400000-0000-0000-0000-000000000005','20300000-0000-0000-0000-000000000001','20100000-0000-0000-0000-000000000001','tenant',null,statement_timestamp()-interval '2 days',statement_timestamp()-interval '1 day');
insert into platform.customer_workspaces(id,tenant_id,workspace_type,lifecycle_status,commercial_owner,environment,version) values
 ('20800000-0000-0000-0000-000000000001','20100000-0000-0000-0000-000000000001','ASSOCIATION','ACTIVE','Billing owner','PILOT',1),
 ('20800000-0000-0000-0000-000000000002','20100000-0000-0000-0000-000000000002','ASSOCIATION','ACTIVE','Other owner','PILOT',1);
insert into platform.workspace_entitlements(customer_workspace_id,entitlement_key,value_type,boolean_value) values
 ('20800000-0000-0000-0000-000000000001','module.billing','boolean',true),('20800000-0000-0000-0000-000000000002','module.billing','boolean',false);
insert into portfolio.parties(id,tenant_id,type,legal_name) values
 ('20900000-0000-0000-0000-000000000001','20100000-0000-0000-0000-000000000001','person','Tenant Party'),
 ('20900000-0000-0000-0000-000000000002','20100000-0000-0000-0000-000000000001','person','Other Party');
insert into identity.membership_parties(membership_id,tenant_id,party_id) values
 ('20300000-0000-0000-0000-000000000002','20100000-0000-0000-0000-000000000001','20900000-0000-0000-0000-000000000001');
insert into portfolio.ownerships(tenant_id,unit_id,party_id,share,valid_from) values
 ('20100000-0000-0000-0000-000000000001','20700000-0000-0000-0000-000000000001','20900000-0000-0000-0000-000000000002',1,current_date-1);
insert into occupancy.leases(tenant_id,unit_id,landlord_party_id,tenant_party_id,starts_on,status) values
 ('20100000-0000-0000-0000-000000000001','20700000-0000-0000-0000-000000000001','20900000-0000-0000-0000-000000000002','20900000-0000-0000-0000-000000000001',current_date-1,'active');
insert into finance.accounts(id,tenant_id,property_id,code,name,type,currency) values
 ('20a00000-0000-0000-0000-000000000001','20100000-0000-0000-0000-000000000001','20500000-0000-0000-0000-000000000001','411','Receivables','asset','RON'),
 ('20a00000-0000-0000-0000-000000000002','20100000-0000-0000-0000-000000000001','20500000-0000-0000-0000-000000000001','704','Revenue','income','RON');
insert into finance.journals(id,tenant_id,property_id,occurred_on,currency,description,source_type) values
 ('20b00000-0000-0000-0000-000000000001','20100000-0000-0000-0000-000000000001','20500000-0000-0000-0000-000000000001',current_date,'RON','Invoice posting','invoice');
insert into finance.journal_entries(tenant_id,journal_id,account_id,unit_id,party_id,side,amount) values
 ('20100000-0000-0000-0000-000000000001','20b00000-0000-0000-0000-000000000001','20a00000-0000-0000-0000-000000000001','20700000-0000-0000-0000-000000000001','20900000-0000-0000-0000-000000000001','debit',100),
 ('20100000-0000-0000-0000-000000000001','20b00000-0000-0000-0000-000000000001','20a00000-0000-0000-0000-000000000002','20700000-0000-0000-0000-000000000001','20900000-0000-0000-0000-000000000001','credit',100);
update finance.journals set status='posted',posted_at=statement_timestamp() where id='20b00000-0000-0000-0000-000000000001';
insert into billing.invoices(id,tenant_id,property_id,unit_id,liable_party_id,period_start,period_end,due_on,currency,subtotal,tax_total,journal_id) values
 ('20c00000-0000-0000-0000-000000000001','20100000-0000-0000-0000-000000000001','20500000-0000-0000-0000-000000000001','20700000-0000-0000-0000-000000000001','20900000-0000-0000-0000-000000000001',current_date-40,current_date-10,current_date-5,'RON',100,0,'20b00000-0000-0000-0000-000000000001'),
 ('20c00000-0000-0000-0000-000000000002','20100000-0000-0000-0000-000000000001','20500000-0000-0000-0000-000000000001','20700000-0000-0000-0000-000000000001','20900000-0000-0000-0000-000000000002',current_date-30,current_date,current_date+10,'RON',200,0,null);
insert into billing.invoice_lines(tenant_id,invoice_id,description,quantity,unit_price,line_subtotal,line_tax) values
 ('20100000-0000-0000-0000-000000000001','20c00000-0000-0000-0000-000000000001','Monthly maintenance',1,100,100,0),
 ('20100000-0000-0000-0000-000000000001','20c00000-0000-0000-0000-000000000002','Reserve contribution',1,200,200,0);
update billing.invoices set status='issued' where id in ('20c00000-0000-0000-0000-000000000001','20c00000-0000-0000-0000-000000000002');
insert into billing.receivables(tenant_id,invoice_id,original_amount,paid_amount) values
 ('20100000-0000-0000-0000-000000000001','20c00000-0000-0000-0000-000000000001',100,25),
 ('20100000-0000-0000-0000-000000000001','20c00000-0000-0000-0000-000000000002',200,0);
end $$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',true);
select ok((billing.get_customer_billing('20400000-0000-0000-0000-000000000001')#>>'{total}')::int=2,'administrator sees scoped invoices');
select ok((billing.get_customer_billing('20400000-0000-0000-0000-000000000001')#>>'{summary,0,invoice_total}')::numeric=300,'invoice total is database computed per currency');
select ok((billing.get_customer_billing('20400000-0000-0000-0000-000000000001')#>>'{summary,0,paid_total}')::numeric=25,'paid total is database computed per currency');
select ok((billing.get_customer_billing('20400000-0000-0000-0000-000000000001')#>>'{summary,0,outstanding_total}')::numeric=275,'outstanding total is database computed per currency');
select ok((billing.get_customer_billing('20400000-0000-0000-0000-000000000001')#>>'{aging,0,days_1_30}')::numeric=75,'aging bucket is database computed per currency');
select ok((billing.get_customer_billing('20400000-0000-0000-0000-000000000001','Monthly')#>>'{total}')::int=1,'line description search works');
select ok((billing.get_customer_billing('20400000-0000-0000-0000-000000000001',null,'overdue')#>>'{total}')::int=1,'overdue filter works');
select ok((billing.get_customer_billing('20400000-0000-0000-0000-000000000001',null,null,null,null,1,0)#>>'{total}')::int=2,'pagination preserves total count');
select ok(jsonb_array_length(billing.get_customer_billing('20400000-0000-0000-0000-000000000001',null,null,null,null,25,0,'20c00000-0000-0000-0000-000000000001')#>'{lines}')=1,'invoice detail returns lines');
select ok(jsonb_array_length(billing.get_customer_billing('20400000-0000-0000-0000-000000000001',null,null,null,null,25,0,'20c00000-0000-0000-0000-000000000001')#>'{journal,entries}')=2,'invoice detail links balanced ledger entries');
select throws_like($$select billing.get_customer_billing('20400000-0000-0000-0000-000000000004')$$,'%customer_context_access_denied%','cross-tenant context is denied');
select throws_like($$select billing.get_customer_billing('20400000-0000-0000-0000-000000000005')$$,'%customer_context_access_denied%','expired context is denied');
select set_config('request.jwt.claims','{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}',true);
select ok((billing.get_customer_billing('20400000-0000-0000-0000-000000000002')#>>'{total}')::int=1,'tenant sees only own liable-party invoice');
select set_config('request.jwt.claims','{"sub":"20000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal2"}',true);
select throws_like($$select billing.get_customer_billing('20400000-0000-0000-0000-000000000003')$$,'%billing_permission_required%','missing permission is denied');
select set_config('request.jwt.claims','{"sub":"20000000-0000-0000-0000-000000000004","role":"authenticated","aal":"aal2"}',true);
select throws_like($$select billing.get_customer_billing('20400000-0000-0000-0000-000000000004')$$,'%billing_entitlement_required%','disabled entitlement is denied');
select set_config('request.jwt.claims','{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}',true);
select throws_like($$select billing.get_customer_billing('20400000-0000-0000-0000-000000000001')$$,'%mfa_required%','AAL1 is denied');
select set_config('request.jwt.claims','{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',true);
select ok((billing.get_customer_billing('20400000-0000-0000-0000-000000000001')#>>'{read_only}')::boolean,'billing projection is read only');
reset role;
update billing.invoices set status='paid' where id='20c00000-0000-0000-0000-000000000001';
select throws_like($$update billing.invoices set due_on=current_date+30 where id='20c00000-0000-0000-0000-000000000001'$$,'%terminal_invoice_is_immutable%','paid invoice is immutable');
select throws_like($$update billing.invoice_lines set description='changed' where invoice_id='20c00000-0000-0000-0000-000000000002'$$,'%issued_invoice_lines_are_immutable%','issued invoice lines are immutable');
select * from finish();
rollback;
