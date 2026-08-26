begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;
create extension if not exists btree_gist with schema extensions;
create extension if not exists pgtap with schema extensions;

create schema if not exists app_private;
create schema if not exists platform;
create schema if not exists identity;
create schema if not exists portfolio;
create schema if not exists occupancy;

revoke all on schema app_private from public, anon, authenticated;
grant usage on schema platform, identity, portfolio, occupancy to authenticated;

create type platform.record_status as enum ('draft','active','suspended','archived');
create type platform.decision_effect as enum ('allow','deny');

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

create or replace function app_private.jwt_uuid(claim_name text)
returns uuid
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select nullif(auth.jwt() ->> claim_name, '')::uuid;
$$;

create or replace function app_private.active_tenant_id()
returns uuid
language sql
stable
security invoker
set search_path = pg_catalog
as $$ select app_private.jwt_uuid('active_tenant_id'); $$;

create or replace function app_private.active_context_id()
returns uuid
language sql
stable
security invoker
set search_path = pg_catalog
as $$ select app_private.jwt_uuid('active_context_id'); $$;

create or replace function app_private.is_service_role()
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog
as $$ select coalesce(auth.jwt() ->> 'role', '') = 'service_role'; $$;

comment on schema app_private is 'Non-exposed authorization and integrity helpers.';
commit;
