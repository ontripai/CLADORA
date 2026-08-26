begin;

create schema if not exists billing;
grant usage on schema billing to authenticated;
create type billing.invoice_status as enum ('draft','issued','partially_paid','paid','void','credited');

create table billing.invoices (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  property_id uuid not null references portfolio.properties(id) on delete restrict, unit_id uuid not null references portfolio.units(id) on delete restrict,
  liable_party_id uuid not null references portfolio.parties(id) on delete restrict, invoice_no bigint generated always as identity,
  period_start date not null, period_end date not null, issued_on date, due_on date, currency char(3) not null default 'RON',
  subtotal numeric(20,4) not null default 0, tax_total numeric(20,4) not null default 0, total numeric(20,4) generated always as (subtotal+tax_total) stored,
  status billing.invoice_status not null default 'draft', allocation_run_id uuid references finance.allocation_runs(id) on delete restrict,
  journal_id uuid references finance.journals(id) on delete restrict, issued_snapshot jsonb, created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp(),
  check(period_end>period_start), check(subtotal>=0 and tax_total>=0), check((status='draft' and issued_on is null) or (status<>'draft' and issued_on is not null)),
  unique(tenant_id,invoice_no)
);
create table billing.invoice_lines (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  invoice_id uuid not null references billing.invoices(id) on delete restrict, allocation_item_id uuid references finance.allocation_items(id) on delete restrict,
  category_id uuid references finance.charge_categories(id) on delete restrict, description text not null, quantity numeric(20,8) not null default 1 check(quantity>0),
  unit_price numeric(20,4) not null, tax_rate numeric(9,6) not null default 0 check(tax_rate>=0), line_subtotal numeric(20,4) not null,
  line_tax numeric(20,4) not null default 0, created_at timestamptz not null default statement_timestamp(), check(line_subtotal>=0 and line_tax>=0)
);
create table billing.receivables (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  invoice_id uuid not null unique references billing.invoices(id) on delete restrict, original_amount numeric(20,4) not null check(original_amount>=0),
  paid_amount numeric(20,4) not null default 0 check(paid_amount>=0), credited_amount numeric(20,4) not null default 0 check(credited_amount>=0),
  outstanding_amount numeric(20,4) generated always as (original_amount-paid_amount-credited_amount) stored,
  last_payment_at timestamptz, updated_at timestamptz not null default statement_timestamp(), check(paid_amount+credited_amount<=original_amount)
);

create or replace function billing.protect_issued_invoice()
returns trigger language plpgsql security definer set search_path=pg_catalog,billing
as $$ declare s billing.invoice_status; lines_subtotal numeric(20,4); lines_tax numeric(20,4); begin
  if tg_table_name='invoices' then
    if tg_op='DELETE' and old.status<>'draft' then raise exception 'issued_invoice_is_immutable'; end if;
    if tg_op='UPDATE' and old.status<>'draft' and (new.tenant_id,new.property_id,new.unit_id,new.liable_party_id,new.period_start,new.period_end,new.currency,new.subtotal,new.tax_total,new.issued_snapshot)
      is distinct from (old.tenant_id,old.property_id,old.unit_id,old.liable_party_id,old.period_start,old.period_end,old.currency,old.subtotal,old.tax_total,old.issued_snapshot) then raise exception 'issued_invoice_financial_fields_are_immutable'; end if;
    if tg_op='UPDATE' and old.status='draft' and new.status<>'draft' then
      select coalesce(sum(line_subtotal),0),coalesce(sum(line_tax),0) into lines_subtotal,lines_tax from billing.invoice_lines where invoice_id=old.id;
      if lines_subtotal<>new.subtotal or lines_tax<>new.tax_total then raise exception 'invoice_totals_do_not_match_lines'; end if;
      new.issued_on=coalesce(new.issued_on,current_date);
      new.issued_snapshot=coalesce(new.issued_snapshot,jsonb_build_object('invoice_id',new.id,'subtotal',new.subtotal,'tax_total',new.tax_total,'currency',new.currency));
    end if;
    return case when tg_op='DELETE' then old else new end;
  end if;
  select status into s from billing.invoices where id=coalesce(new.invoice_id,old.invoice_id);
  if s<>'draft' then raise exception 'issued_invoice_lines_are_immutable'; end if;
  return case when tg_op='DELETE' then old else new end;
end; $$;
create trigger invoices_immutable before update or delete on billing.invoices for each row execute function billing.protect_issued_invoice();
create trigger invoice_lines_immutable before insert or update or delete on billing.invoice_lines for each row execute function billing.protect_issued_invoice();
create trigger invoices_updated_at before update on billing.invoices for each row execute function app_private.set_updated_at();
create trigger receivables_updated_at before update on billing.receivables for each row execute function app_private.set_updated_at();

do $$ declare t text; begin foreach t in array array['invoices','invoice_lines','receivables'] loop execute format('alter table billing.%I enable row level security',t); end loop; end $$;
create policy invoices_unit_read on billing.invoices for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_unit(unit_id));
create policy invoice_lines_unit_read on billing.invoice_lines for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from billing.invoices i where i.id=invoice_id and app_private.can_access_unit(i.unit_id)));
create policy receivables_unit_read on billing.receivables for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from billing.invoices i where i.id=invoice_id and app_private.can_access_unit(i.unit_id)));
grant select on all tables in schema billing to authenticated;
grant all on all tables in schema billing to service_role;
grant usage,select on all sequences in schema billing to service_role;
revoke all on function billing.protect_issued_invoice() from public;

commit;
