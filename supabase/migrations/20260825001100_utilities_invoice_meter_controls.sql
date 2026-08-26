begin;

create type utilities.comparison_status as enum ('pending','within_tolerance','warning','critical','not_applicable','resolved');
create type utilities.anomaly_type as enum ('quantity_variance','amount_variance','period_mismatch','duplicate_invoice','missing_reading','tariff_change','meter_rollover','ocr_low_confidence','other');
create type utilities.severity as enum ('info','warning','critical');

create table utilities.invoice_meter_links (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  invoice_line_id uuid not null references utilities.provider_invoice_lines(id) on delete restrict, meter_id uuid not null references utilities.meters(id) on delete restrict,
  consumption_period_id uuid references utilities.consumption_periods(id) on delete restrict, allocation_weight numeric(12,10) not null default 1 check(allocation_weight>0 and allocation_weight<=1),
  created_at timestamptz not null default statement_timestamp(), unique(invoice_line_id,meter_id,consumption_period_id)
);
create table utilities.utility_comparisons (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  invoice_id uuid not null references utilities.provider_invoices(id) on delete restrict, invoice_line_id uuid references utilities.provider_invoice_lines(id) on delete restrict,
  meter_id uuid references utilities.meters(id) on delete restrict, consumption_period_id uuid references utilities.consumption_periods(id) on delete restrict,
  billed_quantity numeric(20,6), measured_quantity numeric(20,6), quantity_variance numeric(20,6), quantity_variance_pct numeric(12,6),
  billed_amount numeric(20,4), expected_amount numeric(20,4), amount_variance numeric(20,4), amount_variance_pct numeric(12,6),
  quantity_tolerance_pct numeric(12,6) not null default 0.05 check(quantity_tolerance_pct>=0), amount_tolerance_pct numeric(12,6) not null default 0.05 check(amount_tolerance_pct>=0),
  status utilities.comparison_status not null default 'pending', calculation_snapshot jsonb not null,
  calculated_at timestamptz not null default statement_timestamp(), resolved_at timestamptz, resolved_by uuid references auth.users(id) on delete restrict,
  resolution_note text, unique nulls not distinct(invoice_id,invoice_line_id,meter_id,consumption_period_id)
);
create table utilities.utility_anomalies (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  comparison_id uuid references utilities.utility_comparisons(id) on delete restrict, invoice_id uuid references utilities.provider_invoices(id) on delete restrict,
  meter_id uuid references utilities.meters(id) on delete restrict, type utilities.anomaly_type not null, severity utilities.severity not null,
  title text not null, details_json jsonb not null default '{}'::jsonb, detected_at timestamptz not null default statement_timestamp(),
  acknowledged_at timestamptz, acknowledged_by uuid references auth.users(id) on delete restrict, resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete restrict, resolution_note text,
  check(comparison_id is not null or invoice_id is not null or meter_id is not null)
);

create or replace function utilities.evaluate_comparison(target_comparison uuid)
returns utilities.comparison_status language plpgsql security definer set search_path=pg_catalog,utilities
as $$ declare c utilities.utility_comparisons%rowtype; q numeric; a numeric; result utilities.comparison_status; begin
  select * into c from utilities.utility_comparisons where id=target_comparison for update;
  if not found then raise exception 'utility_comparison_not_found'; end if;
  if c.measured_quantity is null and c.expected_amount is null then result='not_applicable';
  else
    q=case when c.billed_quantity is null or c.billed_quantity=0 or c.measured_quantity is null then 0 else abs(c.billed_quantity-c.measured_quantity)/abs(c.billed_quantity) end;
    a=case when c.billed_amount is null or c.billed_amount=0 or c.expected_amount is null then 0 else abs(c.billed_amount-c.expected_amount)/abs(c.billed_amount) end;
    result=case when q>c.quantity_tolerance_pct*2 or a>c.amount_tolerance_pct*2 then 'critical'::utilities.comparison_status when q>c.quantity_tolerance_pct or a>c.amount_tolerance_pct then 'warning'::utilities.comparison_status else 'within_tolerance'::utilities.comparison_status end;
  end if;
  update utilities.utility_comparisons set quantity_variance=case when billed_quantity is null or measured_quantity is null then null else billed_quantity-measured_quantity end,
    quantity_variance_pct=case when billed_quantity is null or billed_quantity=0 or measured_quantity is null then null else (billed_quantity-measured_quantity)/billed_quantity end,
    amount_variance=case when billed_amount is null or expected_amount is null then null else billed_amount-expected_amount end,
    amount_variance_pct=case when billed_amount is null or billed_amount=0 or expected_amount is null then null else (billed_amount-expected_amount)/billed_amount end,
    status=result,calculated_at=statement_timestamp() where id=target_comparison;
  return result;
end; $$;

do $$ declare t text; begin foreach t in array array['invoice_meter_links','utility_comparisons','utility_anomalies'] loop execute format('alter table utilities.%I enable row level security',t); end loop; end $$;
create policy meter_links_context_read on utilities.invoice_meter_links for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from utilities.meters m where m.id=meter_id and app_private.can_access_utility_scope(m.property_id,m.building_id,m.unit_id)));
create policy comparisons_context_read on utilities.utility_comparisons for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from utilities.provider_invoices i join utilities.supply_contracts c on c.id=i.contract_id where i.id=invoice_id and app_private.can_access_utility_scope(c.property_id,c.building_id,c.unit_id)));
create policy anomalies_context_read on utilities.utility_anomalies for select to authenticated using(tenant_id=app_private.active_tenant_id() and ((meter_id is not null and exists(select 1 from utilities.meters m where m.id=meter_id and app_private.can_access_utility_scope(m.property_id,m.building_id,m.unit_id))) or (invoice_id is not null and exists(select 1 from utilities.provider_invoices i join utilities.supply_contracts c on c.id=i.contract_id where i.id=invoice_id and app_private.can_access_utility_scope(c.property_id,c.building_id,c.unit_id)))));
grant select on utilities.invoice_meter_links,utilities.utility_comparisons,utilities.utility_anomalies to authenticated;
grant all on all tables in schema utilities to service_role;
revoke all on function utilities.evaluate_comparison(uuid) from public;
grant execute on function utilities.evaluate_comparison(uuid) to service_role;

commit;
