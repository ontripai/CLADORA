begin;

create schema if not exists assets;
grant usage on schema assets to authenticated;

create type assets.asset_scope as enum ('property','building','unit','common_area');
create type assets.asset_condition as enum ('unknown','good','fair','poor','critical','retired');

create table assets.asset_categories (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  parent_id uuid references assets.asset_categories(id) on delete restrict, code text not null, name text not null,
  default_attributes jsonb not null default '{}'::jsonb, status platform.record_status not null default 'active', created_at timestamptz not null default statement_timestamp(),
  unique(tenant_id,code)
);
create table assets.assets (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  category_id uuid not null references assets.asset_categories(id) on delete restrict, property_id uuid not null references portfolio.properties(id) on delete restrict,
  building_id uuid references portfolio.buildings(id) on delete restrict, unit_id uuid references portfolio.units(id) on delete restrict,
  scope assets.asset_scope not null, asset_code text not null, name text not null, manufacturer text, model text,
  serial_number_encrypted text, serial_fingerprint text, installed_on date, expected_life_months integer check(expected_life_months is null or expected_life_months>0),
  condition assets.asset_condition not null default 'unknown', criticality smallint not null default 3 check(criticality between 1 and 5),
  replacement_cost numeric(20,4) check(replacement_cost is null or replacement_cost>=0), currency char(3) not null default 'RON',
  attributes jsonb not null default '{}'::jsonb, status platform.record_status not null default 'active', retired_at timestamptz,
  created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp(),
  check((scope='property' and building_id is null and unit_id is null) or (scope in ('building','common_area') and building_id is not null and unit_id is null) or (scope='unit' and unit_id is not null)),
  unique(tenant_id,asset_code)
);
create unique index assets_serial_unique on assets.assets(tenant_id,serial_fingerprint) where serial_fingerprint is not null;
create table assets.asset_components (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  parent_asset_id uuid not null references assets.assets(id) on delete restrict, component_asset_id uuid not null references assets.assets(id) on delete restrict,
  quantity numeric(12,4) not null default 1 check(quantity>0), installed_on date, removed_on date, created_at timestamptz not null default statement_timestamp(),
  check(parent_asset_id<>component_asset_id), check(removed_on is null or installed_on is null or removed_on>=installed_on), unique(parent_asset_id,component_asset_id,installed_on)
);
create table assets.asset_warranties (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  asset_id uuid not null references assets.assets(id) on delete restrict, provider_party_id uuid references portfolio.parties(id) on delete restrict,
  warranty_ref_encrypted text, starts_on date not null, ends_on date not null, coverage_json jsonb not null default '{}'::jsonb,
  evidence_object_path text, created_at timestamptz not null default statement_timestamp(), check(ends_on>=starts_on)
);
create table assets.asset_documents (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  asset_id uuid not null references assets.assets(id) on delete restrict, document_type text not null, title text not null,
  object_path text not null, sha256 text not null, version integer not null default 1 check(version>0), created_at timestamptz not null default statement_timestamp(),
  unique(asset_id,document_type,version), unique(tenant_id,sha256)
);

create or replace function app_private.can_access_asset_scope(target_property uuid,target_building uuid,target_unit uuid)
returns boolean language sql stable security definer set search_path=pg_catalog
as $$ select case when target_unit is not null then app_private.can_access_unit(target_unit) when target_building is not null then app_private.can_access_building(target_building) else app_private.can_access_property(target_property) end; $$;
revoke all on function app_private.can_access_asset_scope(uuid,uuid,uuid) from public;
grant execute on function app_private.can_access_asset_scope(uuid,uuid,uuid) to authenticated,service_role;
create trigger assets_updated_at before update on assets.assets for each row execute function app_private.set_updated_at();

do $$ declare t text; begin foreach t in array array['asset_categories','assets','asset_components','asset_warranties','asset_documents'] loop execute format('alter table assets.%I enable row level security',t); end loop; end $$;
create policy asset_categories_member_read on assets.asset_categories for select to authenticated using(tenant_id=app_private.active_tenant_id());
create policy assets_context_read on assets.assets for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_asset_scope(property_id,building_id,unit_id));
create policy asset_components_context_read on assets.asset_components for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from assets.assets a where a.id=parent_asset_id and app_private.can_access_asset_scope(a.property_id,a.building_id,a.unit_id)));
create policy asset_warranties_context_read on assets.asset_warranties for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from assets.assets a where a.id=asset_id and app_private.can_access_asset_scope(a.property_id,a.building_id,a.unit_id)));
create policy asset_documents_context_read on assets.asset_documents for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from assets.assets a where a.id=asset_id and app_private.can_access_asset_scope(a.property_id,a.building_id,a.unit_id)));
grant select on all tables in schema assets to authenticated;
grant all on all tables in schema assets to service_role;

commit;
