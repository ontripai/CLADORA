begin;
select plan(10);

select has_table('public', 'marketing_leads', 'marketing_leads table exists');
select has_table('public', 'marketing_rate_limits', 'marketing_rate_limits table exists');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='marketing_leads'), 'marketing_leads has RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='marketing_rate_limits'), 'marketing_rate_limits has RLS enabled');
select ok(not has_table_privilege('anon', 'public.marketing_leads', 'SELECT'), 'anon cannot select marketing_leads');
select ok(not has_table_privilege('anon', 'public.marketing_leads', 'INSERT'), 'anon cannot insert marketing_leads');
select ok(not has_table_privilege('authenticated', 'public.marketing_leads', 'SELECT'), 'authenticated cannot select marketing_leads');
select ok(not has_table_privilege('authenticated', 'public.marketing_leads', 'INSERT'), 'authenticated cannot insert marketing_leads');
select ok(has_table_privilege('service_role', 'public.marketing_leads', 'SELECT'), 'service_role can select marketing_leads');
select ok(has_table_privilege('service_role', 'public.marketing_leads', 'INSERT'), 'service_role can insert marketing_leads');

select * from finish();
rollback;
