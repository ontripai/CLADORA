begin;

insert into identity.permissions(code,resource,action,description) values
('occupancy.registry.read','occupancy.registry','read','Read authorized redacted parties, ownership, leases and occupancy')
on conflict(code) do nothing;
insert into identity.role_permissions(role_id,permission_id,effect)
select r.id,p.id,'allow' from identity.roles r cross join identity.permissions p
where lower(r.code) in('association_admin','property_manager','president','censor','owner','tenant_resident')and p.code='occupancy.registry.read'
on conflict(role_id,permission_id)do update set effect='allow';

alter table portfolio.ownerships add column if not exists finalized_at timestamptz;
alter table occupancy.leases add column if not exists finalized_at timestamptz;
alter table occupancy.occupancies add column if not exists finalized_at timestamptz;
alter table identity.membership_parties add column if not exists valid_from timestamptz not null default statement_timestamp();
alter table identity.membership_parties add column if not exists valid_until timestamptz;
alter table identity.membership_parties add column if not exists finalized_at timestamptz;
alter table identity.membership_parties drop constraint if exists membership_parties_valid_period;
alter table identity.membership_parties add constraint membership_parties_valid_period check(valid_until is null or valid_until>valid_from);

create table occupancy.lifecycle_events(
 id bigint generated always as identity primary key,tenant_id uuid not null references platform.tenants(id) on delete restrict,
 entity_type text not null check(entity_type in('party','ownership','lease','occupancy','resident','party_mapping')),
 entity_id uuid not null,event_type text not null,status_from text,status_to text,reason text,
 rule_version integer not null default 1 check(rule_version>0),occurred_at timestamptz not null default statement_timestamp()
);
create index occupancy_lifecycle_lookup_idx on occupancy.lifecycle_events(tenant_id,entity_type,entity_id,occurred_at desc,id desc);
create index ownerships_party_id_idx on portfolio.ownerships(party_id);
create index leases_landlord_party_idx on occupancy.leases(landlord_party_id);
create index leases_tenant_party_idx on occupancy.leases(tenant_party_id);
create index occupants_party_id_idx on occupancy.occupants(party_id);
create index occupancy_events_entity_idx on occupancy.lifecycle_events(entity_id);
create index membership_parties_validity_idx on identity.membership_parties(tenant_id,party_id,valid_from,valid_until);

