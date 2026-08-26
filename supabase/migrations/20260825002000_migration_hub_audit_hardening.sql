begin;

create schema if not exists migration_hub;
create schema if not exists audit;
grant usage on schema migration_hub,audit to authenticated;
create type migration_hub.project_status as enum ('draft','mapping','importing','validating','parallel_run','ready','cutover','completed','failed','cancelled');
create type migration_hub.record_status as enum ('staged','valid','invalid','imported','rejected');

create table migration_hub.projects (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  property_id uuid references portfolio.properties(id) on delete restrict, name text not null, source_system text not null,
  status migration_hub.project_status not null default 'draft', parallel_run_from date, parallel_run_to date,
  created_by uuid references auth.users(id) on delete restrict, created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp()
);
create table migration_hub.field_mappings (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  project_id uuid not null references migration_hub.projects(id) on delete cascade, entity_type text not null, source_field text not null,
  target_field text not null, transform_rule jsonb not null default '{}'::jsonb, required boolean not null default false,
  created_at timestamptz not null default statement_timestamp(), unique(project_id,entity_type,source_field,target_field)
);
create table migration_hub.import_batches (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  project_id uuid not null references migration_hub.projects(id) on delete restrict, entity_type text not null, source_object_path text not null,
  source_sha256 text not null, row_count integer not null default 0 check(row_count>=0), started_at timestamptz not null default statement_timestamp(),
  completed_at timestamptz, status text not null default 'staged', unique(project_id,source_sha256)
);
create table migration_hub.staged_records (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  batch_id uuid not null references migration_hub.import_batches(id) on delete cascade, source_row_no integer not null check(source_row_no>0),
  source_key text, raw_record jsonb not null, transformed_record jsonb, status migration_hub.record_status not null default 'staged',
  target_entity_id uuid, created_at timestamptz not null default statement_timestamp(), unique(batch_id,source_row_no)
);
create table migration_hub.validation_results (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  staged_record_id uuid not null references migration_hub.staged_records(id) on delete cascade, rule_code text not null,
  severity text not null, passed boolean not null, message text, details_json jsonb not null default '{}'::jsonb,
  validated_at timestamptz not null default statement_timestamp(), unique(staged_record_id,rule_code)
);
create table migration_hub.reconciliation_runs (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  project_id uuid not null references migration_hub.projects(id) on delete restrict, period_start date not null, period_end date not null,
  source_totals jsonb not null, target_totals jsonb not null, differences jsonb not null, status text not null default 'pending',
  executed_at timestamptz not null default statement_timestamp(), approved_by uuid references auth.users(id) on delete restrict, approved_at timestamptz,
  check(period_end>period_start)
);
create table migration_hub.reconciliation_items (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  run_id uuid not null references migration_hub.reconciliation_runs(id) on delete cascade, metric_code text not null,
  source_value numeric(24,6), target_value numeric(24,6), difference numeric(24,6), tolerance numeric(24,6) not null default 0,
  passed boolean not null, details_json jsonb not null default '{}'::jsonb, unique(run_id,metric_code)
);
create table migration_hub.cutovers (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  project_id uuid not null references migration_hub.projects(id) on delete restrict, planned_at timestamptz not null,
  started_at timestamptz, completed_at timestamptz, rollback_deadline timestamptz, approved_by uuid references auth.users(id) on delete restrict,
  checklist_snapshot jsonb not null, result_json jsonb, created_at timestamptz not null default statement_timestamp(), unique(project_id)
);
create table audit.events (
  id bigint generated always as identity primary key, tenant_id uuid references platform.tenants(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete restrict, actor_role text, action text not null, entity_type text not null, entity_id uuid,
  request_id uuid, before_snapshot jsonb, after_snapshot jsonb, reason text, occurred_at timestamptz not null default statement_timestamp()
);
create index audit_events_tenant_time_idx on audit.events(tenant_id,occurred_at desc,id desc);

create or replace function migration_hub.protect_approved_reconciliation()
returns trigger language plpgsql security definer set search_path=pg_catalog,migration_hub
as $$ begin
  if tg_op='DELETE' and old.approved_at is not null then raise exception 'approved_reconciliation_is_immutable'; end if;
  if tg_op='UPDATE' and old.approved_at is not null and new is distinct from old then raise exception 'approved_reconciliation_is_immutable'; end if;
  return case when tg_op='DELETE' then old else new end;
end; $$;
create trigger reconciliation_runs_protect before update or delete on migration_hub.reconciliation_runs for each row execute function migration_hub.protect_approved_reconciliation();
create trigger migration_projects_updated_at before update on migration_hub.projects for each row execute function app_private.set_updated_at();

do $$ declare t text; begin foreach t in array array['projects','field_mappings','import_batches','staged_records','validation_results','reconciliation_runs','reconciliation_items','cutovers'] loop execute format('alter table migration_hub.%I enable row level security',t); end loop; end $$;
alter table audit.events enable row level security;
create policy migration_projects_context_read on migration_hub.projects for select to authenticated using(tenant_id=app_private.active_tenant_id() and (property_id is null or app_private.can_access_property(property_id)));
create policy mappings_context_read on migration_hub.field_mappings for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from migration_hub.projects p where p.id=project_id and (p.property_id is null or app_private.can_access_property(p.property_id))));
create policy batches_context_read on migration_hub.import_batches for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from migration_hub.projects p where p.id=project_id and (p.property_id is null or app_private.can_access_property(p.property_id))));
create policy staged_records_context_read on migration_hub.staged_records for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from migration_hub.import_batches b join migration_hub.projects p on p.id=b.project_id where b.id=batch_id and (p.property_id is null or app_private.can_access_property(p.property_id))));
create policy validations_context_read on migration_hub.validation_results for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from migration_hub.staged_records r join migration_hub.import_batches b on b.id=r.batch_id join migration_hub.projects p on p.id=b.project_id where r.id=staged_record_id and (p.property_id is null or app_private.can_access_property(p.property_id))));
create policy reconciliation_runs_context_read on migration_hub.reconciliation_runs for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from migration_hub.projects p where p.id=project_id and (p.property_id is null or app_private.can_access_property(p.property_id))));
create policy reconciliation_items_context_read on migration_hub.reconciliation_items for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from migration_hub.reconciliation_runs r join migration_hub.projects p on p.id=r.project_id where r.id=run_id and (p.property_id is null or app_private.can_access_property(p.property_id))));
create policy cutovers_context_read on migration_hub.cutovers for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from migration_hub.projects p where p.id=project_id and (p.property_id is null or app_private.can_access_property(p.property_id))));
create policy audit_self_read on audit.events for select to authenticated using(tenant_id=app_private.active_tenant_id() and actor_id=auth.uid());
grant select on all tables in schema migration_hub to authenticated;
grant select on audit.events to authenticated;
grant all on all tables in schema migration_hub,audit to service_role;
grant usage,select on all sequences in schema audit to service_role;
revoke all on function migration_hub.protect_approved_reconciliation() from public;

commit;
