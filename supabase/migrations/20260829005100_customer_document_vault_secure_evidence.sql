begin;

insert into identity.permissions(code,resource,action,description) values
('documents.vault.read','documents','read','Read authorized redacted document metadata and evidence availability')
on conflict(code) do nothing;
insert into identity.role_permissions(role_id,permission_id,effect)
select r.id,p.id,'allow' from identity.roles r cross join identity.permissions p
where lower(r.code) in ('association_admin','property_manager','president','censor','owner','tenant_resident') and p.code='documents.vault.read'
on conflict(role_id,permission_id) do update set effect='allow';

alter table documents.documents add column if not exists category text;
alter table documents.documents add column if not exists organizational_owner text;
alter table documents.documents add column if not exists effective_on date;
alter table documents.documents add column if not exists expires_on date;
alter table documents.documents add column if not exists published_at timestamptz;
alter table documents.documents add column if not exists archived_at timestamptz;
alter table documents.documents add column if not exists deleted_at timestamptz;
alter table documents.documents add column if not exists retention_snapshot jsonb not null default '{}'::jsonb;
alter table documents.document_versions add column if not exists published_at timestamptz;

create table documents.document_permissions(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references platform.tenants(id) on delete restrict,
 document_id uuid not null references documents.documents(id) on delete restrict,membership_id uuid references identity.memberships(id) on delete restrict,
 party_id uuid references portfolio.parties(id) on delete restrict,permission text not null default 'view' check(permission='view'),
 valid_from timestamptz not null default statement_timestamp(),valid_until timestamptz,created_at timestamptz not null default statement_timestamp(),
 check(num_nonnulls(membership_id,party_id)=1),check(valid_until is null or valid_until>valid_from)
);
create table documents.legal_holds(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references platform.tenants(id) on delete restrict,
 document_id uuid not null references documents.documents(id) on delete restrict,reason text not null check(length(trim(reason)) between 3 and 500),
 status text not null default 'active' check(status in('active','released')),applied_at timestamptz not null default statement_timestamp(),released_at timestamptz,
 evidence_hash text,created_at timestamptz not null default statement_timestamp(),check((status='active' and released_at is null)or(status='released' and released_at is not null))
);
create unique index document_active_legal_hold_unique on documents.legal_holds(document_id) where status='active';
create table documents.retention_records(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references platform.tenants(id) on delete restrict,
 document_id uuid not null references documents.documents(id) on delete restrict,policy_code text not null,retention_snapshot jsonb not null,
 retain_until date,disposition_status text not null default 'retained' check(disposition_status in('retained','review_due','legal_hold','expired','disposed')),
 calculated_at timestamptz not null default statement_timestamp(),finalized_at timestamptz
);
create table documents.lifecycle_events(
 id bigint generated always as identity primary key,tenant_id uuid not null references platform.tenants(id) on delete restrict,
 document_id uuid not null references documents.documents(id) on delete restrict,event_type text not null,status_from text,status_to text,
 reason text,rule_version integer not null default 1 check(rule_version>0),evidence_hash text,occurred_at timestamptz not null default statement_timestamp()
);
create table documents.document_audit_links(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references platform.tenants(id) on delete restrict,
 document_id uuid not null references documents.documents(id) on delete restrict,audit_event_id bigint not null references audit.events(id) on delete restrict,
 relation_type text not null default 'evidence',created_at timestamptz not null default statement_timestamp(),unique(document_id,audit_event_id,relation_type)
);
create index document_permissions_lookup_idx on documents.document_permissions(tenant_id,document_id,valid_from,valid_until,id);
create index document_permissions_document_id_idx on documents.document_permissions(document_id);
create index document_permissions_membership_idx on documents.document_permissions(membership_id);
create index document_permissions_party_idx on documents.document_permissions(party_id);
create index document_holds_lookup_idx on documents.legal_holds(tenant_id,document_id,status,id);
create index document_holds_document_id_idx on documents.legal_holds(document_id);
create index retention_records_lookup_idx on documents.retention_records(tenant_id,document_id,calculated_at desc,id);
create index retention_records_document_id_idx on documents.retention_records(document_id);
create index document_lifecycle_lookup_idx on documents.lifecycle_events(tenant_id,document_id,occurred_at desc,id desc);
create index document_lifecycle_document_id_idx on documents.lifecycle_events(document_id);
create index document_audit_links_lookup_idx on documents.document_audit_links(tenant_id,document_id,audit_event_id,id);
create index document_audit_links_event_idx on documents.document_audit_links(audit_event_id);
create index document_links_entity_lookup_idx on documents.document_links(tenant_id,entity_type,entity_id,document_id);
create index documents_list_lookup_idx on documents.documents(tenant_id,property_id,classification,status,created_at desc,id) where deleted_at is null;
create index document_versions_current_idx on documents.document_versions(tenant_id,document_id,version desc,id);

