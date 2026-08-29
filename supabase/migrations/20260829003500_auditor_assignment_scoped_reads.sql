begin;

alter table platform.platform_customer_assignments
  drop constraint if exists platform_customer_assignments_scope_type_check;

alter table platform.platform_customer_assignments
  add constraint platform_customer_assignments_scope_type_check
  check (scope_type in ('workspace', 'commercial', 'technical', 'support', 'audit'));

create or replace function app_private.can_access_platform_workspace(
  p_workspace_id uuid
)
returns boolean
language sql stable security definer
set search_path = pg_catalog, platform
as $$
  select (
    app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
    or (
      app_private.has_platform_role('PLATFORM_AUDITOR')
      and app_private.has_customer_assignment(p_workspace_id, 'audit')
    )
    or (
      app_private.has_platform_role('PLATFORM_OPERATIONS')
      and app_private.has_customer_assignment(p_workspace_id, 'workspace')
    )
    or (
      app_private.has_platform_role('PLATFORM_FINANCE')
      and app_private.has_customer_assignment(p_workspace_id, 'commercial')
    )
    or (
      app_private.has_platform_role('PLATFORM_SUPPORT')
      and app_private.has_customer_assignment(p_workspace_id, 'support')
    )
  );
$$;
revoke all on function app_private.can_access_platform_workspace(uuid) from public;
grant execute on function app_private.can_access_platform_workspace(uuid) to authenticated, service_role;

drop policy if exists customer_workspaces_select on platform.customer_workspaces;
create policy customer_workspaces_select on platform.customer_workspaces for select to authenticated
using (app_private.can_access_platform_workspace(id));

drop policy if exists platform_customer_assignments_select on platform.platform_customer_assignments;
create policy platform_customer_assignments_select on platform.platform_customer_assignments for select to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or (
    app_private.has_platform_role('PLATFORM_AUDITOR')
    and app_private.has_customer_assignment(customer_workspace_id, 'audit')
  )
  or (
    app_private.has_platform_role('PLATFORM_OPERATIONS')
    and app_private.has_customer_assignment(customer_workspace_id, 'workspace')
  )
  or (
    platform_user_id = app_private.current_platform_user_id()
    and (
      not app_private.has_platform_role('PLATFORM_AUDITOR')
      or scope_type in ('audit', 'workspace')
    )
  )
);

drop policy if exists workspace_contracts_select on platform.workspace_contracts;
create policy workspace_contracts_select on platform.workspace_contracts for select to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or (
    app_private.has_platform_role('PLATFORM_AUDITOR')
    and app_private.has_customer_assignment(customer_workspace_id, 'audit')
  )
  or (
    app_private.has_platform_role('PLATFORM_FINANCE')
    and app_private.has_customer_assignment(customer_workspace_id, 'commercial')
  )
);

drop policy if exists workspace_entitlements_select on platform.workspace_entitlements;
create policy workspace_entitlements_select on platform.workspace_entitlements for select to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or (
    app_private.has_platform_role('PLATFORM_AUDITOR')
    and app_private.has_customer_assignment(customer_workspace_id, 'audit')
  )
  or (
    app_private.has_platform_role('PLATFORM_FINANCE')
    and app_private.has_customer_assignment(customer_workspace_id, 'commercial')
  )
  or (
    app_private.has_platform_role('PLATFORM_OPERATIONS')
    and app_private.has_customer_assignment(customer_workspace_id, 'workspace')
  )
  or (
    app_private.has_platform_role('PLATFORM_SUPPORT')
    and app_private.has_customer_assignment(customer_workspace_id, 'technical')
  )
);

drop policy if exists entitlement_usage_select on platform.entitlement_usage_ledger;
create policy entitlement_usage_select on platform.entitlement_usage_ledger for select to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or (
    app_private.has_platform_role('PLATFORM_AUDITOR')
    and app_private.has_customer_assignment(customer_workspace_id, 'audit')
  )
  or (
    app_private.has_platform_role('PLATFORM_OPERATIONS')
    and app_private.has_customer_assignment(customer_workspace_id, 'workspace')
  )
);

commit;
