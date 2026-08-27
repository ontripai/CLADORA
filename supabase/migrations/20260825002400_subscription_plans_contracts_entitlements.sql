begin;

create table platform.subscription_plans (
  id text primary key,
  plan_code text not null,
  version integer not null default 1 check (version > 0),
  display_name text not null,
  status text not null default 'active' check (status in ('active', 'deprecated', 'retired')),
  feature_catalogue jsonb not null default '[]'::jsonb,
  limit_schema jsonb not null default '{}'::jsonb,
  effective_from timestamptz not null default statement_timestamp(),
  effective_until timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  unique (plan_code, version)
);

create table platform.workspace_contracts (
  id uuid primary key default gen_random_uuid(),
  customer_workspace_id uuid not null references platform.customer_workspaces(id) on delete cascade,
  plan_id text references platform.subscription_plans(id) on delete restrict,
  contract_ref text not null,
  version integer not null default 1 check (version > 0),
  currency text not null default 'EUR' check (currency in ('EUR', 'RON', 'USD')),
  status text not null default 'draft' check (status in ('draft', 'signed', 'active', 'suspended', 'expired', 'terminated')),
  start_date date not null,
  end_date date,
  signed_at timestamptz,
  activated_at timestamptz,
  commercial_terms jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default statement_timestamp(),
  unique (contract_ref, version)
);

create index workspace_contracts_workspace_idx on platform.workspace_contracts (customer_workspace_id, status);

create table platform.workspace_entitlements (
  id uuid primary key default gen_random_uuid(),
  customer_workspace_id uuid not null references platform.customer_workspaces(id) on delete cascade,
  contract_id uuid references platform.workspace_contracts(id) on delete set null,
  entitlement_key text not null,
  value_type text not null check (value_type in ('numeric', 'boolean', 'string', 'array', 'json')),
  numeric_value numeric,
  boolean_value boolean,
  text_value text,
  json_value jsonb,
  valid_from timestamptz not null default statement_timestamp(),
  valid_until timestamptz,
  override_value_json jsonb,
  override_reason text,
  override_expires_at timestamptz,
  override_approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  unique (customer_workspace_id, entitlement_key)
);

create index workspace_entitlements_lookup_idx on platform.workspace_entitlements (customer_workspace_id, entitlement_key);

create table platform.entitlement_usage_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_workspace_id uuid not null references platform.customer_workspaces(id) on delete cascade,
  entitlement_key text not null,
  delta numeric not null,
  idempotency_key text,
  reason text not null,
  recorded_by uuid references auth.users(id) on delete set null,
  recorded_at timestamptz not null default statement_timestamp(),
  unique (customer_workspace_id, entitlement_key, idempotency_key)
);

create index entitlement_usage_ledger_calc_idx on platform.entitlement_usage_ledger
  (customer_workspace_id, entitlement_key, recorded_at);

create or replace function platform.enforce_entitlement_quota(
  p_workspace_id uuid,
  p_entitlement_key text,
  p_requested_quantity numeric,
  p_idempotency_key text default null,
  p_reason text default 'Standard consumption'
)
returns boolean
language plpgsql security definer
set search_path = pg_catalog, platform, audit, app_private
as $$
declare
  v_ent platform.workspace_entitlements;
  v_current_usage numeric;
  v_limit numeric;
  v_existing_id uuid;
  v_ws_status platform.workspace_lifecycle_status;
  v_actor_id uuid := auth.uid();
begin
  if p_requested_quantity is null or p_requested_quantity <= 0 then
    raise exception 'invalid_quantity: requested quantity must be strictly greater than zero'
      using errcode = '22023';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'invalid_reason: reason must not be empty'
      using errcode = '22023';
  end if;

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) = 0 then
    raise exception 'invalid_idempotency_key: idempotency key must not be blank'
      using errcode = '22023';
  end if;

  if auth.role() = 'authenticated' then
    if not (
      app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
      or (
        app_private.has_platform_role('PLATFORM_OPERATIONS')
        and app_private.has_customer_assignment(p_workspace_id, 'workspace')
      )
    ) then
      raise exception 'access_denied: caller lacks platform operations or super admin assignment for workspace %', p_workspace_id
        using errcode = '42501';
    end if;
  end if;

  select lifecycle_status into v_ws_status from platform.customer_workspaces
  where id = p_workspace_id;

  if not found then
    raise exception 'workspace_not_found: %', p_workspace_id
      using errcode = 'P0002';
  end if;

  if v_ws_status in ('TERMINATED', 'ARCHIVED', 'SUSPENDED') then
    raise exception 'workspace_inactive: cannot consume quota in lifecycle state %', v_ws_status
      using errcode = '22000';
  end if;

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
    v_actor_id,
    statement_timestamp()
  );

  return true;
