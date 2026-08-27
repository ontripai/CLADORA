begin;

-- Cover foreign keys used by the Platform Control Plane and shared audit stream.
create index if not exists audit_events_actor_id_idx
  on audit.events (actor_id);

create index if not exists entitlement_usage_ledger_recorded_by_idx
  on platform.entitlement_usage_ledger (recorded_by);

create index if not exists platform_customer_assignments_assigned_by_idx
  on platform.platform_customer_assignments (assigned_by);
create index if not exists platform_customer_assignments_workspace_fk_idx
  on platform.platform_customer_assignments (customer_workspace_id);
create index if not exists platform_customer_assignments_revoked_by_idx
  on platform.platform_customer_assignments (revoked_by);

create index if not exists platform_role_assignments_granted_by_idx
  on platform.platform_role_assignments (granted_by);
create index if not exists platform_role_assignments_revoked_by_idx
  on platform.platform_role_assignments (revoked_by);

create index if not exists provisioning_runs_initiated_by_idx
  on platform.provisioning_runs (initiated_by);

create index if not exists support_access_grants_approver_id_idx
  on platform.support_access_grants (approver_id);
create index if not exists support_access_grants_revoked_by_idx
  on platform.support_access_grants (revoked_by);
create index if not exists support_access_requests_requester_id_idx
  on platform.support_access_requests (requester_id);

create index if not exists workspace_contracts_plan_id_idx
  on platform.workspace_contracts (plan_id);
create index if not exists workspace_entitlements_contract_id_idx
  on platform.workspace_entitlements (contract_id);
create index if not exists workspace_entitlements_override_approved_by_idx
  on platform.workspace_entitlements (override_approved_by);

-- Preserve read semantics while evaluating auth.uid() once per statement.
drop policy if exists platform_users_read on platform.platform_users;
create policy platform_users_read
on platform.platform_users
for select
to authenticated
using (
  auth_user_id = (select auth.uid())
  or app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_AUDITOR')
  or app_private.has_platform_role('PLATFORM_OPERATIONS')
);

-- Split ALL policies by mutation command so they do not overlap SELECT policies.
drop policy if exists platform_users_manage on platform.platform_users;
create policy platform_users_insert
on platform.platform_users
for insert
to authenticated
with check (app_private.has_platform_role('PLATFORM_SUPER_ADMIN'));

create policy platform_users_update
on platform.platform_users
for update
to authenticated
using (app_private.has_platform_role('PLATFORM_SUPER_ADMIN'))
with check (app_private.has_platform_role('PLATFORM_SUPER_ADMIN'));

create policy platform_users_delete
on platform.platform_users
for delete
to authenticated
using (app_private.has_platform_role('PLATFORM_SUPER_ADMIN'));

drop policy if exists platform_roles_manage on platform.platform_role_assignments;
create policy platform_roles_insert
on platform.platform_role_assignments
for insert
to authenticated
with check (app_private.has_platform_role('PLATFORM_SUPER_ADMIN'));

create policy platform_roles_update
on platform.platform_role_assignments
for update
to authenticated
using (app_private.has_platform_role('PLATFORM_SUPER_ADMIN'))
with check (app_private.has_platform_role('PLATFORM_SUPER_ADMIN'));

create policy platform_roles_delete
on platform.platform_role_assignments
for delete
to authenticated
using (app_private.has_platform_role('PLATFORM_SUPER_ADMIN'));

-- Consolidate authenticated audit SELECT policies with unchanged OR semantics.
drop policy if exists audit_self_read on audit.events;
drop policy if exists audit_events_platform_read on audit.events;
create policy audit_events_authenticated_read
on audit.events
for select
to authenticated
using (
  (
    tenant_id = app_private.active_tenant_id()
    and actor_id = (select auth.uid())
  )
  or app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_AUDITOR')
);

commit;
