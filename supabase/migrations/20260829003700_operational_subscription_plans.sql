begin;

alter table platform.subscription_plans drop constraint if exists subscription_plans_status_check;
alter table platform.subscription_plans alter column status set default 'draft';
alter table platform.subscription_plans add constraint subscription_plans_status_check
  check (status in ('draft', 'active', 'deprecated', 'retired'));
alter table platform.subscription_plans add constraint subscription_plans_effective_window_check
  check (effective_until is null or effective_until > effective_from);

create index if not exists subscription_plans_browse_idx
  on platform.subscription_plans (status, plan_code, version desc);
create unique index if not exists subscription_plans_one_active_code_idx
  on platform.subscription_plans (plan_code) where status = 'active';
create index if not exists workspace_contracts_plan_workspace_idx
  on platform.workspace_contracts (plan_id, customer_workspace_id) where plan_id is not null;

create or replace function app_private.can_read_subscription_plan(p_plan_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, platform, app_private
as $$
  select app_private.has_platform_aal2() and (
    app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
    or exists (
      select 1 from platform.workspace_contracts c
      where c.plan_id = p_plan_id and (
        (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(c.customer_workspace_id, 'workspace'))
        or (app_private.has_platform_role('PLATFORM_FINANCE') and (
          app_private.has_customer_assignment(c.customer_workspace_id, 'commercial') or app_private.has_customer_assignment(c.customer_workspace_id, 'workspace')))
        or (app_private.has_platform_role('PLATFORM_AUDITOR') and (
          app_private.has_customer_assignment(c.customer_workspace_id, 'audit') or app_private.has_customer_assignment(c.customer_workspace_id, 'workspace')))
      )
    )
  );
$$;
revoke all on function app_private.can_read_subscription_plan(uuid) from public;
grant execute on function app_private.can_read_subscription_plan(uuid) to authenticated, service_role;

drop policy if exists subscription_plans_select on platform.subscription_plans;
create policy subscription_plans_select on platform.subscription_plans for select to authenticated
  using (app_private.can_read_subscription_plan(id));

create or replace function platform.get_plan_dependency_counts(p_plan_ids uuid[])
returns table(plan_id uuid, workspace_count bigint, contract_count bigint)
language sql stable security definer
set search_path = pg_catalog, platform, app_private
as $$
  select c.plan_id, count(distinct c.customer_workspace_id), count(*)
  from platform.workspace_contracts c
  where c.plan_id = any(p_plan_ids)
    and app_private.can_read_subscription_plan(c.plan_id)
    and (
      app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
      or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(c.customer_workspace_id, 'workspace'))
      or (app_private.has_platform_role('PLATFORM_FINANCE') and (app_private.has_customer_assignment(c.customer_workspace_id, 'commercial') or app_private.has_customer_assignment(c.customer_workspace_id, 'workspace')))
      or (app_private.has_platform_role('PLATFORM_AUDITOR') and (app_private.has_customer_assignment(c.customer_workspace_id, 'audit') or app_private.has_customer_assignment(c.customer_workspace_id, 'workspace')))
    )
  group by c.plan_id;
$$;
revoke all on function platform.get_plan_dependency_counts(uuid[]) from public;
grant execute on function platform.get_plan_dependency_counts(uuid[]) to authenticated, service_role;

create or replace function app_private.protect_published_plan()
returns trigger language plpgsql set search_path = pg_catalog, platform
as $$
begin
  if old.status <> 'draft' and (
    new.plan_code, new.version, new.display_name, new.feature_catalogue, new.limit_schema, new.effective_from
  ) is distinct from (
    old.plan_code, old.version, old.display_name, old.feature_catalogue, old.limit_schema, old.effective_from
  ) then raise exception 'published_plan_immutable' using errcode = '55000'; end if;
  if old.status = 'retired' and new is distinct from old then
    raise exception 'retired_plan_immutable' using errcode = '55000';
  end if;
  if old.status = 'active' and new.status not in ('active', 'retired') then
    raise exception 'invalid_plan_transition' using errcode = '22023';
  end if;
  if old.status = 'draft' and new.status not in ('draft', 'active') then
    raise exception 'invalid_plan_transition' using errcode = '22023';
  end if;
  if old.status = 'deprecated' and new.status not in ('deprecated', 'retired') then
    raise exception 'invalid_plan_transition' using errcode = '22023';
  end if;
  return new;
end;
$$;
drop trigger if exists subscription_plans_protect_published on platform.subscription_plans;
create trigger subscription_plans_protect_published before update on platform.subscription_plans
for each row execute function app_private.protect_published_plan();

create or replace function platform.create_subscription_plan_version(
  p_plan_code text, p_display_name text, p_feature_catalogue jsonb,
  p_limit_schema jsonb, p_effective_from timestamptz, p_effective_until timestamptz, p_reason text)
