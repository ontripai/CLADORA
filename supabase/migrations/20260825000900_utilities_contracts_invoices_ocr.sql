begin;

create schema if not exists utilities;
grant usage on schema utilities to authenticated;

create type utilities.service_type as enum ('water','electricity','gas','heat','sewer','waste','internet','telephone','other');
create type utilities.invoice_status as enum ('received','extracting','review_required','approved','posted','void');
create type utilities.extraction_status as enum ('queued','processing','completed','failed','reviewed');

create table utilities.providers (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  legal_name text not null, tax_number text, service_types utilities.service_type[] not null default '{}',
  contact_json jsonb not null default '{}'::jsonb, status platform.record_status not null default 'active', created_at timestamptz not null default statement_timestamp()
);
create unique index utility_provider_tax_unique on utilities.providers(tenant_id,tax_number) where tax_number is not null;
create table utilities.supply_contracts (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  property_id uuid not null references portfolio.properties(id) on delete restrict, building_id uuid references portfolio.buildings(id) on delete restrict,
  unit_id uuid references portfolio.units(id) on delete restrict, provider_id uuid not null references utilities.providers(id) on delete restrict,
  service_type utilities.service_type not null, contract_ref_encrypted text, account_ref_fingerprint text,
  currency char(3) not null default 'RON', starts_on date not null, ends_on date, status platform.record_status not null default 'active',
  billing_rules jsonb not null default '{}'::jsonb, created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp(),
  check(ends_on is null or ends_on>starts_on), check(unit_id is null or building_id is not null)
);
create table utilities.provider_invoices (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  contract_id uuid not null references utilities.supply_contracts(id) on delete restrict, provider_id uuid not null references utilities.providers(id) on delete restrict,
  external_invoice_no text not null, issued_on date, due_on date, period_start date, period_end date, currency char(3) not null default 'RON',
  subtotal numeric(20,4) not null default 0 check(subtotal>=0), tax_total numeric(20,4) not null default 0 check(tax_total>=0),
  total numeric(20,4) generated always as(subtotal+tax_total) stored, status utilities.invoice_status not null default 'received',
  source_object_path text, source_sha256 text not null, approved_by uuid references auth.users(id) on delete restrict, approved_at timestamptz,
  ledger_journal_id uuid references finance.journals(id) on delete restrict, approved_snapshot jsonb,
  created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp(),
  check(period_end is null or period_start is not null), check(period_end is null or period_end>period_start),
  check((status in ('approved','posted') and approved_at is not null) or status not in ('approved','posted')),
  unique(provider_id,external_invoice_no), unique(tenant_id,source_sha256)
);
create table utilities.provider_invoice_lines (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  invoice_id uuid not null references utilities.provider_invoices(id) on delete restrict, category_id uuid references finance.charge_categories(id) on delete restrict,
  service_type utilities.service_type not null, description text not null, quantity numeric(20,6), unit_code text,
  unit_price numeric(20,6), line_subtotal numeric(20,4) not null check(line_subtotal>=0), line_tax numeric(20,4) not null default 0 check(line_tax>=0),
  tariff_snapshot jsonb not null default '{}'::jsonb, created_at timestamptz not null default statement_timestamp()
);
create table utilities.ocr_extractions (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  invoice_id uuid not null references utilities.provider_invoices(id) on delete cascade, engine text not null, engine_version text,
  status utilities.extraction_status not null default 'queued', raw_result jsonb, normalized_result jsonb,
  overall_confidence numeric(6,5) check(overall_confidence between 0 and 1), started_at timestamptz, completed_at timestamptz,
  error_code text, created_at timestamptz not null default statement_timestamp()
);
create table utilities.ocr_field_candidates (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  extraction_id uuid not null references utilities.ocr_extractions(id) on delete cascade, field_name text not null,
  candidate_value jsonb not null, confidence numeric(6,5) not null check(confidence between 0 and 1), page_no integer check(page_no is null or page_no>0),
  bounding_box jsonb, accepted boolean, reviewed_by uuid references auth.users(id) on delete restrict, reviewed_at timestamptz,
  created_at timestamptz not null default statement_timestamp(), unique(extraction_id,field_name,candidate_value)
);

