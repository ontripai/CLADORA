begin;
create or replace function platform.get_control_plane_overview() returns jsonb language plpgsql stable security definer set search_path=pg_catalog,platform,audit,app_private as $$
declare v_super boolean:=app_private.has_platform_role('PLATFORM_SUPER_ADMIN'); v_ops boolean:=app_private.has_platform_role('PLATFORM_OPERATIONS'); v_fin boolean:=app_private.has_platform_role('PLATFORM_FINANCE'); v_aud boolean:=app_private.has_platform_role('PLATFORM_AUDITOR'); v_result jsonb;
begin
 if not app_private.has_platform_aal2() then raise exception 'mfa_required' using errcode='42501'; end if;
 if not(v_super or v_ops or v_fin or v_aud) then raise exception 'access_denied' using errcode='42501'; end if;
 with vw as (
  select w.*,v_super or(v_ops and app_private.has_customer_assignment(w.id,'workspace'))or(v_aud and(app_private.has_customer_assignment(w.id,'audit')or app_private.has_customer_assignment(w.id,'workspace'))) operational,
   v_super or(v_fin and(app_private.has_customer_assignment(w.id,'commercial')or app_private.has_customer_assignment(w.id,'workspace')))or(v_aud and(app_private.has_customer_assignment(w.id,'audit')or app_private.has_customer_assignment(w.id,'workspace'))) commercial
  from platform.customer_workspaces w where v_super or(v_ops and app_private.has_customer_assignment(w.id,'workspace'))or(v_fin and(app_private.has_customer_assignment(w.id,'commercial')or app_private.has_customer_assignment(w.id,'workspace')))or(v_aud and(app_private.has_customer_assignment(w.id,'audit')or app_private.has_customer_assignment(w.id,'workspace')))
 ), va as (select e.*,app_private.audit_event_workspace_id(e.entity_type,e.entity_id,e.before_snapshot,e.after_snapshot) workspace_id from audit.events e where app_private.can_read_audit_event(app_private.audit_event_workspace_id(e.entity_type,e.entity_id,e.before_snapshot,e.after_snapshot),e.action))
 select jsonb_build_object('generated_at',statement_timestamp(),'capabilities',jsonb_build_object('commercial',v_super or v_fin or v_aud,'operational',v_super or v_ops or v_aud,'audit',true),'kpis',jsonb_build_object(
  'workspaces',(select count(*) from vw),'active_workspaces',(select count(*) from vw where lifecycle_status='ACTIVE'),
  'contracts',case when v_super or v_fin or v_aud then(select count(*) from platform.workspace_contracts c join vw w on w.id=c.customer_workspace_id and w.commercial)else null end,
  'active_contracts',case when v_super or v_fin or v_aud then(select count(*) from platform.workspace_contracts c join vw w on w.id=c.customer_workspace_id and w.commercial where c.status='active' and c.start_date<=current_date and(c.end_date is null or c.end_date>=current_date))else null end,
  'plans',case when v_super then(select count(*) from platform.subscription_plans)when v_fin or v_aud then(select count(distinct c.plan_id)from platform.workspace_contracts c join vw w on w.id=c.customer_workspace_id and w.commercial where c.plan_id is not null)else null end,
  'provisioning',case when v_super or v_ops or v_aud then(select count(*)from platform.provisioning_runs r join vw w on w.id=r.customer_workspace_id and w.operational)else null end,
  'provisioning_attention',case when v_super or v_ops or v_aud then(select count(*)from platform.provisioning_runs r join vw w on w.id=r.customer_workspace_id and w.operational where r.status='failed'or(r.status in('pending','running')and r.started_at<statement_timestamp()-interval '30 minutes'))else null end,
  'support_open',case when v_super or v_ops or v_aud then(select count(*)from platform.support_access_requests s join vw w on w.id=s.customer_workspace_id and w.operational where s.status='requested')else null end,
  'audit_recent',(select count(*)from va where occurred_at>=statement_timestamp()-interval '24 hours')),
  'attention',coalesce((select jsonb_agg(item order by priority,occurred_at desc)from(
   select 1 priority,r.started_at occurred_at,jsonb_build_object('kind','provisioning','id',r.id,'workspace_id',r.customer_workspace_id,'status',r.status,'occurred_at',r.started_at)item from platform.provisioning_runs r join vw w on w.id=r.customer_workspace_id and w.operational where(v_super or v_ops or v_aud)and(r.status='failed'or(r.status in('pending','running')and r.started_at<statement_timestamp()-interval '30 minutes'))
   union all select 2,s.created_at,jsonb_build_object('kind','support','id',s.id,'workspace_id',s.customer_workspace_id,'status',s.status,'occurred_at',s.created_at)from platform.support_access_requests s join vw w on w.id=s.customer_workspace_id and w.operational where(v_super or v_ops or v_aud)and s.status='requested'
   union all select 3,c.created_at,jsonb_build_object('kind','contract','id',c.id,'workspace_id',c.customer_workspace_id,'status',c.status,'occurred_at',c.created_at,'due_date',c.end_date)from platform.workspace_contracts c join vw w on w.id=c.customer_workspace_id and w.commercial where(v_super or v_fin or v_aud)and c.status='active'and c.end_date between current_date and current_date+30 order by 1,2 desc limit 12)q),'[]'::jsonb),
  'recent_events',coalesce((select jsonb_agg(jsonb_build_object('id',id,'workspace_id',workspace_id,'action',action,'entity_type',entity_type,'entity_id',entity_id,'actor_role',actor_role,'reason',app_private.redact_audit_text(reason),'occurred_at',occurred_at)order by occurred_at desc,id desc)from(select * from va order by occurred_at desc,id desc limit 10)e),'[]'::jsonb))into v_result;
 return v_result;
end;$$;
revoke all on function platform.get_control_plane_overview() from public;
grant execute on function platform.get_control_plane_overview() to authenticated,service_role;
comment on function platform.get_control_plane_overview() is 'Read-only, AAL2 and assignment-scoped control-plane dashboard projection.';
commit;
