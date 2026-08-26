begin;

create type maintenance.ticket_status as enum ('open','triaged','planned','in_progress','resolved','closed','reopened','cancelled');

create table maintenance.tickets (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  property_id uuid not null references portfolio.properties(id) on delete restrict, building_id uuid references portfolio.buildings(id) on delete restrict,
  unit_id uuid references portfolio.units(id) on delete restrict, asset_id uuid references assets.assets(id) on delete restrict,
  ticket_no bigint generated always as identity, title text not null, description text not null, category_code text,
  priority maintenance.priority not null default 'normal', status maintenance.ticket_status not null default 'open',
  reported_by uuid references auth.users(id) on delete restrict, reported_at timestamptz not null default statement_timestamp(),
  triaged_at timestamptz, resolved_at timestamptz, closed_at timestamptz, resolution_summary text,
  created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp(), unique(tenant_id,ticket_no)
);
create table maintenance.ticket_work_orders (
  ticket_id uuid not null references maintenance.tickets(id) on delete restrict, work_order_id uuid not null references maintenance.work_orders(id) on delete restrict,
  tenant_id uuid not null references platform.tenants(id) on delete restrict, created_at timestamptz not null default statement_timestamp(), primary key(ticket_id,work_order_id)
);
create table maintenance.work_order_costs (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  work_order_id uuid not null references maintenance.work_orders(id) on delete restrict, purchase_order_id uuid references maintenance.purchase_orders(id) on delete restrict,
  category_code text not null, description text not null, amount numeric(20,4) not null check(amount>=0), currency char(3) not null default 'RON',
  charge_category_id uuid references finance.charge_categories(id) on delete restrict, allocation_run_id uuid references finance.allocation_runs(id) on delete restrict,
  journal_id uuid references finance.journals(id) on delete restrict, incurred_on date not null, snapshot_json jsonb not null,
  created_at timestamptz not null default statement_timestamp()
);
create table assets.asset_history (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  asset_id uuid not null references assets.assets(id) on delete restrict, event_type text not null, work_order_id uuid references maintenance.work_orders(id) on delete restrict,
  ticket_id uuid references maintenance.tickets(id) on delete restrict, actor_id uuid references auth.users(id) on delete restrict,
  before_snapshot jsonb, after_snapshot jsonb, reason text, occurred_at timestamptz not null default statement_timestamp()
);
create table maintenance.attachments (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  ticket_id uuid references maintenance.tickets(id) on delete restrict, work_order_id uuid references maintenance.work_orders(id) on delete restrict,
  object_path text not null, sha256 text not null, mime_type text not null, title text, uploaded_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(), check(ticket_id is not null or work_order_id is not null), unique(tenant_id,sha256)
);

create trigger tickets_updated_at before update on maintenance.tickets for each row execute function app_private.set_updated_at();
alter table maintenance.tickets enable row level security;
alter table maintenance.ticket_work_orders enable row level security;
alter table maintenance.work_order_costs enable row level security;
alter table maintenance.attachments enable row level security;
alter table assets.asset_history enable row level security;
create policy tickets_context_read on maintenance.tickets for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_asset_scope(property_id,building_id,unit_id));
create policy ticket_work_orders_context_read on maintenance.ticket_work_orders for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from maintenance.tickets t where t.id=ticket_id and app_private.can_access_asset_scope(t.property_id,t.building_id,t.unit_id)));
create policy work_order_costs_context_read on maintenance.work_order_costs for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from maintenance.work_orders w where w.id=work_order_id and app_private.can_access_asset_scope(w.property_id,w.building_id,w.unit_id)));
create policy attachments_context_read on maintenance.attachments for select to authenticated using(tenant_id=app_private.active_tenant_id() and ((ticket_id is not null and exists(select 1 from maintenance.tickets t where t.id=ticket_id and app_private.can_access_asset_scope(t.property_id,t.building_id,t.unit_id))) or (work_order_id is not null and exists(select 1 from maintenance.work_orders w where w.id=work_order_id and app_private.can_access_asset_scope(w.property_id,w.building_id,w.unit_id)))));
create policy asset_history_context_read on assets.asset_history for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from assets.assets a where a.id=asset_id and app_private.can_access_asset_scope(a.property_id,a.building_id,a.unit_id)));
grant select on maintenance.tickets,maintenance.ticket_work_orders,maintenance.work_order_costs,maintenance.attachments to authenticated;
grant select on assets.asset_history to authenticated;
grant all on all tables in schema maintenance to service_role;
grant all on all tables in schema assets to service_role;
grant usage,select on all sequences in schema maintenance to service_role;

commit;
