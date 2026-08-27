begin;

create table platform.provisioning_runs (
  id uuid primary key default gen_random_uuid(),
  customer_workspace_id uuid not null references platform.customer_workspaces(id) on delete cascade,
  idempotency_key text not null unique,
  status text not null default 'pending' check (status in ('pending','running','completed','failed','cancelled')),
  initiated_by uuid references auth.users(id) on delete restrict,
  started_at timestamptz not null default statement_timestamp(),
  completed_at timestamptz,
  failure_reason text,
  evidence_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default statement_timestamp()
);

create index provisioning_runs_workspace_idx on platform.provisioning_runs (customer_workspace_id, status);

create table platform.provisioning_tasks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references platform.provisioning_runs(id) on delete cascade,
  task_order integer not null check (task_order >= 0),
  task_type text not null,
  status text not null default 'pending' check (status in ('pending','running','completed','failed','skipped')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  failure_reason text,
  result_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default statement_timestamp(),
  unique (run_id, task_order)
);

create index provisioning_tasks_run_status_idx on platform.provisioning_tasks (run_id, status);

create table platform.support_access_requests (
  id uuid primary key default gen_random_uuid(),
  customer_workspace_id uuid not null references platform.customer_workspaces(id) on delete cascade,
  ticket_ref text not null,
  purpose text not null,
  requested_scope text not null default 'technical',
  sensitivity_level text not null default 'standard' check (sensitivity_level in ('standard','sensitive','critical')),
  requester_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'requested' check (status in ('requested','approved','rejected','expired','revoked')),
  created_at timestamptz not null default statement_timestamp()
);

create index support_access_requests_workspace_idx on platform.support_access_requests (customer_workspace_id, status);

create table platform.support_access_grants (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references platform.support_access_requests(id) on delete cascade,
  customer_workspace_id uuid not null references platform.customer_workspaces(id) on delete cascade,
  approver_id uuid not null references auth.users(id) on delete restrict,
  starts_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete restrict,
  revoke_reason text,
  activation_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default statement_timestamp(),
  check (expires_at > starts_at)
);

create index support_access_grants_lookup_idx on platform.support_access_grants (customer_workspace_id, starts_at, expires_at);

create or replace function platform.create_provisioning_run(
  p_workspace_id uuid,
  p_idempotency_key text,
  p_task_types text[]
)
returns platform.provisioning_runs
language plpgsql security definer
set search_path = pg_catalog, platform
as $$
declare
  v_run platform.provisioning_runs;
  v_task_type text;
  v_order integer := 0;
begin
  if not (
    app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
    or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(p_workspace_id, 'workspace'))
  ) then
    raise exception 'access_denied: insufficient privileges to create provisioning run'
      using errcode = '42501';
  end if;

  select * into v_run from platform.provisioning_runs
  where idempotency_key = p_idempotency_key;

  if found then
    return v_run;
  end if;

  insert into platform.provisioning_runs (
    customer_workspace_id,
    idempotency_key,
    status,
    initiated_by,
    started_at
  ) values (
    p_workspace_id,
    p_idempotency_key,
    'pending',
    auth.uid(),
    statement_timestamp()
  )
  returning * into v_run;

  foreach v_task_type in array p_task_types loop
    insert into platform.provisioning_tasks (
      run_id,
      task_order,
      task_type,
      status
    ) values (
      v_run.id,
      v_order,
      v_task_type,
      'pending'
    );
    v_order := v_order + 1;
  end loop;

  return v_run;
end;
$$;
revoke all on function platform.create_provisioning_run(uuid, text, text[]) from public;
grant execute on function platform.create_provisioning_run(uuid, text, text[]) to authenticated, service_role;

create or replace function platform.approve_support_access(
  p_request_id uuid,
  p_duration_interval interval default interval '4 hours',
  p_evidence jsonb default '{}'::jsonb
)
returns platform.support_access_grants
language plpgsql security definer
set search_path = pg_catalog, platform, audit
as $$
declare
  v_req platform.support_access_requests;
  v_grant platform.support_access_grants;
  v_actor uuid := auth.uid();
