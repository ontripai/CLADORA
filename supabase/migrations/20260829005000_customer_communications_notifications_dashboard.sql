begin;

insert into identity.permissions(code,resource,action,description) values
('communications.feed.read','communications','read','Read authorized communications, aggregate polls and own notifications')
on conflict(code) do nothing;
insert into identity.role_permissions(role_id,permission_id,effect)
select r.id,p.id,'allow' from identity.roles r cross join identity.permissions p
where lower(r.code) in ('association_admin','property_manager','president','censor','owner','tenant_resident') and p.code='communications.feed.read'
on conflict(role_id,permission_id) do update set effect='allow';

alter table communications.posts add column if not exists comments_closed boolean not null default false;
alter table communications.posts add column if not exists audience_rule jsonb not null default '{"rule_version":1}'::jsonb;
alter table communications.polls add column if not exists rule_version integer not null default 1 check(rule_version>0);
alter table communications.polls add column if not exists finalized_at timestamptz;

create table communications.communication_links(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references platform.tenants(id) on delete restrict,
 post_id uuid not null references communications.posts(id) on delete restrict,
 meeting_id uuid references governance.meetings(id) on delete restrict,resolution_id uuid references governance.resolutions(id) on delete restrict,
 work_order_id uuid references maintenance.work_orders(id) on delete restrict,invoice_id uuid references billing.invoices(id) on delete restrict,
 document_id uuid references documents.documents(id) on delete restrict,audit_event_id bigint references audit.events(id) on delete restrict,
 relation_type text not null default 'related',created_at timestamptz not null default statement_timestamp(),
 check(num_nonnulls(meeting_id,resolution_id,work_order_id,invoice_id,document_id,audit_event_id)=1)
);
create index communication_links_tenant_post_idx on communications.communication_links(tenant_id,post_id,id);
create index communication_links_post_id_idx on communications.communication_links(post_id);
create index communication_links_meeting_id_idx on communications.communication_links(meeting_id);
create index communication_links_resolution_id_idx on communications.communication_links(resolution_id);
create index communication_links_work_order_id_idx on communications.communication_links(work_order_id);
create index communication_links_invoice_id_idx on communications.communication_links(invoice_id);
create index communication_links_document_id_idx on communications.communication_links(document_id);
create index communication_links_audit_event_id_idx on communications.communication_links(audit_event_id);
create index communications_posts_channel_published_idx on communications.posts(tenant_id,channel_id,published_at desc,id desc) where status='published';
create index communications_notifications_member_unread_idx on communications.notifications(tenant_id,membership_id,created_at desc,id desc) where read_at is null;
create index communications_poll_responses_poll_option_idx on communications.poll_responses(tenant_id,poll_id,option_id);

