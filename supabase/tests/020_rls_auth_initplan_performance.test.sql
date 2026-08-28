begin;
set local search_path = public, extensions;

select plan(15);

select ok((
  select qual like '%( SELECT auth.uid() AS uid)%'
  from pg_policies
  where schemaname = 'identity' and tablename = 'profiles' and policyname = 'profiles_self_read'
), 'profile read policy caches auth.uid once per statement');

select ok((
  select qual like '%( SELECT auth.uid() AS uid)%'
  from pg_policies
  where schemaname = 'identity' and tablename = 'profiles' and policyname = 'profiles_self_update'
), 'profile update USING policy caches auth.uid once per statement');

select ok((
  select with_check like '%( SELECT auth.uid() AS uid)%'
  from pg_policies
  where schemaname = 'identity' and tablename = 'profiles' and policyname = 'profiles_self_update'
), 'profile update WITH CHECK policy caches auth.uid once per statement');

select ok((
  select qual like '%( SELECT auth.uid() AS uid)%'
    and qual like '%active_tenant_id%'
  from pg_policies
  where schemaname = 'identity' and tablename = 'memberships' and policyname = 'memberships_self_read'
), 'membership policy caches auth.uid and preserves tenant scope');

select ok((
  select qual like '%( SELECT auth.uid() AS uid)%'
    and qual like '%active_tenant_id%'
  from pg_policies
  where schemaname = 'utilities' and tablename = 'review_decisions' and policyname = 'review_decisions_self_read'
), 'review decision policy caches auth.uid and preserves tenant scope');

select ok((
  select qual like '%( SELECT auth.uid() AS uid)%'
    and qual like '%active_tenant_id%'
  from pg_policies
  where schemaname = 'documents' and tablename = 'access_events' and policyname = 'access_events_self_read'
), 'document access policy caches auth.uid and preserves tenant scope');

select ok((
  select count(*) = 5
  from pg_policies
  where (schemaname, tablename, policyname) in (
    ('identity', 'profiles', 'profiles_self_read'),
    ('identity', 'profiles', 'profiles_self_update'),
    ('identity', 'memberships', 'memberships_self_read'),
    ('utilities', 'review_decisions', 'review_decisions_self_read'),
    ('documents', 'access_events', 'access_events_self_read')
  )
    and 'authenticated' = any(roles)
), 'all five policies remain scoped to authenticated callers');

select ok((
  select count(*) = 4
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where (n.nspname, c.relname) in (
    ('identity', 'profiles'),
    ('identity', 'memberships'),
    ('utilities', 'review_decisions'),
    ('documents', 'access_events')
  )
    and c.relrowsecurity
), 'all four affected tables retain row-level security');

do $$
declare
  v_actor uuid := 'e1000000-0000-0000-0000-000000000001';
  v_other uuid := 'e1000000-0000-0000-0000-000000000002';
  v_tenant uuid := 'e2000000-0000-0000-0000-000000000001';
  v_other_tenant uuid := 'e2000000-0000-0000-0000-000000000002';
  v_role uuid := 'e3000000-0000-0000-0000-000000000001';
begin
  insert into auth.users (id, email, email_confirmed_at) values
    (v_actor, 'rls.actor@cladora.test', statement_timestamp()),
    (v_other, 'rls.other@cladora.test', statement_timestamp());
  insert into platform.tenants (id, legal_name, registration_number) values
    (v_tenant, 'RLS Actor Tenant', 'RO-RLS-ACTOR'),
    (v_other_tenant, 'RLS Other Tenant', 'RO-RLS-OTHER');
  insert into identity.roles (id, tenant_id, code, name, is_system)
    values (v_role, null, 'RLS_TEST_MEMBER', 'RLS Test Member', true);
  insert into identity.profiles (user_id, display_name) values
    (v_actor, 'RLS Actor'),
    (v_other, 'RLS Other');
  insert into identity.memberships (tenant_id, user_id, role_id, status) values
    (v_tenant, v_actor, v_role, 'active'),
    (v_other_tenant, v_actor, v_role, 'active'),
    (v_tenant, v_other, v_role, 'active');
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e1000000-0000-0000-0000-000000000001","role":"authenticated","active_tenant_id":"e2000000-0000-0000-0000-000000000001"}',
  true
);

select ok((select count(*) = 1 from identity.profiles), 'authenticated actor can read only their own profile');
select ok((select count(*) = 0 from identity.profiles where user_id = 'e1000000-0000-0000-0000-000000000002'), 'authenticated actor cannot read another profile');
select ok((select count(*) = 1 from identity.memberships), 'authenticated actor can read only their membership in the active tenant');
select ok((select count(*) = 0 from identity.memberships where tenant_id = 'e2000000-0000-0000-0000-000000000002'), 'membership policy still denies the actor cross-tenant access');
select lives_ok(
  $$update identity.profiles set display_name = 'RLS Actor Updated' where user_id = 'e1000000-0000-0000-0000-000000000001'$$,
  'authenticated actor can still update their own profile'
);
select lives_ok(
  $sql$update identity.profiles set display_name = 'Forbidden Update' where user_id = 'e1000000-0000-0000-0000-000000000002'$sql$,
  'attempting to update another profile is safely filtered by RLS'
);

reset role;
select ok(
  (select display_name = 'RLS Actor Updated' from identity.profiles where user_id = 'e1000000-0000-0000-0000-000000000001')
  and
  (select display_name = 'RLS Other' from identity.profiles where user_id = 'e1000000-0000-0000-0000-000000000002'),
  'self-update persisted while the cross-user update changed no row'
);

select * from finish();
rollback;
