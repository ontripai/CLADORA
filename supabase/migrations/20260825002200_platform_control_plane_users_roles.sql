begin;

create type platform.platform_role_type as enum (
  'PLATFORM_SUPER_ADMIN',
  'PLATFORM_OPERATIONS',
  'PLATFORM_FINANCE',
  'PLATFORM_SUPPORT',
  'PLATFORM_AUDITOR'
);

create table platform.platform_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  employee_ref text not null unique,
  display_name text not null,
  status platform.record_status not null default 'active',
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  deactivated_at timestamptz
);

create table platform.platform_role_assignments (
  id uuid primary key default gen_random_uuid(),
  platform_user_id uuid not null references platform.platform_users(id) on delete cascade,
  role platform.platform_role_type not null,
  valid_from timestamptz not null default statement_timestamp(),
  valid_until timestamptz,
  status text not null default 'active' check (status in ('active','revoked','expired')),
  granted_by uuid references auth.users(id) on delete restrict,
  grant_reason text not null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete restrict,
  revoke_reason text,
  created_at timestamptz not null default statement_timestamp(),
  check (valid_until is null or valid_until > valid_from)
);

create unique index platform_role_assignments_active_idx on platform.platform_role_assignments (platform_user_id, role) where status = 'active';
create index platform_role_assignments_user_status_idx on platform.platform_role_assignments (platform_user_id, status, valid_from, valid_until);

create trigger platform_users_updated_at before update on platform.platform_users for each row execute function app_private.set_updated_at();

create or replace function app_private.current_platform_user_id()
returns uuid language sql stable security definer
set search_path = pg_catalog, platform
as $$
  select u.id from platform.platform_users u
  where u.auth_user_id = auth.uid()
    and u.status = 'active'
    and u.deactivated_at is null
  limit 1;
$$;
revoke all on function app_private.current_platform_user_id() from public;
grant execute on function app_private.current_platform_user_id() to authenticated, service_role;

create or replace function app_private.has_platform_role(required_role platform.platform_role_type)
returns boolean language sql stable security definer
set search_path = pg_catalog, platform
as $$
  select exists (
    select 1 from platform.platform_role_assignments ra
    join platform.platform_users pu on pu.id = ra.platform_user_id
    where pu.auth_user_id = auth.uid()
      and pu.status = 'active'
      and pu.deactivated_at is null
      and ra.role = required_role
      and ra.status = 'active'
      and ra.valid_from <= statement_timestamp()
      and (ra.valid_until is null or ra.valid_until > statement_timestamp())
  );
$$;
revoke all on function app_private.has_platform_role(platform.platform_role_type) from public;
grant execute on function app_private.has_platform_role(platform.platform_role_type) to authenticated, service_role;

create or replace function app_private.is_platform_user()
returns boolean language sql stable security definer
set search_path = pg_catalog, platform
as $$
  select app_private.current_platform_user_id() is not null;
$$;
revoke all on function app_private.is_platform_user() from public;
grant execute on function app_private.is_platform_user() to authenticated, service_role;

alter table platform.platform_users enable row level security;
alter table platform.platform_role_assignments enable row level security;

create policy platform_users_read on platform.platform_users for select to authenticated
using (
  auth_user_id = auth.uid()
  or app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_AUDITOR')
  or app_private.has_platform_role('PLATFORM_OPERATIONS')
);

create policy platform_users_manage on platform.platform_users for all to authenticated
using (app_private.has_platform_role('PLATFORM_SUPER_ADMIN'))
with check (app_private.has_platform_role('PLATFORM_SUPER_ADMIN'));

create policy platform_roles_read on platform.platform_role_assignments for select to authenticated
using (
  platform_user_id = app_private.current_platform_user_id()
  or app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_AUDITOR')
);

create policy platform_roles_manage on platform.platform_role_assignments for all to authenticated
using (app_private.has_platform_role('PLATFORM_SUPER_ADMIN'))
with check (app_private.has_platform_role('PLATFORM_SUPER_ADMIN'));

create policy service_platform_users_all on platform.platform_users for all to service_role using (true) with check (true);
create policy service_platform_role_assignments_all on platform.platform_role_assignments for all to service_role using (true) with check (true);

grant select on platform.platform_users, platform.platform_role_assignments to authenticated;
grant insert, update on platform.platform_users, platform.platform_role_assignments to authenticated;
grant all on platform.platform_users, platform.platform_role_assignments to service_role;

commit;