returns platform.subscription_plans language plpgsql security definer
set search_path = pg_catalog, platform, audit, app_private
as $$
declare v_plan platform.subscription_plans; v_version integer; v_code text := upper(trim(p_plan_code));
begin
  if not app_private.has_platform_role('PLATFORM_SUPER_ADMIN') then raise exception 'access_denied: Super Admin role required' using errcode='42501'; end if;
  if v_code !~ '^[A-Z][A-Z0-9_]{2,63}$' or length(trim(coalesce(p_display_name,''))) < 3 then raise exception 'invalid_plan_identity' using errcode='22023'; end if;
  if jsonb_typeof(p_feature_catalogue) <> 'array' or jsonb_typeof(p_limit_schema) <> 'object' then raise exception 'invalid_catalogue_schema' using errcode='22023'; end if;
  if p_effective_until is not null and p_effective_until <= p_effective_from then raise exception 'invalid_effective_window' using errcode='22023'; end if;
  if length(trim(coalesce(p_reason,''))) < 8 or length(p_reason) > 500 then raise exception 'invalid_reason' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_code, 0));
  select coalesce(max(version),0)+1 into v_version from platform.subscription_plans where plan_code=v_code;
  insert into platform.subscription_plans(plan_code,version,display_name,status,feature_catalogue,limit_schema,effective_from,effective_until)
  values(v_code,v_version,trim(p_display_name),'draft',p_feature_catalogue,p_limit_schema,p_effective_from,p_effective_until) returning * into v_plan;
  insert into audit.events(actor_id,actor_role,action,entity_type,entity_id,after_snapshot,reason,occurred_at)
  values(auth.uid(),'PLATFORM_SUPER_ADMIN','SUBSCRIPTION_PLAN_VERSION_CREATED','subscription_plan',v_plan.id,to_jsonb(v_plan),trim(p_reason),statement_timestamp());
  return v_plan;
end; $$;

create or replace function platform.activate_subscription_plan(p_plan_id uuid, p_reason text)
returns platform.subscription_plans language plpgsql security definer
set search_path = pg_catalog, platform, audit, app_private
as $$
declare v_plan platform.subscription_plans;
begin
  if not app_private.has_platform_role('PLATFORM_SUPER_ADMIN') then raise exception 'access_denied: Super Admin role required' using errcode='42501'; end if;
  if length(trim(coalesce(p_reason,''))) < 8 or length(p_reason)>500 then raise exception 'invalid_reason' using errcode='22023'; end if;
  select * into v_plan from platform.subscription_plans where id=p_plan_id and status='draft' for update;
  if not found then raise exception 'draft_plan_not_found' using errcode='P0002'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_plan.plan_code,0));
  if exists(select 1 from platform.subscription_plans p where p.plan_code=v_plan.plan_code and p.status='active' and p.id<>v_plan.id
    and tstzrange(p.effective_from,coalesce(p.effective_until,'infinity'),'[)') && tstzrange(v_plan.effective_from,coalesce(v_plan.effective_until,'infinity'),'[)'))
  then raise exception 'active_plan_version_overlap' using errcode='23P01'; end if;
  update platform.subscription_plans set status='active' where id=v_plan.id returning * into v_plan;
  insert into audit.events(actor_id,actor_role,action,entity_type,entity_id,before_snapshot,after_snapshot,reason,occurred_at)
  values(auth.uid(),'PLATFORM_SUPER_ADMIN','SUBSCRIPTION_PLAN_ACTIVATED','subscription_plan',v_plan.id,jsonb_build_object('status','draft'),jsonb_build_object('status','active'),trim(p_reason),statement_timestamp());
  return v_plan;
end; $$;

create or replace function platform.retire_subscription_plan(p_plan_id uuid, p_reason text)
returns platform.subscription_plans language plpgsql security definer
set search_path = pg_catalog, platform, audit, app_private
as $$
declare v_plan platform.subscription_plans;
begin
  if not app_private.has_platform_role('PLATFORM_SUPER_ADMIN') then raise exception 'access_denied: Super Admin role required' using errcode='42501'; end if;
  if length(trim(coalesce(p_reason,''))) < 8 or length(p_reason)>500 then raise exception 'invalid_reason' using errcode='22023'; end if;
  select * into v_plan from platform.subscription_plans where id=p_plan_id and status='active' for update;
  if not found then raise exception 'active_plan_not_found' using errcode='P0002'; end if;
  update platform.subscription_plans set status='retired', effective_until=greatest(effective_from + interval '1 microsecond', least(coalesce(effective_until,statement_timestamp()),statement_timestamp())) where id=v_plan.id returning * into v_plan;
  insert into audit.events(actor_id,actor_role,action,entity_type,entity_id,before_snapshot,after_snapshot,reason,occurred_at)
  values(auth.uid(),'PLATFORM_SUPER_ADMIN','SUBSCRIPTION_PLAN_RETIRED','subscription_plan',v_plan.id,jsonb_build_object('status','active'),jsonb_build_object('status','retired','effective_until',v_plan.effective_until),trim(p_reason),statement_timestamp());
  return v_plan;
end; $$;

revoke insert, update, delete on platform.subscription_plans from authenticated;
revoke all on function platform.create_subscription_plan_version(text,text,jsonb,jsonb,timestamptz,timestamptz,text) from public;
revoke all on function platform.activate_subscription_plan(uuid,text) from public;
revoke all on function platform.retire_subscription_plan(uuid,text) from public;
grant execute on function platform.create_subscription_plan_version(text,text,jsonb,jsonb,timestamptz,timestamptz,text), platform.activate_subscription_plan(uuid,text), platform.retire_subscription_plan(uuid,text) to authenticated, service_role;

comment on function app_private.can_read_subscription_plan(uuid) is 'AAL2 and assignment-scoped plan visibility; Super Admin sees the complete catalogue.';
comment on function platform.create_subscription_plan_version(text,text,jsonb,jsonb,timestamptz,timestamptz,text) is 'Super Admin-only immutable plan version creation with audit evidence.';
commit;
