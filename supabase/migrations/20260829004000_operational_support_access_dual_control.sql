begin;

alter table platform.support_access_requests add column if not exists requested_duration_minutes integer;
alter table platform.support_access_requests add column if not exists request_evidence jsonb not null default '{}'::jsonb;
alter table platform.support_access_requests drop constraint if exists support_access_requests_status_check;
alter table platform.support_access_requests add constraint support_access_requests_status_check
  check (status in ('requested','approved','rejected','cancelled','expired','revoked'));
alter table platform.support_access_requests add constraint support_access_duration_check
  check (requested_duration_minutes between 15 and 240);
alter table platform.support_access_requests add constraint support_access_ticket_length_check
  check (char_length(ticket_ref) between 3 and 100);
alter table platform.support_access_requests add constraint support_access_purpose_length_check
  check (char_length(purpose) between 8 and 500);
alter table platform.support_access_requests add constraint support_access_scope_check
  check (requested_scope in ('diagnostic','technical','data_review'));
alter table platform.support_access_requests add constraint support_access_request_evidence_size_check
  check (octet_length(request_evidence::text) between 2 and 4096);
update platform.support_access_requests set requested_duration_minutes=60 where requested_duration_minutes is null;
alter table platform.support_access_requests alter column requested_duration_minutes set default 60;
alter table platform.support_access_requests alter column requested_duration_minutes set not null;
alter table platform.support_access_grants add constraint support_access_grant_evidence_size_check
  check (octet_length(activation_evidence::text) between 2 and 4096);

create index if not exists support_access_requests_browse_idx
  on platform.support_access_requests(status, created_at desc, customer_workspace_id);
create index if not exists support_access_grants_browse_idx
  on platform.support_access_grants(expires_at desc, customer_workspace_id);