end;
$$;
revoke all on function platform.enforce_entitlement_quota(uuid, text, numeric, text, text) from public;
grant execute on function platform.enforce_entitlement_quota(uuid, text, numeric, text, text) to authenticated, service_role;

create or replace function platform.create_workspace_contract(
  p_workspace_id uuid,
  p_contract_ref text,
  p_plan_id text,
  p_currency text default 'EUR',
  p_start_date date default current_date,
  p_end_date date default null,
  p_commercial_terms jsonb default '{}'::jsonb
)
returns platform.workspace_contracts
language plpgsql security definer
set search_path = pg_catalog, platform, audit, app_private
as $$
declare
  v_contract platform.workspace_contracts;
  v_actor_id uuid := auth.uid();
begin
  if not (
    app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
    or (app_private.has_platform_role('PLATFORM_FINANCE') and app_private.has_customer_assignment(p_workspace_id, 'commercial'))
  ) then
    raise exception 'access_denied: insufficient commercial privileges for workspace %', p_workspace_id
      using errcode = '42501';
  end if;

  if length(trim(coalesce(p_contract_ref, ''))) = 0 then
    raise exception 'invalid_contract_ref: contract reference must not be empty'
      using errcode = '22023';
  end if;

  if not exists (select 1 from platform.customer_workspaces where id = p_workspace_id) then
    raise exception 'workspace_not_found: %', p_workspace_id
      using errcode = 'P0002';
  end if;

  if p_plan_id is not null and not exists (select 1 from platform.subscription_plans where id = p_plan_id) then
    raise exception 'plan_not_found: %', p_plan_id
      using errcode = 'P0002';
  end if;

  insert into platform.workspace_contracts (
    customer_workspace_id,
    plan_id,
    contract_ref,
    version,
    currency,
    status,
    start_date,
    end_date,
    commercial_terms
  ) values (
    p_workspace_id,
    p_plan_id,
    trim(p_contract_ref),
    1,
    coalesce(p_currency, 'EUR'),
    'draft',
    coalesce(p_start_date, current_date),
    p_end_date,
    coalesce(p_commercial_terms, '{}'::jsonb)
  )
  returning * into v_contract;

  insert into audit.events (
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    after_snapshot,
    reason,
    occurred_at
  ) values (
    v_actor_id,
    'PLATFORM_CONTROL_PLANE',
    'WORKSPACE_CONTRACT_CREATED',
    'workspace_contract',
    v_contract.id,
    jsonb_build_object(
      'customer_workspace_id', v_contract.customer_workspace_id,
      'contract_ref', v_contract.contract_ref,
      'status', v_contract.status,
      'currency', v_contract.currency
    ),
    format('Created contract %s in draft status', v_contract.contract_ref),
    statement_timestamp()
  );

  return v_contract;
end;
$$;
revoke all on function platform.create_workspace_contract(uuid, text, text, text, date, date, jsonb) from public;
grant execute on function platform.create_workspace_contract(uuid, text, text, text, date, date, jsonb) to authenticated, service_role;

create or replace function platform.activate_workspace_contract(
  p_contract_id uuid,
  p_reason text default 'Contract executed and activated'
)
returns platform.workspace_contracts
language plpgsql security definer
set search_path = pg_catalog, platform, audit, app_private
as $$
declare
  v_contract platform.workspace_contracts;
  v_actor_id uuid := auth.uid();
  v_before_status text;
begin
  select * into v_contract from platform.workspace_contracts
  where id = p_contract_id
  for update;

  if not found then
    raise exception 'contract_not_found: %', p_contract_id
      using errcode = 'P0002';
  end if;

  if not (
    app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
    or (app_private.has_platform_role('PLATFORM_FINANCE') and app_private.has_customer_assignment(v_contract.customer_workspace_id, 'commercial'))
  ) then
    raise exception 'access_denied: insufficient commercial privileges for contract %', p_contract_id
      using errcode = '42501';
  end if;

  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'invalid_reason: activation reason must not be empty'
      using errcode = '22023';
  end if;

  v_before_status := v_contract.status;

  update platform.workspace_contracts
  set status = 'active',
      signed_at = coalesce(signed_at, statement_timestamp()),
      activated_at = statement_timestamp()
  where id = p_contract_id
  returning * into v_contract;

  insert into audit.events (
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    before_snapshot,
    after_snapshot,
    reason,
    occurred_at
  ) values (
    v_actor_id,
    'PLATFORM_CONTROL_PLANE',
    'WORKSPACE_CONTRACT_ACTIVATED',
    'workspace_contract',
    v_contract.id,
    jsonb_build_object('status', v_before_status),
    jsonb_build_object('status', v_contract.status, 'activated_at', v_contract.activated_at),
    p_reason,
    statement_timestamp()
  );

  return v_contract;
