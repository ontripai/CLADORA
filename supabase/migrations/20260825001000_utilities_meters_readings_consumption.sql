begin;

create type utilities.meter_scope as enum ('property','building','unit','common_area','submeter');
create type utilities.reading_method as enum ('manual','photo_ocr','bulk_import','iot','provider');
create type utilities.reading_status as enum ('captured','validated','rejected','superseded');

create table utilities.meters (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  property_id uuid not null references portfolio.properties(id) on delete restrict, building_id uuid references portfolio.buildings(id) on delete restrict,
  unit_id uuid references portfolio.units(id) on delete restrict, parent_meter_id uuid references utilities.meters(id) on delete restrict,
  service_type utilities.service_type not null, scope utilities.meter_scope not null, serial_number_encrypted text, serial_fingerprint text not null,
  unit_code text not null, multiplier numeric(20,8) not null default 1 check(multiplier>0), rollover_value numeric(20,6),
  installed_on date, removed_on date, status platform.record_status not null default 'active', metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp(),
  check(removed_on is null or installed_on is null or removed_on>=installed_on),
  check((scope='property' and building_id is null and unit_id is null) or (scope in ('building','common_area') and building_id is not null and unit_id is null) or (scope in ('unit','submeter') and unit_id is not null)),
  unique(tenant_id,serial_fingerprint)
);
create table utilities.meter_readings (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  meter_id uuid not null references utilities.meters(id) on delete restrict, reading_at timestamptz not null, reading_value numeric(20,6) not null check(reading_value>=0),
  method utilities.reading_method not null, status utilities.reading_status not null default 'captured', confidence numeric(6,5) check(confidence between 0 and 1),
  source_object_path text, source_sha256 text, entered_by uuid references auth.users(id) on delete restrict, validated_by uuid references auth.users(id) on delete restrict,
  validated_at timestamptz, supersedes_reading_id uuid references utilities.meter_readings(id) on delete restrict,
  note text, created_at timestamptz not null default statement_timestamp(),
  check((status='validated' and validated_at is not null) or status<>'validated'), unique(meter_id,reading_at)
);
create unique index meter_reading_source_unique on utilities.meter_readings(tenant_id,source_sha256) where source_sha256 is not null;
create table utilities.consumption_periods (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  meter_id uuid not null references utilities.meters(id) on delete restrict, start_reading_id uuid not null references utilities.meter_readings(id) on delete restrict,
  end_reading_id uuid not null references utilities.meter_readings(id) on delete restrict, period_start timestamptz not null, period_end timestamptz not null,
  raw_consumption numeric(20,6) not null check(raw_consumption>=0), adjusted_consumption numeric(20,6) not null check(adjusted_consumption>=0),
  calculation_snapshot jsonb not null, created_at timestamptz not null default statement_timestamp(),
  check(start_reading_id<>end_reading_id), check(period_end>period_start), unique(meter_id,start_reading_id,end_reading_id)
);

create or replace function utilities.protect_validated_reading()
returns trigger language plpgsql security definer set search_path=pg_catalog,utilities
as $$ begin
  if tg_op='DELETE' and old.status in ('validated','superseded') then raise exception 'validated_meter_reading_is_immutable'; end if;
  if tg_op='UPDATE' and old.status='superseded' and new is distinct from old then raise exception 'validated_meter_reading_is_immutable'; end if;
  if tg_op='UPDATE' and old.status='validated' and new is distinct from old and not (new.status='superseded' and (to_jsonb(new)-'status')=(to_jsonb(old)-'status')) then raise exception 'validated_meter_reading_is_immutable'; end if;
  if tg_op='UPDATE' and old.status='captured' and new.status='validated' then new.validated_at=coalesce(new.validated_at,statement_timestamp()); end if;
  return case when tg_op='DELETE' then old else new end;
end; $$;
create trigger meter_readings_protect before update or delete on utilities.meter_readings for each row execute function utilities.protect_validated_reading();
create trigger meters_updated_at before update on utilities.meters for each row execute function app_private.set_updated_at();

do $$ declare t text; begin foreach t in array array['meters','meter_readings','consumption_periods'] loop execute format('alter table utilities.%I enable row level security',t); end loop; end $$;
create policy meters_context_read on utilities.meters for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_utility_scope(property_id,building_id,unit_id));
create policy readings_context_read on utilities.meter_readings for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from utilities.meters m where m.id=meter_id and app_private.can_access_utility_scope(m.property_id,m.building_id,m.unit_id)));
create policy consumption_context_read on utilities.consumption_periods for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from utilities.meters m where m.id=meter_id and app_private.can_access_utility_scope(m.property_id,m.building_id,m.unit_id)));
grant select on utilities.meters,utilities.meter_readings,utilities.consumption_periods to authenticated;
grant all on all tables in schema utilities to service_role;
revoke all on function utilities.protect_validated_reading() from public;

commit;