create or replace function app_private.can_access_utility_scope(target_property uuid,target_building uuid,target_unit uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,portfolio
as $$ select case when target_unit is not null then app_private.can_access_unit(target_unit) when target_building is not null then app_private.can_access_building(target_building) else app_private.can_access_property(target_property) end; $$;
revoke all on function app_private.can_access_utility_scope(uuid,uuid,uuid) from public;
grant execute on function app_private.can_access_utility_scope(uuid,uuid,uuid) to authenticated,service_role;

create or replace function utilities.protect_approved_invoice()
returns trigger language plpgsql security definer set search_path=pg_catalog,utilities
as $$ declare s utilities.invoice_status; ls numeric(20,4); lt numeric(20,4); begin
  if tg_table_name='provider_invoices' then
    if tg_op='DELETE' and old.status in ('approved','posted') then raise exception 'approved_provider_invoice_is_immutable'; end if;
    if tg_op='UPDATE' and old.status='posted' and new is distinct from old then raise exception 'approved_provider_invoice_is_immutable'; end if;
    if tg_op='UPDATE' and old.status='approved' and (new.status not in ('approved','posted') or (new.tenant_id,new.contract_id,new.provider_id,new.external_invoice_no,new.issued_on,new.due_on,new.period_start,new.period_end,new.currency,new.subtotal,new.tax_total,new.source_sha256,new.approved_snapshot) is distinct from (old.tenant_id,old.contract_id,old.provider_id,old.external_invoice_no,old.issued_on,old.due_on,old.period_start,old.period_end,old.currency,old.subtotal,old.tax_total,old.source_sha256,old.approved_snapshot)) then raise exception 'approved_provider_invoice_is_immutable'; end if;
    if tg_op='UPDATE' and old.status not in ('approved','posted') and new.status in ('approved','posted') then
      select coalesce(sum(line_subtotal),0),coalesce(sum(line_tax),0) into ls,lt from utilities.provider_invoice_lines where invoice_id=old.id;
      if ls<>new.subtotal or lt<>new.tax_total then raise exception 'provider_invoice_totals_do_not_match_lines'; end if;
      new.approved_at=coalesce(new.approved_at,statement_timestamp());
      new.approved_snapshot=coalesce(new.approved_snapshot,jsonb_build_object('invoice_id',new.id,'subtotal',new.subtotal,'tax_total',new.tax_total,'currency',new.currency));
    end if;
    return case when tg_op='DELETE' then old else new end;
  end if;
  select status into s from utilities.provider_invoices where id=coalesce(new.invoice_id,old.invoice_id);
  if s in ('approved','posted') then raise exception 'approved_provider_invoice_lines_are_immutable'; end if;
  return case when tg_op='DELETE' then old else new end;
end; $$;
create trigger provider_invoices_protect before update or delete on utilities.provider_invoices for each row execute function utilities.protect_approved_invoice();
create trigger provider_invoice_lines_protect before insert or update or delete on utilities.provider_invoice_lines for each row execute function utilities.protect_approved_invoice();
create trigger supply_contracts_updated_at before update on utilities.supply_contracts for each row execute function app_private.set_updated_at();
create trigger provider_invoices_updated_at before update on utilities.provider_invoices for each row execute function app_private.set_updated_at();

do $$ declare t text; begin foreach t in array array['providers','supply_contracts','provider_invoices','provider_invoice_lines','ocr_extractions','ocr_field_candidates'] loop execute format('alter table utilities.%I enable row level security',t); end loop; end $$;
create policy providers_member_read on utilities.providers for select to authenticated using(tenant_id=app_private.active_tenant_id());
create policy contracts_context_read on utilities.supply_contracts for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_utility_scope(property_id,building_id,unit_id));
create policy provider_invoices_context_read on utilities.provider_invoices for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from utilities.supply_contracts c where c.id=contract_id and app_private.can_access_utility_scope(c.property_id,c.building_id,c.unit_id)));
create policy provider_invoice_lines_context_read on utilities.provider_invoice_lines for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from utilities.provider_invoices i join utilities.supply_contracts c on c.id=i.contract_id where i.id=invoice_id and app_private.can_access_utility_scope(c.property_id,c.building_id,c.unit_id)));
create policy ocr_extractions_context_read on utilities.ocr_extractions for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from utilities.provider_invoices i join utilities.supply_contracts c on c.id=i.contract_id where i.id=invoice_id and app_private.can_access_utility_scope(c.property_id,c.building_id,c.unit_id)));
create policy ocr_candidates_context_read on utilities.ocr_field_candidates for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from utilities.ocr_extractions e join utilities.provider_invoices i on i.id=e.invoice_id join utilities.supply_contracts c on c.id=i.contract_id where e.id=extraction_id and app_private.can_access_utility_scope(c.property_id,c.building_id,c.unit_id)));
grant select on all tables in schema utilities to authenticated;
grant all on all tables in schema utilities to service_role;
revoke all on function utilities.protect_approved_invoice() from public;

commit;
