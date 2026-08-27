begin;

create table platform.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  plan_code text not null,
  version integer not null default 1 check (version > 0),
  display_name text not null,
  status text not null default 'active' check (status in ('draft','active','deprecated','retired')),
  feature_catalogue jsonb not null default '[]'::jsonb,
  limit_schema jsonb not null default '{}'::jsonb,
  effective_from timestamptz not null default statement_timestamp(),
  effective_until timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  unique (plan_code, version),
  check (effective_until is null or effective_until > effective_from)
);

create table platform.workspace_contracts (
  id uuid primary key default gen_random_uuid(),
  customer_workspace_id uuid not null references platform.customer_workspaces(id) on delete restrict,
  plan_id uuid references platform.subscription_plans(id) on delete restrict,
  contract_ref text not null,
  version integer not null default 1 check (version > 0),
  currency text not null default 'EUR' check (currency in ('EUR','RON','USD')),
  status text not null default 'draft' check (status in ('draft','pending_signature','signed','active','expired','terminated','superseded')),
  start_date date not null,
  end_date date,
  signed_at timestamptz,
  activated_at timestamptz,
  commercial_terms jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default statement_timestamp(),
  unique (contract_ref, version),
  check (end_date is null or end_date >= start_date)
);

create index workspace_contracts_workspace_idx on platform.workspace_contracts (customer_workspace_id, status);

create table platform.workspace_entitlements (
  id uuid primary key default gen_random_uuid(),
  customer_workspace_id uuid not null references platform.customer_workspaces(id) on delete cascade,
  contract_id uuid references platform.workspace_contracts(id) on delete set null,
  entitlement_key text not null,
  value_type text not null check (value_type in ('numeric','boolean','string','array','json')),
  numeric_value numeric(20,4),
  boolean_value boolean,
  text_value text,
  json_value jsonb,
  valid_from timestamptz not null default statement_timestamp(),
  valid_until timestamptz,
  override_value_json jsonb,
  override_reason text,
  override_expires_at timestamptz,
  override_approved_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  unique (customer_workspace_id, entitlement_key),
  check (valid_until is null or valid_until > valid_from),
  check (
    (value_type = 'numeric' and numeric_value is not null) or
    (value_type = 'boolean' and boolean_value is not null) or
    (value_type = 'string' and text_value is not null) or
    (value_type in ('array','json') and json_value is not null)
  )
);

create index workspace_entitlements_lookup_idx on platform.workspace_entitlements (customer_workspace_id, entitlement_key);
create trigger workspace_entitlements_updated_at before update on platform.workspace_entitlements for each row execute function app_private.set_updated_at();

create table platform.entitlement_usage_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_workspace_id uuid not null references platform.customer_workspaces(id) on delete cascade,
  entitlement_key text not null,
  delta numeric(20,4) not null,
  idempotency_key text,
  reason text not null,
  recorded_by uuid references auth.users(id) on delete restrict,
  recorded_at timestamptz not null default statement_timestamp()
);

create unique index entitlement_usage_idempotency_idx on platform.entitlement_usage_ledger (customer_workspace_id, entitlement_key, idempotency_key) where idempotency_key is not null;
create index entitlement_usage_lookup_idx on platform.entitlement_usage_ledger (customer_workspace_id, entitlement_key, recorded_at);

create or replace function platform.enforce_entitlement_quota(
  p_workspace_id uuid,
  p_entitlement_key text,
  p_requested_quantity numeric,
  p_idempotency_key text default null,
  p_reason text default 'standard_consumption'
)
returns boolean
language plpgsql security definer
set search_path = pg_catalog, platform
as $$
declare
  v_ent platform.workspace_entitlements;
  v_limit numeric(20,4);
  v_current_usage numeric(20,4);
  v_existing_id uuid;
