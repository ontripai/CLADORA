begin;

update platform.provisioning_runs set status = 'queued' where status = 'pending';
update platform.provisioning_tasks set status = 'queued' where status = 'pending';

alter table platform.provisioning_runs drop constraint if exists provisioning_runs_status_check;
alter table platform.provisioning_runs alter column status set default 'queued';
alter table platform.provisioning_runs add constraint provisioning_runs_status_check
  check (status in ('queued','running','completed','failed','cancelled'));

alter table platform.provisioning_tasks drop constraint if exists provisioning_tasks_status_check;
alter table platform.provisioning_tasks alter column status set default 'queued';
alter table platform.provisioning_tasks add constraint provisioning_tasks_status_check
  check (status in ('queued','running','completed','failed','skipped'));

create index if not exists provisioning_runs_browse_idx
  on platform.provisioning_runs (status, created_at desc, customer_workspace_id);
create unique index if not exists provisioning_runs_one_live_workspace_idx
  on platform.provisioning_runs (customer_workspace_id)
  where status in ('queued','running');

create or replace function app_private.can_read_provisioning_run(p_workspace_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, platform, app_private
as $$
  select app_private.has_platform_aal2() and (
    app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
    or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(p_workspace_id, 'workspace'))
    or (app_private.has_platform_role('PLATFORM_AUDITOR') and (
      app_private.has_customer_assignment(p_workspace_id, 'audit')
      or app_private.has_customer_assignment(p_workspace_id, 'workspace')
    ))
  );
$$;
revoke all on function app_private.can_read_provisioning_run(uuid) from public;
grant execute on function app_private.can_read_provisioning_run(uuid) to authenticated, service_role;

drop policy if exists provisioning_runs_select on platform.provisioning_runs;
create policy provisioning_runs_select on platform.provisioning_runs for select to authenticated
using (app_private.can_read_provisioning_run(customer_workspace_id));

drop policy if exists provisioning_tasks_select on platform.provisioning_tasks;
create policy provisioning_tasks_select on platform.provisioning_tasks for select to authenticated
using (exists (
  select 1 from platform.provisioning_runs r
  where r.id = run_id and app_private.can_read_provisioning_run(r.customer_workspace_id)
));

create or replace function app_private.enforce_provisioning_run_transition()
returns trigger language plpgsql
set search_path = pg_catalog, platform
as $$
begin
  if new.customer_workspace_id <> old.customer_workspace_id
     or new.idempotency_key <> old.idempotency_key
     or new.initiated_by is distinct from old.initiated_by
     or new.created_at <> old.created_at then
    raise exception 'provisioning_run_identity_immutable' using errcode = '55000';
  end if;
  if new.status <> old.status and not (
    (old.status = 'queued' and new.status in ('running','cancelled'))
    or (old.status = 'running' and new.status in ('completed','failed','cancelled'))
    or (old.status = 'failed' and new.status in ('queued','cancelled'))
  ) then raise exception 'invalid_provisioning_run_transition' using errcode = '22023'; end if;
  if new.status in ('completed','failed','cancelled') and new.completed_at is null then
    raise exception 'terminal_provisioning_run_requires_completed_at' using errcode = '22023';
  end if;
  return new;
end;
$$;

create or replace function app_private.enforce_provisioning_task_transition()
returns trigger language plpgsql
set search_path = pg_catalog, platform
as $$
begin
  if new.run_id <> old.run_id or new.task_order <> old.task_order
     or new.task_type <> old.task_type or new.created_at <> old.created_at then
    raise exception 'provisioning_task_identity_immutable' using errcode = '55000';
  end if;
  if new.status <> old.status and not (
    (old.status = 'queued' and new.status in ('running','skipped'))
    or (old.status = 'running' and new.status in ('completed','failed'))
    or (old.status = 'failed' and new.status = 'queued')
  ) then raise exception 'invalid_provisioning_task_transition' using errcode = '22023'; end if;
  return new;
end;
$$;

drop trigger if exists provisioning_runs_transition_guard on platform.provisioning_runs;
create trigger provisioning_runs_transition_guard before update on platform.provisioning_runs
for each row execute function app_private.enforce_provisioning_run_transition();
drop trigger if exists provisioning_tasks_transition_guard on platform.provisioning_tasks;
create trigger provisioning_tasks_transition_guard before update on platform.provisioning_tasks
for each row execute function app_private.enforce_provisioning_task_transition();

create or replace function platform.create_provisioning_run(
  p_workspace_id uuid, p_idempotency_key text, p_task_types text[])
returns platform.provisioning_runs language plpgsql security definer
set search_path = pg_catalog, platform, audit, app_private
as $$
declare
  v_run platform.provisioning_runs;
  v_contract platform.workspace_contracts;
  v_task text;
  v_order integer := 0;
  v_actor uuid := auth.uid();
  v_allowed constant text[] := array['validate_workspace','validate_contract','apply_plan','materialize_entitlements','initialize_workspace','verify_provisioning'];
