begin;

create type identity.membership_status as enum ('invited','active','suspended','expired','revoked');
create type identity.scope_type as enum ('tenant','property','building','unit');

create table identity.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  locale text not null default 'ro' check (locale in ('ro','en','fa')),
  timezone text not null default 'Europe/Bucharest',
  phone_encrypted text,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp()
);

create table identity.roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references platform.tenants(id) on delete restrict,
  code text not null,
  name text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default statement_timestamp(),
  unique nulls not distinct (tenant_id, code)
);

create table identity.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  resource text not null,
  action text not null,
  description text,
  unique (resource, action)
);

create table identity.role_permissions (
  role_id uuid not null references identity.roles(id) on delete cascade,
  permission_id uuid not null references identity.permissions(id) on delete cascade,
  effect platform.decision_effect not null default 'allow',
  primary key (role_id, permission_id)
);

create table identity.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references platform.tenants(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references identity.roles(id) on delete restrict,
  status identity.membership_status not null default 'invited',
  starts_at timestamptz not null default statement_timestamp(),
  ends_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  check (ends_at is null or ends_at > starts_at)
);
create unique index memberships_active_unique on identity.memberships (tenant_id,user_id,role_id) where status in ('invited','active');

create table identity.context_grants (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references identity.memberships(id) on delete cascade,
  tenant_id uuid not null references platform.tenants(id) on delete restrict,
  scope_type identity.scope_type not null,
  property_id uuid,
  building_id uuid,
  unit_id uuid,
  starts_at timestamptz not null default statement_timestamp(),
  ends_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  check (ends_at is null or ends_at > starts_at),
  check (
    (scope_type='tenant' and property_id is null and building_id is null and unit_id is null) or
    (scope_type='property' and property_id is not null and building_id is null and unit_id is null) or
    (scope_type='building' and building_id is not null and unit_id is null) or
    (scope_type='unit' and unit_id is not null)
  )
);

create table identity.delegations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references platform.tenants(id) on delete restrict,
  grantor_membership_id uuid not null references identity.memberships(id) on delete restrict,
  grantee_membership_id uuid not null references identity.memberships(id) on delete restrict,
  context_grant_id uuid not null references identity.context_grants(id) on delete restrict,
  permissions text[] not null default '{}',
  justification text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  check (grantor_membership_id <> grantee_membership_id),
  check (ends_at > starts_at)
);

create or replace function app_private.is_active_member(target_tenant uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, identity
as $$
  select exists (
    select 1 from identity.memberships m
    where m.tenant_id=target_tenant and m.user_id=auth.uid() and m.status='active'
      and m.starts_at <= statement_timestamp()
      and (m.ends_at is null or m.ends_at > statement_timestamp())
  );
$$;
revoke all on function app_private.is_active_member(uuid) from public;
grant execute on function app_private.is_active_member(uuid) to authenticated, service_role;

create or replace function app_private.active_membership_id()
returns uuid language sql stable security definer
set search_path = pg_catalog, identity
as $$
  select m.id from identity.memberships m
  where m.tenant_id=app_private.active_tenant_id() and m.user_id=auth.uid() and m.status='active'
    and m.starts_at <= statement_timestamp() and (m.ends_at is null or m.ends_at > statement_timestamp())
  order by m.starts_at desc limit 1;
$$;
revoke all on function app_private.active_membership_id() from public;
grant execute on function app_private.active_membership_id() to authenticated, service_role;

create trigger profiles_updated_at before update on identity.profiles for each row execute function app_private.set_updated_at();
create trigger memberships_updated_at before update on identity.memberships for each row execute function app_private.set_updated_at();

alter table identity.profiles enable row level security;
alter table identity.roles enable row level security;
alter table identity.permissions enable row level security;
alter table identity.role_permissions enable row level security;
alter table identity.memberships enable row level security;
alter table identity.context_grants enable row level security;
alter table identity.delegations enable row level security;

create policy profiles_self_read on identity.profiles for select to authenticated using (user_id=auth.uid());
create policy profiles_self_update on identity.profiles for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy roles_member_read on identity.roles for select to authenticated using (tenant_id is null or app_private.is_active_member(tenant_id));
create policy permissions_catalog_read on identity.permissions for select to authenticated using (true);
create policy role_permissions_member_read on identity.role_permissions for select to authenticated using (exists(select 1 from identity.roles r where r.id=role_id and (r.tenant_id is null or app_private.is_active_member(r.tenant_id))));
create policy memberships_self_read on identity.memberships for select to authenticated using (user_id=auth.uid() and tenant_id=app_private.active_tenant_id());
create policy context_grants_self_read on identity.context_grants for select to authenticated using (membership_id=app_private.active_membership_id() and tenant_id=app_private.active_tenant_id());
create policy delegations_party_read on identity.delegations for select to authenticated using (tenant_id=app_private.active_tenant_id() and (grantor_membership_id=app_private.active_membership_id() or grantee_membership_id=app_private.active_membership_id()));

grant select on identity.roles, identity.permissions, identity.role_permissions, identity.memberships, identity.context_grants, identity.delegations to authenticated;
grant select,update on identity.profiles to authenticated;
grant all on all tables in schema identity to service_role;
commit;
