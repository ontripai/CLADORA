begin;

create or replace function app_private.try_uuid(p_value text)
returns uuid
language plpgsql immutable
set search_path = pg_catalog
as $$
begin
  return p_value::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

create or replace function app_private.redact_audit_json_internal(
  p_value jsonb,
  p_depth integer
)
returns jsonb
language plpgsql immutable
set search_path = pg_catalog, app_private
as $$
declare
  v_result jsonb;
begin
  if p_value is null then return null; end if;
  if p_depth >= 8 then return '"[TRUNCATED]"'::jsonb; end if;

  case jsonb_typeof(p_value)
    when 'object' then
      select coalesce(jsonb_object_agg(
        key,
        case
          when lower(key) ~ '(^|_)(password|passwd|passphrase|secret|token|refresh_token|access_token|session|session_id|captcha|challenge|authorization|cookie|api_key|apikey|private_key|service_role)(_|$)'
            then '"[REDACTED]"'::jsonb
          else app_private.redact_audit_json_internal(value, p_depth + 1)
        end
      ), '{}'::jsonb)
      into v_result
      from jsonb_each(p_value);
      return v_result;
    when 'array' then
      select coalesce(jsonb_agg(app_private.redact_audit_json_internal(value, p_depth + 1)), '[]'::jsonb)
      into v_result
      from jsonb_array_elements(p_value);
      return v_result;
    else
      return p_value;
  end case;
end;
$$;

create or replace function app_private.redact_audit_json(p_value jsonb)
returns jsonb
language sql immutable
set search_path = pg_catalog, app_private
as $$
  select app_private.redact_audit_json_internal(p_value, 0);
$$;

create or replace function app_private.redact_audit_text(p_value text)
returns text
language sql immutable
set search_path = pg_catalog
as $$
  select case
    when p_value is null then null
    when lower(p_value) ~ '(password|passwd|passphrase|secret|token|session|captcha|authorization|cookie|api[ _-]?key|private[ _-]?key|service[ _-]?role)'
      then '[REDACTED]'
    else left(p_value, 1000)
  end;
$$;

create or replace function app_private.audit_event_workspace_id(
  p_entity_type text,
  p_entity_id uuid,
  p_before_snapshot jsonb,
  p_after_snapshot jsonb
)
returns uuid
language plpgsql stable security definer
set search_path = pg_catalog, platform, app_private
as $$
declare
  v_workspace_id uuid;
  v_snapshot jsonb := coalesce(p_after_snapshot, '{}'::jsonb) || coalesce(p_before_snapshot, '{}'::jsonb);
begin
  v_workspace_id := coalesce(
    app_private.try_uuid(v_snapshot ->> 'customer_workspace_id'),
    app_private.try_uuid(v_snapshot ->> 'workspace_id')
  );
  if v_workspace_id is not null then return v_workspace_id; end if;

  case p_entity_type
    when 'customer_workspace' then return p_entity_id;
    when 'workspace_contract' then
      select customer_workspace_id into v_workspace_id from platform.workspace_contracts where id = p_entity_id;
    when 'workspace_entitlement' then
      select customer_workspace_id into v_workspace_id from platform.workspace_entitlements where id = p_entity_id;
    when 'platform_customer_assignment' then
      select customer_workspace_id into v_workspace_id from platform.platform_customer_assignments where id = p_entity_id;
    when 'provisioning_run' then
      select customer_workspace_id into v_workspace_id from platform.provisioning_runs where id = p_entity_id;
    when 'provisioning_task' then
      select r.customer_workspace_id into v_workspace_id
      from platform.provisioning_tasks t
      join platform.provisioning_runs r on r.id = t.run_id
      where t.id = p_entity_id;
    when 'support_access_request' then
      select customer_workspace_id into v_workspace_id from platform.support_access_requests where id = p_entity_id;
    when 'support_access_grant' then
      select customer_workspace_id into v_workspace_id from platform.support_access_grants where id = p_entity_id;
    else null;
  end case;
  return v_workspace_id;
end;
$$;

create or replace function app_private.can_read_audit_event(
  p_workspace_id uuid,
  p_action text
)
returns boolean
language sql stable security definer
set search_path = pg_catalog, platform, app_private
as $$
  select app_private.has_platform_aal2() and (
    app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
    or (
      p_workspace_id is not null
      and app_private.has_platform_role('PLATFORM_AUDITOR')
      and (
        app_private.has_customer_assignment(p_workspace_id, 'audit')
        or app_private.has_customer_assignment(p_workspace_id, 'workspace')
      )
    )
    or (
      p_workspace_id is not null
      and app_private.has_platform_role('PLATFORM_OPERATIONS')
      and app_private.has_customer_assignment(p_workspace_id, 'workspace')
      and p_action ~ '^(CUSTOMER_WORKSPACE_|WORKSPACE_METADATA_|WORKSPACE_LIFECYCLE_|WORKSPACE_INVITATION_|PRIMARY_ADMIN_|PROVISIONING_|SUPPORT_ACCESS_)'
    )
    or (
      p_workspace_id is not null
      and app_private.has_platform_role('PLATFORM_FINANCE')
      and (
        app_private.has_customer_assignment(p_workspace_id, 'commercial')
        or app_private.has_customer_assignment(p_workspace_id, 'workspace')
      )
      and p_action ~ '^(WORKSPACE_CONTRACT_|WORKSPACE_ENTITLEMENT_|SUBSCRIPTION_PLAN_)'
    )
  );
