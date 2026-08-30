begin;

insert into identity.permissions(code,resource,action,description) values
('governance.meetings.read','governance','read','Read authorized governance meetings and redacted voting evidence')
on conflict(code) do nothing;
insert into identity.role_permissions(role_id,permission_id,effect)
select r.id,p.id,'allow' from identity.roles r cross join identity.permissions p
where lower(r.code) in ('association_admin','property_manager','president','censor','owner','tenant_resident') and p.code='governance.meetings.read'
on conflict(role_id,permission_id) do update set effect='allow';

alter table governance.meetings add column if not exists tenant_visible boolean not null default false;
alter table governance.votes add column if not exists secret_ballot boolean not null default false;
alter table governance.votes add column if not exists rule_version integer not null default 1 check(rule_version>0);
alter table governance.resolutions add column if not exists tenant_visible boolean not null default false;
alter table governance.minutes add column if not exists tenant_visible boolean not null default false;

create table governance.meeting_invitations(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references platform.tenants(id) on delete restrict,
 meeting_id uuid not null references governance.meetings(id) on delete restrict,party_id uuid not null references portfolio.parties(id) on delete restrict,
 unit_id uuid references portfolio.units(id) on delete restrict,invitation_status text not null default 'pending' check(invitation_status in ('pending','delivered','accepted','declined','expired','cancelled')),
 invited_at timestamptz not null default statement_timestamp(),responded_at timestamptz,evidence_document_id uuid references documents.documents(id) on delete restrict,
 created_at timestamptz not null default statement_timestamp(),unique(meeting_id,party_id,unit_id)
);
create table governance.proxies(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references platform.tenants(id) on delete restrict,
 meeting_id uuid not null references governance.meetings(id) on delete restrict,eligibility_id uuid not null references governance.eligibility_snapshots(id) on delete restrict,
 grantor_party_id uuid not null references portfolio.parties(id) on delete restrict,representative_party_id uuid not null references portfolio.parties(id) on delete restrict,
 valid_from timestamptz not null,valid_until timestamptz not null,status text not null default 'active' check(status in ('active','revoked','expired','used')),
 evidence_document_id uuid references documents.documents(id) on delete restrict,created_at timestamptz not null default statement_timestamp(),
 check(grantor_party_id<>representative_party_id),check(valid_until>valid_from)
);
create table governance.meeting_history(
 id bigint generated always as identity primary key,tenant_id uuid not null references platform.tenants(id) on delete restrict,
 meeting_id uuid not null references governance.meetings(id) on delete restrict,event_type text not null,status_from text,status_to text,
 reason text,rule_version integer not null default 1 check(rule_version>0),evidence_json jsonb not null default '{}'::jsonb,
 occurred_at timestamptz not null default statement_timestamp()
);
create index governance_invitations_meeting_status_idx on governance.meeting_invitations(tenant_id,meeting_id,invitation_status,id);
create index governance_proxies_meeting_period_idx on governance.proxies(tenant_id,meeting_id,valid_from,valid_until,status,id);
create index governance_history_meeting_time_idx on governance.meeting_history(tenant_id,meeting_id,occurred_at desc,id desc);
create index governance_meetings_property_schedule_idx on governance.meetings(tenant_id,property_id,scheduled_at desc,id);
create index governance_votes_meeting_status_idx on governance.votes(tenant_id,meeting_id,status,id);

