begin;

select plan(25);

select ok(to_regclass('audit.audit_events_actor_id_idx') is not null, 'audit actor foreign key is indexed');
select ok(to_regclass('platform.entitlement_usage_ledger_recorded_by_idx') is not null, 'entitlement usage recorder foreign key is indexed');
select ok(to_regclass('platform.platform_customer_assignments_assigned_by_idx') is not null, 'customer assignment grantor foreign key is indexed');
select ok(to_regclass('platform.platform_customer_assignments_workspace_fk_idx') is not null, 'customer assignment workspace foreign key is indexed');
select ok(to_regclass('platform.platform_customer_assignments_revoked_by_idx') is not null, 'customer assignment revoker foreign key is indexed');
select ok(to_regclass('platform.platform_role_assignments_granted_by_idx') is not null, 'platform role grantor foreign key is indexed');
select ok(to_regclass('platform.platform_role_assignments_revoked_by_idx') is not null, 'platform role revoker foreign key is indexed');
select ok(to_regclass('platform.provisioning_runs_initiated_by_idx') is not null, 'provisioning initiator foreign key is indexed');
select ok(to_regclass('platform.support_access_grants_approver_id_idx') is not null, 'support approver foreign key is indexed');
select ok(to_regclass('platform.support_access_grants_revoked_by_idx') is not null, 'support revoker foreign key is indexed');
select ok(to_regclass('platform.support_access_requests_requester_id_idx') is not null, 'support requester foreign key is indexed');
select ok(to_regclass('platform.workspace_contracts_plan_id_idx') is not null, 'contract plan foreign key is indexed');
select ok(to_regclass('platform.workspace_entitlements_contract_id_idx') is not null, 'entitlement contract foreign key is indexed');
select ok(to_regclass('platform.workspace_entitlements_override_approved_by_idx') is not null, 'entitlement override approver foreign key is indexed');

select ok(not exists (
  select 1 from pg_policies where schemaname='platform' and tablename='platform_users' and policyname='platform_users_manage'
), 'legacy platform users ALL policy is removed');
select ok(not exists (
  select 1 from pg_policies where schemaname='platform' and tablename='platform_role_assignments' and policyname='platform_roles_manage'
), 'legacy platform roles ALL policy is removed');
select ok(not exists (
  select 1 from pg_policies where schemaname='audit' and tablename='events' and policyname in ('audit_self_read','audit_events_platform_read')
), 'legacy overlapping audit SELECT policies are removed');

select ok(exists (
  select 1 from pg_policies where schemaname='platform' and tablename='platform_users' and policyname='platform_users_read' and cmd='SELECT'
), 'platform users consolidated SELECT policy exists');
select ok(exists (
  select 1 from pg_policies where schemaname='platform' and tablename='platform_role_assignments' and policyname='platform_roles_read' and cmd='SELECT'
), 'platform roles SELECT policy remains');
select ok(exists (
  select 1 from pg_policies where schemaname='audit' and tablename='events' and policyname='audit_events_authenticated_read' and cmd='SELECT'
), 'consolidated audit SELECT policy exists');

select ok((
  select qual like '%( SELECT auth.uid() AS uid)%'
  from pg_policies
  where schemaname='platform' and tablename='platform_users' and policyname='platform_users_read'
), 'platform users policy caches auth.uid per statement');
select ok((
  select qual like '%( SELECT auth.uid() AS uid)%'
  from pg_policies
  where schemaname='audit' and tablename='events' and policyname='audit_events_authenticated_read'
), 'audit policy caches auth.uid per statement');

select ok((
  select count(*) = 1
  from pg_policies
  where schemaname='platform' and tablename='platform_users'
    and 'authenticated'=any(roles) and cmd in ('ALL','SELECT')
), 'platform users has one authenticated permissive SELECT path');
select ok((
  select count(*) = 1
  from pg_policies
  where schemaname='platform' and tablename='platform_role_assignments'
    and 'authenticated'=any(roles) and cmd in ('ALL','SELECT')
), 'platform roles has one authenticated permissive SELECT path');
select ok((
  select count(*) = 1
  from pg_policies
  where schemaname='audit' and tablename='events'
    and 'authenticated'=any(roles) and cmd in ('ALL','SELECT')
), 'audit events has one authenticated permissive SELECT path');

select * from finish();
rollback;
