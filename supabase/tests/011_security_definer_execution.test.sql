begin;
set local search_path = public, extensions;

select plan(4);

select ok(
  to_regprocedure('public.rls_auto_enable()') is not null,
  'RLS auto-enable event trigger function exists'
);

select ok(
  (select p.prosecdef
   from pg_catalog.pg_proc p
   join pg_catalog.pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname = 'rls_auto_enable'
     and pg_catalog.pg_get_function_identity_arguments(p.oid) = ''),
  'RLS auto-enable function remains SECURITY DEFINER for event-trigger execution'
);

select ok(
  not has_function_privilege('anon', 'public.rls_auto_enable()', 'EXECUTE'),
  'anon cannot execute the SECURITY DEFINER function directly'
);

select ok(
  not has_function_privilege('authenticated', 'public.rls_auto_enable()', 'EXECUTE'),
  'authenticated cannot execute the SECURITY DEFINER function directly'
);

select * from finish();
rollback;
