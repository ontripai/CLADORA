begin;

create type finance.allocation_method as enum ('meter_consumption','cpi','per_person','surface_m2','direct','fixed');
create type finance.run_status as enum ('draft','calculated','approved','posted','cancelled');

create table finance.charge_categories (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  code text not null, name text not null, default_expense_account_id uuid references finance.accounts(id) on delete restrict,
  recoverable boolean not null default true, status platform.record_status not null default 'active', created_at timestamptz not null default statement_timestamp(),
  unique(tenant_id,code)
);
create table finance.allocation_rules (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  property_id uuid not null references portfolio.properties(id) on delete restrict, charge_category_id uuid not null references finance.charge_categories(id) on delete restrict,
  method finance.allocation_method not null, parameters jsonb not null default '{}'::jsonb, valid_from date not null, valid_to date,
  version integer not null default 1 check(version>0), status platform.record_status not null default 'active', created_at timestamptz not null default statement_timestamp(),
  check(valid_to is null or valid_to>valid_from), unique(property_id,charge_category_id,valid_from,version)
);
create table finance.allocation_runs (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  property_id uuid not null references portfolio.properties(id) on delete restrict, period_start date not null, period_end date not null,
  currency char(3) not null default 'RON', status finance.run_status not null default 'draft', input_hash text,
  calculated_at timestamptz, approved_at timestamptz, approved_by uuid references auth.users(id) on delete restrict,
  journal_id uuid references finance.journals(id) on delete restrict, created_at timestamptz not null default statement_timestamp(),
  check(period_end>period_start), unique(property_id,period_start,period_end)
);
create table finance.allocation_inputs (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  run_id uuid not null references finance.allocation_runs(id) on delete cascade, source_type text not null, source_id uuid,
  category_id uuid not null references finance.charge_categories(id) on delete restrict, amount numeric(20,4) not null check(amount>=0),
  snapshot_json jsonb not null, created_at timestamptz not null default statement_timestamp()
);
create table finance.allocation_items (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  run_id uuid not null references finance.allocation_runs(id) on delete cascade, input_id uuid not null references finance.allocation_inputs(id) on delete restrict,
  unit_id uuid not null references portfolio.units(id) on delete restrict, responsible_party_id uuid references portfolio.parties(id) on delete restrict,
  method finance.allocation_method not null, basis_value numeric(20,8), basis_total numeric(20,8), allocated_amount numeric(20,4) not null check(allocated_amount>=0),
  rule_snapshot jsonb not null, explanation_json jsonb not null default '{}'::jsonb, created_at timestamptz not null default statement_timestamp(),
  unique(input_id,unit_id,responsible_party_id)
);
create index allocation_items_run_unit_idx on finance.allocation_items(tenant_id,run_id,unit_id);

create or replace function finance.assert_allocation_balanced(target_run uuid)
returns void language plpgsql security definer set search_path=pg_catalog,finance
as $$ declare source_total numeric(20,4); allocated_total numeric(20,4); begin
  select coalesce(sum(amount),0) into source_total from finance.allocation_inputs where run_id=target_run;
  select coalesce(sum(allocated_amount),0) into allocated_total from finance.allocation_items where run_id=target_run;
  if source_total<>allocated_total then
    raise exception 'allocation_unbalanced: %, source %, allocated %',target_run,source_total,allocated_total;
  end if;
end; $$;

create or replace function finance.protect_allocation_run()
returns trigger language plpgsql security definer set search_path=pg_catalog,finance
as $$ begin
  if old.status in ('approved','posted','cancelled') and new is distinct from old then raise exception 'final_allocation_run_is_immutable'; end if;
  if old.status not in ('approved','posted') and new.status in ('approved','posted') then perform finance.assert_allocation_balanced(old.id); end if;
  return new;
end; $$;
create trigger allocation_runs_protect before update on finance.allocation_runs for each row execute function finance.protect_allocation_run();

do $$ declare t text; begin foreach t in array array['charge_categories','allocation_rules','allocation_runs','allocation_inputs','allocation_items'] loop execute format('alter table finance.%I enable row level security',t); end loop; end $$;
create policy categories_member_read on finance.charge_categories for select to authenticated using(tenant_id=app_private.active_tenant_id());
create policy rules_context_read on finance.allocation_rules for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_property(property_id));
create policy runs_context_read on finance.allocation_runs for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_property(property_id));
create policy inputs_context_read on finance.allocation_inputs for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from finance.allocation_runs r where r.id=run_id and app_private.can_access_property(r.property_id)));
create policy items_context_read on finance.allocation_items for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_unit(unit_id));
grant select on finance.charge_categories,finance.allocation_rules,finance.allocation_runs,finance.allocation_inputs,finance.allocation_items to authenticated;
grant all on all tables in schema finance to service_role;
revoke all on function finance.assert_allocation_balanced(uuid),finance.protect_allocation_run() from public;
grant execute on function finance.assert_allocation_balanced(uuid) to service_role;

commit;
