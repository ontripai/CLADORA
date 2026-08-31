begin;

create schema if not exists security_access;
revoke all on schema security_access from public,anon;

insert into identity.permissions(code,resource,action,description) values
('security.access.read','security.access','read','Read authorized redacted access points, credentials, visitor passes and access logs')
on conflict(code) do nothing;
insert into identity.role_permissions(role_id,permission_id,effect)
select r.id,p.id,'allow' from identity.roles r cross join identity.permissions p
where lower(r.code) in('association_admin','property_manager','president','censor','owner','tenant_resident') and p.code='security.access.read'
on conflict(role_id,permission_id) do update set effect='allow';

create type security_access.access_point_type as enum('entrance','door','gate');
create type security_access.credential_kind as enum('key','fob','access_card');
create type security_access.credential_status as enum('active','suspended','expired','revoked','lost','returned');
create type security_access.visitor_access_type as enum('visitor','contractor','delivery','vehicle');
create type security_access.visitor_status as enum('scheduled','active','used','expired','cancelled','denied');
create type security_access.access_decision as enum('allowed','denied');

create table security_access.access_points(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references platform.tenants(id) on delete restrict,
 property_id uuid not null references portfolio.properties(id) on delete restrict,building_id uuid not null references portfolio.buildings(id) on delete restrict,
 entrance_id uuid references portfolio.entrances(id) on delete restrict,unit_id uuid references portfolio.units(id) on delete restrict,
 point_type security_access.access_point_type not null,code text not null,name text not null,status platform.record_status not null default'active',
 created_at timestamptz not null default statement_timestamp(),finalized_at timestamptz,unique(tenant_id,building_id,code)
);
create table security_access.credentials(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references platform.tenants(id) on delete restrict,
 kind security_access.credential_kind not null,masked_identifier text not null check(masked_identifier !~ '^[[:alnum:]]{8,}$'),identifier_hash text not null,
 status security_access.credential_status not null default'active',valid_from timestamptz not null,valid_until timestamptz,
 last_used_at timestamptz,returned_at timestamptz,created_at timestamptz not null default statement_timestamp(),finalized_at timestamptz,
 check(valid_until is null or valid_until>valid_from),unique(tenant_id,identifier_hash)
);
create table security_access.credential_assignments(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references platform.tenants(id) on delete restrict,
 credential_id uuid not null references security_access.credentials(id) on delete restrict,party_id uuid not null references portfolio.parties(id) on delete restrict,
 unit_id uuid not null references portfolio.units(id) on delete restrict,access_point_id uuid references security_access.access_points(id) on delete restrict,
 starts_at timestamptz not null,ends_at timestamptz,returned_at timestamptz,created_at timestamptz not null default statement_timestamp(),finalized_at timestamptz,
 check(ends_at is null or ends_at>starts_at)
);
create table security_access.visitor_passes(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references platform.tenants(id) on delete restrict,
 unit_id uuid not null references portfolio.units(id) on delete restrict,access_point_id uuid not null references security_access.access_points(id) on delete restrict,
 invited_by_party_id uuid not null references portfolio.parties(id) on delete restrict,access_type security_access.visitor_access_type not null,
 visitor_label text not null,vehicle_masked text,status security_access.visitor_status not null default'scheduled',valid_from timestamptz not null,valid_until timestamptz not null,
 work_order_id uuid references maintenance.work_orders(id) on delete restrict,document_id uuid references documents.documents(id) on delete restrict,
 used_at timestamptz,created_at timestamptz not null default statement_timestamp(),finalized_at timestamptz,check(valid_until>valid_from)
);
create table security_access.access_events(
 id bigint generated always as identity primary key,tenant_id uuid not null references platform.tenants(id) on delete restrict,
 access_point_id uuid not null references security_access.access_points(id) on delete restrict,credential_id uuid references security_access.credentials(id) on delete restrict,
 visitor_pass_id uuid references security_access.visitor_passes(id) on delete restrict,party_id uuid references portfolio.parties(id) on delete restrict,
 unit_id uuid references portfolio.units(id) on delete restrict,decision security_access.access_decision not null,reason_code text not null,
 occurred_at timestamptz not null,recorded_at timestamptz not null default statement_timestamp(),finalized_at timestamptz not null default statement_timestamp(),
 check((credential_id is not null)::integer+(visitor_pass_id is not null)::integer=1)
);
create table security_access.credential_lifecycle(
 id bigint generated always as identity primary key,tenant_id uuid not null references platform.tenants(id) on delete restrict,
 credential_id uuid not null references security_access.credentials(id) on delete restrict,status_from security_access.credential_status,status_to security_access.credential_status not null,
 reason_code text not null,occurred_at timestamptz not null,finalized_at timestamptz not null default statement_timestamp()
);
create table security_access.visitor_access_history(
 id bigint generated always as identity primary key,tenant_id uuid not null references platform.tenants(id) on delete restrict,
 visitor_pass_id uuid not null references security_access.visitor_passes(id) on delete restrict,status_from security_access.visitor_status,status_to security_access.visitor_status not null,
 reason_code text not null,occurred_at timestamptz not null,finalized_at timestamptz not null default statement_timestamp()
);