create or replace function governance.customer_governance_scope_matches(p_scope text,p_property uuid,p_building uuid,p_unit uuid,p_target_property uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,portfolio
as $$ select case p_scope when 'tenant' then true when 'property' then p_property=p_target_property when 'building' then exists(select 1 from portfolio.buildings b where b.id=p_building and b.property_id=p_target_property) when 'unit' then exists(select 1 from portfolio.units u join portfolio.buildings b on b.id=u.building_id where u.id=p_unit and b.property_id=p_target_property) else false end $$;
revoke all on function governance.customer_governance_scope_matches(text,uuid,uuid,uuid,uuid) from public,anon,authenticated;

create or replace function governance.enforce_customer_governance_integrity()
returns trigger language plpgsql security definer set search_path=pg_catalog,governance,portfolio,documents
as $$
declare m governance.meetings;e governance.eligibility_snapshots;v governance.votes;
begin
 if tg_table_name='eligibility_snapshots' then
  if tg_op<>'INSERT' then raise exception 'eligibility_snapshot_is_immutable';end if;
  select * into m from governance.meetings where id=new.meeting_id and tenant_id=new.tenant_id;
  if not found or not exists(select 1 from portfolio.units u join portfolio.buildings b on b.id=u.building_id where u.id=new.unit_id and u.tenant_id=new.tenant_id and b.property_id=m.property_id) then raise exception 'eligibility_scope_invalid';end if;
  return new;
 elsif tg_table_name='ballots' then
  if tg_op<>'INSERT' then raise exception 'final_ballot_is_immutable';end if;
  select * into v from governance.votes where id=new.vote_id and tenant_id=new.tenant_id;
  select * into e from governance.eligibility_snapshots where id=new.eligibility_id and tenant_id=new.tenant_id and meeting_id=v.meeting_id;
  if v.id is null or e.id is null or not e.eligible or new.voting_weight<>e.voting_weight or statement_timestamp()<coalesce(v.opens_at,'infinity'::timestamptz) or statement_timestamp()>=coalesce(v.closes_at,'infinity'::timestamptz) then raise exception 'ballot_eligibility_or_time_invalid';end if;
  if not exists(select 1 from governance.vote_options o where o.id=new.option_id and o.vote_id=new.vote_id and o.tenant_id=new.tenant_id) then raise exception 'ballot_option_invalid';end if;
  return new;
 elsif tg_table_name='proxies' then
  if tg_op='DELETE' then raise exception 'proxy_history_is_immutable';end if;
  select * into m from governance.meetings where id=new.meeting_id and tenant_id=new.tenant_id;
  select * into e from governance.eligibility_snapshots where id=new.eligibility_id and meeting_id=new.meeting_id and tenant_id=new.tenant_id and party_id=new.grantor_party_id;
  if m.id is null or e.id is null or new.valid_until<=new.valid_from or new.valid_until>coalesce(m.closed_at,m.scheduled_at+interval '7 days') then raise exception 'proxy_scope_or_time_invalid';end if;
  if new.status='active' and exists(select 1 from governance.proxies p where p.id<>new.id and p.meeting_id=new.meeting_id and p.eligibility_id=new.eligibility_id and p.status='active' and tstzrange(p.valid_from,p.valid_until,'[)')&&tstzrange(new.valid_from,new.valid_until,'[)')) then raise exception 'overlapping_active_proxy';end if;
  if tg_op='UPDATE' and old.status<>'active' and new is distinct from old then raise exception 'final_proxy_is_immutable';end if;
  return new;
 elsif tg_table_name='resolutions' then
  if tg_op='DELETE' and old.adopted then raise exception 'adopted_resolution_is_immutable';end if;
  if tg_op='UPDATE' and old.adopted and new is distinct from old then raise exception 'adopted_resolution_is_immutable';end if;
  return case when tg_op='DELETE' then old else new end;
 elsif tg_table_name='minutes' then
  if tg_op='DELETE' and old.approved_at is not null then raise exception 'approved_minutes_are_immutable';end if;
  if tg_op='UPDATE' and old.approved_at is not null and new is distinct from old then raise exception 'approved_minutes_are_immutable';end if;
  return case when tg_op='DELETE' then old else new end;
 elsif tg_table_name='meeting_history' then
  if tg_op<>'INSERT' then raise exception 'meeting_history_is_append_only';end if;return new;
 end if;return case when tg_op='DELETE' then old else new end;
end $$;
create trigger customer_eligibility_integrity before insert or update or delete on governance.eligibility_snapshots for each row execute function governance.enforce_customer_governance_integrity();
create trigger customer_ballot_integrity before insert or update or delete on governance.ballots for each row execute function governance.enforce_customer_governance_integrity();
create trigger customer_proxy_integrity before insert or update or delete on governance.proxies for each row execute function governance.enforce_customer_governance_integrity();
create trigger customer_resolution_integrity before update or delete on governance.resolutions for each row execute function governance.enforce_customer_governance_integrity();
create trigger customer_minutes_integrity before update or delete on governance.minutes for each row execute function governance.enforce_customer_governance_integrity();
create trigger customer_meeting_history_integrity before update or delete on governance.meeting_history for each row execute function governance.enforce_customer_governance_integrity();
revoke all on function governance.enforce_customer_governance_integrity() from public,anon,authenticated;

alter table governance.meeting_invitations enable row level security;alter table governance.proxies enable row level security;alter table governance.meeting_history enable row level security;
create policy governance_invitations_context_read on governance.meeting_invitations for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from governance.meetings m where m.id=meeting_id and app_private.can_access_property(m.property_id)));
create policy governance_proxies_context_read on governance.proxies for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from governance.meetings m where m.id=meeting_id and app_private.can_access_property(m.property_id)));
create policy governance_history_context_read on governance.meeting_history for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from governance.meetings m where m.id=meeting_id and app_private.can_access_property(m.property_id)));
grant all on governance.meeting_invitations,governance.proxies,governance.meeting_history to service_role;

