begin;
create type portfolio.property_type as enum ('condominium','residential_complex','villa','gated_community','mixed_residential');
create type portfolio.party_type as enum ('person','company','association','public_body');
create type portfolio.unit_status as enum ('active','inactive','combined','archived');

create table portfolio.addresses (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  country_code char(2) not null default 'RO', county text, city text not null, street text not null,
  building_no text, postal_code text, latitude numeric(9,6), longitude numeric(9,6), created_at timestamptz not null default statement_timestamp()
);
create table portfolio.properties (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  type portfolio.property_type not null, name text not null, address_id uuid references portfolio.addresses(id) on delete restrict,
  base_currency char(3) not null default 'RON', status platform.record_status not null default 'draft', created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp()
);
create table portfolio.buildings (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  property_id uuid not null references portfolio.properties(id) on delete restrict, code text not null, name text not null,
  year_built smallint, floors smallint check (floors is null or floors>=0), status platform.record_status not null default 'active',
  created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp(), unique(property_id,code)
);
create table portfolio.entrances (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  building_id uuid not null references portfolio.buildings(id) on delete restrict, code text not null, name text, created_at timestamptz not null default statement_timestamp(), unique(building_id,code)
);
create table portfolio.units (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  building_id uuid not null references portfolio.buildings(id) on delete restrict, entrance_id uuid references portfolio.entrances(id) on delete restrict,
  code text not null, floor smallint, area_m2 numeric(12,3) check(area_m2 is null or area_m2>0), bedrooms smallint check(bedrooms is null or bedrooms>=0),
  status portfolio.unit_status not null default 'active', created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp(), unique(building_id,code)
);
create table portfolio.parties (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  type portfolio.party_type not null, legal_name text not null, tax_ref_encrypted text, email_encrypted text, phone_encrypted text,
  created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp(), archived_at timestamptz
);
create table portfolio.ownerships (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  unit_id uuid not null references portfolio.units(id) on delete restrict, party_id uuid not null references portfolio.parties(id) on delete restrict,
  share numeric(10,8) not null check(share>0 and share<=1), valid_from date not null, valid_to date, evidence_id uuid,
  created_at timestamptz not null default statement_timestamp(), check(valid_to is null or valid_to>valid_from)
);
create index properties_tenant_status_idx on portfolio.properties(tenant_id,status,id);
create index buildings_tenant_property_idx on portfolio.buildings(tenant_id,property_id,id);
create index units_tenant_building_idx on portfolio.units(tenant_id,building_id,status,id);
create index ownerships_unit_period_idx on portfolio.ownerships(tenant_id,unit_id,valid_from,valid_to);

create or replace function app_private.can_access_property(target_property uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,identity,portfolio
as $$ select exists(select 1 from identity.context_grants g where g.id=app_private.active_context_id() and g.membership_id=app_private.active_membership_id() and g.tenant_id=app_private.active_tenant_id() and (g.scope_type='tenant' or g.property_id=target_property)); $$;
create or replace function app_private.can_access_building(target_building uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,identity,portfolio
as $$ select exists(select 1 from portfolio.buildings b join identity.context_grants g on g.id=app_private.active_context_id() where b.id=target_building and b.tenant_id=app_private.active_tenant_id() and g.membership_id=app_private.active_membership_id() and (g.scope_type='tenant' or g.property_id=b.property_id or g.building_id=b.id)); $$;
create or replace function app_private.can_access_unit(target_unit uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,identity,portfolio
as $$ select exists(select 1 from portfolio.units u join portfolio.buildings b on b.id=u.building_id join identity.context_grants g on g.id=app_private.active_context_id() where u.id=target_unit and u.tenant_id=app_private.active_tenant_id() and g.membership_id=app_private.active_membership_id() and (g.scope_type='tenant' or g.property_id=b.property_id or g.building_id=b.id or g.unit_id=u.id)); $$;
revoke all on function app_private.can_access_property(uuid),app_private.can_access_building(uuid),app_private.can_access_unit(uuid) from public;
grant execute on function app_private.can_access_property(uuid),app_private.can_access_building(uuid),app_private.can_access_unit(uuid) to authenticated,service_role;

do $$ declare t text; begin foreach t in array array['addresses','properties','buildings','entrances','units','parties','ownerships'] loop execute format('alter table portfolio.%I enable row level security',t); end loop; end $$;
create policy properties_context_read on portfolio.properties for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_property(id));
create policy buildings_context_read on portfolio.buildings for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_building(id));
create policy entrances_context_read on portfolio.entrances for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_building(building_id));
create policy units_context_read on portfolio.units for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_unit(id));
create policy addresses_context_read on portfolio.addresses for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from portfolio.properties p where p.address_id=addresses.id and app_private.can_access_property(p.id)));
create policy parties_context_read on portfolio.parties for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from portfolio.ownerships o where o.party_id=parties.id and app_private.can_access_unit(o.unit_id)));
create policy ownerships_context_read on portfolio.ownerships for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_unit(unit_id));
grant select on all tables in schema portfolio to authenticated; grant all on all tables in schema portfolio to service_role;
commit;