create index access_points_tenant_property_idx on security_access.access_points(tenant_id,property_id,building_id);
create index access_points_entrance_id_idx on security_access.access_points(entrance_id);
create index access_points_unit_id_idx on security_access.access_points(unit_id);
create index credentials_tenant_status_idx on security_access.credentials(tenant_id,status,valid_from,valid_until);
create index credential_assignments_credential_id_idx on security_access.credential_assignments(credential_id);
create index credential_assignments_party_id_idx on security_access.credential_assignments(party_id);
create index credential_assignments_unit_id_idx on security_access.credential_assignments(unit_id);
create index credential_assignments_access_point_id_idx on security_access.credential_assignments(access_point_id);
create index visitor_passes_access_point_id_idx on security_access.visitor_passes(access_point_id);
create index visitor_passes_invited_by_party_id_idx on security_access.visitor_passes(invited_by_party_id);
create index visitor_passes_unit_id_idx on security_access.visitor_passes(unit_id);
create index visitor_passes_work_order_id_idx on security_access.visitor_passes(work_order_id);
create index visitor_passes_document_id_idx on security_access.visitor_passes(document_id);
create index access_events_access_point_id_idx on security_access.access_events(access_point_id);
create index access_events_credential_id_idx on security_access.access_events(credential_id);
create index access_events_visitor_pass_id_idx on security_access.access_events(visitor_pass_id);
create index access_events_party_id_idx on security_access.access_events(party_id);
create index access_events_unit_id_idx on security_access.access_events(unit_id);
create index access_events_tenant_time_idx on security_access.access_events(tenant_id,occurred_at desc,id desc);
create index credential_lifecycle_credential_id_idx on security_access.credential_lifecycle(credential_id);
create index visitor_history_pass_id_idx on security_access.visitor_access_history(visitor_pass_id);

create unique index credential_assignment_no_overlap on security_access.credential_assignments(credential_id,starts_at,coalesce(ends_at,'infinity'::timestamptz));

create or replace function security_access.credential_effective_status(p_status security_access.credential_status,p_from timestamptz,p_until timestamptz,p_returned timestamptz,p_at timestamptz)
returns security_access.credential_status language sql immutable set search_path=pg_catalog,security_access as $$
 select case when p_status in('revoked','lost','suspended')then p_status when p_returned is not null or p_status='returned'then'returned'::security_access.credential_status when p_at<p_from then'suspended'::security_access.credential_status when p_until is not null and p_at>=p_until then'expired'::security_access.credential_status else'active'::security_access.credential_status end;
$$;
create or replace function security_access.visitor_effective_status(p_status security_access.visitor_status,p_from timestamptz,p_until timestamptz,p_used timestamptz,p_at timestamptz)
returns security_access.visitor_status language sql immutable set search_path=pg_catalog,security_access as $$
 select case when p_status in('cancelled','denied')then p_status when p_used is not null or p_status='used'then'used'::security_access.visitor_status when p_at<p_from then'scheduled'::security_access.visitor_status when p_at>=p_until then'expired'::security_access.visitor_status else'active'::security_access.visitor_status end;
$$;

