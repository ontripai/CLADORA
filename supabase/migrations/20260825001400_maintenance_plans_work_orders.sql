begin;

create schema if not exists maintenance;
grant usage on schema maintenance to authenticated;
create type maintenance.priority as enum ('low','normal','high','urgent','emergency');
create type maintenance.work_order_status as enum ('draft','scheduled','assigned','in_progress','blocked','completed','verified','cancelled');
create type maintenance.plan_trigger as enum ('calendar','meter','condition','manual');

create table maintenance.maintenance_plans (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  asset_id uuid not null references assets.assets(id) on delete restrict, name text not null, trigger_type maintenance.plan_trigger not null,
  recurrence_rule jsonb not null, checklist_template jsonb not null default '[]'::jsonb, estimated_duration_minutes integer check(estimated_duration_minutes is null or estimated_duration_minutes>0),
  default_priority maintenance.priority not null default 'normal', next_due_at timestamptz, last_generated_at timestamptz,
  status platform.record_status not null default 'active', created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp()
);
create table maintenance.work_orders (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  property_id uuid not null references portfolio.properties(id) on delete restrict, building_id uuid references portfolio.buildings(id) on delete restrict,
  unit_id uuid references portfolio.units(id) on delete restrict, asset_id uuid references assets.assets(id) on delete restrict,
  plan_id uuid references maintenance.maintenance_plans(id) on delete restrict, work_order_no bigint generated always as identity,
  title text not null, description text, priority maintenance.priority not null default 'normal', status maintenance.work_order_status not null default 'draft',
  scheduled_start timestamptz, scheduled_end timestamptz, started_at timestamptz, completed_at timestamptz, verified_at timestamptz,
  assigned_membership_id uuid references identity.memberships(id) on delete restrict, created_by uuid references auth.users(id) on delete restrict,
  completion_summary text, created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp(),
  check(scheduled_end is null or scheduled_start is not null), check(scheduled_end is null or scheduled_end>scheduled_start),
  check(completed_at is null or started_at is null or completed_at>=started_at), unique(tenant_id,work_order_no)
);
create table maintenance.work_order_checklist_items (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  work_order_id uuid not null references maintenance.work_orders(id) on delete cascade, sequence_no integer not null check(sequence_no>0),
  label text not null, required boolean not null default true, completed boolean not null default false,
  result_json jsonb, completed_by uuid references auth.users(id) on delete restrict, completed_at timestamptz,
  created_at timestamptz not null default statement_timestamp(), unique(work_order_id,sequence_no),
  check((completed and completed_at is not null) or not completed)
);
create table maintenance.work_order_events (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  work_order_id uuid not null references maintenance.work_orders(id) on delete restrict, event_type text not null,
  from_status maintenance.work_order_status, to_status maintenance.work_order_status, actor_id uuid references auth.users(id) on delete restrict,
  payload jsonb not null default '{}'::jsonb, occurred_at timestamptz not null default statement_timestamp()
);

create or replace function maintenance.enforce_work_order_transition()
returns trigger language plpgsql security definer set search_path=pg_catalog,maintenance
as $$ declare incomplete integer; allowed boolean; begin
  if new.status=old.status then return new; end if;
  allowed=case old.status
    when 'draft' then new.status in ('scheduled','assigned','cancelled')
    when 'scheduled' then new.status in ('assigned','in_progress','cancelled')
    when 'assigned' then new.status in ('scheduled','in_progress','cancelled')
    when 'in_progress' then new.status in ('blocked','completed','cancelled')
    when 'blocked' then new.status in ('in_progress','cancelled')
    when 'completed' then new.status in ('verified','in_progress')
    else false end;
  if not allowed then raise exception 'invalid_work_order_transition: % -> %',old.status,new.status; end if;
  if new.status='in_progress' then new.started_at=coalesce(new.started_at,statement_timestamp()); end if;
  if new.status='completed' then
    select count(*) into incomplete from maintenance.work_order_checklist_items where work_order_id=old.id and required and not completed;
    if incomplete>0 then raise exception 'required_checklist_items_incomplete'; end if;
    new.completed_at=coalesce(new.completed_at,statement_timestamp());
  end if;
  if new.status='verified' then new.verified_at=coalesce(new.verified_at,statement_timestamp()); end if;
  return new;
end; $$;
create trigger work_orders_transition before update on maintenance.work_orders for each row execute function maintenance.enforce_work_order_transition();
create trigger maintenance_plans_updated_at before update on maintenance.maintenance_plans for each row execute function app_private.set_updated_at();
create trigger work_orders_updated_at before update on maintenance.work_orders for each row execute function app_private.set_updated_at();

do $$ declare t text; begin foreach t in array array['maintenance_plans','work_orders','work_order_checklist_items','work_order_events'] loop execute format('alter table maintenance.%I enable row level security',t); end loop; end $$;
create policy plans_context_read on maintenance.maintenance_plans for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from assets.assets a where a.id=asset_id and app_private.can_access_asset_scope(a.property_id,a.building_id,a.unit_id)));
create policy work_orders_context_read on maintenance.work_orders for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_asset_scope(property_id,building_id,unit_id));
create policy checklist_context_read on maintenance.work_order_checklist_items for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from maintenance.work_orders w where w.id=work_order_id and app_private.can_access_asset_scope(w.property_id,w.building_id,w.unit_id)));
create policy work_order_events_context_read on maintenance.work_order_events for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from maintenance.work_orders w where w.id=work_order_id and app_private.can_access_asset_scope(w.property_id,w.building_id,w.unit_id)));
grant select on all tables in schema maintenance to authenticated;
grant all on all tables in schema maintenance to service_role;
grant usage,select on all sequences in schema maintenance to service_role;
revoke all on function maintenance.enforce_work_order_transition() from public;

commit;
