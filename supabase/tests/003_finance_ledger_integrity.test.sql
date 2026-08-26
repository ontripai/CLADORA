begin;
set local search_path = public, extensions;
select plan(4);

insert into platform.tenants(id,legal_name,registration_number,status)
values('90000000-0000-7000-8000-000000000001','Ledger Test Tenant','LEDGER-TEST','active');
insert into finance.accounts(id,tenant_id,code,name,type) values
('91000000-0000-7000-8000-000000000001','90000000-0000-7000-8000-000000000001','1000','Cash','asset'),
('91000000-0000-7000-8000-000000000002','90000000-0000-7000-8000-000000000001','4000','Income','income');
insert into finance.journals(id,tenant_id,occurred_on,currency,description,source_type)
values('92000000-0000-7000-8000-000000000001','90000000-0000-7000-8000-000000000001',current_date,'RON','Integrity test','test');
insert into finance.journal_entries(tenant_id,journal_id,account_id,side,amount)
values('90000000-0000-7000-8000-000000000001','92000000-0000-7000-8000-000000000001','91000000-0000-7000-8000-000000000001','debit',100);

select throws_like(
  $$select finance.assert_balanced('92000000-0000-7000-8000-000000000001')$$,
  '%journal_unbalanced%', 'unbalanced journal is rejected');

insert into finance.journal_entries(tenant_id,journal_id,account_id,side,amount)
values('90000000-0000-7000-8000-000000000001','92000000-0000-7000-8000-000000000001','91000000-0000-7000-8000-000000000002','credit',100);
select lives_ok(
  $$update finance.journals set status='posted' where id='92000000-0000-7000-8000-000000000001'$$,
  'balanced journal posts');
select throws_like(
  $$update finance.journals set description='tampered' where id='92000000-0000-7000-8000-000000000001'$$,
  '%posted_journal_is_immutable%', 'posted journal cannot be changed');
select throws_like(
  $$delete from finance.journal_entries where journal_id='92000000-0000-7000-8000-000000000001'$$,
  '%posted_journal_entries_are_immutable%', 'posted entries cannot be deleted');

select * from finish();
rollback;