create or replace function documents.customer_document_scope_matches(p_scope text,p_property uuid,p_building uuid,p_unit uuid,p_target_property uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,portfolio
as $$ select case when p_target_property is null then p_scope='tenant' when p_scope='tenant' then true when p_scope='property' then p_property=p_target_property when p_scope='building' then exists(select 1 from portfolio.buildings b where b.id=p_building and b.property_id=p_target_property) when p_scope='unit' then exists(select 1 from portfolio.units u join portfolio.buildings b on b.id=u.building_id where u.id=p_unit and b.property_id=p_target_property) else false end $$;
revoke all on function documents.customer_document_scope_matches(text,uuid,uuid,uuid,uuid) from public,anon,authenticated;

create or replace function documents.enforce_customer_document_integrity()
returns trigger language plpgsql security definer set search_path=pg_catalog,documents,platform,portfolio,finance,billing,payments,maintenance,governance,communications,audit
as $$
declare d documents.documents;target_tenant uuid;
begin
 if tg_table_name='document_audit_links' then
  if tg_op<>'INSERT' then raise exception 'document_audit_link_is_immutable';end if;
  select * into d from documents.documents where id=new.document_id and tenant_id=new.tenant_id;
  select tenant_id into target_tenant from audit.events where id=new.audit_event_id;
  if d.id is null or target_tenant is null or target_tenant<>new.tenant_id then raise exception 'document_link_cross_tenant_or_missing';end if;return new;
 elsif tg_table_name='document_links' then
  if tg_op<>'INSERT' then raise exception 'document_link_is_immutable';end if;
  select * into d from documents.documents where id=new.document_id and tenant_id=new.tenant_id;
  if d.id is null then raise exception 'document_link_document_invalid';end if;
  if new.entity_type='platform.tenant' then select id into target_tenant from platform.tenants where id=new.entity_id;
  elsif new.entity_type='portfolio.property' then select tenant_id into target_tenant from portfolio.properties where id=new.entity_id;
  elsif new.entity_type='portfolio.building' then select tenant_id into target_tenant from portfolio.buildings where id=new.entity_id;
  elsif new.entity_type='portfolio.unit' then select tenant_id into target_tenant from portfolio.units where id=new.entity_id;
  elsif new.entity_type='platform.contract' then select w.tenant_id into target_tenant from platform.workspace_contracts c join platform.customer_workspaces w on w.id=c.customer_workspace_id where c.id=new.entity_id;
  elsif new.entity_type='billing.invoice' then select tenant_id into target_tenant from billing.invoices where id=new.entity_id;
  elsif new.entity_type='payments.payment' then select tenant_id into target_tenant from payments.payments where id=new.entity_id;
  elsif new.entity_type='finance.journal' then select tenant_id into target_tenant from finance.journals where id=new.entity_id;
  elsif new.entity_type='maintenance.work_order' then select tenant_id into target_tenant from maintenance.work_orders where id=new.entity_id;
  elsif new.entity_type='governance.meeting' then select tenant_id into target_tenant from governance.meetings where id=new.entity_id;
  elsif new.entity_type='governance.resolution' then select tenant_id into target_tenant from governance.resolutions where id=new.entity_id;
  elsif new.entity_type='communications.post' then select tenant_id into target_tenant from communications.posts where id=new.entity_id;
  else raise exception 'document_link_type_invalid';end if;
  if target_tenant is null or target_tenant<>new.tenant_id then raise exception 'document_link_cross_tenant_or_missing';end if;return new;
 elsif tg_table_name='documents' then
  if tg_op='DELETE' and(old.legal_hold or exists(select 1 from documents.legal_holds h where h.document_id=old.id and h.status='active'))then raise exception 'document_under_legal_hold';end if;
  if tg_op='UPDATE' then
   if old.legal_hold and new is distinct from old then raise exception 'document_under_legal_hold';end if;
   if old.published_at is not null and(new.current_version,new.title,new.document_type,new.effective_on,new.retention_snapshot)is distinct from(old.current_version,old.title,old.document_type,old.effective_on,old.retention_snapshot)then raise exception 'published_document_is_immutable';end if;
   if new.classification<old.classification then raise exception 'classification_downgrade_forbidden';end if;
  end if;return case when tg_op='DELETE'then old else new end;
 elsif tg_table_name='legal_holds' then
  if tg_op='DELETE' then raise exception 'legal_hold_history_is_append_only';end if;
  if tg_op='UPDATE' and old.status='released' and new is distinct from old then raise exception 'released_legal_hold_is_immutable';end if;return new;
 elsif tg_table_name='retention_records' then
  if tg_op='DELETE' or(tg_op='UPDATE' and old.finalized_at is not null and new is distinct from old)then raise exception 'final_retention_record_is_immutable';end if;return case when tg_op='DELETE'then old else new end;
 elsif tg_table_name='lifecycle_events' then if tg_op<>'INSERT'then raise exception 'document_lifecycle_is_append_only';end if;return new;
 end if;return case when tg_op='DELETE'then old else new end;
end $$;
drop trigger if exists customer_document_link_integrity on documents.document_links;
create trigger customer_document_link_integrity before insert or update or delete on documents.document_links for each row execute function documents.enforce_customer_document_integrity();
create trigger customer_document_audit_link_integrity before insert or update or delete on documents.document_audit_links for each row execute function documents.enforce_customer_document_integrity();
create trigger customer_document_integrity before update or delete on documents.documents for each row execute function documents.enforce_customer_document_integrity();
create trigger customer_legal_hold_integrity before update or delete on documents.legal_holds for each row execute function documents.enforce_customer_document_integrity();
create trigger customer_retention_integrity before update or delete on documents.retention_records for each row execute function documents.enforce_customer_document_integrity();
create trigger customer_document_lifecycle_integrity before update or delete on documents.lifecycle_events for each row execute function documents.enforce_customer_document_integrity();
revoke all on function documents.enforce_customer_document_integrity() from public,anon,authenticated;

alter table documents.document_permissions enable row level security;alter table documents.legal_holds enable row level security;alter table documents.retention_records enable row level security;alter table documents.lifecycle_events enable row level security;alter table documents.document_audit_links enable row level security;
grant all on documents.document_permissions,documents.legal_holds,documents.retention_records,documents.lifecycle_events,documents.document_audit_links to service_role;
grant usage,select on all sequences in schema documents to service_role;

create or replace function documents.get_customer_documents(p_context_id uuid,p_view text default 'documents',p_query text default null,p_status text default null,p_classification text default null,p_from date default null,p_to date default null,p_limit integer default 25,p_offset integer default 0,p_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog,documents,identity,platform,portfolio,occupancy
as $$
declare x record;v_workspace uuid;v_party uuid;v_resident boolean;v_tenant boolean;v_total bigint;v_rows jsonb;v_summary jsonb;v_detail jsonb;
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501';end if;
 if coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501';end if;
 if p_view not in('documents','versions','categories','retention','holds','evidence','links','history')or p_limit<1 or p_limit>100 or p_offset<0 then raise exception 'invalid_query' using errcode='22023';end if;
 if p_classification is not null and p_classification not in('public','internal','confidential','restricted')then raise exception 'invalid_classification' using errcode='22023';end if;
 select g.*,m.id membership_key,m.role_id,r.code role_code,r.name role_name into x from identity.context_grants g join identity.memberships m on m.id=g.membership_id and m.tenant_id=g.tenant_id join identity.roles r on r.id=m.role_id where g.id=p_context_id and m.user_id=auth.uid()and m.status='active'and m.starts_at<=statement_timestamp()and(m.ends_at is null or m.ends_at>statement_timestamp())and g.starts_at<=statement_timestamp()and(g.ends_at is null or g.ends_at>statement_timestamp());
 if not found then raise exception 'customer_context_access_denied' using errcode='42501';end if;
 if lower(x.role_code)not in('association_admin','property_manager','president','censor','owner','tenant_resident')then raise exception 'documents_role_denied' using errcode='42501';end if;
 if not exists(select 1 from identity.role_permissions rp join identity.permissions p on p.id=rp.permission_id where rp.role_id=x.role_id and rp.effect='allow'and p.code='documents.vault.read')then raise exception 'documents_permission_required' using errcode='42501';end if;
 select w.id into v_workspace from platform.customer_workspaces w where w.tenant_id=x.tenant_id and w.lifecycle_status='ACTIVE'order by w.id limit 1;
 if v_workspace is null or not exists(select 1 from platform.workspace_entitlements e where e.customer_workspace_id=v_workspace and e.entitlement_key='module.documents'and e.valid_from<=statement_timestamp()and(e.valid_until is null or e.valid_until>statement_timestamp())and(case when e.override_value_json is not null and e.override_expires_at>statement_timestamp()then e.override_value_json='true'::jsonb else e.boolean_value is true end))then raise exception 'documents_entitlement_required' using errcode='42501';end if;
 v_resident:=lower(x.role_code)in('owner','tenant_resident');v_tenant:=lower(x.role_code)='tenant_resident';
 if v_resident then select mp.party_id into v_party from identity.membership_parties mp where mp.membership_id=x.membership_key and mp.tenant_id=x.tenant_id;if v_party is null or x.scope_type<>'unit'then raise exception 'resident_party_and_unit_context_required' using errcode='42501';end if;
  if not v_tenant and not exists(select 1 from portfolio.ownerships o where o.tenant_id=x.tenant_id and o.unit_id=x.unit_id and o.party_id=v_party and o.valid_from<=current_date and(o.valid_to is null or o.valid_to>current_date))then raise exception 'ownership_required' using errcode='42501';end if;
  if v_tenant and not exists(select 1 from occupancy.leases l where l.tenant_id=x.tenant_id and l.unit_id=x.unit_id and l.tenant_party_id=v_party and l.status='active'and l.starts_on<=current_date and(l.ends_on is null or l.ends_on>current_date))then raise exception 'active_lease_required' using errcode='42501';end if;end if;
 with allowed as(select d.* from documents.documents d where d.tenant_id=x.tenant_id and d.deleted_at is null and documents.customer_document_scope_matches(x.scope_type::text,x.property_id,x.building_id,x.unit_id,d.property_id)and case lower(x.role_code)
  when'association_admin'then true when'property_manager'then d.classification<>'restricted'
  when'president'then d.classification<>'restricted'and(d.document_type ilike'governance%'or exists(select 1 from documents.document_links l where l.document_id=d.id and l.entity_type in('governance.meeting','governance.resolution')))
  when'censor'then d.classification<>'restricted'and(d.document_type ilike any(array['audit%','financial%','governance%'])or exists(select 1 from documents.document_links l where l.document_id=d.id and l.entity_type in('finance.journal','billing.invoice','governance.meeting','governance.resolution'))or exists(select 1 from documents.document_audit_links l where l.document_id=d.id))
  when'owner'then d.classification<>'restricted'and exists(select 1 from documents.document_links l where l.document_id=d.id and l.entity_type='portfolio.unit'and l.entity_id=x.unit_id)
  else d.classification='public'or exists(select 1 from documents.document_permissions a where a.document_id=d.id and a.tenant_id=x.tenant_id and(a.membership_id=x.membership_key or a.party_id=v_party)and a.valid_from<=statement_timestamp()and(a.valid_until is null or a.valid_until>statement_timestamp()))end)
 select jsonb_build_object('documents',count(*),'published',count(*)filter(where published_at is not null),'legal_hold',count(*)filter(where legal_hold or exists(select 1 from documents.legal_holds h where h.document_id=allowed.id and h.status='active')),'expiring',count(*)filter(where expires_on between current_date and current_date+30))into v_summary from allowed;
 if p_view='documents'then with q as(select d.id,d.title,d.document_type,d.category,d.classification,d.organizational_owner,d.current_version,d.status,d.created_at,d.effective_on,d.expires_on,d.retention_policy_code,case when d.legal_hold or exists(select 1 from documents.legal_holds h where h.document_id=d.id and h.status='active')then'active'else'none'end legal_hold_status,v.sha256 hash,(v.id is not null)evidence_available,((select count(*)from documents.document_links l where l.document_id=d.id)+(select count(*)from documents.document_audit_links l where l.document_id=d.id))linked_entity_count,count(*)over()total_count from allowed d left join lateral(select x.id,x.sha256 from documents.document_versions x where x.document_id=d.id and x.version=d.current_version order by x.id limit 1)v on true where(p_id is null or d.id=p_id)and(p_status is null or d.status::text=p_status)and(p_classification is null or d.classification::text=p_classification)and(p_from is null or d.created_at::date>=p_from)and(p_to is null or d.created_at::date<=p_to)and(p_query is null or d.title ilike'%'||trim(p_query)||'%'or d.document_type ilike'%'||trim(p_query)||'%'or coalesce(d.category,'')ilike'%'||trim(p_query)||'%')order by d.created_at desc,d.id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='versions'then with q as(select v.id,v.document_id,d.title document_title,v.version,v.sha256 hash,v.mime_type,v.size_bytes,v.published_at,v.created_at,(v.object_path is not null)evidence_available,count(*)over()total_count from documents.document_versions v join allowed d on d.id=v.document_id where(p_id is null or v.id=p_id)order by v.created_at desc,v.id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='categories'then with q as(select coalesce(d.category,d.document_type)category,d.classification::text,count(*)document_count,max(d.created_at)latest_at,count(*)over()total_count from allowed d group by coalesce(d.category,d.document_type),d.classification order by document_count desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='retention'then with q as(select r.id,r.document_id,d.title document_title,r.policy_code,r.retain_until,r.disposition_status,r.calculated_at,r.finalized_at,true snapshot_available,count(*)over()total_count from documents.retention_records r join allowed d on d.id=r.document_id where(p_status is null or r.disposition_status=p_status)order by r.calculated_at desc,r.id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='holds'then with q as(select h.id,h.document_id,d.title document_title,h.reason,h.status,h.applied_at,h.released_at,(h.evidence_hash is not null)evidence_available,count(*)over()total_count from documents.legal_holds h join allowed d on d.id=h.document_id where(p_status is null or h.status=p_status)order by h.applied_at desc,h.id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='evidence'then with q as(select d.id,d.title,d.current_version,v.sha256 hash,v.mime_type,v.size_bytes,(v.id is not null)evidence_available,v.created_at evidence_registered_at,count(*)over()total_count from allowed d left join lateral(select x.id,x.sha256,x.mime_type,x.size_bytes,x.created_at from documents.document_versions x where x.document_id=d.id and x.version=d.current_version order by x.id limit 1)v on true order by d.created_at desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='links'then with all_links as(select l.id,l.document_id,l.entity_type,l.relation_type,l.created_at,case l.entity_type when'platform.tenant'then(select t.legal_name from platform.tenants t where t.id=l.entity_id)when'portfolio.property'then(select p.name from portfolio.properties p where p.id=l.entity_id)when'portfolio.building'then(select b.name from portfolio.buildings b where b.id=l.entity_id)when'portfolio.unit'then(select u.unit_code from portfolio.units u where u.id=l.entity_id)when'platform.contract'then(select c.contract_ref from platform.workspace_contracts c where c.id=l.entity_id)when'billing.invoice'then(select i.invoice_no::text from billing.invoices i where i.id=l.entity_id)when'finance.journal'then(select j.journal_no::text from finance.journals j where j.id=l.entity_id)when'maintenance.work_order'then(select w.title from maintenance.work_orders w where w.id=l.entity_id)when'governance.meeting'then(select m.title from governance.meetings m where m.id=l.entity_id)when'governance.resolution'then(select r.title from governance.resolutions r where r.id=l.entity_id)when'communications.post'then(select p.title from communications.posts p where p.id=l.entity_id)else'Authorized record'end entity_label from documents.document_links l union all select l.id,l.document_id,'audit.event',l.relation_type,l.created_at,(select a.action from audit.events a where a.id=l.audit_event_id)from documents.document_audit_links l),q as(select l.id,d.title document_title,l.entity_type,l.entity_label,l.relation_type,l.created_at,count(*)over()total_count from all_links l join allowed d on d.id=l.document_id order by l.created_at desc,l.id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 else with q as(select h.id,h.document_id,d.title document_title,h.event_type,h.status_from,h.status_to,h.reason,h.rule_version,(h.evidence_hash is not null)evidence_available,h.occurred_at,count(*)over()total_count from documents.lifecycle_events h join allowed d on d.id=h.document_id order by h.occurred_at desc,h.id desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;end if;
 v_detail:=case when p_id is null then null else(select r from jsonb_array_elements(v_rows)r where r->>'id'=p_id::text limit 1)end;
 return jsonb_build_object('context',jsonb_build_object('id',x.id,'role',x.role_code,'scope',x.scope_type),'view',p_view,'total',coalesce(v_total,0),'rows',coalesce(v_rows,'[]'),'summary',v_summary,'detail',v_detail,'read_only',true,'storage_access',false,'signed_urls',false,'generated_at',statement_timestamp());
end $$;
revoke all on function documents.get_customer_documents(uuid,text,text,text,text,date,date,integer,integer,uuid) from public,anon;
grant execute on function documents.get_customer_documents(uuid,text,text,text,text,date,date,integer,integer,uuid) to authenticated,service_role;
revoke select on all tables in schema documents from authenticated;
grant usage on schema documents to authenticated;

commit;