begin
  if not app_private.has_platform_aal2() then raise exception 'mfa_required' using errcode='42501'; end if;
  if not (app_private.has_platform_role('PLATFORM_SUPER_ADMIN') or
    (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(p_workspace_id,'workspace')))
  then raise exception 'access_denied' using errcode='42501'; end if;
  if p_idempotency_key !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$' then raise exception 'invalid_idempotency_key' using errcode='22023'; end if;
  if coalesce(array_length(p_task_types,1),0) < 1 or array_length(p_task_types,1) > 12
     or exists(select 1 from unnest(p_task_types) t where not (t = any(v_allowed)))
     or (select count(*) <> count(distinct t) from unnest(p_task_types) t)
  then raise exception 'invalid_task_catalogue' using errcode='22023'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key,0));
  select * into v_run from platform.provisioning_runs where idempotency_key=p_idempotency_key;
  if found then
    if v_run.customer_workspace_id <> p_workspace_id then raise exception 'idempotency_key_conflict' using errcode='23505'; end if;
    return v_run;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_workspace_id::text,0));
  if not exists(select 1 from platform.customer_workspaces where id=p_workspace_id and lifecycle_status='PROVISIONING')
  then raise exception 'workspace_not_provisionable' using errcode='22023'; end if;
  select c.* into v_contract from platform.workspace_contracts c
  join platform.subscription_plans p on p.id=c.plan_id
  where c.customer_workspace_id=p_workspace_id and c.status='active'
    and c.start_date <= current_date and (c.end_date is null or c.end_date >= current_date)
    and p.status='active' and p.effective_from <= statement_timestamp()
    and (p.effective_until is null or p.effective_until > statement_timestamp())
  order by c.version desc limit 1 for update of c;
  if not found then raise exception 'active_contract_plan_required' using errcode='22023'; end if;
  if not exists(select 1 from platform.workspace_entitlements e
    where e.customer_workspace_id=p_workspace_id and e.contract_id=v_contract.id
      and e.valid_from <= statement_timestamp() and (e.valid_until is null or e.valid_until > statement_timestamp()))
  then raise exception 'active_entitlement_required' using errcode='22023'; end if;
  if exists(select 1 from platform.provisioning_runs where customer_workspace_id=p_workspace_id and status in ('queued','running'))
  then raise exception 'concurrent_provisioning_run' using errcode='23505'; end if;

  insert into platform.provisioning_runs(customer_workspace_id,idempotency_key,status,initiated_by,started_at,evidence_json)
  values(p_workspace_id,p_idempotency_key,'queued',v_actor,statement_timestamp(),
    jsonb_build_object('contract_id',v_contract.id,'plan_id',v_contract.plan_id,'eligibility_checked_at',statement_timestamp()))
  returning * into v_run;
  foreach v_task in array p_task_types loop
    insert into platform.provisioning_tasks(run_id,task_order,task_type,status)
    values(v_run.id,v_order,v_task,'queued'); v_order := v_order + 1;
  end loop;
  insert into audit.events(actor_id,actor_role,action,entity_type,entity_id,after_snapshot,reason,occurred_at)
  values(v_actor,'PLATFORM_CONTROL_PLANE','PROVISIONING_RUN_CREATED','provisioning_run',v_run.id,
    jsonb_build_object('workspace_id',p_workspace_id,'idempotency_key',p_idempotency_key,'task_count',array_length(p_task_types,1)),
    'Eligible workspace provisioning queued',statement_timestamp());
  return v_run;
end;
$$;

create or replace function platform.list_provisionable_workspaces()
returns table(workspace_id uuid, workspace_type platform.workspace_type, commercial_owner text, environment platform.workspace_environment)
language sql stable security definer
set search_path = pg_catalog, platform, app_private
as $$
  select w.id,w.workspace_type,w.commercial_owner,w.environment
  from platform.customer_workspaces w
  where app_private.has_platform_aal2()
    and w.lifecycle_status='PROVISIONING'
    and (app_private.has_platform_role('PLATFORM_SUPER_ADMIN') or
      (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(w.id,'workspace')))
    and exists(select 1 from platform.workspace_contracts c join platform.subscription_plans p on p.id=c.plan_id
      where c.customer_workspace_id=w.id and c.status='active' and c.start_date<=current_date
        and (c.end_date is null or c.end_date>=current_date) and p.status='active'
        and p.effective_from<=statement_timestamp() and (p.effective_until is null or p.effective_until>statement_timestamp())
        and exists(select 1 from platform.workspace_entitlements e where e.customer_workspace_id=w.id and e.contract_id=c.id
          and e.valid_from<=statement_timestamp() and (e.valid_until is null or e.valid_until>statement_timestamp())))
    and not exists(select 1 from platform.provisioning_runs r where r.customer_workspace_id=w.id and r.status in ('queued','running'))
  order by w.created_at desc limit 100;
$$;

