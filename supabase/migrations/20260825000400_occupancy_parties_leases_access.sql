begin;
create type occupancy.occupancy_kind as enum ('owner','tenant','household_member','short_stay','company','empty');
create type occupancy.occupancy_status as enum ('planned','active','ended','cancelled');
create type occupancy.payer_type as enum ('owner','tenant','split');

create table occupancy.occupancies (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
 unit_id uuid not null references portfolio.units(id) on delete restrict, kind occupancy.occupancy_kind not null, status occupancy.occupancy_status not null default 'planned',
 starts_at timestamptz not null, ends_at timestamptz, created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp(),
 check(ends_at is null or ends_at>starts_at)
);
create table occupancy.occupants (
 occupancy_id uuid not null references occupancy.occupancies(id) on delete cascade, party_id uuid not null references portfolio.parties(id) on delete restrict,
 role text not null, resident_weight numeric(8,4) not null default 1 check(resident_weight>=0), created_at timestamptz not null default statement_timestamp(), primary key(occupancy_id,party_id)
);
create table occupancy.leases (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
 unit_id uuid not null references portfolio.units(id) on delete restrict, landlord_party_id uuid not null references portfolio.parties(id) on delete restrict,
 tenant_party_id uuid not null references portfolio.parties(id) on delete restrict, starts_on date not null, ends_on date, currency char(3) not null default 'RON',
 status platform.record_status not null default 'draft', evidence_id uuid, created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp(),
 check(landlord_party_id<>tenant_party_id), check(ends_on is null or ends_on>starts_on)
);
create table occupancy.cost_responsibilities (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
 lease_id uuid not null references occupancy.leases(id) on delete restrict, charge_category_code text not null, payer occupancy.payer_type not null,
 owner_share numeric(10,8), rule_json jsonb not null default '{}'::jsonb, valid_from date not null, valid_to date, version integer not null default 1,
 created_at timestamptz not null default statement_timestamp(), check(valid_to is null or valid_to>valid_from),
 check((payer='split' and owner_share between 0 and 1) or (payer<>'split' and owner_share is null))
);
create table occupancy.access_assets (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
 unit_id uuid references portfolio.units(id) on delete restrict, building_id uuid references portfolio.buildings(id) on delete restrict,
 asset_type text not null, serial_hash text not null, status platform.record_status not null default 'active', created_at timestamptz not null default statement_timestamp(),
 check(unit_id is not null or building_id is not null), unique(tenant_id,serial_hash)
);
create table occupancy.access_assignments (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
 asset_id uuid not null references occupancy.access_assets(id) on delete restrict, party_id uuid not null references portfolio.parties(id) on delete restrict,
 starts_at timestamptz not null, ends_at timestamptz, returned_at timestamptz, created_at timestamptz not null default statement_timestamp(), check(ends_at is null or ends_at>starts_at)
);
create index occupancies_unit_period_idx on occupancy.occupancies(tenant_id,unit_id,starts_at,ends_at);
create index leases_unit_period_idx on occupancy.leases(tenant_id,unit_id,starts_on,ends_on);
create index responsibilities_lease_period_idx on occupancy.cost_responsibilities(tenant_id,lease_id,charge_category_code,valid_from,valid_to);
do $$ declare t text; begin foreach t in array array['occupancies','occupants','leases','cost_responsibilities','access_assets','access_assignments'] loop execute format('alter table occupancy.%I enable row level security',t); end loop; end $$;
create policy occupancies_context_read on occupancy.occupancies for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_unit(unit_id));
create policy occupants_context_read on occupancy.occupants for select to authenticated using(exists(select 1 from occupancy.occupancies o where o.id=occupancy_id and app_private.can_access_unit(o.unit_id)));
create policy leases_context_read on occupancy.leases for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_unit(unit_id));
create policy responsibilities_context_read on occupancy.cost_responsibilities for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from occupancy.leases l where l.id=lease_id and app_private.can_access_unit(l.unit_id)));
create policy access_assets_context_read on occupancy.access_assets for select to authenticated using(tenant_id=app_private.active_tenant_id() and ((unit_id is not null and app_private.can_access_unit(unit_id)) or (building_id is not null and app_private.can_access_building(building_id))));
create policy access_assignments_context_read on occupancy.access_assignments for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from occupancy.access_assets a where a.id=asset_id and ((a.unit_id is not null and app_private.can_access_unit(a.unit_id)) or (a.building_id is not null and app_private.can_access_building(a.building_id)))));
grant select on all tables in schema occupancy to authenticated;grant all on all tables in schema occupancy to service_role;
commit;
