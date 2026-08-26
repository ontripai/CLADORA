begin;

create table platform.tenants (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  registration_number text,
  status platform.record_status not null default 'draft',
  default_locale text not null default 'ro' check (default_locale in ('ro','en','fa')),
  timezone text not null default 'Europe/Bucharest',
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  archived_at timestamptz,
  unique (registration_number)
);

create table platform.tenant_settings (
  tenant_id uuid not null references platform.tenants(id) on delete restrict,
  key text not null,
  value_json jsonb not null default '{}'::jsonb,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  primary key (tenant_id, key)
);

create table platform.idempotency_keys (
  tenant_id uuid not null references platform.tenants(id) on delete restrict,
  actor_id uuid,
  key text not null,
  request_hash text not null,
  response_ref jsonb,
  status_code integer,
  created_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null,
  primary key (tenant_id, key),
  check (expires_at > created_at)
);

create table platform.outbox_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references platform.tenants(id) on delete restrict,
  aggregate_type text not null,
  aggregate_id uuid not null,
  aggregate_version bigint not null check (aggregate_version > 0),
  event_type text not null,
  payload jsonb not null,
  trace_id uuid,
  occurred_at timestamptz not null default statement_timestamp(),
  published_at timestamptz,
  publish_attempts integer not null default 0 check (publish_attempts >= 0),
  unique (tenant_id, aggregate_type, aggregate_id, aggregate_version, event_type)
);

create index outbox_unpublished_idx on platform.outbox_events (occurred_at, id) where published_at is null;
create index idempotency_expiry_idx on platform.idempotency_keys (expires_at);

create trigger tenants_updated_at before update on platform.tenants for each row execute function app_private.set_updated_at();
create trigger tenant_settings_updated_at before update on platform.tenant_settings for each row execute function app_private.set_updated_at();

alter table platform.tenants enable row level security;
alter table platform.tenant_settings enable row level security;
alter table platform.idempotency_keys enable row level security;
alter table platform.outbox_events enable row level security;

create policy tenants_read_active on platform.tenants for select to authenticated
using (id = app_private.active_tenant_id());
create policy tenant_settings_read_active on platform.tenant_settings for select to authenticated
using (tenant_id = app_private.active_tenant_id());
create policy service_tenants_all on platform.tenants for all to service_role using (true) with check (true);
create policy service_tenant_settings_all on platform.tenant_settings for all to service_role using (true) with check (true);
create policy service_idempotency_all on platform.idempotency_keys for all to service_role using (true) with check (true);
create policy service_outbox_all on platform.outbox_events for all to service_role using (true) with check (true);

grant select on platform.tenants, platform.tenant_settings to authenticated;
grant all on all tables in schema platform to service_role;
commit;