create or replace function communications.customer_channel_scope_matches(p_context_scope text,p_property uuid,p_building uuid,p_unit uuid,p_channel_scope communications.channel_scope,p_channel_property uuid,p_channel_building uuid,p_channel_unit uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,portfolio
as $$
 select case p_channel_scope
  when 'tenant' then true
  when 'property' then case p_context_scope when 'tenant' then true when 'property' then p_property=p_channel_property when 'building' then exists(select 1 from portfolio.buildings b where b.id=p_building and b.property_id=p_channel_property) when 'unit' then exists(select 1 from portfolio.units u join portfolio.buildings b on b.id=u.building_id where u.id=p_unit and b.property_id=p_channel_property) else false end
  when 'building' then case p_context_scope when 'tenant' then true when 'property' then exists(select 1 from portfolio.buildings b where b.id=p_channel_building and b.property_id=p_property) when 'building' then p_building=p_channel_building when 'unit' then exists(select 1 from portfolio.units u where u.id=p_unit and u.building_id=p_channel_building) else false end
  when 'unit' then p_context_scope='tenant' or(p_context_scope='property' and exists(select 1 from portfolio.units u join portfolio.buildings b on b.id=u.building_id where u.id=p_channel_unit and b.property_id=p_property))or(p_context_scope='building' and exists(select 1 from portfolio.units u where u.id=p_channel_unit and u.building_id=p_building))or(p_context_scope='unit' and p_unit=p_channel_unit)
  when 'direct' then true else false end
$$;
revoke all on function communications.customer_channel_scope_matches(text,uuid,uuid,uuid,communications.channel_scope,uuid,uuid,uuid) from public,anon,authenticated;

create or replace function communications.enforce_customer_communications_integrity()
returns trigger language plpgsql security definer set search_path=pg_catalog,communications,identity,governance,maintenance,billing,documents,audit
as $$
declare p communications.polls;po communications.posts;c communications.channels;link_tenant uuid;
begin
 if tg_table_name='poll_responses' then
  if tg_op<>'INSERT' then raise exception 'poll_response_is_immutable';end if;
  select * into p from communications.polls where id=new.poll_id and tenant_id=new.tenant_id;
  select x.* into po from communications.posts x where x.id=p.post_id and x.tenant_id=new.tenant_id;
  select x.* into c from communications.channels x where x.id=po.channel_id and x.tenant_id=new.tenant_id;
  if p.id is null or po.id is null or c.id is null or po.status<>'published' or statement_timestamp()<p.opens_at or(p.closes_at is not null and statement_timestamp()>=p.closes_at)or p.finalized_at is not null then raise exception 'poll_is_not_open';end if;
  if not exists(select 1 from communications.poll_options o where o.id=new.option_id and o.poll_id=new.poll_id and o.tenant_id=new.tenant_id) then raise exception 'poll_option_mismatch';end if;
  if not exists(select 1 from identity.memberships m where m.id=new.membership_id and m.tenant_id=new.tenant_id and m.status='active' and m.starts_at<=statement_timestamp() and(m.ends_at is null or m.ends_at>statement_timestamp())) then raise exception 'poll_membership_ineligible';end if;
  if(c.is_private or c.scope='direct')and not exists(select 1 from communications.channel_members cm where cm.channel_id=c.id and cm.membership_id=new.membership_id and cm.tenant_id=new.tenant_id)then raise exception 'poll_channel_membership_required';end if;
  if not p.multiple_choice and exists(select 1 from communications.poll_responses r where r.poll_id=new.poll_id and r.membership_id=new.membership_id)then raise exception 'single_choice_poll_allows_one_response';end if;
  return new;
 elsif tg_table_name='polls' then
  if tg_op='DELETE' and old.finalized_at is not null then raise exception 'final_poll_is_immutable';end if;
  if tg_op='UPDATE' and old.finalized_at is not null and new is distinct from old then raise exception 'final_poll_is_immutable';end if;
  return case when tg_op='DELETE' then old else new end;
 elsif tg_table_name='comments' then
  if tg_op='DELETE' then return old;end if;
  select * into po from communications.posts where id=new.post_id and tenant_id=new.tenant_id;
  if po.id is null or po.comments_closed or po.status in('archived','removed')then raise exception 'post_comments_are_closed';end if;return new;
 elsif tg_table_name='communication_links' then
  if tg_op<>'INSERT' then raise exception 'communication_link_is_immutable';end if;
  select tenant_id into link_tenant from communications.posts where id=new.post_id;
  if link_tenant is distinct from new.tenant_id then raise exception 'communication_link_post_tenant_mismatch';end if;
  if new.meeting_id is not null then select tenant_id into link_tenant from governance.meetings where id=new.meeting_id;
  elsif new.resolution_id is not null then select tenant_id into link_tenant from governance.resolutions where id=new.resolution_id;
  elsif new.work_order_id is not null then select tenant_id into link_tenant from maintenance.work_orders where id=new.work_order_id;
  elsif new.invoice_id is not null then select tenant_id into link_tenant from billing.invoices where id=new.invoice_id;
  elsif new.document_id is not null then select tenant_id into link_tenant from documents.documents where id=new.document_id;
  else select tenant_id into link_tenant from audit.events where id=new.audit_event_id;end if;
  if link_tenant is distinct from new.tenant_id then raise exception 'communication_link_target_tenant_mismatch';end if;return new;
 end if;return case when tg_op='DELETE' then old else new end;
end $$;
drop trigger if exists poll_responses_validate on communications.poll_responses;
create trigger customer_poll_response_integrity before insert or update or delete on communications.poll_responses for each row execute function communications.enforce_customer_communications_integrity();
create trigger customer_poll_final_integrity before update or delete on communications.polls for each row execute function communications.enforce_customer_communications_integrity();
create trigger customer_comment_integrity before insert or update on communications.comments for each row execute function communications.enforce_customer_communications_integrity();
create trigger customer_communication_link_integrity before insert or update or delete on communications.communication_links for each row execute function communications.enforce_customer_communications_integrity();
revoke all on function communications.enforce_customer_communications_integrity() from public,anon,authenticated;

alter table communications.communication_links enable row level security;
create policy communication_links_context_read on communications.communication_links for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from communications.posts p where p.id=post_id and app_private.can_access_channel(p.channel_id)));
grant all on communications.communication_links to service_role;