begin
  if not (
    app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
    or app_private.has_platform_role('PLATFORM_OPERATIONS')
  ) then
    raise exception 'access_denied: insufficient privileges to approve support access'
      using errcode = '42501';
  end if;

  select * into v_req from platform.support_access_requests
  where id = p_request_id and status = 'requested'
  for update;

  if not found then
    raise exception 'invalid_request: request % not found or not in requested state', p_request_id
      using errcode = 'P0002';
  end if;

  if v_req.requester_id = v_actor and not app_private.has_platform_role('PLATFORM_SUPER_ADMIN') then
    raise exception 'dual_control_violation: requester cannot approve their own support access grant'
      using errcode = '42501';
  end if;

  update platform.support_access_requests
  set status = 'approved'
  where id = p_request_id;

  insert into platform.support_access_grants (
    request_id,
    customer_workspace_id,
    approver_id,
    starts_at,
    expires_at,
    activation_evidence
  ) values (
    p_request_id,
    v_req.customer_workspace_id,
    v_actor,
    statement_timestamp(),
    statement_timestamp() + p_duration_interval,
    p_evidence
  )
  returning * into v_grant;

  insert into audit.events (
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    reason,
    occurred_at
  ) values (
    v_actor,
    'PLATFORM_CONTROL_PLANE',
    'SUPPORT_ACCESS_GRANT_APPROVED',
    'support_access_grant',
    v_grant.id,
    v_req.purpose,
    statement_timestamp()
  );

  return v_grant;
end;
$$;
revoke all on function platform.approve_support_access(uuid, interval, jsonb) from public;
grant execute on function platform.approve_support_access(uuid, interval, jsonb) to authenticated, service_role;

alter table platform.provisioning_runs enable row level security;
alter table platform.provisioning_tasks enable row level security;
alter table platform.support_access_requests enable row level security;
alter table platform.support_access_grants enable row level security;

create policy provisioning_runs_select on platform.provisioning_runs for select to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_AUDITOR')
  or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(customer_workspace_id, 'workspace'))
);

create policy provisioning_runs_manage on platform.provisioning_runs for all to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(customer_workspace_id, 'workspace'))
)
with check (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(customer_workspace_id, 'workspace'))
);

create policy provisioning_tasks_select on platform.provisioning_tasks for select to authenticated
using (
  exists (
    select 1 from platform.provisioning_runs r
    where r.id = run_id
      and (
        app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
        or app_private.has_platform_role('PLATFORM_AUDITOR')
        or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(r.customer_workspace_id, 'workspace'))
      )
  )
);

create policy provisioning_tasks_manage on platform.provisioning_tasks for all to authenticated
using (
  exists (
    select 1 from platform.provisioning_runs r
    where r.id = run_id
      and (
        app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
        or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(r.customer_workspace_id, 'workspace'))
      )
  )
)
with check (
  exists (
    select 1 from platform.provisioning_runs r
    where r.id = run_id
      and (
        app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
        or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(r.customer_workspace_id, 'workspace'))
      )
  )
);

create policy support_requests_select on platform.support_access_requests for select to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_AUDITOR')
  or app_private.has_platform_role('PLATFORM_SUPPORT')
  or app_private.has_platform_role('PLATFORM_OPERATIONS')
);

create policy support_requests_manage on platform.support_access_requests for all to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_SUPPORT')
)
with check (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_SUPPORT')
);

create policy support_grants_select on platform.support_access_grants for select to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_AUDITOR')
  or app_private.has_platform_role('PLATFORM_SUPPORT')
  or app_private.has_platform_role('PLATFORM_OPERATIONS')
);

create policy support_grants_manage on platform.support_access_grants for all to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_OPERATIONS')
)
with check (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_OPERATIONS')
);

create policy audit_events_platform_read on audit.events for select to authenticated
using (
  app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
  or app_private.has_platform_role('PLATFORM_AUDITOR')
);

create policy service_runs_all on platform.provisioning_runs for all to service_role using (true) with check (true);
create policy service_tasks_all on platform.provisioning_tasks for all to service_role using (true) with check (true);
create policy service_support_req_all on platform.support_access_requests for all to service_role using (true) with check (true);
create policy service_support_grants_all on platform.support_access_grants for all to service_role using (true) with check (true);

grant select on platform.provisioning_runs, platform.provisioning_tasks, platform.support_access_requests, platform.support_access_grants to authenticated;
grant insert, update on platform.provisioning_runs, platform.provisioning_tasks, platform.support_access_requests, platform.support_access_grants to authenticated;
grant all on platform.provisioning_runs, platform.provisioning_tasks, platform.support_access_requests, platform.support_access_grants to service_role;

commit;