create or replace function security_access.enforce_access_integrity()
returns trigger language plpgsql security definer set search_path=pg_catalog,security_access,portfolio,occupancy,identity,maintenance,documents
as $$
declare v_tenant uuid;v_building uuid;v_property uuid;v_unit uuid;v_party uuid;v_credential uuid;v_from timestamptz;v_until timestamptz;
begin
 if tg_table_name in('access_events','credential_lifecycle','visitor_access_history')and tg_op<>'INSERT'then raise exception'access_history_is_append_only';end if;
 if tg_table_name='access_points'then
  if tg_op='DELETE'and old.finalized_at is not null then raise exception'final_access_point_is_immutable';end if;
  if tg_op='UPDATE'and old.finalized_at is not null and new is distinct from old then raise exception'final_access_point_is_immutable';end if;
  if tg_op<>'DELETE'then
   select b.tenant_id,b.property_id into v_tenant,v_property from portfolio.buildings b where b.id=new.building_id;
   if v_tenant is null or v_tenant<>new.tenant_id or v_property<>new.property_id or not exists(select 1 from portfolio.properties p where p.id=new.property_id and p.tenant_id=new.tenant_id) then raise exception'access_point_cross_tenant_or_invalid_scope';end if;
   if new.entrance_id is not null and not exists(select 1 from portfolio.entrances e where e.id=new.entrance_id and e.tenant_id=new.tenant_id and e.building_id=new.building_id)then raise exception'access_point_invalid_entrance';end if;
   if new.unit_id is not null and not exists(select 1 from portfolio.units u where u.id=new.unit_id and u.tenant_id=new.tenant_id and u.building_id=new.building_id and u.status='active')then raise exception'access_point_invalid_unit';end if;
  end if;
 elsif tg_table_name='credentials'then
  if tg_op='DELETE'and old.finalized_at is not null then raise exception'final_credential_snapshot_is_immutable';end if;
  if tg_op='UPDATE'and old.finalized_at is not null and new is distinct from old then raise exception'final_credential_snapshot_is_immutable';end if;
  if tg_op<>'DELETE'and new.status='active'and(new.valid_until is not null and new.valid_until<=statement_timestamp())then raise exception'expired_credential_cannot_be_active';end if;
 elsif tg_table_name='credential_assignments'then
  if tg_op='DELETE'and old.finalized_at is not null then raise exception'final_credential_assignment_is_immutable';end if;
  if tg_op='UPDATE'and old.finalized_at is not null and new is distinct from old then raise exception'final_credential_assignment_is_immutable';end if;
  if tg_op<>'DELETE'then
   select c.tenant_id into v_tenant from security_access.credentials c where c.id=new.credential_id;select p.tenant_id into v_party from portfolio.parties p where p.id=new.party_id;
   if v_tenant is null or v_tenant<>new.tenant_id or v_party<>new.tenant_id or not exists(select 1 from portfolio.units u where u.id=new.unit_id and u.tenant_id=new.tenant_id and u.status='active')then raise exception'credential_assignment_cross_tenant_or_invalid';end if;
   if new.access_point_id is not null and not exists(select 1 from security_access.access_points a join portfolio.units u on u.id=new.unit_id where a.id=new.access_point_id and a.tenant_id=new.tenant_id and(a.unit_id is null or a.unit_id=new.unit_id)and a.building_id=u.building_id)then raise exception'credential_access_point_out_of_scope';end if;
   if exists(select 1 from security_access.credential_assignments a where a.id<>new.id and a.credential_id=new.credential_id and tstzrange(a.starts_at,coalesce(a.ends_at,'infinity'::timestamptz),'[)')&&tstzrange(new.starts_at,coalesce(new.ends_at,'infinity'::timestamptz),'[)'))then raise exception'overlapping_credential_assignment';end if;
   if not exists(select 1 from identity.membership_parties mp where mp.tenant_id=new.tenant_id and mp.party_id=new.party_id and mp.valid_from<=new.starts_at and(mp.valid_until is null or mp.valid_until>new.starts_at))then raise exception'expired_party_mapping';end if;
   if not(exists(select 1 from portfolio.ownerships o where o.tenant_id=new.tenant_id and o.unit_id=new.unit_id and o.party_id=new.party_id and o.valid_from<=new.starts_at::date and(o.valid_to is null or o.valid_to>new.starts_at::date))or exists(select 1 from occupancy.leases l where l.tenant_id=new.tenant_id and l.unit_id=new.unit_id and l.tenant_party_id=new.party_id and l.status='active'and l.starts_on<=new.starts_at::date and(l.ends_on is null or l.ends_on>new.starts_at::date)))then raise exception'credential_ownership_or_lease_invalid';end if;
  end if;
 elsif tg_table_name='visitor_passes'then
  if tg_op='DELETE'and old.finalized_at is not null then raise exception'final_visitor_pass_is_immutable';end if;
  if tg_op='UPDATE'and old.finalized_at is not null and new is distinct from old then raise exception'final_visitor_pass_is_immutable';end if;
  if tg_op<>'DELETE'then
   if not exists(select 1 from portfolio.units u join security_access.access_points a on a.id=new.access_point_id where u.id=new.unit_id and u.tenant_id=new.tenant_id and u.status='active'and a.tenant_id=new.tenant_id and a.building_id=u.building_id and(a.unit_id is null or a.unit_id=u.id))then raise exception'visitor_access_point_out_of_scope';end if;
   if not exists(select 1 from portfolio.parties p where p.id=new.invited_by_party_id and p.tenant_id=new.tenant_id)then raise exception'visitor_cross_tenant_party';end if;
   if not exists(select 1 from identity.membership_parties mp where mp.tenant_id=new.tenant_id and mp.party_id=new.invited_by_party_id and mp.valid_from<=new.valid_from and(mp.valid_until is null or mp.valid_until>=new.valid_until))then raise exception'visitor_expired_party_mapping';end if;
   if not(exists(select 1 from portfolio.ownerships o where o.tenant_id=new.tenant_id and o.unit_id=new.unit_id and o.party_id=new.invited_by_party_id and o.valid_from<=new.valid_from::date and(o.valid_to is null or o.valid_to>=new.valid_until::date))or exists(select 1 from occupancy.leases l where l.tenant_id=new.tenant_id and l.unit_id=new.unit_id and l.tenant_party_id=new.invited_by_party_id and l.status='active'and l.starts_on<=new.valid_from::date and(l.ends_on is null or l.ends_on>=new.valid_until::date)))then raise exception'visitor_ownership_or_lease_invalid';end if;
   if new.work_order_id is not null and not exists(select 1 from maintenance.work_orders w where w.id=new.work_order_id and w.tenant_id=new.tenant_id and(w.unit_id is null or w.unit_id=new.unit_id))then raise exception'visitor_work_order_invalid';end if;
   if new.document_id is not null and not exists(select 1 from documents.documents d where d.id=new.document_id and d.tenant_id=new.tenant_id)then raise exception'visitor_document_invalid';end if;
  end if;
 elsif tg_table_name='access_events'then
  select a.tenant_id into v_tenant from security_access.access_points a where a.id=new.access_point_id;
  if v_tenant is null or v_tenant<>new.tenant_id then raise exception'access_event_cross_tenant_point';end if;
  if new.unit_id is not null and not exists(select 1 from portfolio.units u join security_access.access_points a on a.id=new.access_point_id where u.id=new.unit_id and u.tenant_id=new.tenant_id and a.building_id=u.building_id and(a.unit_id is null or a.unit_id=u.id))then raise exception'access_event_invalid_unit';end if;
  if new.credential_id is not null then
   select c.id,c.valid_from,c.valid_until into v_credential,v_from,v_until from security_access.credentials c where c.id=new.credential_id and c.tenant_id=new.tenant_id and security_access.credential_effective_status(c.status,c.valid_from,c.valid_until,c.returned_at,new.occurred_at)='active';
   if v_credential is null or not exists(select 1 from security_access.credential_assignments a where a.credential_id=new.credential_id and a.tenant_id=new.tenant_id and a.starts_at<=new.occurred_at and(a.ends_at is null or a.ends_at>new.occurred_at)and(a.access_point_id is null or a.access_point_id=new.access_point_id)and(new.unit_id is null or a.unit_id=new.unit_id))then if new.decision='allowed'then raise exception'ineligible_credential_cannot_allow_access';end if;end if;
  else
   if not exists(select 1 from security_access.visitor_passes v where v.id=new.visitor_pass_id and v.tenant_id=new.tenant_id and v.access_point_id=new.access_point_id and(new.unit_id is null or v.unit_id=new.unit_id)and security_access.visitor_effective_status(v.status,v.valid_from,v.valid_until,v.used_at,new.occurred_at)='active')then if new.decision='allowed'then raise exception'visitor_access_outside_invitation';end if;end if;
  end if;
 elsif tg_table_name='credential_lifecycle'then
  if not exists(select 1 from security_access.credentials c where c.id=new.credential_id and c.tenant_id=new.tenant_id)then raise exception'credential_lifecycle_cross_tenant';end if;
 elsif tg_table_name='visitor_access_history'then
  if not exists(select 1 from security_access.visitor_passes v where v.id=new.visitor_pass_id and v.tenant_id=new.tenant_id)then raise exception'visitor_history_cross_tenant';end if;
 end if;
 return case when tg_op='DELETE'then old else new end;