$$;

drop policy if exists audit_events_authenticated_read on audit.events;
create policy audit_events_assignment_scoped_read
on audit.events
for select
to authenticated
using (
  app_private.can_read_audit_event(
    app_private.audit_event_workspace_id(entity_type, entity_id, before_snapshot, after_snapshot),
    action
  )
);

revoke select on audit.events from authenticated;

create index if not exists audit_events_action_time_idx
  on audit.events(action, occurred_at desc, id desc);
create index if not exists audit_events_entity_time_idx
  on audit.events(entity_type, occurred_at desc, id desc);

create or replace function platform.list_audit_events(
  p_limit integer default 20,
  p_offset integer default 0,
  p_query text default null,
  p_action text default null,
  p_actor_role text default null,
  p_entity_type text default null,
  p_workspace_id uuid default null,
  p_occurred_from timestamptz default null,
  p_occurred_until timestamptz default null
)
returns table (
  id bigint,
  workspace_id uuid,
  actor_id uuid,
  actor_display_name text,
  actor_role text,
  action text,
  entity_type text,
  entity_id uuid,
  request_id uuid,
  reason text,
  before_snapshot jsonb,
  after_snapshot jsonb,
  occurred_at timestamptz,
  total_count bigint
)
language sql stable security definer
set search_path = pg_catalog, audit, platform, app_private
as $$
  with resolved as (
    select
      e.*,
      app_private.audit_event_workspace_id(e.entity_type, e.entity_id, e.before_snapshot, e.after_snapshot) as workspace_id
    from audit.events e
  ),
  filtered as (
    select
      r.*,
      coalesce(u.display_name, r.actor_id::text, 'SYSTEM') as actor_display_name
    from resolved r
    left join platform.platform_users u on u.auth_user_id = r.actor_id
    where app_private.can_read_audit_event(r.workspace_id, r.action)
      and (p_query is null or p_query = '' or
        r.action ilike '%' || p_query || '%' or
        r.entity_type ilike '%' || p_query || '%' or
        coalesce(r.entity_id::text, '') ilike '%' || p_query || '%' or
        coalesce(r.actor_id::text, '') ilike '%' || p_query || '%' or
        coalesce(app_private.redact_audit_text(r.reason), '') ilike '%' || p_query || '%')
      and (p_action is null or r.action = p_action)
      and (p_actor_role is null or r.actor_role = p_actor_role)
      and (p_entity_type is null or r.entity_type = p_entity_type)
      and (p_workspace_id is null or r.workspace_id = p_workspace_id)
      and (p_occurred_from is null or r.occurred_at >= p_occurred_from)
      and (p_occurred_until is null or r.occurred_at < p_occurred_until)
  )
  select
    f.id,
    f.workspace_id,
    f.actor_id,
    f.actor_display_name,
    f.actor_role,
    f.action,
    f.entity_type,
    f.entity_id,
    f.request_id,
    app_private.redact_audit_text(f.reason),
    app_private.redact_audit_json(f.before_snapshot),
    app_private.redact_audit_json(f.after_snapshot),
    f.occurred_at,
    count(*) over() as total_count
  from filtered f
  order by f.occurred_at desc, f.id desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function app_private.try_uuid(text) from public;
revoke all on function app_private.redact_audit_json_internal(jsonb,integer) from public;
revoke all on function app_private.redact_audit_json(jsonb) from public;
revoke all on function app_private.redact_audit_text(text) from public;
revoke all on function app_private.audit_event_workspace_id(text,uuid,jsonb,jsonb) from public;
revoke all on function app_private.can_read_audit_event(uuid,text) from public;
revoke all on function platform.list_audit_events(integer,integer,text,text,text,text,uuid,timestamptz,timestamptz) from public;

grant execute on function app_private.audit_event_workspace_id(text,uuid,jsonb,jsonb) to authenticated, service_role;
grant execute on function app_private.can_read_audit_event(uuid,text) to authenticated, service_role;
grant execute on function platform.list_audit_events(integer,integer,text,text,text,text,uuid,timestamptz,timestamptz) to authenticated, service_role;

comment on function platform.list_audit_events(integer,integer,text,text,text,text,uuid,timestamptz,timestamptz)
is 'Read-only, AAL2 and assignment-scoped audit explorer with recursive snapshot redaction.';

commit;