create or replace function platform.cancel_provisioning_run(p_run_id uuid, p_reason text)
returns platform.provisioning_runs language plpgsql security definer
set search_path = pg_catalog, platform, audit, app_private
as $$
declare v_run platform.provisioning_runs; v_before text; v_actor uuid:=auth.uid();
begin
  if not app_private.has_platform_aal2() then raise exception 'mfa_required' using errcode='42501'; end if;
  select * into v_run from platform.provisioning_runs where id=p_run_id for update;
  if not found then raise exception 'provisioning_run_not_found' using errcode='P0002'; end if;
  if not (app_private.has_platform_role('PLATFORM_SUPER_ADMIN') or
    (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(v_run.customer_workspace_id,'workspace')))
  then raise exception 'access_denied' using errcode='42501'; end if;
  if length(trim(coalesce(p_reason,''))) < 8 or length(p_reason)>500 then raise exception 'invalid_reason' using errcode='22023'; end if;
  if v_run.status not in ('queued','running','failed') then raise exception 'run_not_cancellable' using errcode='22023'; end if;
  v_before:=v_run.status;
  update platform.provisioning_runs set status='cancelled',completed_at=statement_timestamp(),failure_reason=trim(p_reason)
  where id=p_run_id returning * into v_run;
  update platform.provisioning_tasks set status='skipped',completed_at=statement_timestamp(),failure_reason='Run cancelled'
  where run_id=p_run_id and status='queued';
  insert into audit.events(actor_id,actor_role,action,entity_type,entity_id,before_snapshot,after_snapshot,reason,occurred_at)
  values(v_actor,'PLATFORM_CONTROL_PLANE','PROVISIONING_RUN_CANCELLED','provisioning_run',v_run.id,
    jsonb_build_object('status',v_before),jsonb_build_object('status','cancelled'),trim(p_reason),statement_timestamp());
  return v_run;
end;
$$;

create or replace function platform.retry_provisioning_task(p_task_id uuid, p_reason text)
returns platform.provisioning_tasks language plpgsql security definer
set search_path = pg_catalog, platform, audit, app_private
as $$
declare v_task platform.provisioning_tasks; v_run platform.provisioning_runs; v_actor uuid:=auth.uid();
begin
  if not app_private.has_platform_aal2() then raise exception 'mfa_required' using errcode='42501'; end if;
  select * into v_task from platform.provisioning_tasks where id=p_task_id for update;
  if not found then raise exception 'provisioning_task_not_found' using errcode='P0002'; end if;
  select * into v_run from platform.provisioning_runs where id=v_task.run_id for update;
  if not (app_private.has_platform_role('PLATFORM_SUPER_ADMIN') or
    (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(v_run.customer_workspace_id,'workspace')))
  then raise exception 'access_denied' using errcode='42501'; end if;
  if length(trim(coalesce(p_reason,''))) < 8 or length(p_reason)>500 then raise exception 'invalid_reason' using errcode='22023'; end if;
  if v_task.status <> 'failed' or v_run.status <> 'failed' then raise exception 'failed_task_and_run_required' using errcode='22023'; end if;
  if exists(select 1 from platform.provisioning_runs where customer_workspace_id=v_run.customer_workspace_id and id<>v_run.id and status in ('queued','running'))
  then raise exception 'concurrent_provisioning_run' using errcode='23505'; end if;
  update platform.provisioning_tasks set status='queued',attempt_count=attempt_count+1,started_at=null,completed_at=null,failure_reason=null
  where id=p_task_id returning * into v_task;
  update platform.provisioning_runs set status='queued',completed_at=null,failure_reason=null where id=v_run.id;
  insert into audit.events(actor_id,actor_role,action,entity_type,entity_id,before_snapshot,after_snapshot,reason,occurred_at)
  values(v_actor,'PLATFORM_CONTROL_PLANE','PROVISIONING_TASK_RETRIED','provisioning_task',v_task.id,
    jsonb_build_object('status','failed'),jsonb_build_object('status','queued','attempt_count',v_task.attempt_count),trim(p_reason),statement_timestamp());
  return v_task;
end;
$$;

revoke insert,update,delete on platform.provisioning_runs,platform.provisioning_tasks from authenticated;
revoke all on function platform.create_provisioning_run(uuid,text,text[]) from public;
revoke all on function platform.list_provisionable_workspaces() from public;
revoke all on function platform.cancel_provisioning_run(uuid,text) from public;
revoke all on function platform.retry_provisioning_task(uuid,text) from public;
grant execute on function platform.create_provisioning_run(uuid,text,text[]),
  platform.list_provisionable_workspaces(),platform.cancel_provisioning_run(uuid,text),
  platform.retry_provisioning_task(uuid,text) to authenticated,service_role;

comment on function app_private.can_read_provisioning_run(uuid) is 'AAL2 assignment-scoped provisioning visibility for Super Admin, Operations, and Auditor.';
comment on function platform.create_provisioning_run(uuid,text,text[]) is 'Queues an idempotent run only after workspace, contract, plan, and entitlement eligibility checks.';

commit;