end $$;

create trigger security_access_points_integrity before insert or update or delete on security_access.access_points for each row execute function security_access.enforce_access_integrity();
create trigger security_credentials_integrity before insert or update or delete on security_access.credentials for each row execute function security_access.enforce_access_integrity();
create trigger security_assignments_integrity before insert or update or delete on security_access.credential_assignments for each row execute function security_access.enforce_access_integrity();
create trigger security_visitors_integrity before insert or update or delete on security_access.visitor_passes for each row execute function security_access.enforce_access_integrity();
create trigger security_events_integrity before insert or update or delete on security_access.access_events for each row execute function security_access.enforce_access_integrity();
create trigger security_credential_lifecycle_integrity before insert or update or delete on security_access.credential_lifecycle for each row execute function security_access.enforce_access_integrity();
create trigger security_visitor_history_integrity before insert or update or delete on security_access.visitor_access_history for each row execute function security_access.enforce_access_integrity();
revoke all on function security_access.enforce_access_integrity()from public,anon,authenticated;
revoke all on function security_access.credential_effective_status(security_access.credential_status,timestamptz,timestamptz,timestamptz,timestamptz)from public,anon,authenticated;
revoke all on function security_access.visitor_effective_status(security_access.visitor_status,timestamptz,timestamptz,timestamptz,timestamptz)from public,anon,authenticated;

