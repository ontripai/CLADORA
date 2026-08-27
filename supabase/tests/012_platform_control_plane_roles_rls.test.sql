begin;
set local search_path = public, extensions;

select plan(24);

select has_table('platform','platform_users','platform_users table exists');
select has_table('platform','platform_role_assignments','platform_role_assignments table exists');
select has_table('platform','customer_workspaces','customer_workspaces table exists');
select has_table('platform','platform_customer_assignments','platform_customer_assignments table exists');
select has_table('platform','subscription_plans','subscription_plans table exists');
select has_table('platform','workspace_contracts','workspace_contracts table exists');
select has_table('platform','workspace_entitlements','workspace_entitlements table exists');
select has_table('platform','entitlement_usage_ledger','entitlement_usage_ledger table exists');
select has_table('platform','provisioning_runs','provisioning_runs table exists');
select has_table('platform','provisioning_tasks','provisioning_tasks table exists');
select has_table('platform','support_access_requests','support_access_requests table exists');
select has_table('platform','support_access_grants','support_access_grants table exists');

select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='platform_users'),'platform_users RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='platform_role_assignments'),'platform_role_assignments RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='customer_workspaces'),'customer_workspaces RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='platform_customer_assignments'),'platform_customer_assignments RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='subscription_plans'),'subscription_plans RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='workspace_contracts'),'workspace_contracts RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='workspace_entitlements'),'workspace_entitlements RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='entitlement_usage_ledger'),'entitlement_usage_ledger RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='provisioning_runs'),'provisioning_runs RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='provisioning_tasks'),'provisioning_tasks RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='support_access_requests'),'support_access_requests RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='platform' and c.relname='support_access_grants'),'support_access_grants RLS enabled');

select * from finish();
rollback;
