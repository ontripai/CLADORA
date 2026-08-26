begin;

create schema if not exists finance;
grant usage on schema finance to authenticated;

create type finance.account_type as enum ('asset','liability','equity','income','expense');
create type finance.journal_status as enum ('draft','posted','reversed');
create type finance.entry_side as enum ('debit','credit');

create table finance.accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references platform.tenants(id) on delete restrict,
  property_id uuid references portfolio.properties(id) on delete restrict,
  code text not null,
  name text not null,
  type finance.account_type not null,
  currency char(3) not null default 'RON',
  parent_account_id uuid references finance.accounts(id) on delete restrict,
  is_control_account boolean not null default false,
  status platform.record_status not null default 'active',
  created_at timestamptz not null default statement_timestamp(),
  unique nulls not distinct (tenant_id, property_id, code)
);

create table finance.journals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references platform.tenants(id) on delete restrict,
  property_id uuid references portfolio.properties(id) on delete restrict,
  journal_no bigint generated always as identity,
  occurred_on date not null,
  currency char(3) not null,
  description text not null,
  source_type text not null,
  source_id uuid,
  status finance.journal_status not null default 'draft',
  reversal_of_id uuid references finance.journals(id) on delete restrict,
  posted_at timestamptz,
  posted_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  unique (tenant_id, journal_no),
  check ((status='draft' and posted_at is null) or (status<>'draft' and posted_at is not null)),
  check (reversal_of_id is null or status='reversed')
);
create unique index journals_source_unique on finance.journals(tenant_id,source_type,source_id) where source_id is not null;

create table finance.journal_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references platform.tenants(id) on delete restrict,
  journal_id uuid not null references finance.journals(id) on delete restrict,
  account_id uuid not null references finance.accounts(id) on delete restrict,
  unit_id uuid references portfolio.units(id) on delete restrict,
  party_id uuid references portfolio.parties(id) on delete restrict,
  side finance.entry_side not null,
  amount numeric(20,4) not null check (amount>0),
  memo text,
  created_at timestamptz not null default statement_timestamp()
);

create index journal_entries_journal_idx on finance.journal_entries(tenant_id,journal_id,id);
create index journal_entries_account_date_idx on finance.journal_entries(tenant_id,account_id,journal_id);

create or replace function finance.assert_balanced(target_journal uuid)
returns void language plpgsql security definer
set search_path=pg_catalog,finance
as $$
declare j finance.journals%rowtype; debit_total numeric(20,4); credit_total numeric(20,4); entry_count integer;
begin
  select * into j from finance.journals where id=target_journal for update;
  if not found then raise exception 'journal_not_found'; end if;
  select count(*),coalesce(sum(amount) filter(where side='debit'),0),coalesce(sum(amount) filter(where side='credit'),0)
    into entry_count,debit_total,credit_total from finance.journal_entries where journal_id=target_journal;
  if entry_count<2 or debit_total<>credit_total then
    raise exception 'journal_unbalanced: %, debit %, credit %',target_journal,debit_total,credit_total;
  end if;
end; $$;

create or replace function finance.protect_ledger()
returns trigger language plpgsql security definer set search_path=pg_catalog,finance
as $$
declare parent_status finance.journal_status;
begin
  if tg_table_name='journals' then
    if tg_op='DELETE' and old.status<>'draft' then raise exception 'posted_journal_is_immutable'; end if;
    if tg_op='UPDATE' and old.status<>'draft' and new is distinct from old then raise exception 'posted_journal_is_immutable'; end if;
    if tg_op='UPDATE' and old.status='draft' and new.status in ('posted','reversed') then
      perform finance.assert_balanced(old.id);
      new.posted_at=coalesce(new.posted_at,statement_timestamp());
    end if;
    return case when tg_op='DELETE' then old else new end;
  end if;
  select status into parent_status from finance.journals where id=coalesce(new.journal_id,old.journal_id);
  if parent_status<>'draft' then raise exception 'posted_journal_entries_are_immutable'; end if;
  return case when tg_op='DELETE' then old else new end;
end; $$;

create trigger journals_immutable before update or delete on finance.journals for each row execute function finance.protect_ledger();
create trigger journal_entries_immutable before insert or update or delete on finance.journal_entries for each row execute function finance.protect_ledger();

do $$ declare t text; begin foreach t in array array['accounts','journals','journal_entries'] loop execute format('alter table finance.%I enable row level security',t); end loop; end $$;
create policy accounts_context_read on finance.accounts for select to authenticated using(tenant_id=app_private.active_tenant_id() and (property_id is null or app_private.can_access_property(property_id)));
create policy journals_context_read on finance.journals for select to authenticated using(tenant_id=app_private.active_tenant_id() and (property_id is null or app_private.can_access_property(property_id)));
create policy entries_context_read on finance.journal_entries for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from finance.journals j where j.id=journal_id and (j.property_id is null or app_private.can_access_property(j.property_id))));
grant select on all tables in schema finance to authenticated;
grant all on all tables in schema finance to service_role;
grant usage,select on all sequences in schema finance to service_role;
revoke all on function finance.assert_balanced(uuid),finance.protect_ledger() from public;
grant execute on function finance.assert_balanced(uuid) to service_role;

commit;