create or replace function communications.get_customer_communications(p_context_id uuid,p_view text default 'posts',p_query text default null,p_status text default null,p_from date default null,p_to date default null,p_limit integer default 25,p_offset integer default 0,p_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog,communications,identity,platform,portfolio,occupancy,governance,maintenance,billing,documents,audit
as $$
declare x record;v_workspace uuid;v_party uuid;v_resident boolean;v_tenant boolean;v_total bigint;v_rows jsonb;v_summary jsonb;v_detail jsonb;
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501';end if;
 if coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501';end if;
 if p_view not in('channels','announcements','posts','comments','polls','options','results','notifications','links')or p_limit<1 or p_limit>100 or p_offset<0 then raise exception 'invalid_query' using errcode='22023';end if;
 select g.*,m.id membership_key,m.role_id,r.code role_code,r.name role_name into x from identity.context_grants g join identity.memberships m on m.id=g.membership_id and m.tenant_id=g.tenant_id join identity.roles r on r.id=m.role_id where g.id=p_context_id and m.user_id=auth.uid() and m.status='active' and m.starts_at<=statement_timestamp()and(m.ends_at is null or m.ends_at>statement_timestamp())and g.starts_at<=statement_timestamp()and(g.ends_at is null or g.ends_at>statement_timestamp());
 if not found then raise exception 'customer_context_access_denied' using errcode='42501';end if;
 if lower(x.role_code)not in('association_admin','property_manager','president','censor','owner','tenant_resident')then raise exception 'communications_role_denied' using errcode='42501';end if;
 if not exists(select 1 from identity.role_permissions rp join identity.permissions p on p.id=rp.permission_id where rp.role_id=x.role_id and rp.effect='allow'and p.code='communications.feed.read')then raise exception 'communications_permission_required' using errcode='42501';end if;
 select w.id into v_workspace from platform.customer_workspaces w where w.tenant_id=x.tenant_id and w.lifecycle_status='ACTIVE' order by w.id limit 1;
 if v_workspace is null or not exists(select 1 from platform.workspace_entitlements e where e.customer_workspace_id=v_workspace and e.entitlement_key='module.communications'and e.valid_from<=statement_timestamp()and(e.valid_until is null or e.valid_until>statement_timestamp())and(case when e.override_value_json is not null and e.override_expires_at>statement_timestamp()then e.override_value_json='true'::jsonb else e.boolean_value is true end))then raise exception 'communications_entitlement_required' using errcode='42501';end if;
 v_resident:=lower(x.role_code)in('owner','tenant_resident');v_tenant:=lower(x.role_code)='tenant_resident';
 if v_resident then select mp.party_id into v_party from identity.membership_parties mp where mp.membership_id=x.membership_key and mp.tenant_id=x.tenant_id;if v_party is null or x.scope_type<>'unit'then raise exception 'resident_party_and_unit_context_required' using errcode='42501';end if;
  if not v_tenant and not exists(select 1 from portfolio.ownerships o where o.tenant_id=x.tenant_id and o.unit_id=x.unit_id and o.party_id=v_party and o.valid_from<=current_date and(o.valid_to is null or o.valid_to>current_date))then raise exception 'ownership_required' using errcode='42501';end if;
  if v_tenant and not exists(select 1 from occupancy.leases l where l.tenant_id=x.tenant_id and l.unit_id=x.unit_id and l.tenant_party_id=v_party and l.status='active'and l.starts_on<=current_date and(l.ends_on is null or l.ends_on>current_date))then raise exception 'active_lease_required' using errcode='42501';end if;end if;
 with allowed as(select c.* from communications.channels c where c.tenant_id=x.tenant_id and c.status='active'and communications.customer_channel_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,c.scope,c.property_id,c.building_id,c.unit_id)and(not(c.is_private or c.scope='direct')or exists(select 1 from communications.channel_members cm where cm.channel_id=c.id and cm.membership_id=x.membership_key and cm.tenant_id=x.tenant_id)))select jsonb_build_object('channels',count(*),'published_posts',(select count(*)from communications.posts p join allowed a on a.id=p.channel_id where p.status='published'),'open_polls',(select count(*)from communications.polls q join communications.posts p on p.id=q.post_id join allowed a on a.id=p.channel_id where q.finalized_at is null and q.opens_at<=statement_timestamp()and(q.closes_at is null or q.closes_at>statement_timestamp())),'unread_notifications',(select count(*)from communications.notifications n where n.tenant_id=x.tenant_id and n.membership_id=x.membership_key and n.read_at is null))into v_summary from allowed;
 if p_view='channels'then with q as(select c.id,c.name,c.scope,c.is_private,c.status,c.created_at,pr.name property_name,b.name building_name,u.unit_code,exists(select 1 from communications.channel_members cm where cm.channel_id=c.id and cm.membership_id=x.membership_key)member,count(*)over()total_count from communications.channels c left join portfolio.properties pr on pr.id=c.property_id left join portfolio.buildings b on b.id=c.building_id left join portfolio.units u on u.id=c.unit_id where c.tenant_id=x.tenant_id and communications.customer_channel_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,c.scope,c.property_id,c.building_id,c.unit_id)and(not(c.is_private or c.scope='direct')or exists(select 1 from communications.channel_members cm where cm.channel_id=c.id and cm.membership_id=x.membership_key and cm.tenant_id=x.tenant_id))and(p_status is null or c.status::text=p_status)and(p_query is null or c.name ilike'%'||trim(p_query)||'%')order by c.created_at desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view in('announcements','posts')then with q as(select p.id,p.channel_id,c.name channel_name,p.title,p.body,p.post_type,p.status,p.published_at,p.pinned_until,p.comments_closed,p.audience_rule->>'rule_version'rule_version,p.created_at,(select count(*)from communications.comments k where k.post_id=p.id and k.removed_at is null)comment_count,(select count(*)from communications.reactions r where r.post_id=p.id)reaction_count,count(*)over()total_count from communications.posts p join communications.channels c on c.id=p.channel_id where p.tenant_id=x.tenant_id and p.status='published'and(p_view='posts'or p.post_type='announcement')and communications.customer_channel_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,c.scope,c.property_id,c.building_id,c.unit_id)and(not(c.is_private or c.scope='direct')or exists(select 1 from communications.channel_members cm where cm.channel_id=c.id and cm.membership_id=x.membership_key and cm.tenant_id=x.tenant_id))and(p_id is null or p.id=p_id)and(p_status is null or p.post_type=p_status)and(p_from is null or p.published_at::date>=p_from)and(p_to is null or p.published_at::date<=p_to)and(p_query is null or coalesce(p.title,'')ilike'%'||trim(p_query)||'%'or p.body ilike'%'||trim(p_query)||'%')order by p.published_at desc nulls last,p.id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='comments'then with q as(select k.id,k.post_id,p.title post_title,c.name channel_name,k.body,k.created_at,k.updated_at,(k.removed_at is not null)removed,count(*)over()total_count from communications.comments k join communications.posts p on p.id=k.post_id join communications.channels c on c.id=p.channel_id where k.tenant_id=x.tenant_id and p.status='published'and k.removed_at is null and communications.customer_channel_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,c.scope,c.property_id,c.building_id,c.unit_id)and(not(c.is_private or c.scope='direct')or exists(select 1 from communications.channel_members cm where cm.channel_id=c.id and cm.membership_id=x.membership_key and cm.tenant_id=x.tenant_id))and(p_query is null or k.body ilike'%'||trim(p_query)||'%')order by k.created_at desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view in('polls','results')then with option_totals as(select o.poll_id,jsonb_object_agg(o.label,coalesce((select count(*)from communications.poll_responses r where r.poll_id=o.poll_id and r.option_id=o.id),0))option_totals from communications.poll_options o group by o.poll_id),q as(select q.id,q.post_id,p.title post_title,c.name channel_name,q.question,q.multiple_choice,q.anonymous,q.opens_at,q.closes_at,q.rule_version,q.finalized_at,case when q.finalized_at is not null then'final'when statement_timestamp()<q.opens_at then'scheduled'when q.closes_at is null or statement_timestamp()<q.closes_at then'open'else'closed'end status,coalesce(o.option_totals,'{}'::jsonb)option_totals,(select count(distinct r.membership_id)from communications.poll_responses r where r.poll_id=q.id)response_count,(select count(*)from identity.memberships m where m.tenant_id=x.tenant_id and m.status='active'and m.starts_at<=statement_timestamp()and(m.ends_at is null or m.ends_at>statement_timestamp()))eligible_audience,statement_timestamp()calculated_at,count(*)over()total_count from communications.polls q join communications.posts p on p.id=q.post_id join communications.channels c on c.id=p.channel_id left join option_totals o on o.poll_id=q.id where q.tenant_id=x.tenant_id and p.status='published'and communications.customer_channel_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,c.scope,c.property_id,c.building_id,c.unit_id)and(not(c.is_private or c.scope='direct')or exists(select 1 from communications.channel_members cm where cm.channel_id=c.id and cm.membership_id=x.membership_key and cm.tenant_id=x.tenant_id))and(p_id is null or q.id=p_id)and(p_query is null or q.question ilike'%'||trim(p_query)||'%')order by q.created_at desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='options'then with q as(select o.id,o.poll_id,q.question,o.label,o.sequence_no,case when q.finalized_at is not null then'final'when q.closes_at is not null and q.closes_at<=statement_timestamp()then'closed'else'open'end status,count(*)over()total_count from communications.poll_options o join communications.polls q on q.id=o.poll_id join communications.posts p on p.id=q.post_id join communications.channels c on c.id=p.channel_id where o.tenant_id=x.tenant_id and p.status='published'and communications.customer_channel_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,c.scope,c.property_id,c.building_id,c.unit_id)and(not(c.is_private or c.scope='direct')or exists(select 1 from communications.channel_members cm where cm.channel_id=c.id and cm.membership_id=x.membership_key and cm.tenant_id=x.tenant_id))order by q.created_at desc,o.sequence_no limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='notifications'then with q as(select n.id,n.type,n.title,n.body,n.created_at,n.read_at,(n.read_at is null)unread,(n.action_url is not null)action_available,count(*)over()total_count from communications.notifications n where n.tenant_id=x.tenant_id and n.membership_id=x.membership_key and(p_status is null or(p_status='unread'and n.read_at is null)or(p_status='read'and n.read_at is not null))and(p_from is null or n.created_at::date>=p_from)and(p_to is null or n.created_at::date<=p_to)and(p_query is null or n.title ilike'%'||trim(p_query)||'%'or coalesce(n.body,'')ilike'%'||trim(p_query)||'%')order by n.created_at desc,n.id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 else with q as(select l.id,l.post_id,p.title post_title,l.relation_type,case when l.meeting_id is not null then'meeting'when l.resolution_id is not null then'resolution'when l.work_order_id is not null then'work_order'when l.invoice_id is not null then'invoice'when l.document_id is not null then'document'else'audit_event'end entity_type,coalesce(m.title,r.title,w.title,i.invoice_no::text,d.title,a.action)entity_label,(l.document_id is not null)document_available,l.created_at,count(*)over()total_count from communications.communication_links l join communications.posts p on p.id=l.post_id join communications.channels c on c.id=p.channel_id left join governance.meetings m on m.id=l.meeting_id left join governance.resolutions r on r.id=l.resolution_id left join maintenance.work_orders w on w.id=l.work_order_id left join billing.invoices i on i.id=l.invoice_id left join documents.documents d on d.id=l.document_id left join audit.events a on a.id=l.audit_event_id where l.tenant_id=x.tenant_id and p.status='published'and communications.customer_channel_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,c.scope,c.property_id,c.building_id,c.unit_id)and(not(c.is_private or c.scope='direct')or exists(select 1 from communications.channel_members cm where cm.channel_id=c.id and cm.membership_id=x.membership_key and cm.tenant_id=x.tenant_id))order by l.created_at desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;end if;
 v_detail:=case when p_id is null then null else(select r from jsonb_array_elements(v_rows)r where r->>'id'=p_id::text limit 1)end;
 return jsonb_build_object('context',jsonb_build_object('id',x.id,'role',x.role_code,'scope',x.scope_type),'view',p_view,'total',coalesce(v_total,0),'rows',coalesce(v_rows,'[]'),'summary',v_summary,'detail',v_detail,'read_only',true,'anonymous_polls_aggregated',true,'generated_at',statement_timestamp());
end $$;
revoke all on function communications.get_customer_communications(uuid,text,text,text,date,date,integer,integer,uuid) from public,anon;
grant execute on function communications.get_customer_communications(uuid,text,text,text,date,date,integer,integer,uuid) to authenticated,service_role;
revoke select on all tables in schema communications from authenticated;
grant usage on schema communications to authenticated;

commit;
