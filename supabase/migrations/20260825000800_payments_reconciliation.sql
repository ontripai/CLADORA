begin;

create schema if not exists payments;
grant usage on schema payments to authenticated;
create type payments.transaction_direction as enum ('credit','debit');
create type payments.match_status as enum ('unmatched','suggested','confirmed','rejected');
create type payments.payment_status as enum ('pending','settled','failed','refunded');

create table payments.bank_accounts (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  property_id uuid references portfolio.properties(id) on delete restrict, iban_encrypted text not null, iban_fingerprint text not null,
  bank_name text, currency char(3) not null default 'RON', status platform.record_status not null default 'active', created_at timestamptz not null default statement_timestamp(),
  unique(tenant_id,iban_fingerprint)
);
create table payments.import_batches (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  bank_account_id uuid not null references payments.bank_accounts(id) on delete restrict, source text not null, source_hash text not null,
  period_start date, period_end date, imported_at timestamptz not null default statement_timestamp(), imported_by uuid references auth.users(id) on delete restrict,
  row_count integer not null default 0 check(row_count>=0), unique(bank_account_id,source_hash)
);
create table payments.bank_transactions (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  batch_id uuid not null references payments.import_batches(id) on delete restrict, bank_account_id uuid not null references payments.bank_accounts(id) on delete restrict,
  external_ref text, booked_on date not null, value_on date, direction payments.transaction_direction not null, amount numeric(20,4) not null check(amount>0),
  currency char(3) not null, counterparty_name text, counterparty_iban_encrypted text, remittance_text text, fingerprint text not null,
  raw_snapshot jsonb not null, created_at timestamptz not null default statement_timestamp(), unique(bank_account_id,fingerprint)
);
create table payments.payments (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  property_id uuid not null references portfolio.properties(id) on delete restrict, unit_id uuid references portfolio.units(id) on delete restrict,
  payer_party_id uuid references portfolio.parties(id) on delete restrict, bank_transaction_id uuid unique references payments.bank_transactions(id) on delete restrict,
  provider_ref text, amount numeric(20,4) not null check(amount>0), currency char(3) not null, paid_at timestamptz not null,
  status payments.payment_status not null default 'pending', journal_id uuid references finance.journals(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp()
);
create unique index payments_provider_ref_unique on payments.payments(tenant_id,provider_ref) where provider_ref is not null;
create table payments.reconciliation_matches (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  bank_transaction_id uuid not null references payments.bank_transactions(id) on delete restrict, payment_id uuid references payments.payments(id) on delete restrict,
  receivable_id uuid references billing.receivables(id) on delete restrict, matched_amount numeric(20,4) not null check(matched_amount>0),
  confidence numeric(6,5) check(confidence between 0 and 1), status payments.match_status not null default 'suggested', rationale_json jsonb not null default '{}'::jsonb,
  confirmed_by uuid references auth.users(id) on delete restrict, confirmed_at timestamptz, created_at timestamptz not null default statement_timestamp(),
  check(payment_id is not null or receivable_id is not null), check((status='confirmed' and confirmed_at is not null) or status<>'confirmed'),
  unique nulls not distinct(bank_transaction_id,payment_id,receivable_id)
);
create index bank_transactions_date_idx on payments.bank_transactions(tenant_id,bank_account_id,booked_on,id);
create index reconciliation_status_idx on payments.reconciliation_matches(tenant_id,status,created_at);

do $$ declare t text; begin foreach t in array array['bank_accounts','import_batches','bank_transactions','payments','reconciliation_matches'] loop execute format('alter table payments.%I enable row level security',t); end loop; end $$;
create policy bank_accounts_context_read on payments.bank_accounts for select to authenticated using(tenant_id=app_private.active_tenant_id() and (property_id is null or app_private.can_access_property(property_id)));
create policy import_batches_context_read on payments.import_batches for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from payments.bank_accounts a where a.id=bank_account_id and (a.property_id is null or app_private.can_access_property(a.property_id))));
create policy bank_transactions_context_read on payments.bank_transactions for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from payments.bank_accounts a where a.id=bank_account_id and (a.property_id is null or app_private.can_access_property(a.property_id))));
create policy payments_context_read on payments.payments for select to authenticated using(tenant_id=app_private.active_tenant_id() and ((unit_id is not null and app_private.can_access_unit(unit_id)) or (unit_id is null and app_private.can_access_property(property_id))));
create policy reconciliation_context_read on payments.reconciliation_matches for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from payments.bank_transactions t join payments.bank_accounts a on a.id=t.bank_account_id where t.id=bank_transaction_id and (a.property_id is null or app_private.can_access_property(a.property_id))));
grant select on all tables in schema payments to authenticated;
grant all on all tables in schema payments to service_role;

commit;