create or replace function occupancy.enforce_customer_registry_integrity()
returns trigger language plpgsql security definer set search_path=pg_catalog,portfolio,occupancy,identity
as $$
declare v_tenant uuid;v_other uuid;v_share numeric;v_unit uuid;v_start timestamptz;v_end timestamptz;
begin
 if tg_table_schema='portfolio'and tg_table_name='ownerships' then
  if tg_op='DELETE'and old.finalized_at is not null then raise exception 'final_ownership_snapshot_is_immutable';end if;
  if tg_op='UPDATE'and old.finalized_at is not null and new is distinct from old then raise exception 'final_ownership_snapshot_is_immutable';end if;
  if tg_op<>'DELETE'then
   select tenant_id into v_tenant from portfolio.units where id=new.unit_id;select tenant_id into v_other from portfolio.parties where id=new.party_id;
   if v_tenant is null or v_tenant<>new.tenant_id or v_other<>new.tenant_id then raise exception 'ownership_cross_tenant_or_invalid_link';end if;
   select coalesce(sum(o.share),0)into v_share from portfolio.ownerships o where o.unit_id=new.unit_id and o.id<>new.id and daterange(o.valid_from,coalesce(o.valid_to,'infinity'::date),'[)')&&daterange(new.valid_from,coalesce(new.valid_to,'infinity'::date),'[)');
   if v_share+new.share>1 then raise exception 'ownership_share_exceeds_one';end if;
  end if;return case when tg_op='DELETE'then old else new end;
 elsif tg_table_schema='occupancy'and tg_table_name='leases'then
  if tg_op='DELETE'and old.finalized_at is not null then raise exception 'final_lease_snapshot_is_immutable';end if;
  if tg_op='UPDATE'and old.finalized_at is not null and new is distinct from old then raise exception 'final_lease_snapshot_is_immutable';end if;
  if tg_op<>'DELETE'then
   select tenant_id into v_tenant from portfolio.units where id=new.unit_id;select tenant_id into v_other from portfolio.parties where id=new.landlord_party_id;
   if v_tenant is null or v_tenant<>new.tenant_id or v_other<>new.tenant_id or not exists(select 1 from portfolio.parties p where p.id=new.tenant_party_id and p.tenant_id=new.tenant_id)then raise exception 'lease_cross_tenant_or_invalid_link';end if;
   if not exists(select 1 from portfolio.ownerships o where o.unit_id=new.unit_id and o.party_id=new.landlord_party_id and o.tenant_id=new.tenant_id and o.valid_from<=new.starts_on and(o.valid_to is null or o.valid_to>new.starts_on))then raise exception 'lease_landlord_ownership_required';end if;
   if new.status='active'and exists(select 1 from occupancy.leases l where l.id<>new.id and l.unit_id=new.unit_id and l.status='active'and daterange(l.starts_on,coalesce(l.ends_on,'infinity'::date),'[)')&&daterange(new.starts_on,coalesce(new.ends_on,'infinity'::date),'[)'))then raise exception 'overlapping_active_lease';end if;
  end if;return case when tg_op='DELETE'then old else new end;
 elsif tg_table_schema='occupancy'and tg_table_name='occupancies'then
  if tg_op='DELETE'and old.finalized_at is not null then raise exception 'final_occupancy_snapshot_is_immutable';end if;
  if tg_op='UPDATE'and old.finalized_at is not null and new is distinct from old then raise exception 'final_occupancy_snapshot_is_immutable';end if;
  if tg_op<>'DELETE'then
   select tenant_id into v_tenant from portfolio.units where id=new.unit_id;if v_tenant is null or v_tenant<>new.tenant_id then raise exception 'occupancy_cross_tenant_or_invalid_unit';end if;
   if new.status='active'and exists(select 1 from occupancy.occupancies o where o.id<>new.id and o.unit_id=new.unit_id and o.status='active'and(o.kind='empty'or new.kind='empty')and tstzrange(o.starts_at,coalesce(o.ends_at,'infinity'::timestamptz),'[)')&&tstzrange(new.starts_at,coalesce(new.ends_at,'infinity'::timestamptz),'[)'))then raise exception 'invalid_overlapping_occupancy';end if;
  end if;return case when tg_op='DELETE'then old else new end;
 elsif tg_table_schema='occupancy'and tg_table_name='occupants'then
  select o.tenant_id,o.unit_id,o.starts_at,o.ends_at into v_tenant,v_unit,v_start,v_end from occupancy.occupancies o where o.id=new.occupancy_id;
  select tenant_id into v_other from portfolio.parties where id=new.party_id;
  if v_tenant is null or v_other<>v_tenant then raise exception 'occupant_cross_tenant_or_invalid_link';end if;
  if lower(new.role)in('tenant','resident','household_member','short_stay')and not exists(select 1 from occupancy.leases l where l.tenant_id=v_tenant and l.unit_id=v_unit and(l.tenant_party_id=new.party_id or lower(new.role)<>'tenant')and l.status='active'and l.starts_on<=v_start::date and(l.ends_on is null or l.ends_on>=coalesce(v_end::date,v_start::date)))then raise exception 'occupant_outside_active_lease';end if;
  return new;
 elsif tg_table_schema='identity'and tg_table_name='membership_parties'then
  if tg_op='DELETE'and old.finalized_at is not null then raise exception 'final_party_mapping_is_immutable';end if;
  if tg_op='UPDATE'and old.finalized_at is not null and new is distinct from old then raise exception 'final_party_mapping_is_immutable';end if;
  if tg_op<>'DELETE'then
   select tenant_id into v_tenant from identity.memberships where id=new.membership_id;select tenant_id into v_other from portfolio.parties where id=new.party_id;
   if v_tenant is null or v_tenant<>new.tenant_id or v_other<>new.tenant_id then raise exception 'party_mapping_cross_tenant_or_invalid';end if;
  end if;return case when tg_op='DELETE'then old else new end;
 elsif tg_table_name='lifecycle_events'then if tg_op<>'INSERT'then raise exception 'occupancy_lifecycle_is_append_only';end if;return new;
 end if;return case when tg_op='DELETE'then old else new end;
