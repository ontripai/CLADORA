begin;

create schema if not exists documents;
grant usage on schema documents to authenticated;
create type documents.classification as enum ('public','internal','confidential','restricted');

create table documents.folders (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  parent_id uuid references documents.folders(id) on delete restrict, property_id uuid references portfolio.properties(id) on delete restrict,
  name text not null, classification documents.classification not null default 'internal', created_at timestamptz not null default statement_timestamp(),
  unique nulls not distinct(tenant_id,parent_id,property_id,name)
);
create table documents.documents (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  folder_id uuid references documents.folders(id) on delete restrict, property_id uuid references portfolio.properties(id) on delete restrict,
  title text not null, document_type text not null, classification documents.classification not null default 'internal',
  retention_policy_code text, legal_hold boolean not null default false, current_version integer not null default 1 check(current_version>0),
  status platform.record_status not null default 'active', created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp()
);
create table documents.document_versions (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  document_id uuid not null references documents.documents(id) on delete restrict, version integer not null check(version>0), object_path text not null,
  sha256 text not null, mime_type text not null, size_bytes bigint check(size_bytes is null or size_bytes>=0), metadata_json jsonb not null default '{}'::jsonb,
  uploaded_by uuid references auth.users(id) on delete restrict, created_at timestamptz not null default statement_timestamp(),
  unique(document_id,version), unique(tenant_id,sha256)
);
create table documents.document_links (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  document_id uuid not null references documents.documents(id) on delete cascade, entity_type text not null, entity_id uuid not null,
  relation_type text not null default 'attachment', created_at timestamptz not null default statement_timestamp(), unique(document_id,entity_type,entity_id,relation_type)
);
create table documents.retention_policies (
  tenant_id uuid not null references platform.tenants(id) on delete restrict, code text not null, name text not null,
  retain_months integer check(retain_months is null or retain_months>0), disposition_action text not null default 'review',
  policy_json jsonb not null default '{}'::jsonb, created_at timestamptz not null default statement_timestamp(), primary key(tenant_id,code)
);
create table documents.access_events (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  document_id uuid not null references documents.documents(id) on delete restrict, version_id uuid references documents.document_versions(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete restrict, action text not null, purpose text, ip_hash text,
  occurred_at timestamptz not null default statement_timestamp()
);
create table documents.legal_records (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  property_id uuid not null references portfolio.properties(id) on delete restrict, record_type text not null, reference_no text,
  title text not null, authority text, effective_on date, expires_on date, document_id uuid references documents.documents(id) on delete restrict,
  status platform.record_status not null default 'active', metadata_json jsonb not null default '{}'::jsonb, created_at timestamptz not null default statement_timestamp(),
  check(expires_on is null or effective_on is null or expires_on>=effective_on)
);

create or replace function documents.protect_document_version()
returns trigger language plpgsql security definer set search_path=pg_catalog
as $$ begin raise exception 'document_versions_are_immutable'; end; $$;
create trigger document_versions_immutable before update or delete on documents.document_versions for each row execute function documents.protect_document_version();

create trigger vault_documents_updated_at before update on documents.documents for each row execute function app_private.set_updated_at();
do $$ declare t text; begin foreach t in array array['folders','documents','document_versions','document_links','retention_policies','access_events','legal_records'] loop execute format('alter table documents.%I enable row level security',t); end loop; end $$;
create policy folders_context_read on documents.folders for select to authenticated using(tenant_id=app_private.active_tenant_id() and (property_id is null or app_private.can_access_property(property_id)));
create policy documents_context_read on documents.documents for select to authenticated using(tenant_id=app_private.active_tenant_id() and (property_id is null or app_private.can_access_property(property_id)));
create policy document_versions_context_read on documents.document_versions for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from documents.documents d where d.id=document_id and (d.property_id is null or app_private.can_access_property(d.property_id))));
create policy document_links_context_read on documents.document_links for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from documents.documents d where d.id=document_id and (d.property_id is null or app_private.can_access_property(d.property_id))));
create policy retention_policies_member_read on documents.retention_policies for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.is_active_member(tenant_id));
create policy access_events_self_read on documents.access_events for select to authenticated using(tenant_id=app_private.active_tenant_id() and actor_id=auth.uid());
create policy legal_records_context_read on documents.legal_records for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_property(property_id));
grant select on all tables in schema documents to authenticated;
grant all on all tables in schema documents to service_role;
revoke all on function documents.protect_document_version() from public;

commit;
