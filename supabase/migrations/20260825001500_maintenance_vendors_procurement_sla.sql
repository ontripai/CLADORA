begin;

create type maintenance.vendor_status as enum ('candidate','approved','suspended','blocked');
create type maintenance.procurement_status as enum ('draft','requested','approved','ordered','received','cancelled');

create table maintenance.vendors (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  party_id uuid not null references portfolio.parties(id) on delete restrict, status maintenance.vendor_status not null default 'candidate',
  service_categories text[] not null default '{}', rating numeric(3,2) check(rating between 0 and 5),
  insurance_valid_until date, compliance_json jsonb not null default '{}'::jsonb, created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp(),
  unique(tenant_id,party_id)
);
create table maintenance.vendor_contracts (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  vendor_id uuid not null references maintenance.vendors(id) on delete restrict, property_id uuid not null references portfolio.properties(id) on delete restrict,
  contract_ref_encrypted text, starts_on date not null, ends_on date, currency char(3) not null default 'RON',
  rate_card jsonb not null default '{}'::jsonb, sla_json jsonb not null default '{}'::jsonb, status platform.record_status not null default 'active',
  created_at timestamptz not null default statement_timestamp(), check(ends_on is null or ends_on>starts_on)
);
create table maintenance.work_order_assignments (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  work_order_id uuid not null references maintenance.work_orders(id) on delete restrict, vendor_id uuid not null references maintenance.vendors(id) on delete restrict,
  contract_id uuid references maintenance.vendor_contracts(id) on delete restrict, assigned_at timestamptz not null default statement_timestamp(),
  accepted_at timestamptz, declined_at timestamptz, response_note text, unique(work_order_id,vendor_id,assigned_at)
);
create table maintenance.vendor_quotes (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  work_order_id uuid not null references maintenance.work_orders(id) on delete restrict, vendor_id uuid not null references maintenance.vendors(id) on delete restrict,
  quote_ref text, subtotal numeric(20,4) not null check(subtotal>=0), tax_total numeric(20,4) not null default 0 check(tax_total>=0),
  currency char(3) not null default 'RON', valid_until date, scope_snapshot jsonb not null, status platform.record_status not null default 'draft',
  submitted_at timestamptz, created_at timestamptz not null default statement_timestamp(), unique(work_order_id,vendor_id,quote_ref)
);
create table maintenance.purchase_orders (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  work_order_id uuid not null references maintenance.work_orders(id) on delete restrict, vendor_id uuid not null references maintenance.vendors(id) on delete restrict,
  quote_id uuid references maintenance.vendor_quotes(id) on delete restrict, po_no bigint generated always as identity,
  subtotal numeric(20,4) not null check(subtotal>=0), tax_total numeric(20,4) not null default 0 check(tax_total>=0), currency char(3) not null default 'RON',
  status maintenance.procurement_status not null default 'draft', approved_by uuid references auth.users(id) on delete restrict, approved_at timestamptz,
  ordered_at timestamptz, received_at timestamptz, ledger_journal_id uuid references finance.journals(id) on delete restrict,
  snapshot_json jsonb not null, created_at timestamptz not null default statement_timestamp(), unique(tenant_id,po_no),
  check((status in ('approved','ordered','received') and approved_at is not null) or status not in ('approved','ordered','received'))
);
create table maintenance.sla_measurements (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  work_order_id uuid not null references maintenance.work_orders(id) on delete restrict, contract_id uuid references maintenance.vendor_contracts(id) on delete restrict,
  metric_code text not null, target_value numeric(20,6), actual_value numeric(20,6), unit_code text not null,
  met boolean, measured_at timestamptz not null default statement_timestamp(), details_json jsonb not null default '{}'::jsonb,
  unique(work_order_id,metric_code)
);

create or replace function maintenance.protect_purchase_order()
returns trigger language plpgsql security definer set search_path=pg_catalog,maintenance
as $$ begin
  if tg_op='DELETE' and old.status in ('approved','ordered','received') then raise exception 'approved_purchase_order_is_immutable'; end if;
  if tg_op='UPDATE' and old.status='received' and new is distinct from old then raise exception 'approved_purchase_order_is_immutable'; end if;
  if tg_op='UPDATE' and old.status='approved' and (new.status not in ('approved','ordered') or (new.tenant_id,new.work_order_id,new.vendor_id,new.quote_id,new.subtotal,new.tax_total,new.currency,new.snapshot_json) is distinct from (old.tenant_id,old.work_order_id,old.vendor_id,old.quote_id,old.subtotal,old.tax_total,old.currency,old.snapshot_json)) then raise exception 'approved_purchase_order_is_immutable'; end if;
  if tg_op='UPDATE' and old.status='ordered' and (new.status not in ('ordered','received') or (new.tenant_id,new.work_order_id,new.vendor_id,new.quote_id,new.subtotal,new.tax_total,new.currency,new.snapshot_json) is distinct from (old.tenant_id,old.work_order_id,old.vendor_id,old.quote_id,old.subtotal,old.tax_total,old.currency,old.snapshot_json)) then raise exception 'approved_purchase_order_is_immutable'; end if;
  if tg_op='UPDATE' and old.status not in ('approved','ordered','received') and new.status in ('approved','ordered','received') then new.approved_at=coalesce(new.approved_at,statement_timestamp()); end if;
  if tg_op='UPDATE' and new.status='ordered' and old.status<>'ordered' then new.ordered_at=coalesce(new.ordered_at,statement_timestamp()); end if;
  if tg_op='UPDATE' and new.status='received' and old.status<>'received' then new.received_at=coalesce(new.received_at,statement_timestamp()); end if;
  return case when tg_op='DELETE' then old else new end;
end; $$;
create trigger purchase_orders_protect before update or delete on maintenance.purchase_orders for each row execute function maintenance.protect_purchase_order();
create trigger vendors_updated_at before update on maintenance.vendors for each row execute function app_private.set_updated_at();

do $$ declare t text; begin foreach t in array array['vendors','vendor_contracts','work_order_assignments','vendor_quotes','purchase_orders','sla_measurements'] loop execute format('alter table maintenance.%I enable row level security',t); end loop; end $$;
create policy vendors_member_read on maintenance.vendors for select to authenticated using(tenant_id=app_private.active_tenant_id());
create policy vendor_contracts_context_read on maintenance.vendor_contracts for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_property(property_id));
create policy assignments_context_read on maintenance.work_order_assignments for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from maintenance.work_orders w where w.id=work_order_id and app_private.can_access_asset_scope(w.property_id,w.building_id,w.unit_id)));
create policy quotes_context_read on maintenance.vendor_quotes for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from maintenance.work_orders w where w.id=work_order_id and app_private.can_access_asset_scope(w.property_id,w.building_id,w.unit_id)));
create policy purchase_orders_context_read on maintenance.purchase_orders for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from maintenance.work_orders w where w.id=work_order_id and app_private.can_access_asset_scope(w.property_id,w.building_id,w.unit_id)));
create policy sla_context_read on maintenance.sla_measurements for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from maintenance.work_orders w where w.id=work_order_id and app_private.can_access_asset_scope(w.property_id,w.building_id,w.unit_id)));
grant select on maintenance.vendors,maintenance.vendor_contracts,maintenance.work_order_assignments,maintenance.vendor_quotes,maintenance.purchase_orders,maintenance.sla_measurements to authenticated;
grant all on all tables in schema maintenance to service_role;
grant usage,select on all sequences in schema maintenance to service_role;
revoke all on function maintenance.protect_purchase_order() from public;

commit;