create or replace function app_private.can_read_support_access(p_workspace_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, platform, app_private
as $$
  select app_private.has_platform_aal2() and (
    app_private.has_platform_role('PLATFORM_SUPER_ADMIN')
    or (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(p_workspace_id,'workspace'))
    or (app_private.has_platform_role('PLATFORM_AUDITOR') and (
      app_private.has_customer_assignment(p_workspace_id,'audit')
      or app_private.has_customer_assignment(p_workspace_id,'workspace')
    ))
  );
$$;

drop policy if exists support_requests_select on platform.support_access_requests;
create policy support_requests_select on platform.support_access_requests for select to authenticated
using (app_private.can_read_support_access(customer_workspace_id));
drop policy if exists support_grants_select on platform.support_access_grants;
create policy support_grants_select on platform.support_access_grants for select to authenticated
using (app_private.can_read_support_access(customer_workspace_id));

revoke select on platform.support_access_requests, platform.support_access_grants from authenticated;

create or replace function platform.list_support_access(
  p_limit integer default 20, p_offset integer default 0, p_query text default null,
  p_status text default null, p_workspace_id uuid default null
)
returns table(
  request_id uuid, workspace_id uuid, workspace_label text, ticket_ref text, purpose text,
  requested_scope text, sensitivity_level text, requester_id uuid, requester_name text,
  request_status text, requested_duration_minutes integer, request_evidence jsonb,
  requested_at timestamptz, grant_id uuid, approver_id uuid, approver_name text,
  starts_at timestamptz, expires_at timestamptz, revoked_at timestamptz,
  revoked_by uuid, revoke_reason text, activation_evidence jsonb, effective_status text,
  total_count bigint
)
language sql stable security definer
set search_path = pg_catalog, platform, app_private
as $$
  with visible as (
    select r.*, g.id grant_id, g.approver_id, g.starts_at, g.expires_at, g.revoked_at,
      g.revoked_by, g.revoke_reason, g.activation_evidence,
      coalesce(w.commercial_owner, w.id::text) workspace_label,
      coalesce(requester.display_name, r.requester_id::text) requester_name,
      coalesce(approver.display_name, g.approver_id::text) approver_name,
      case when g.id is not null and g.revoked_at is not null then 'revoked'
           when g.id is not null and g.expires_at <= statement_timestamp() then 'expired'
           else r.status end effective_status
    from platform.support_access_requests r
    join platform.customer_workspaces w on w.id=r.customer_workspace_id
    left join platform.support_access_grants g on g.request_id=r.id
    left join platform.platform_users requester on requester.auth_user_id=r.requester_id
    left join platform.platform_users approver on approver.auth_user_id=g.approver_id
    where app_private.can_read_support_access(r.customer_workspace_id)
  ), filtered as (
    select * from visible v where
      (p_query is null or p_query='' or v.ticket_ref ilike '%'||p_query||'%'
       or v.purpose ilike '%'||p_query||'%' or v.workspace_label ilike '%'||p_query||'%')
      and (p_status is null or v.effective_status=p_status)
      and (p_workspace_id is null or v.customer_workspace_id=p_workspace_id)
  )
  select f.id, f.customer_workspace_id, f.workspace_label, f.ticket_ref,
    app_private.redact_audit_text(f.purpose), f.requested_scope, f.sensitivity_level,
    f.requester_id, f.requester_name, f.status, f.requested_duration_minutes,
    app_private.redact_audit_json(f.request_evidence), f.created_at, f.grant_id,
    f.approver_id, f.approver_name, f.starts_at, f.expires_at, f.revoked_at,
    f.revoked_by, app_private.redact_audit_text(f.revoke_reason),
    app_private.redact_audit_json(f.activation_evidence), f.effective_status,
    count(*) over()
  from filtered f order by f.created_at desc, f.id desc
  limit least(greatest(coalesce(p_limit,20),1),50) offset greatest(coalesce(p_offset,0),0);
$$;

create or replace function platform.list_support_workspaces()
returns table(workspace_id uuid, workspace_label text)
language sql stable security definer
set search_path = pg_catalog, platform, app_private
as $$
  select w.id, coalesce(w.commercial_owner,w.id::text)
  from platform.customer_workspaces w
  where app_private.has_platform_aal2() and (
    app_private.has_platform_role('PLATFORM_SUPER_ADMIN') or
    (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(w.id,'workspace'))
  ) order by w.created_at desc limit 200;
$$;

drop function if exists platform.request_support_access(uuid,text,text,text,text);
create function platform.request_support_access(
  p_workspace_id uuid, p_ticket_ref text, p_purpose text, p_requested_scope text,
  p_sensitivity_level text, p_duration_minutes integer, p_evidence jsonb
)
returns platform.support_access_requests language plpgsql security definer
set search_path = pg_catalog, platform, audit, app_private
as $$
declare v_req platform.support_access_requests; v_actor uuid:=auth.uid();
begin
  if not app_private.has_platform_aal2() then raise exception 'mfa_required' using errcode='42501'; end if;
  if not (app_private.has_platform_role('PLATFORM_SUPER_ADMIN') or
    (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(p_workspace_id,'workspace')))
  then raise exception 'access_denied' using errcode='42501'; end if;
  if char_length(trim(coalesce(p_ticket_ref,''))) not between 3 and 100 or
     char_length(trim(coalesce(p_purpose,''))) not between 8 and 500 or
     p_requested_scope not in ('diagnostic','technical','data_review') or
     p_sensitivity_level not in ('standard','sensitive','critical') or
     p_duration_minutes not between 15 and 240 or
     p_evidence is null or p_evidence='{}'::jsonb or octet_length(p_evidence::text)>4096
  then raise exception 'invalid_support_request' using errcode='22023'; end if;
  insert into platform.support_access_requests(customer_workspace_id,ticket_ref,purpose,requested_scope,
    sensitivity_level,requester_id,status,requested_duration_minutes,request_evidence)
  values(p_workspace_id,trim(p_ticket_ref),trim(p_purpose),p_requested_scope,p_sensitivity_level,
    v_actor,'requested',p_duration_minutes,app_private.redact_audit_json(p_evidence)) returning * into v_req;
  insert into audit.events(actor_id,actor_role,action,entity_type,entity_id,reason,after_snapshot,occurred_at)
  values(v_actor,'PLATFORM_CONTROL_PLANE','SUPPORT_ACCESS_REQUESTED','support_access_request',v_req.id,
    app_private.redact_audit_text(p_purpose),app_private.redact_audit_json(jsonb_build_object(
      'workspace_id',p_workspace_id,'ticket_ref',p_ticket_ref,'scope',p_requested_scope,
      'duration_minutes',p_duration_minutes,'evidence',p_evidence)),statement_timestamp());
  return v_req;
end; $$;

drop function if exists platform.approve_support_access(uuid,interval,jsonb);
create function platform.approve_support_access(p_request_id uuid,p_evidence jsonb)
returns platform.support_access_grants language plpgsql security definer
set search_path = pg_catalog, platform, audit, app_private
as $$
declare v_req platform.support_access_requests; v_grant platform.support_access_grants; v_actor uuid:=auth.uid();
begin
  if not app_private.has_platform_aal2() then raise exception 'mfa_required' using errcode='42501'; end if;
  select * into v_req from platform.support_access_requests where id=p_request_id for update;
  if not found or v_req.status<>'requested' then raise exception 'request_not_approvable' using errcode='P0002'; end if;
  if not (app_private.has_platform_role('PLATFORM_SUPER_ADMIN') or
    (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(v_req.customer_workspace_id,'workspace')))
  then raise exception 'access_denied' using errcode='42501'; end if;
  if v_req.requester_id=v_actor then raise exception 'dual_control_violation' using errcode='42501'; end if;
  if p_evidence is null or p_evidence='{}'::jsonb or octet_length(p_evidence::text)>4096
  then raise exception 'invalid_evidence' using errcode='22023'; end if;
  update platform.support_access_requests set status='approved' where id=p_request_id;
  insert into platform.support_access_grants(request_id,customer_workspace_id,approver_id,starts_at,expires_at,activation_evidence)
  values(p_request_id,v_req.customer_workspace_id,v_actor,statement_timestamp(),
    statement_timestamp()+make_interval(mins=>v_req.requested_duration_minutes),app_private.redact_audit_json(p_evidence))
  returning * into v_grant;
  insert into audit.events(actor_id,actor_role,action,entity_type,entity_id,reason,after_snapshot,occurred_at)
  values(v_actor,'PLATFORM_CONTROL_PLANE','SUPPORT_ACCESS_GRANT_APPROVED','support_access_grant',v_grant.id,
    'Independent dual-control approval',app_private.redact_audit_json(jsonb_build_object(
      'workspace_id',v_req.customer_workspace_id,'request_id',p_request_id,'expires_at',v_grant.expires_at,'evidence',p_evidence)),statement_timestamp());
  return v_grant;
end; $$;

create or replace function platform.cancel_support_access_request(p_request_id uuid,p_reason text)
returns platform.support_access_requests language plpgsql security definer
set search_path = pg_catalog, platform, audit, app_private
as $$
declare v_req platform.support_access_requests; v_actor uuid:=auth.uid();
begin
  if not app_private.has_platform_aal2() then raise exception 'mfa_required' using errcode='42501'; end if;
  select * into v_req from platform.support_access_requests where id=p_request_id for update;
  if not found or v_req.status<>'requested' then raise exception 'request_not_cancellable' using errcode='P0002'; end if;
  if not (app_private.has_platform_role('PLATFORM_SUPER_ADMIN') or
    (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(v_req.customer_workspace_id,'workspace')))
  then raise exception 'access_denied' using errcode='42501'; end if;
  if char_length(trim(coalesce(p_reason,''))) not between 8 and 500 then raise exception 'invalid_reason' using errcode='22023'; end if;
  update platform.support_access_requests set status='cancelled' where id=p_request_id returning * into v_req;
  insert into audit.events(actor_id,actor_role,action,entity_type,entity_id,reason,before_snapshot,after_snapshot,occurred_at)
  values(v_actor,'PLATFORM_CONTROL_PLANE','SUPPORT_ACCESS_REQUEST_CANCELLED','support_access_request',v_req.id,
    app_private.redact_audit_text(p_reason),'{"status":"requested"}', '{"status":"cancelled"}',statement_timestamp());
  return v_req;
end; $$;

create or replace function platform.revoke_support_access(p_grant_id uuid,p_reason text)
returns platform.support_access_grants language plpgsql security definer
set search_path = pg_catalog, platform, audit, app_private
as $$
declare v_grant platform.support_access_grants; v_actor uuid:=auth.uid();
begin
  if not app_private.has_platform_aal2() then raise exception 'mfa_required' using errcode='42501'; end if;
  select * into v_grant from platform.support_access_grants where id=p_grant_id for update;
  if not found or v_grant.revoked_at is not null or v_grant.expires_at<=statement_timestamp()
  then raise exception 'grant_not_active' using errcode='P0002'; end if;
  if not (app_private.has_platform_role('PLATFORM_SUPER_ADMIN') or
    (app_private.has_platform_role('PLATFORM_OPERATIONS') and app_private.has_customer_assignment(v_grant.customer_workspace_id,'workspace')))
  then raise exception 'access_denied' using errcode='42501'; end if;
  if char_length(trim(coalesce(p_reason,''))) not between 8 and 500 then raise exception 'invalid_reason' using errcode='22023'; end if;
  update platform.support_access_grants set revoked_at=statement_timestamp(),revoked_by=v_actor,revoke_reason=app_private.redact_audit_text(trim(p_reason))
  where id=p_grant_id returning * into v_grant;
  update platform.support_access_requests set status='revoked' where id=v_grant.request_id;
  insert into audit.events(actor_id,actor_role,action,entity_type,entity_id,reason,before_snapshot,after_snapshot,occurred_at)
  values(v_actor,'PLATFORM_CONTROL_PLANE','SUPPORT_ACCESS_GRANT_REVOKED','support_access_grant',v_grant.id,
    app_private.redact_audit_text(p_reason),'{"status":"active"}',app_private.redact_audit_json(jsonb_build_object('status','revoked','workspace_id',v_grant.customer_workspace_id)),statement_timestamp());
  return v_grant;
end; $$;

revoke all on function app_private.can_read_support_access(uuid) from public;
revoke all on function platform.list_support_access(integer,integer,text,text,uuid) from public;
revoke all on function platform.list_support_workspaces() from public;
revoke all on function platform.request_support_access(uuid,text,text,text,text,integer,jsonb) from public;
revoke all on function platform.approve_support_access(uuid,jsonb) from public;
revoke all on function platform.cancel_support_access_request(uuid,text) from public;
revoke all on function platform.revoke_support_access(uuid,text) from public;
grant execute on function app_private.can_read_support_access(uuid) to authenticated,service_role;
grant execute on function platform.list_support_access(integer,integer,text,text,uuid) to authenticated,service_role;
grant execute on function platform.list_support_workspaces() to authenticated,service_role;
grant execute on function platform.request_support_access(uuid,text,text,text,text,integer,jsonb) to authenticated,service_role;
grant execute on function platform.approve_support_access(uuid,jsonb) to authenticated,service_role;
grant execute on function platform.cancel_support_access_request(uuid,text) to authenticated,service_role;
grant execute on function platform.revoke_support_access(uuid,text) to authenticated,service_role;

comment on function platform.list_support_access(integer,integer,text,text,uuid)
is 'AAL2 and assignment-scoped support request/grant explorer with redacted evidence and computed expiration.';

commit;