create or replace function governance.get_customer_governance(p_context_id uuid,p_view text default 'meetings',p_query text default null,p_status text default null,p_from date default null,p_to date default null,p_limit integer default 25,p_offset integer default 0,p_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog,governance,identity,platform,portfolio,occupancy,documents,audit
as $$
declare x record;v_workspace uuid;v_party uuid;v_resident boolean;v_tenant boolean;v_total bigint;v_rows jsonb;v_summary jsonb;v_detail jsonb;
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501';end if;
 if coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501';end if;
 if p_view not in ('meetings','agenda','invitations','attendance','quorum','proxies','votes','resolutions','minutes','documents','history') or p_limit<1 or p_limit>100 or p_offset<0 then raise exception 'invalid_query' using errcode='22023';end if;
 select g.*,m.id membership_key,m.role_id,r.code role_code,r.name role_name into x from identity.context_grants g join identity.memberships m on m.id=g.membership_id and m.tenant_id=g.tenant_id join identity.roles r on r.id=m.role_id where g.id=p_context_id and m.user_id=auth.uid() and m.status='active' and m.starts_at<=statement_timestamp() and(m.ends_at is null or m.ends_at>statement_timestamp()) and g.starts_at<=statement_timestamp() and(g.ends_at is null or g.ends_at>statement_timestamp());
 if not found then raise exception 'customer_context_access_denied' using errcode='42501';end if;
 if lower(x.role_code) not in ('association_admin','property_manager','president','censor','owner','tenant_resident') then raise exception 'governance_role_denied' using errcode='42501';end if;
 if not exists(select 1 from identity.role_permissions rp join identity.permissions p on p.id=rp.permission_id where rp.role_id=x.role_id and rp.effect='allow' and p.code='governance.meetings.read') then raise exception 'governance_permission_required' using errcode='42501';end if;
 select w.id into v_workspace from platform.customer_workspaces w where w.tenant_id=x.tenant_id and w.lifecycle_status='ACTIVE' order by w.id limit 1;
 if v_workspace is null or not exists(select 1 from platform.workspace_entitlements e where e.customer_workspace_id=v_workspace and e.entitlement_key='module.governance' and e.valid_from<=statement_timestamp() and(e.valid_until is null or e.valid_until>statement_timestamp()) and(case when e.override_value_json is not null and e.override_expires_at>statement_timestamp() then e.override_value_json='true'::jsonb else e.boolean_value is true end)) then raise exception 'governance_entitlement_required' using errcode='42501';end if;
 v_resident:=lower(x.role_code) in('owner','tenant_resident');v_tenant:=lower(x.role_code)='tenant_resident';
 if v_resident then select mp.party_id into v_party from identity.membership_parties mp where mp.membership_id=x.membership_key and mp.tenant_id=x.tenant_id;if v_party is null or x.scope_type<>'unit' then raise exception 'resident_party_and_unit_context_required' using errcode='42501';end if;
  if not v_tenant and not exists(select 1 from portfolio.ownerships o where o.tenant_id=x.tenant_id and o.unit_id=x.unit_id and o.party_id=v_party and o.valid_from<=current_date and(o.valid_to is null or o.valid_to>current_date)) then raise exception 'ownership_required' using errcode='42501';end if;
  if v_tenant and not exists(select 1 from occupancy.leases l where l.tenant_id=x.tenant_id and l.unit_id=x.unit_id and l.tenant_party_id=v_party and l.status='active' and l.starts_on<=current_date and(l.ends_on is null or l.ends_on>current_date)) then raise exception 'active_lease_required' using errcode='42501';end if;end if;
 with allowed as(select m.* from governance.meetings m where m.tenant_id=x.tenant_id and governance.customer_governance_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,m.property_id) and(not v_tenant or m.tenant_visible))
 select jsonb_build_object('meetings',count(*),'scheduled',count(*)filter(where status in('announced','open')),'closed',count(*)filter(where status='closed'),'open_votes',(select count(*) from governance.votes v join allowed a on a.id=v.meeting_id where v.status='open')) into v_summary from allowed;
 if p_view='meetings' then with q as(select m.id,m.title,m.meeting_type,m.scheduled_at,m.location_text,m.status,m.quorum_rule,m.announced_at,m.opened_at,m.closed_at,m.tenant_visible,p.name property_name,count(*)over() total_count from governance.meetings m join portfolio.properties p on p.id=m.property_id where m.tenant_id=x.tenant_id and governance.customer_governance_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,m.property_id) and(not v_tenant or m.tenant_visible) and(p_id is null or m.id=p_id) and(p_status is null or m.status::text=p_status) and(p_from is null or m.scheduled_at::date>=p_from) and(p_to is null or m.scheduled_at::date<=p_to) and(p_query is null or trim(p_query)='' or m.title ilike '%'||trim(p_query)||'%' or p.name ilike '%'||trim(p_query)||'%') order by m.scheduled_at desc,m.id limit p_limit offset p_offset) select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]') into v_total,v_rows from q;
 elsif p_view='agenda' then with q as(select a.id,a.meeting_id,m.title meeting_title,a.sequence_no,a.title,a.description,a.decision_required,a.created_at,m.status,count(*)over() total_count from governance.agenda_items a join governance.meetings m on m.id=a.meeting_id where a.tenant_id=x.tenant_id and governance.customer_governance_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,m.property_id) and(not v_tenant or m.tenant_visible) and(p_id is null or a.id=p_id) and(p_query is null or a.title ilike '%'||trim(p_query)||'%') order by m.scheduled_at desc,a.sequence_no limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='invitations' then with q as(select i.id,i.meeting_id,m.title meeting_title,i.unit_id,u.unit_code,i.invitation_status,i.invited_at,i.responded_at,(i.evidence_document_id is not null) evidence_available,count(*)over() total_count from governance.meeting_invitations i join governance.meetings m on m.id=i.meeting_id left join portfolio.units u on u.id=i.unit_id where i.tenant_id=x.tenant_id and not v_tenant and governance.customer_governance_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,m.property_id) and(not v_resident or(i.party_id=v_party and i.unit_id=x.unit_id)) and(p_status is null or i.invitation_status=p_status) order by i.invited_at desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='attendance' then with q as(select a.id,a.meeting_id,m.title meeting_title,e.unit_id,u.unit_code,a.attendance_mode,a.checked_in_at,(a.proxy_evidence_path is not null) proxy_evidence_available,count(*)over() total_count from governance.attendance a join governance.meetings m on m.id=a.meeting_id join governance.eligibility_snapshots e on e.id=a.eligibility_id join portfolio.units u on u.id=e.unit_id where a.tenant_id=x.tenant_id and not v_tenant and governance.customer_governance_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,m.property_id) and(not v_resident or(e.party_id=v_party and e.unit_id=x.unit_id)) order by a.checked_in_at desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='quorum' then with q as(select m.id,m.title,m.status,m.scheduled_at,coalesce(sum(e.voting_weight)filter(where e.eligible),0) eligible_weight,coalesce(sum(e.voting_weight)filter(where e.eligible and a.id is not null),0) represented_weight,case when coalesce(sum(e.voting_weight)filter(where e.eligible),0)>0 then round(100*sum(e.voting_weight)filter(where e.eligible and a.id is not null)/sum(e.voting_weight)filter(where e.eligible),4) else 0 end quorum_percent,m.quorum_rule->>'basis' quorum_basis,m.quorum_rule->>'threshold' quorum_threshold,m.quorum_rule->>'rule_version' rule_version,statement_timestamp() calculated_at,count(*)over() total_count from governance.meetings m left join governance.eligibility_snapshots e on e.meeting_id=m.id left join governance.attendance a on a.meeting_id=m.id and a.eligibility_id=e.id where m.tenant_id=x.tenant_id and governance.customer_governance_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,m.property_id) and(not v_tenant or m.tenant_visible) group by m.id order by m.scheduled_at desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='proxies' then with q as(select p.id,p.meeting_id,m.title meeting_title,e.unit_id,u.unit_code,p.valid_from,p.valid_until,p.status,(p.evidence_document_id is not null) evidence_available,case when p.valid_from<=statement_timestamp() and p.valid_until>statement_timestamp() and p.status='active' then true else false end currently_valid,count(*)over() total_count from governance.proxies p join governance.meetings m on m.id=p.meeting_id join governance.eligibility_snapshots e on e.id=p.eligibility_id join portfolio.units u on u.id=e.unit_id where p.tenant_id=x.tenant_id and not v_tenant and governance.customer_governance_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,m.property_id) and(not v_resident or(p.grantor_party_id=v_party and e.unit_id=x.unit_id)) order by p.valid_from desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='votes' then with option_weights as(select o.vote_id,jsonb_object_agg(o.code,coalesce((select sum(b.voting_weight)from governance.ballots b where b.vote_id=o.vote_id and b.option_id=o.id),0)) option_totals from governance.vote_options o group by o.vote_id),cast_weights as(select b.vote_id,sum(b.voting_weight)cast_weight from governance.ballots b group by b.vote_id),totals as(select v.id,v.meeting_id,v.agenda_item_id,v.question,v.status,v.voting_method,v.secret_ballot,v.rule_version,v.opens_at,v.closes_at,m.title meeting_title,m.property_id,coalesce(c.cast_weight,0)cast_weight,coalesce(o.option_totals,'{}'::jsonb)option_totals from governance.votes v join governance.meetings m on m.id=v.meeting_id left join option_weights o on o.vote_id=v.id left join cast_weights c on c.vote_id=v.id where v.tenant_id=x.tenant_id),q as(select t.id,t.meeting_id,t.meeting_title,t.question,t.status,t.voting_method,t.secret_ballot,t.rule_version,t.opens_at,t.closes_at,t.cast_weight,t.option_totals,case when t.status='closed' then 'final' else 'provisional' end result_state,count(*)over()total_count from totals t where governance.customer_governance_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,t.property_id) and(not v_tenant or exists(select 1 from governance.meetings m where m.id=t.meeting_id and m.tenant_visible) and t.status='closed') and(p_status is null or t.status::text=p_status) and(p_query is null or t.question ilike '%'||trim(p_query)||'%') order by t.opens_at desc nulls last limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='resolutions' then with q as(select r.id,r.meeting_id,m.title meeting_title,r.resolution_no,r.title,r.text_body,r.adopted,r.result_snapshot->>'quorum_basis' quorum_basis,r.result_snapshot->>'calculation_method' calculation_method,r.result_snapshot->>'rule_version' rule_version,r.result_snapshot->>'eligible_weight' eligible_weight,r.result_snapshot->>'cast_weight' cast_weight,r.result_snapshot->>'for_weight' for_weight,r.result_snapshot->>'against_weight' against_weight,r.result_snapshot->>'abstain_weight' abstain_weight,(r.result_snapshot?'evidence_document_id')evidence_available,r.effective_on,r.tenant_visible,r.created_at,count(*)over()total_count from governance.resolutions r join governance.meetings m on m.id=r.meeting_id where r.tenant_id=x.tenant_id and governance.customer_governance_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,m.property_id) and(not v_tenant or(r.tenant_visible and m.tenant_visible)) and(p_query is null or r.title ilike '%'||trim(p_query)||'%' or r.resolution_no ilike '%'||trim(p_query)||'%') order by r.created_at desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='minutes' then with q as(select n.id,n.meeting_id,m.title meeting_title,n.version,n.sha256,n.approved_at,n.created_at,n.tenant_visible,(n.object_path is not null) document_available,count(*)over()total_count from governance.minutes n join governance.meetings m on m.id=n.meeting_id where n.tenant_id=x.tenant_id and governance.customer_governance_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,m.property_id) and(not v_tenant or(n.tenant_visible and m.tenant_visible)) order by n.created_at desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='documents' then with links as(select l.document_id,l.entity_type,l.entity_id,l.entity_id meeting_id from documents.document_links l where l.entity_type='governance.meeting' union all select l.document_id,l.entity_type,l.entity_id,r.meeting_id from documents.document_links l join governance.resolutions r on l.entity_type='governance.resolution'and r.id=l.entity_id union all select l.document_id,l.entity_type,l.entity_id,n.meeting_id from documents.document_links l join governance.minutes n on l.entity_type='governance.minutes'and n.id=l.entity_id),q as(select d.id,d.title,d.document_type,d.classification,d.current_version,d.status,d.created_at,l.entity_type,l.entity_id,count(*)over()total_count from links l join documents.documents d on d.id=l.document_id join governance.meetings m on m.id=l.meeting_id where d.tenant_id=x.tenant_id and governance.customer_governance_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,m.property_id) and(not v_tenant or(d.classification='public' and m.tenant_visible)) order by d.created_at desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 else with q as(select h.id,h.meeting_id,m.title meeting_title,h.event_type,h.status_from,h.status_to,h.reason,h.rule_version,(h.evidence_json<>'{}'::jsonb)evidence_available,h.occurred_at,count(*)over()total_count from governance.meeting_history h join governance.meetings m on m.id=h.meeting_id where h.tenant_id=x.tenant_id and governance.customer_governance_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,m.property_id) and(not v_tenant or m.tenant_visible) order by h.occurred_at desc,h.id desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;end if;
 v_detail:=case when p_id is null then null else(select r from jsonb_array_elements(v_rows)r where r->>'id'=p_id::text limit 1)end;
 return jsonb_build_object('context',jsonb_build_object('id',x.id,'role',x.role_code,'scope',x.scope_type),'view',p_view,'total',coalesce(v_total,0),'rows',coalesce(v_rows,'[]'),'summary',v_summary,'detail',v_detail,'read_only',true,'secret_ballots_redacted',true,'generated_at',statement_timestamp());
end $$;
revoke all on function governance.get_customer_governance(uuid,text,text,text,date,date,integer,integer,uuid) from public,anon;
grant execute on function governance.get_customer_governance(uuid,text,text,text,date,date,integer,integer,uuid) to authenticated,service_role;

revoke select on all tables in schema governance from authenticated;
grant usage on schema governance to authenticated;

commit;