begin
  if p_idempotency_key is not null then
    select id into v_existing_id from platform.entitlement_usage_ledger
    where customer_workspace_id = p_workspace_id
      and entitlement_key = p_entitlement_key
      and idempotency_key = p_idempotency_key;

    if v_existing_id is not null then
      return true;
    end if;
  end if;

  select * into v_ent from platform.workspace_entitlements
  where customer_workspace_id = p_workspace_id
    and entitlement_key = p_entitlement_key
    and valid_from <= statement_timestamp()
    and (valid_until is null or valid_until > statement_timestamp())
  for update;

  if not found then
    raise exception 'entitlement_not_found: key % not configured or expired for workspace %', p_entitlement_key, p_workspace_id
      using errcode = 'P0002';
  end if;

  if v_ent.value_type <> 'numeric' then
    raise exception 'invalid_entitlement_type: % is of type %, expected numeric for quota enforcement', p_entitlement_key, v_ent.value_type
      using errcode = '22023';
  end if;

  v_limit := v_ent.numeric_value;
  if v_ent.override_value_json is not null and (v_ent.override_expires_at is null or v_ent.override_expires_at > statement_timestamp()) then
    v_limit := (v_ent.override_value_json ->> 'numeric_value')::numeric;
  end if;

  select coalesce(sum(delta), 0) into v_current_usage
  from platform.entitlement_usage_ledger
  where customer_workspace_id = p_workspace_id
    and entitlement_key = p_entitlement_key;

  if (v_current_usage + p_requested_quantity) > v_limit then
    raise exception 'quota_exceeded: requested % exceeds available capacity (current: %, limit: %)',
      p_requested_quantity, v_current_usage, v_limit
      using errcode = '54000';
  end if;

  insert into platform.entitlement_usage_ledger (
    customer_workspace_id,
    entitlement_key,
    delta,
    idempotency_key,
    reason,
    recorded_by,
    recorded_at
  ) values (
    p_workspace_id,
    p_entitlement_key,
    p_requested_quantity,
    p_idempotency_key,
    p_reason,
    auth.uid(),
    statement_timestamp()
  );

  return true;
end;
$$;
revoke all on function platform.enforce_entitlement_quota(uuid, text, numeric, text, text) from public;
grant execute on function platform.enforce_entitlement_quota(uuid, text, numeric, text, text) to authenticated, service_role;

alter table platform.subscription_plans enable row level security;
alter table platform.workspace_contracts enable row level security;
alter table platform.workspace_entitlements enable row level security;
alter table platform.entitlement_usage_ledger enable row level security;

create policy subscription_plans_select on platform.subscription_plans for select to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_FINANCE')
  or app_private.has_platform_role('PLATFORM_OPERATIONS')
  or app_private.has_platform_role('PLATFORM_AUDITOR')
);

create policy subscription_plans_manage on platform.subscription_plans for all to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_FINANCE')
)
with check (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_FINANCE')
);

create policy workspace_contracts_select on platform.workspace_contracts for select to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_AUDITOR')
  or (app_private.has_platform_role('PLATFORM_FINANCE') and app_private.has_customer_assignment(customer_workspace_id, 'commercial'))
);

create policy workspace_contracts_manage on platform.workspace_contracts for all to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or (app_private.has_platform_role('PLATFORM_FINANCE') and app_private.has_customer_assignment(customer_workspace_id, 'commercial'))
)
with check (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or (app_private.has_platform_role('PLATFORM_FINANCE') and app_private.has_customer_assignment(customer_workspace_id, 'commercial'))
);

create policy workspace_entitlements_select on platform.workspace_entitlements for select to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_AUDITOR')
  or app_private.has_customer_assignment(customer_workspace_id, 'workspace')
  or app_private.has_customer_assignment(customer_workspace_id, 'commercial')
  or app_private.has_customer_assignment(customer_workspace_id, 'technical')
);

create policy workspace_entitlements_manage on platform.workspace_entitlements for all to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or (app_private.has_platform_role('PLATFORM_FINANCE') and app_private.has_customer_assignment(customer_workspace_id, 'commercial'))
  or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(customer_workspace_id, 'workspace'))
)
with check (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or (app_private.has_platform_role('PLATFORM_FINANCE') and app_private.has_customer_assignment(customer_workspace_id, 'commercial'))
  or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(customer_workspace_id, 'workspace'))
);

create policy entitlement_usage_select on platform.entitlement_usage_ledger for select to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_AUDITOR')
  or app_private.has_customer_assignment(customer_workspace_id, 'workspace')
);

create policy service_plans_all on platform.subscription_plans for all to service_role using (true) with check (true);
create policy service_contracts_all on platform.workspace_contracts for all to service_role using (true) with check (true);
create policy service_entitlements_all on platform.workspace_entitlements for all to service_role using (true) with check (true);
create policy service_usage_all on platform.entitlement_usage_ledger for all to service_role using (true) with check (true);

grant select on platform.subscription_plans, platform.workspace_contracts, platform.workspace_entitlements, platform.entitlement_usage_ledger to authenticated;
grant insert, update on platform.subscription_plans, platform.workspace_contracts, platform.workspace_entitlements to authenticated;
grant all on platform.subscription_plans, platform.workspace_contracts, platform.workspace_entitlements, platform.entitlement_usage_ledger to service_role;

commit;
