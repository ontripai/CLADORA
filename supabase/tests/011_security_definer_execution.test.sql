begin;
set local search_path = public, extensions;

select plan(4);

select ok(
  coalesce((
    select p.prosecdef
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
      and pg_catalog.pg_get_function_identity_arguments(p.oid) = ''
  ), true),
  'hosted RLS auto-enable function remains SECURITY DEFINER when present'
);

select ok(
  coalesce((
    select not has_function_privilege('anon', p.oid, 'EXECUTE')
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
      and pg_catalog.pg_get_function_identity_arguments(p.oid) = ''
  ), true),
  'anon cannot execute the hosted SECURITY DEFINER function directly'
);

select ok(
  coalesce((
    select not has_function_privilege('authenticated', p.oid, 'EXECUTE')
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
      and pg_catalog.pg_get_function_identity_arguments(p.oid) = ''
  ), true),
  'authenticated cannot execute the hosted SECURITY DEFINER function directly'
);

select ok(
  coalesce((
    select not has_function_privilege('service_role', p.oid, 'EXECUTE')
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
      and pg_catalog.pg_get_function_identity_arguments(p.oid) = ''
  ), true),
  'service_role cannot execute the hosted SECURITY DEFINER function directly'
);

select * from finish();
rollback;