do $$declare t text;begin foreach t in array array['access_points','credentials','credential_assignments','visitor_passes','access_events','credential_lifecycle','visitor_access_history']loop execute format('alter table security_access.%I enable row level security',t);end loop;end$$;
grant all on all tables in schema security_access to service_role;
grant usage,select on all sequences in schema security_access to service_role;

create or replace function security_access.get_customer_security_access(p_context_id uuid,p_view text default'access_points',p_query text default null,p_status text default null,p_kind text default null,p_from timestamptz default null,p_to timestamptz default null,p_limit integer default 25,p_offset integer default 0,p_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog,security_access,platform,identity,portfolio,occupancy,maintenance,documents,audit
as $$
declare x record;v_workspace uuid;v_party uuid;v_total bigint;v_rows jsonb;v_summary jsonb;v_detail jsonb;
begin
 if auth.uid()is null then raise exception'authentication_required'using errcode='42501';end if;
 if coalesce(auth.jwt()->>'aal','aal1')<>'aal2'then raise exception'mfa_required'using errcode='42501';end if;
 if p_view not in('access_points','credentials','visitors','access_logs','credential_history','visitor_history','links')or p_limit<1 or p_limit>100 or p_offset<0 then raise exception'invalid_query'using errcode='22023';end if;
 select g.*,m.id membership_key,m.role_id,r.code role_code into x from identity.context_grants g join identity.memberships m on m.id=g.membership_id and m.tenant_id=g.tenant_id join identity.roles r on r.id=m.role_id where g.id=p_context_id and m.user_id=auth.uid()and m.status='active'and m.starts_at<=statement_timestamp()and(m.ends_at is null or m.ends_at>statement_timestamp())and g.starts_at<=statement_timestamp()and(g.ends_at is null or g.ends_at>statement_timestamp());
 if not found then raise exception'customer_context_access_denied'using errcode='42501';end if;
 if lower(x.role_code)not in('association_admin','property_manager','president','censor','owner','tenant_resident')then raise exception'security_role_denied'using errcode='42501';end if;
 if(lower(x.role_code)='president'and p_view not in('access_points','access_logs','links'))or(lower(x.role_code)='censor'and p_view not in('access_logs','credential_history','visitor_history','links'))then raise exception'security_role_view_denied'using errcode='42501';end if;
 if not exists(select 1 from identity.role_permissions rp join identity.permissions p on p.id=rp.permission_id where rp.role_id=x.role_id and rp.effect='allow'and p.code='security.access.read')then raise exception'security_permission_required'using errcode='42501';end if;
 select w.id into v_workspace from platform.customer_workspaces w where w.tenant_id=x.tenant_id and w.lifecycle_status='ACTIVE'order by w.id limit 1;
 if v_workspace is null or not exists(select 1 from platform.workspace_entitlements e where e.customer_workspace_id=v_workspace and e.entitlement_key='module.security'and e.valid_from<=statement_timestamp()and(e.valid_until is null or e.valid_until>statement_timestamp())and(case when e.override_value_json is not null and e.override_expires_at>statement_timestamp()then e.override_value_json='true'::jsonb else e.boolean_value is true end))then raise exception'security_entitlement_required'using errcode='42501';end if;
 if lower(x.role_code)in('owner','tenant_resident')then select mp.party_id into v_party from identity.membership_parties mp where mp.membership_id=x.membership_key and mp.tenant_id=x.tenant_id and mp.valid_from<=statement_timestamp()and(mp.valid_until is null or mp.valid_until>statement_timestamp());if v_party is null then raise exception'active_party_mapping_required'using errcode='42501';end if;end if;
 with allowed_units as(select u.id from portfolio.units u join portfolio.buildings b on b.id=u.building_id where u.tenant_id=x.tenant_id and u.status='active'and(x.scope_type='tenant'or b.property_id=x.property_id or b.id=x.building_id or u.id=x.unit_id)and(case lower(x.role_code)when'owner'then exists(select 1 from portfolio.ownerships o where o.unit_id=u.id and o.party_id=v_party and o.valid_from<=current_date and(o.valid_to is null or o.valid_to>current_date))when'tenant_resident'then exists(select 1 from occupancy.leases l where l.unit_id=u.id and l.tenant_party_id=v_party and l.status='active'and l.starts_on<=current_date and(l.ends_on is null or l.ends_on>current_date))and exists(select 1 from occupancy.occupancies z join occupancy.occupants zo on zo.occupancy_id=z.id where z.unit_id=u.id and zo.party_id=v_party and z.status='active'and z.starts_at<=statement_timestamp()and(z.ends_at is null or z.ends_at>statement_timestamp()))else true end))select jsonb_build_object('access_points',(select count(*)from security_access.access_points a where a.tenant_id=x.tenant_id and(a.unit_id is null and exists(select 1 from allowed_units u join portfolio.units pu on pu.id=u.id where pu.building_id=a.building_id)or a.unit_id in(select id from allowed_units))),'active_credentials',(select count(*)from security_access.credential_assignments ca join security_access.credentials c on c.id=ca.credential_id where ca.unit_id in(select id from allowed_units)and security_access.credential_effective_status(c.status,c.valid_from,c.valid_until,c.returned_at,statement_timestamp())='active'and ca.starts_at<=statement_timestamp()and(ca.ends_at is null or ca.ends_at>statement_timestamp())),'valid_visitors',(select count(*)from security_access.visitor_passes v where v.unit_id in(select id from allowed_units)and security_access.visitor_effective_status(v.status,v.valid_from,v.valid_until,v.used_at,statement_timestamp())in('scheduled','active')),'recent_denied',(select count(*)from security_access.access_events e where e.unit_id in(select id from allowed_units)and e.decision='denied'and e.occurred_at>=statement_timestamp()-interval'24 hours'))into v_summary;
 if p_view='access_points'then with q as(select a.id,a.point_type::text,a.code,a.name,a.status::text,p.name property_name,b.name building_name,e.name entrance_name,u.code unit_code,count(*)over()total_count from security_access.access_points a join portfolio.properties p on p.id=a.property_id join portfolio.buildings b on b.id=a.building_id left join portfolio.entrances e on e.id=a.entrance_id left join portfolio.units u on u.id=a.unit_id where a.tenant_id=x.tenant_id and(x.scope_type='tenant'or a.property_id=x.property_id or a.building_id=x.building_id or a.unit_id=x.unit_id)and(lower(x.role_code)not in('owner','tenant_resident')or(a.unit_id=x.unit_id or exists(select 1 from portfolio.units xu where xu.id=x.unit_id and xu.building_id=a.building_id and a.unit_id is null)))and(p_id is null or a.id=p_id)and(p_status is null or a.status::text=p_status)and(p_kind is null or a.point_type::text=p_kind)and(p_query is null or a.name ilike'%'||trim(p_query)||'%'or a.code ilike'%'||trim(p_query)||'%')order by p.name,b.name,a.code limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='credentials'then with q as(select c.id,c.kind::text,c.masked_identifier,security_access.credential_effective_status(c.status,c.valid_from,c.valid_until,c.returned_at,statement_timestamp())::text effective_status,ca.unit_id,u.code unit_code,case when ca.party_id=v_party or lower(x.role_code)in('association_admin','property_manager')then p.legal_name else'Party · '||left(ca.party_id::text,8)end assigned_party,c.valid_from,c.valid_until,c.last_used_at,ca.returned_at,(c.valid_from<=statement_timestamp()and(c.valid_until is null or c.valid_until>statement_timestamp())and ca.starts_at<=statement_timestamp()and(ca.ends_at is null or ca.ends_at>statement_timestamp())) access_period_eligible,(exists(select 1 from identity.membership_parties mp where mp.tenant_id=c.tenant_id and mp.party_id=ca.party_id and mp.valid_from<=statement_timestamp()and(mp.valid_until is null or mp.valid_until>statement_timestamp()))) context_eligible,count(*)over()total_count from security_access.credentials c join security_access.credential_assignments ca on ca.credential_id=c.id join portfolio.units u on u.id=ca.unit_id join portfolio.parties p on p.id=ca.party_id where c.tenant_id=x.tenant_id and(x.scope_type='tenant'or u.id=x.unit_id or u.building_id=x.building_id or exists(select 1 from portfolio.buildings b where b.id=u.building_id and b.property_id=x.property_id))and(lower(x.role_code)not in('owner','tenant_resident')or ca.party_id=v_party)and(p_id is null or c.id=p_id)and(p_status is null or security_access.credential_effective_status(c.status,c.valid_from,c.valid_until,c.returned_at,statement_timestamp())::text=p_status)and(p_kind is null or c.kind::text=p_kind)and(p_from is null or c.valid_from>=p_from)and(p_to is null or c.valid_from<=p_to)and(p_query is null or c.masked_identifier ilike'%'||trim(p_query)||'%'or u.code ilike'%'||trim(p_query)||'%')order by c.valid_from desc,c.id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='visitors'then with q as(select v.id,v.access_type::text,left(v.visitor_label,1)||'***' visitor_label,v.vehicle_masked,security_access.visitor_effective_status(v.status,v.valid_from,v.valid_until,v.used_at,statement_timestamp())::text effective_status,u.code unit_code,a.name access_point,v.valid_from,v.valid_until,v.used_at,(v.valid_from<=statement_timestamp()and v.valid_until>statement_timestamp()) access_period_eligible,(exists(select 1 from identity.membership_parties mp where mp.tenant_id=v.tenant_id and mp.party_id=v.invited_by_party_id and mp.valid_from<=statement_timestamp()and(mp.valid_until is null or mp.valid_until>statement_timestamp()))) context_eligible,(v.work_order_id is not null) work_order_linked,(v.document_id is not null) document_linked,count(*)over()total_count from security_access.visitor_passes v join portfolio.units u on u.id=v.unit_id join security_access.access_points a on a.id=v.access_point_id where v.tenant_id=x.tenant_id and(x.scope_type='tenant'or u.id=x.unit_id or u.building_id=x.building_id or exists(select 1 from portfolio.buildings b where b.id=u.building_id and b.property_id=x.property_id))and(lower(x.role_code)not in('owner','tenant_resident')or v.invited_by_party_id=v_party)and(p_id is null or v.id=p_id)and(p_status is null or security_access.visitor_effective_status(v.status,v.valid_from,v.valid_until,v.used_at,statement_timestamp())::text=p_status)and(p_kind is null or v.access_type::text=p_kind)and(p_from is null or v.valid_from>=p_from)and(p_to is null or v.valid_from<=p_to)and(p_query is null or u.code ilike'%'||trim(p_query)||'%'or v.vehicle_masked ilike'%'||trim(p_query)||'%')order by v.valid_from desc,v.id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='access_logs'then with q as(select e.id::text id,e.decision::text,e.reason_code,e.occurred_at,a.name access_point,u.code unit_code,case when e.credential_id is not null then c.masked_identifier else'Visitor pass · '||left(e.visitor_pass_id::text,8)end credential_or_pass,(e.decision='allowed') access_eligible,count(*)over()total_count from security_access.access_events e join security_access.access_points a on a.id=e.access_point_id left join portfolio.units u on u.id=e.unit_id left join security_access.credentials c on c.id=e.credential_id where e.tenant_id=x.tenant_id and(x.scope_type='tenant'or a.property_id=x.property_id or a.building_id=x.building_id or e.unit_id=x.unit_id)and(lower(x.role_code)not in('owner','tenant_resident')or e.party_id=v_party or e.unit_id=x.unit_id)and(p_status is null or e.decision::text=p_status)and(p_from is null or e.occurred_at>=p_from)and(p_to is null or e.occurred_at<=p_to)and(p_query is null or a.name ilike'%'||trim(p_query)||'%'or e.reason_code ilike'%'||trim(p_query)||'%')order by e.occurred_at desc,e.id desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='credential_history'then with q as(select h.id::text id,c.masked_identifier,h.status_from::text,h.status_to::text,h.reason_code,h.occurred_at,count(*)over()total_count from security_access.credential_lifecycle h join security_access.credentials c on c.id=h.credential_id where h.tenant_id=x.tenant_id and(lower(x.role_code)not in('owner','tenant_resident')or exists(select 1 from security_access.credential_assignments ca where ca.credential_id=c.id and ca.party_id=v_party))order by h.occurred_at desc,h.id desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='visitor_history'then with q as(select h.id::text id,'Visitor pass · '||left(h.visitor_pass_id::text,8)visitor_pass,h.status_from::text,h.status_to::text,h.reason_code,h.occurred_at,count(*)over()total_count from security_access.visitor_access_history h join security_access.visitor_passes v on v.id=h.visitor_pass_id where h.tenant_id=x.tenant_id and(lower(x.role_code)not in('owner','tenant_resident')or v.invited_by_party_id=v_party)order by h.occurred_at desc,h.id desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 else with q as(select a.id,a.name access_point,a.point_type::text,p.name property_name,b.name building_name,(select count(*)from security_access.credentials c join security_access.credential_assignments ca on ca.credential_id=c.id where ca.access_point_id=a.id)credential_count,(select count(*)from security_access.visitor_passes v where v.access_point_id=a.id)visitor_pass_count,(select count(*)from security_access.access_events e where e.access_point_id=a.id)access_event_count,(select count(*)from maintenance.work_orders w where w.tenant_id=a.tenant_id and(w.building_id=a.building_id or w.unit_id=a.unit_id))work_order_count,(select count(*)from documents.document_links d where d.tenant_id=a.tenant_id and d.entity_type='portfolio.unit'and d.entity_id=a.unit_id)document_count,(select count(*)from audit.events ae where ae.tenant_id=a.tenant_id and(ae.entity_id=a.id or ae.entity_id=a.unit_id))audit_event_count,count(*)over()total_count from security_access.access_points a join portfolio.properties p on p.id=a.property_id join portfolio.buildings b on b.id=a.building_id where a.tenant_id=x.tenant_id and(x.scope_type='tenant'or a.property_id=x.property_id or a.building_id=x.building_id or a.unit_id=x.unit_id)order by p.name,b.name,a.name limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;end if;
 v_detail:=case when p_id is null then null else(select r from jsonb_array_elements(v_rows)r where r->>'id'=p_id::text limit 1)end;
 return jsonb_build_object('context',jsonb_build_object('id',x.id,'role',x.role_code,'scope',x.scope_type),'view',p_view,'total',coalesce(v_total,0),'rows',coalesce(v_rows,'[]'),'summary',coalesce(v_summary,'{}'),'detail',v_detail,'read_only',true,'credential_data_masked',true,'physical_control',false,'generated_at',statement_timestamp());
end $$;

revoke all on function security_access.get_customer_security_access(uuid,text,text,text,text,timestamptz,timestamptz,integer,integer,uuid)from public,anon;
grant execute on function security_access.get_customer_security_access(uuid,text,text,text,text,timestamptz,timestamptz,integer,integer,uuid)to authenticated,service_role;
revoke select,insert,update,delete on all tables in schema security_access from authenticated,anon;
grant usage on schema security_access to authenticated;

commit;
