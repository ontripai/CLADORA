begin;

create type utilities.ingestion_channel as enum ('upload','email','api','provider_portal','bulk_import');
create type utilities.review_status as enum ('open','assigned','approved','rejected','cancelled');

create table utilities.ingestion_sources (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  contract_id uuid references utilities.supply_contracts(id) on delete restrict, channel utilities.ingestion_channel not null,
  name text not null, configuration_encrypted text, status platform.record_status not null default 'active', created_at timestamptz not null default statement_timestamp()
);
create table utilities.ingestion_runs (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  source_id uuid not null references utilities.ingestion_sources(id) on delete restrict, started_at timestamptz not null default statement_timestamp(), completed_at timestamptz,
  discovered_count integer not null default 0 check(discovered_count>=0), imported_count integer not null default 0 check(imported_count>=0),
  duplicate_count integer not null default 0 check(duplicate_count>=0), failed_count integer not null default 0 check(failed_count>=0), status text not null default 'running', error_summary jsonb
);
create table utilities.ingestion_documents (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  run_id uuid references utilities.ingestion_runs(id) on delete restrict, source_id uuid not null references utilities.ingestion_sources(id) on delete restrict,
  external_ref text, object_path text not null, sha256 text not null, mime_type text not null, received_at timestamptz not null default statement_timestamp(),
  invoice_id uuid references utilities.provider_invoices(id) on delete restrict, processing_status text not null default 'received', metadata_json jsonb not null default '{}'::jsonb,
  unique(tenant_id,sha256)
);
create table utilities.review_tasks (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  invoice_id uuid references utilities.provider_invoices(id) on delete restrict, extraction_id uuid references utilities.ocr_extractions(id) on delete restrict,
  anomaly_id uuid references utilities.utility_anomalies(id) on delete restrict, reason_code text not null, priority smallint not null default 3 check(priority between 1 and 5),
  status utilities.review_status not null default 'open', assigned_to uuid references auth.users(id) on delete restrict, assigned_at timestamptz,
  decided_by uuid references auth.users(id) on delete restrict, decided_at timestamptz, decision_note text, created_at timestamptz not null default statement_timestamp(),
  check(invoice_id is not null or extraction_id is not null or anomaly_id is not null),
  check((status in ('approved','rejected') and decided_at is not null) or status not in ('approved','rejected'))
);
create table utilities.review_decisions (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  task_id uuid not null references utilities.review_tasks(id) on delete restrict, actor_id uuid not null references auth.users(id) on delete restrict,
  decision text not null, before_snapshot jsonb, after_snapshot jsonb, reason text not null, created_at timestamptz not null default statement_timestamp()
);

do $$ declare t text; begin foreach t in array array['ingestion_sources','ingestion_runs','ingestion_documents','review_tasks','review_decisions'] loop execute format('alter table utilities.%I enable row level security',t); end loop; end $$;
create policy ingestion_sources_context_read on utilities.ingestion_sources for select to authenticated using(tenant_id=app_private.active_tenant_id() and (contract_id is null or exists(select 1 from utilities.supply_contracts c where c.id=contract_id and app_private.can_access_utility_scope(c.property_id,c.building_id,c.unit_id))));
create policy ingestion_runs_context_read on utilities.ingestion_runs for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from utilities.ingestion_sources s where s.id=source_id and (s.contract_id is null or exists(select 1 from utilities.supply_contracts c where c.id=s.contract_id and app_private.can_access_utility_scope(c.property_id,c.building_id,c.unit_id)))));
create policy ingestion_documents_context_read on utilities.ingestion_documents for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from utilities.ingestion_sources s where s.id=source_id and (s.contract_id is null or exists(select 1 from utilities.supply_contracts c where c.id=s.contract_id and app_private.can_access_utility_scope(c.property_id,c.building_id,c.unit_id)))));
create policy review_tasks_context_read on utilities.review_tasks for select to authenticated using(tenant_id=app_private.active_tenant_id() and ((invoice_id is not null and exists(select 1 from utilities.provider_invoices i join utilities.supply_contracts c on c.id=i.contract_id where i.id=invoice_id and app_private.can_access_utility_scope(c.property_id,c.building_id,c.unit_id))) or (extraction_id is not null and exists(select 1 from utilities.ocr_extractions e join utilities.provider_invoices i on i.id=e.invoice_id join utilities.supply_contracts c on c.id=i.contract_id where e.id=extraction_id and app_private.can_access_utility_scope(c.property_id,c.building_id,c.unit_id))) or (anomaly_id is not null and exists(select 1 from utilities.utility_anomalies a left join utilities.provider_invoices i on i.id=a.invoice_id left join utilities.supply_contracts c on c.id=i.contract_id left join utilities.meters m on m.id=a.meter_id where a.id=anomaly_id and ((c.id is not null and app_private.can_access_utility_scope(c.property_id,c.building_id,c.unit_id)) or (m.id is not null and app_private.can_access_utility_scope(m.property_id,m.building_id,m.unit_id)))))));
create policy review_decisions_self_read on utilities.review_decisions for select to authenticated using(tenant_id=app_private.active_tenant_id() and actor_id=auth.uid());
grant select on utilities.ingestion_sources,utilities.ingestion_runs,utilities.ingestion_documents,utilities.review_tasks,utilities.review_decisions to authenticated;
grant all on all tables in schema utilities to service_role;

commit;