end;
$$;
revoke all on function platform.activate_workspace_contract(uuid, text) from public;
grant execute on function platform.activate_workspace_contract(uuid, text) to authenticated, service_role;

create or replace function platform.set_workspace_entitlement(
  p_workspace_id uuid,
  p_entitlement_key text,
  p_value_type text,
  p_numeric_value numeric default null,
  p_boolean_value boolean default null,
  p_text_value text default null,
  p_json_value jsonb default null,
  p_override_value_json jsonb default null,
  p_override_reason text default null,
  p_override_expires_at timestamptz default null
)
returns platform.workspace_entitlements
language plpgsql security definer
set search_path = pg_catalog, platform, audit
as $$
declare
  v_ent platform.workspace_entitlements;
  v_actor_id uuid := auth.uid();
  v_before_override jsonb;
begin
  if not (
    app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
    or (app_private.has_platform_role('PLATFORM_FINANCE') and app_private.has_customer_assignment(p_workspace_id, 'commercial'))
    or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(p_workspace_id, 'workspace'))
  ) then
    raise exception 'access_denied: insufficient privileges to configure entitlement for workspace %', p_workspace_id
      using errcode = '42501';
  end if;

  if length(trim(coalesce(p_entitlement_key, ''))) = 0 then
    raise exception 'invalid_key: entitlement_key must not be empty'
      using errcode = '22023';
  end if;

  if p_value_type not in ('numeric', 'boolean', 'string', 'array', 'json') then
    raise exception 'invalid_value_type: % is not a valid value_type', p_value_type
      using errcode = '22023';
  end if;

  if p_override_value_json is not null then
    if length(trim(coalesce(p_override_reason, ''))) = 0 then
      raise exception 'invalid_override: override reason must not be empty when override is set'
        using errcode = '22023';
    end if;

    if p_override_expires_at is not null and p_override_expires_at <= statement_timestamp() then
      raise exception 'invalid_override: override expiry must be in the future'
        using errcode = '22023';
    end if;
  end if;

  select override_value_json into v_before_override
  from platform.workspace_entitlements
  where customer_workspace_id = p_workspace_id and entitlement_key = p_entitlement_key;

  insert into platform.workspace_entitlements (
    customer_workspace_id,
    entitlement_key,
    value_type,
    numeric_value,
    boolean_value,
    text_value,
    json_value,
    override_value_json,
    override_reason,
    override_expires_at,
    override_approved_by,
    updated_at
  ) values (
    p_workspace_id,
    p_entitlement_key,
    p_value_type,
    p_numeric_value,
    p_boolean_value,
    p_text_value,
    p_json_value,
    p_override_value_json,
    p_override_reason,
    p_override_expires_at,
    case when p_override_value_json is not null then v_actor_id else null end,
    statement_timestamp()
  )
  on conflict (customer_workspace_id, entitlement_key) do update
  set
    value_type = excluded.value_type,
    numeric_value = excluded.numeric_value,
    boolean_value = excluded.boolean_value,
    text_value = excluded.text_value,
    json_value = excluded.json_value,
    override_value_json = excluded.override_value_json,
    override_reason = excluded.override_reason,
    override_expires_at = excluded.override_expires_at,
    override_approved_by = excluded.override_approved_by,
    updated_at = statement_timestamp()
  returning * into v_ent;

  insert into audit.events (
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    before_snapshot,
    after_snapshot,
    reason,
    occurred_at
  ) values (
    v_actor_id,
    'PLATFORM_CONTROL_PLANE',
    'WORKSPACE_ENTITLEMENT_SET',
    'workspace_entitlement',
    v_ent.id,
    jsonb_build_object('override', v_before_override),
    jsonb_build_object(
      'key', v_ent.entitlement_key,
      'value_type', v_ent.value_type,
      'numeric_value', v_ent.numeric_value,
      'override', v_ent.override_value_json
    ),
    coalesce(p_override_reason, 'Configured workspace entitlement'),
    statement_timestamp()
  );

  return v_ent;
end;
$$;
revoke all on function platform.set_workspace_entitlement(uuid, text, text, numeric, boolean, text, jsonb, jsonb, text, timestamptz) from public;
grant execute on function platform.set_workspace_entitlement(uuid, text, text, numeric, boolean, text, jsonb, jsonb, text, timestamptz) to authenticated, service_role;

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

create policy workspace_contracts_select on platform.workspace_contracts for select to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_AUDITOR')
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
grant all on platform.subscription_plans, platform.workspace_contracts, platform.workspace_entitlements, platform.entitlement_usage_ledger to service_role;

commit;
