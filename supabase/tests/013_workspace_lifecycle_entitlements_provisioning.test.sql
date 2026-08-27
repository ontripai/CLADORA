begin;
set local search_path = public, extensions;

select plan(12);

select ok(
  (select not app_private.is_platform_user()),
  'anonymous/unauthenticated caller is not a platform user'
);

select ok(
  (select app_private.current_platform_user_id() is null),
  'current platform user ID is null for unauthenticated session'
);

select ok(
  (select not app_private.has_platform_role('PLATFORM_SUPER_ADMIN')),
  'unauthenticated session does not possess PLATFORM_SUPER_ADMIN role'
);

select ok(
  (select not app_private.has_platform_role('PLATFORM_OPERATIONS')),
  'unauthenticated session does not possess PLATFORM_OPERATIONS role'
);

select ok(
  (select not app_private.has_platform_role('PLATFORM_FINANCE')),
  'unauthenticated session does not possess PLATFORM_FINANCE role'
);

select ok(
  (select not app_private.has_platform_role('PLATFORM_SUPPORT')),
  'unauthenticated session does not possess PLATFORM_SUPPORT role'
);

select ok(
  (select not app_private.has_platform_role('PLATFORM_AUDITOR')),
  'unauthenticated session does not possess PLATFORM_AUDITOR role'
);

select ok(
  (select not app_private.has_customer_assignment('00000000-0000-0000-0000-000000000000'::uuid, 'workspace')),
  'unauthenticated session has no customer assignment to nil UUID'
);

select ok(
  (select not app_private.can_access_platform_workspace('00000000-0000-0000-0000-000000000000'::uuid)),
  'unauthenticated session cannot access any platform workspace'
);

select ok(
  to_regprocedure('platform.transition_workspace_lifecycle(uuid,platform.workspace_lifecycle_status,integer,text)') is not null,
  'transition_workspace_lifecycle function exists with safe signature'
);

select ok(
  to_regprocedure('platform.enforce_entitlement_quota(uuid,text,numeric,text,text)') is not null,
  'enforce_entitlement_quota function exists with transactional signature'
);

select ok(
  to_regprocedure('platform.create_provisioning_run(uuid,text,text[])') is not null,
  'create_provisioning_run function exists with idempotent signature'
);

select * from finish();
rollback;