end $$;
create trigger customer_ownership_integrity before insert or update or delete on portfolio.ownerships for each row execute function occupancy.enforce_customer_registry_integrity();
create trigger customer_lease_integrity before insert or update or delete on occupancy.leases for each row execute function occupancy.enforce_customer_registry_integrity();
create trigger customer_occupancy_integrity before insert or update or delete on occupancy.occupancies for each row execute function occupancy.enforce_customer_registry_integrity();
create trigger customer_occupant_integrity before insert or update on occupancy.occupants for each row execute function occupancy.enforce_customer_registry_integrity();
create trigger customer_party_mapping_integrity before insert or update or delete on identity.membership_parties for each row execute function occupancy.enforce_customer_registry_integrity();
create trigger customer_occupancy_lifecycle_integrity before update or delete on occupancy.lifecycle_events for each row execute function occupancy.enforce_customer_registry_integrity();
revoke all on function occupancy.enforce_customer_registry_integrity()from public,anon,authenticated;

alter table occupancy.lifecycle_events enable row level security;
grant all on occupancy.lifecycle_events to service_role;grant usage,select on all sequences in schema occupancy to service_role;

create or replace function occupancy.get_customer_registry(p_context_id uuid,p_view text default'occupancies',p_query text default null,p_status text default null,p_kind text default null,p_from date default null,p_to date default null,p_limit integer default 25,p_offset integer default 0,p_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog,occupancy,portfolio,identity,platform,billing,payments,utilities,maintenance,governance,documents,audit
as $$
declare x record;v_workspace uuid;v_party uuid;v_total bigint;v_rows jsonb;v_summary jsonb;v_detail jsonb;
begin
 if auth.uid()is null then raise exception'authentication_required'using errcode='42501';end if;
 if coalesce(auth.jwt()->>'aal','aal1')<>'aal2'then raise exception'mfa_required'using errcode='42501';end if;
 if p_view not in('parties','residents','ownerships','leases','occupancies','mappings','links','history')or p_limit<1 or p_limit>100 or p_offset<0 then raise exception'invalid_query'using errcode='22023';end if;
 if p_kind is not null and p_kind not in('owner','tenant','household_member','short_stay','company','empty')then raise exception'invalid_occupancy_kind'using errcode='22023';end if;
 select g.*,m.id membership_key,m.role_id,r.code role_code into x from identity.context_grants g join identity.memberships m on m.id=g.membership_id and m.tenant_id=g.tenant_id join identity.roles r on r.id=m.role_id where g.id=p_context_id and m.user_id=auth.uid()and m.status='active'and m.starts_at<=statement_timestamp()and(m.ends_at is null or m.ends_at>statement_timestamp())and g.starts_at<=statement_timestamp()and(g.ends_at is null or g.ends_at>statement_timestamp());
 if not found then raise exception'customer_context_access_denied'using errcode='42501';end if;
 if lower(x.role_code)not in('association_admin','property_manager','president','censor','owner','tenant_resident')then raise exception'occupancy_role_denied'using errcode='42501';end if;
 if not exists(select 1 from identity.role_permissions rp join identity.permissions p on p.id=rp.permission_id where rp.role_id=x.role_id and rp.effect='allow'and p.code='occupancy.registry.read')then raise exception'occupancy_permission_required'using errcode='42501';end if;
 select w.id into v_workspace from platform.customer_workspaces w where w.tenant_id=x.tenant_id and w.lifecycle_status='ACTIVE'order by w.id limit 1;
 if v_workspace is null or not exists(select 1 from platform.workspace_entitlements e where e.customer_workspace_id=v_workspace and e.entitlement_key='module.occupancy'and e.valid_from<=statement_timestamp()and(e.valid_until is null or e.valid_until>statement_timestamp())and(case when e.override_value_json is not null and e.override_expires_at>statement_timestamp()then e.override_value_json='true'::jsonb else e.boolean_value is true end))then raise exception'occupancy_entitlement_required'using errcode='42501';end if;
 if lower(x.role_code)in('owner','tenant_resident')then select mp.party_id into v_party from identity.membership_parties mp where mp.membership_id=x.membership_key and mp.tenant_id=x.tenant_id and mp.valid_from<=statement_timestamp()and(mp.valid_until is null or mp.valid_until>statement_timestamp());if v_party is null or x.scope_type<>'unit'then raise exception'resident_party_and_unit_context_required'using errcode='42501';end if;end if;
 with allowed_units as(select u.id,u.code unit_code,b.id building_id,b.name building_name,p.id property_id,p.name property_name from portfolio.units u join portfolio.buildings b on b.id=u.building_id join portfolio.properties p on p.id=b.property_id where u.tenant_id=x.tenant_id and(x.scope_type='tenant'or p.id=x.property_id or b.id=x.building_id or u.id=x.unit_id)and(case lower(x.role_code)when'owner'then exists(select 1 from portfolio.ownerships o where o.unit_id=u.id and o.party_id=v_party and o.valid_from<=current_date and(o.valid_to is null or o.valid_to>current_date))when'tenant_resident'then exists(select 1 from occupancy.leases l where l.unit_id=u.id and l.tenant_party_id=v_party and l.status='active'and l.starts_on<=current_date and(l.ends_on is null or l.ends_on>current_date))else true end))
 select jsonb_build_object('units',count(*),'occupied',count(*)filter(where exists(select 1 from occupancy.occupancies o where o.unit_id=allowed_units.id and o.status='active'and o.kind<>'empty'and o.starts_at<=statement_timestamp()and(o.ends_at is null or o.ends_at>statement_timestamp()))),'vacant',count(*)filter(where not exists(select 1 from occupancy.occupancies o where o.unit_id=allowed_units.id and o.status='active'and o.kind<>'empty'and o.starts_at<=statement_timestamp()and(o.ends_at is null or o.ends_at>statement_timestamp()))),'active_leases',sum((select count(*)from occupancy.leases l where l.unit_id=allowed_units.id and l.status='active'and l.starts_on<=current_date and(l.ends_on is null or l.ends_on>current_date))))into v_summary from allowed_units;
 if p_view='occupancies'then with allowed_units as(select u.id,u.code unit_code,b.name building_name,p.name property_name from portfolio.units u join portfolio.buildings b on b.id=u.building_id join portfolio.properties p on p.id=b.property_id where u.tenant_id=x.tenant_id and(x.scope_type='tenant'or p.id=x.property_id or b.id=x.building_id or u.id=x.unit_id)and(case lower(x.role_code)when'owner'then exists(select 1 from portfolio.ownerships z where z.unit_id=u.id and z.party_id=v_party and z.valid_from<=current_date and(z.valid_to is null or z.valid_to>current_date))when'tenant_resident'then exists(select 1 from occupancy.leases z where z.unit_id=u.id and z.tenant_party_id=v_party and z.status='active'and z.starts_on<=current_date and(z.ends_on is null or z.ends_on>current_date))else true end)),q as(select o.id,a.property_name,a.building_name,a.unit_code,o.kind::text,o.status::text,o.starts_at,o.ends_at,(select count(*)from occupancy.occupants z where z.occupancy_id=o.id)resident_count,o.finalized_at,count(*)over()total_count from occupancy.occupancies o join allowed_units a on a.id=o.unit_id where(p_id is null or o.id=p_id)and(p_status is null or o.status::text=p_status)and(p_kind is null or o.kind::text=p_kind)and(p_from is null or o.starts_at::date>=p_from)and(p_to is null or o.starts_at::date<=p_to)and(p_query is null or a.unit_code ilike'%'||trim(p_query)||'%'or a.building_name ilike'%'||trim(p_query)||'%')order by o.starts_at desc,o.id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='ownerships'then with q as(select o.id,u.code unit_code,b.name building_name,case when lower(x.role_code)in('association_admin','property_manager')or o.party_id=v_party then p.legal_name else'Owner · '||left(o.party_id::text,8)end party_label,p.type::text party_type,o.share,o.valid_from,o.valid_to,o.finalized_at,count(*)over()total_count from portfolio.ownerships o join portfolio.units u on u.id=o.unit_id join portfolio.buildings b on b.id=u.building_id join portfolio.parties p on p.id=o.party_id where o.tenant_id=x.tenant_id and(x.scope_type='tenant'or b.property_id=x.property_id or b.id=x.building_id or u.id=x.unit_id)and(lower(x.role_code)not in('owner','tenant_resident')or o.party_id=v_party)and(p_id is null or o.id=p_id)and(p_from is null or o.valid_from>=p_from)and(p_to is null or o.valid_from<=p_to)and(p_query is null or u.code ilike'%'||trim(p_query)||'%'or(lower(x.role_code)in('association_admin','property_manager')and p.legal_name ilike'%'||trim(p_query)||'%'))order by o.valid_from desc,o.id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='leases'then with q as(select l.id,u.code unit_code,b.name building_name,case when lower(x.role_code)in('association_admin','property_manager')or l.landlord_party_id=v_party then lp.legal_name else'Landlord · '||left(l.landlord_party_id::text,8)end landlord_label,case when lower(x.role_code)in('association_admin','property_manager')or l.tenant_party_id=v_party then tp.legal_name else'Tenant · '||left(l.tenant_party_id::text,8)end tenant_label,l.starts_on,l.ends_on,l.currency,l.status::text,l.finalized_at,count(*)over()total_count from occupancy.leases l join portfolio.units u on u.id=l.unit_id join portfolio.buildings b on b.id=u.building_id join portfolio.parties lp on lp.id=l.landlord_party_id join portfolio.parties tp on tp.id=l.tenant_party_id where l.tenant_id=x.tenant_id and(x.scope_type='tenant'or b.property_id=x.property_id or b.id=x.building_id or u.id=x.unit_id)and(lower(x.role_code)not in('owner','tenant_resident')or l.landlord_party_id=v_party or l.tenant_party_id=v_party)and(p_id is null or l.id=p_id)and(p_status is null or l.status::text=p_status)and(p_from is null or l.starts_on>=p_from)and(p_to is null or l.starts_on<=p_to)and(p_query is null or u.code ilike'%'||trim(p_query)||'%')order by l.starts_on desc,l.id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='residents'then with q as(select z.party_id id,u.code unit_code,b.name building_name,case when lower(x.role_code)in('association_admin','property_manager')or z.party_id=v_party then p.legal_name else'Resident · '||left(z.party_id::text,8)end resident_label,p.type::text party_type,z.role,z.resident_weight,o.kind::text,o.starts_at,o.ends_at,count(*)over()total_count from occupancy.occupants z join occupancy.occupancies o on o.id=z.occupancy_id join portfolio.units u on u.id=o.unit_id join portfolio.buildings b on b.id=u.building_id join portfolio.parties p on p.id=z.party_id where o.tenant_id=x.tenant_id and(x.scope_type='tenant'or b.property_id=x.property_id or b.id=x.building_id or u.id=x.unit_id)and(lower(x.role_code)not in('owner','tenant_resident')or z.party_id=v_party)and(p_query is null or u.code ilike'%'||trim(p_query)||'%'or(lower(x.role_code)in('association_admin','property_manager')and p.legal_name ilike'%'||trim(p_query)||'%'))order by o.starts_at desc,z.party_id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='parties'then with visible as(select distinct p.id,p.type,p.legal_name,p.created_at,p.archived_at from portfolio.parties p left join portfolio.ownerships ow on ow.party_id=p.id left join occupancy.leases l on l.landlord_party_id=p.id or l.tenant_party_id=p.id left join occupancy.occupants oc on oc.party_id=p.id left join occupancy.occupancies o on o.id=oc.occupancy_id where p.tenant_id=x.tenant_id and(lower(x.role_code)in('association_admin','property_manager','president','censor')or p.id=v_party)and(p_query is null or(lower(x.role_code)in('association_admin','property_manager')and p.legal_name ilike'%'||trim(p_query)||'%'))),q as(select id,type::text party_type,case when lower(x.role_code)in('association_admin','property_manager')or id=v_party then legal_name else'Party · '||left(id::text,8)end display_name,created_at,archived_at,count(*)over()total_count from visible order by created_at desc,id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='mappings'then with q as(select mp.party_id id,case when mp.party_id=v_party then p.legal_name else'Party · '||left(mp.party_id::text,8)end party_label,r.code role_code,mp.valid_from,mp.valid_until,mp.finalized_at,(mp.valid_from<=statement_timestamp()and(mp.valid_until is null or mp.valid_until>statement_timestamp()))active,count(*)over()total_count from identity.membership_parties mp join identity.memberships m on m.id=mp.membership_id join identity.roles r on r.id=m.role_id join portfolio.parties p on p.id=mp.party_id where mp.tenant_id=x.tenant_id and(lower(x.role_code)in('association_admin','property_manager')or mp.membership_id=x.membership_key)order by mp.valid_from desc,mp.party_id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='links'then with q as(select u.id,u.code unit_code,b.name building_name,p.name property_name,(select count(*)from billing.invoices i where i.unit_id=u.id)invoice_count,(select count(*)from payments.payments y where y.unit_id=u.id)payment_count,(select count(*)from utilities.meters m where m.unit_id=u.id)meter_count,(select count(*)from maintenance.work_orders w where w.unit_id=u.id)work_order_count,(select count(*)from documents.document_links d where d.entity_type='portfolio.unit'and d.entity_id=u.id)document_count,(select count(*)from audit.events a where a.tenant_id=x.tenant_id and a.entity_id=u.id)audit_event_count,count(*)over()total_count from portfolio.units u join portfolio.buildings b on b.id=u.building_id join portfolio.properties p on p.id=b.property_id where u.tenant_id=x.tenant_id and(x.scope_type='tenant'or p.id=x.property_id or b.id=x.building_id or u.id=x.unit_id)and(lower(x.role_code)not in('owner','tenant_resident')or u.id=x.unit_id)order by p.name,b.name,u.code limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 else with q as(select h.id,h.entity_type,h.entity_id,h.event_type,h.status_from,h.status_to,h.reason,h.rule_version,h.occurred_at,count(*)over()total_count from occupancy.lifecycle_events h where h.tenant_id=x.tenant_id and(lower(x.role_code)in('association_admin','property_manager','president','censor')or h.entity_id=v_party or h.entity_id=x.unit_id)order by h.occurred_at desc,h.id desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;end if;
 v_detail:=case when p_id is null then null else(select r from jsonb_array_elements(v_rows)r where r->>'id'=p_id::text limit 1)end;
 return jsonb_build_object('context',jsonb_build_object('id',x.id,'role',x.role_code,'scope',x.scope_type),'view',p_view,'total',coalesce(v_total,0),'rows',coalesce(v_rows,'[]'),'summary',coalesce(v_summary,'{}'),'detail',v_detail,'read_only',true,'pii_redacted',true,'generated_at',statement_timestamp());
end $$;
revoke all on function occupancy.get_customer_registry(uuid,text,text,text,text,date,date,integer,integer,uuid)from public,anon;
grant execute on function occupancy.get_customer_registry(uuid,text,text,text,text,date,date,integer,integer,uuid)to authenticated,service_role;
revoke select on all tables in schema occupancy from authenticated;
revoke select on portfolio.parties,portfolio.ownerships from authenticated;
revoke select on identity.membership_parties from authenticated;
grant usage on schema occupancy to authenticated;

commit;
