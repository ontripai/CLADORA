begin;

insert into identity.permissions(code,resource,action,description)
values('utilities.metering.read','utilities.metering','read','Read authorized metering, consumption and utility validation evidence')
on conflict(code) do nothing;

insert into identity.role_permissions(role_id,permission_id,effect)
select r.id,p.id,'allow' from identity.roles r cross join identity.permissions p
where p.code='utilities.metering.read' and lower(r.code) in ('association_admin','property_manager','president','censor','owner','tenant_resident')
on conflict(role_id,permission_id) do update set effect='allow';

create index if not exists meters_customer_scope_idx on utilities.meters(tenant_id,property_id,building_id,unit_id,status,id);
create index if not exists readings_customer_period_idx on utilities.meter_readings(tenant_id,meter_id,reading_at desc,status,id);
create index if not exists consumption_customer_period_idx on utilities.consumption_periods(tenant_id,meter_id,period_end desc,id);
create index if not exists contracts_customer_scope_idx on utilities.supply_contracts(tenant_id,property_id,building_id,unit_id,status,starts_on,ends_on,id);
create index if not exists provider_invoices_customer_period_idx on utilities.provider_invoices(tenant_id,contract_id,period_end desc,status,id);

create or replace function utilities.enforce_metering_integrity()
returns trigger language plpgsql security definer
set search_path=pg_catalog,utilities,portfolio
as $$
declare m utilities.meters; sr utilities.meter_readings; er utilities.meter_readings; delta numeric(20,6);
begin
  if tg_table_name='meters' then
    if tg_op='DELETE' then return old; end if;
    if not exists(select 1 from portfolio.properties p where p.id=new.property_id and p.tenant_id=new.tenant_id) then raise exception 'meter_property_scope_invalid'; end if;
    if new.building_id is not null and not exists(select 1 from portfolio.buildings b where b.id=new.building_id and b.tenant_id=new.tenant_id and b.property_id=new.property_id) then raise exception 'meter_building_scope_invalid'; end if;
    if new.unit_id is not null and not exists(select 1 from portfolio.units u join portfolio.buildings b on b.id=u.building_id where u.id=new.unit_id and u.tenant_id=new.tenant_id and b.property_id=new.property_id and (new.building_id is null or b.id=new.building_id)) then raise exception 'meter_unit_scope_invalid'; end if;
    if new.parent_meter_id is not null and not exists(select 1 from utilities.meters p where p.id=new.parent_meter_id and p.tenant_id=new.tenant_id and p.property_id=new.property_id and p.service_type=new.service_type) then raise exception 'parent_meter_scope_invalid'; end if;
    return new;
  end if;
  if tg_table_name='meter_readings' then
    if tg_op='DELETE' then return old; end if;
    select * into m from utilities.meters where id=new.meter_id and tenant_id=new.tenant_id;
    if not found then raise exception 'reading_meter_scope_invalid'; end if;
    if m.installed_on is not null and new.reading_at::date<m.installed_on or m.removed_on is not null and new.reading_at::date>m.removed_on then raise exception 'reading_outside_meter_lifecycle'; end if;
    return new;
  end if;
  if tg_op='DELETE' then raise exception 'consumption_snapshot_is_immutable'; end if;
  if tg_op='UPDATE' and new is distinct from old then raise exception 'consumption_snapshot_is_immutable'; end if;
  select * into m from utilities.meters where id=new.meter_id and tenant_id=new.tenant_id;
  select * into sr from utilities.meter_readings where id=new.start_reading_id and meter_id=new.meter_id and tenant_id=new.tenant_id and status='validated';
  select * into er from utilities.meter_readings where id=new.end_reading_id and meter_id=new.meter_id and tenant_id=new.tenant_id and status='validated';
  if m.id is null or sr.id is null or er.id is null then raise exception 'consumption_reading_scope_invalid'; end if;
  if sr.reading_at>=er.reading_at or new.period_start<>sr.reading_at or new.period_end<>er.reading_at then raise exception 'consumption_period_readings_mismatch'; end if;
  delta:=case when er.reading_value>=sr.reading_value then er.reading_value-sr.reading_value when m.rollover_value is not null then (m.rollover_value-sr.reading_value)+er.reading_value else -1 end;
  if delta<0 then raise exception 'negative_consumption'; end if;
  new.raw_consumption:=delta; new.adjusted_consumption:=delta*m.multiplier;
  new.calculation_snapshot:=jsonb_build_object('start_reading_id',sr.id,'end_reading_id',er.id,'start_value',sr.reading_value,'end_value',er.reading_value,'multiplier',m.multiplier,'rollover_value',m.rollover_value,'formula','delta_times_multiplier');
  return new;
end $$;

drop trigger if exists meters_integrity on utilities.meters;
create trigger meters_integrity before insert or update on utilities.meters for each row execute function utilities.enforce_metering_integrity();
drop trigger if exists meter_readings_integrity on utilities.meter_readings;
create trigger meter_readings_integrity before insert or update on utilities.meter_readings for each row execute function utilities.enforce_metering_integrity();
drop trigger if exists consumption_periods_integrity on utilities.consumption_periods;
create trigger consumption_periods_integrity before insert or update or delete on utilities.consumption_periods for each row execute function utilities.enforce_metering_integrity();

create or replace function utilities.enforce_utility_invoice_scope()
returns trigger language plpgsql security definer set search_path=pg_catalog,utilities
as $$ declare c utilities.supply_contracts; begin
  if tg_op='DELETE' then return old; end if;
  select * into c from utilities.supply_contracts where id=new.contract_id and tenant_id=new.tenant_id;
  if not found or c.provider_id<>new.provider_id then raise exception 'utility_invoice_contract_scope_invalid'; end if;
  if c.currency<>new.currency then raise exception 'utility_invoice_currency_mismatch'; end if;
  if c.status<>'active' or coalesce(new.period_start,new.issued_on,current_date)<c.starts_on or (c.ends_on is not null and coalesce(new.period_end,new.issued_on,current_date)>c.ends_on) then raise exception 'utility_contract_inactive_or_expired'; end if;
  return new;
end $$;
drop trigger if exists provider_invoices_scope_integrity on utilities.provider_invoices;
create trigger provider_invoices_scope_integrity before insert or update on utilities.provider_invoices for each row execute function utilities.enforce_utility_invoice_scope();

create or replace function utilities.customer_utility_scope_matches(p_scope text,p_property uuid,p_building uuid,p_unit uuid,target_property uuid,target_building uuid,target_unit uuid)
returns boolean language sql immutable set search_path=pg_catalog
as $$ select case p_scope when 'tenant' then true when 'property' then target_property=p_property when 'building' then target_building=p_building when 'unit' then target_unit=p_unit else false end $$;
revoke all on function utilities.customer_utility_scope_matches(text,uuid,uuid,uuid,uuid,uuid,uuid) from public,anon,authenticated;

create or replace function utilities.get_customer_utilities(
  p_context_id uuid,p_view text default 'meters',p_query text default null,p_status text default null,p_service text default null,
  p_from date default null,p_to date default null,p_limit integer default 25,p_offset integer default 0,p_id uuid default null
) returns jsonb language plpgsql stable security definer
set search_path=pg_catalog,utilities,identity,platform,portfolio,occupancy
as $$
declare v record; v_workspace uuid; v_property uuid; v_party uuid; v_resident boolean; v_tenant boolean;
  v_total bigint; v_rows jsonb; v_summary jsonb; v_detail jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501'; end if;
  if p_view not in ('meters','readings','periods','contracts','invoices','comparisons','anomalies') or p_limit<1 or p_limit>100 or p_offset<0 then raise exception 'invalid_query' using errcode='22023'; end if;
  if p_service is not null and p_service not in ('water','electricity','gas','heat','sewer','waste','internet','telephone','other') then raise exception 'invalid_service' using errcode='22023'; end if;
  select g.*,m.id membership_key,m.role_id,r.code role_code,r.name role_name,t.legal_name tenant_name into v
  from identity.context_grants g join identity.memberships m on m.id=g.membership_id and m.tenant_id=g.tenant_id
  join identity.roles r on r.id=m.role_id join platform.tenants t on t.id=m.tenant_id
  where g.id=p_context_id and m.user_id=auth.uid() and m.status='active'
    and m.starts_at<=statement_timestamp() and (m.ends_at is null or m.ends_at>statement_timestamp())
    and g.starts_at<=statement_timestamp() and (g.ends_at is null or g.ends_at>statement_timestamp());
  if not found then raise exception 'customer_context_access_denied' using errcode='42501'; end if;
  if lower(v.role_code) not in ('association_admin','property_manager','president','censor','owner','tenant_resident') then raise exception 'utility_role_denied' using errcode='42501'; end if;
  if not exists(select 1 from identity.role_permissions rp join identity.permissions p on p.id=rp.permission_id where rp.role_id=v.role_id and rp.effect='allow' and p.code='utilities.metering.read') then raise exception 'utility_permission_required' using errcode='42501'; end if;
  select w.id into v_workspace from platform.customer_workspaces w where w.tenant_id=v.tenant_id and w.lifecycle_status='ACTIVE' order by w.id limit 1;
  if v_workspace is null or not exists(select 1 from platform.workspace_entitlements e where e.customer_workspace_id=v_workspace and e.entitlement_key='module.utilities'
    and e.valid_from<=statement_timestamp() and (e.valid_until is null or e.valid_until>statement_timestamp())
    and (case when e.override_value_json is not null and e.override_expires_at>statement_timestamp() then e.override_value_json='true'::jsonb else e.boolean_value is true end))
    then raise exception 'utility_entitlement_required' using errcode='42501'; end if;
  v_property:=case when v.scope_type='property' then v.property_id when v.scope_type='building' then (select b.property_id from portfolio.buildings b where b.id=v.building_id and b.tenant_id=v.tenant_id)
    when v.scope_type='unit' then (select b.property_id from portfolio.units u join portfolio.buildings b on b.id=u.building_id where u.id=v.unit_id and u.tenant_id=v.tenant_id) else null end;
  v_resident:=lower(v.role_code) in ('owner','tenant_resident'); v_tenant:=lower(v.role_code)='tenant_resident';
  if v_resident then
    if v.scope_type<>'unit' then raise exception 'resident_unit_context_required' using errcode='42501'; end if;
    select mp.party_id into v_party from identity.membership_parties mp where mp.membership_id=v.membership_key and mp.tenant_id=v.tenant_id;
    if v_party is null then raise exception 'resident_party_mapping_required' using errcode='42501'; end if;
    if not v_tenant and not exists(select 1 from portfolio.ownerships o where o.tenant_id=v.tenant_id and o.unit_id=v.unit_id and o.party_id=v_party and o.valid_from<=current_date and (o.valid_to is null or o.valid_to>current_date)) then raise exception 'ownership_required' using errcode='42501'; end if;
    if v_tenant and not exists(select 1 from occupancy.leases l where l.tenant_id=v.tenant_id and l.unit_id=v.unit_id and l.tenant_party_id=v_party and l.status='active' and l.starts_on<=current_date and (l.ends_on is null or l.ends_on>current_date)) then raise exception 'active_lease_required' using errcode='42501'; end if;
  end if;

  if p_view='meters' then
    with filtered as (select m.id,m.service_type,m.scope,m.unit_code,m.multiplier,m.rollover_value,m.installed_on,m.removed_on,m.status,
      right(m.serial_fingerprint,8) serial_suffix,u.code unit_code_label,b.name building_name
      from utilities.meters m left join portfolio.units u on u.id=m.unit_id left join portfolio.buildings b on b.id=m.building_id
      where m.tenant_id=v.tenant_id and utilities.customer_utility_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,m.property_id,m.building_id,m.unit_id) and (not v_resident or m.unit_id=v.unit_id)
      and (p_id is null or m.id=p_id) and (p_status is null or m.status::text=p_status) and (p_service is null or m.service_type::text=p_service)
      and (p_query is null or trim(p_query)='' or coalesce(u.code,'') ilike '%'||trim(p_query)||'%' or coalesce(b.name,'') ilike '%'||trim(p_query)||'%' or m.serial_fingerprint ilike '%'||trim(p_query)||'%')),
    page as (select *,count(*) over() total_count from filtered order by service_type,id limit p_limit offset p_offset)
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(page)-'total_count' order by service_type,id),'[]') into v_total,v_rows from page;
  elsif p_view='readings' then
    with filtered as (select r.id,r.reading_at,r.reading_value,r.method,r.status,r.confidence,r.validated_at,r.note,
      (r.source_object_path is not null) evidence_available,m.id meter_id,m.service_type,m.unit_code,right(m.serial_fingerprint,8) serial_suffix,u.code unit_code_label
      from utilities.meter_readings r join utilities.meters m on m.id=r.meter_id and m.tenant_id=r.tenant_id left join portfolio.units u on u.id=m.unit_id
      where r.tenant_id=v.tenant_id and utilities.customer_utility_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,m.property_id,m.building_id,m.unit_id) and (not v_resident or m.unit_id=v.unit_id)
      and (p_id is null or r.id=p_id) and (p_status is null or r.status::text=p_status) and (p_service is null or m.service_type::text=p_service)
      and (p_from is null or r.reading_at::date>=p_from) and (p_to is null or r.reading_at::date<=p_to)
      and (p_query is null or trim(p_query)='' or coalesce(u.code,'') ilike '%'||trim(p_query)||'%' or m.serial_fingerprint ilike '%'||trim(p_query)||'%')),
    page as (select *,count(*) over() total_count from filtered order by reading_at desc,id desc limit p_limit offset p_offset)
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(page)-'total_count' order by reading_at desc,id desc),'[]') into v_total,v_rows from page;
  elsif p_view='periods' then
    with filtered as (select c.id,c.period_start,c.period_end,c.raw_consumption,c.adjusted_consumption,c.calculation_snapshot,m.id meter_id,m.service_type,m.unit_code,
      sr.reading_value start_value,er.reading_value end_value,sr.method start_method,er.method end_method,(sr.source_object_path is not null or er.source_object_path is not null) evidence_available
      from utilities.consumption_periods c join utilities.meters m on m.id=c.meter_id and m.tenant_id=c.tenant_id join utilities.meter_readings sr on sr.id=c.start_reading_id join utilities.meter_readings er on er.id=c.end_reading_id
      where c.tenant_id=v.tenant_id and utilities.customer_utility_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,m.property_id,m.building_id,m.unit_id) and (not v_resident or m.unit_id=v.unit_id)
      and (p_id is null or c.id=p_id) and (p_service is null or m.service_type::text=p_service) and (p_from is null or c.period_start::date>=p_from) and (p_to is null or c.period_end::date<=p_to)),
    page as (select *,count(*) over() total_count from filtered order by period_end desc,id desc limit p_limit offset p_offset)
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(page)-'total_count' order by period_end desc,id desc),'[]') into v_total,v_rows from page;
  elsif p_view='contracts' then
    with filtered as (select c.id,c.service_type,c.currency,c.starts_on,c.ends_on,c.status,p.legal_name provider_name,c.account_ref_fingerprint is not null account_reference_available,u.code unit_code_label,b.name building_name
      from utilities.supply_contracts c join utilities.providers p on p.id=c.provider_id left join portfolio.units u on u.id=c.unit_id left join portfolio.buildings b on b.id=c.building_id
      where c.tenant_id=v.tenant_id and utilities.customer_utility_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,c.property_id,c.building_id,c.unit_id) and (not v_resident or c.unit_id=v.unit_id)
      and (p_id is null or c.id=p_id) and (p_status is null or c.status::text=p_status) and (p_service is null or c.service_type::text=p_service)
      and (p_query is null or trim(p_query)='' or p.legal_name ilike '%'||trim(p_query)||'%' or coalesce(u.code,'') ilike '%'||trim(p_query)||'%')),
    page as (select *,count(*) over() total_count from filtered order by starts_on desc,id desc limit p_limit offset p_offset)
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(page)-'total_count' order by starts_on desc,id desc),'[]') into v_total,v_rows from page;
  elsif p_view='invoices' then
    with filtered as (select i.id,i.external_invoice_no,i.issued_on,i.due_on,i.period_start,i.period_end,i.currency,i.subtotal,i.tax_total,i.total,i.status,
      c.service_type,p.legal_name provider_name,(i.source_object_path is not null) evidence_available,i.approved_at,i.ledger_journal_id
      from utilities.provider_invoices i join utilities.supply_contracts c on c.id=i.contract_id and c.tenant_id=i.tenant_id join utilities.providers p on p.id=i.provider_id
      where i.tenant_id=v.tenant_id and utilities.customer_utility_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,c.property_id,c.building_id,c.unit_id) and (not v_resident or c.unit_id=v.unit_id)
      and (p_id is null or i.id=p_id) and (p_status is null or i.status::text=p_status) and (p_service is null or c.service_type::text=p_service)
      and (p_from is null or coalesce(i.period_start,i.issued_on)>=p_from) and (p_to is null or coalesce(i.period_end,i.issued_on)<=p_to)
      and (p_query is null or trim(p_query)='' or i.external_invoice_no ilike '%'||trim(p_query)||'%' or p.legal_name ilike '%'||trim(p_query)||'%')),
    page as (select *,count(*) over() total_count from filtered order by issued_on desc nulls last,id desc limit p_limit offset p_offset)
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(page)-'total_count' order by issued_on desc nulls last,id desc),'[]') into v_total,v_rows from page;
  elsif p_view='comparisons' then
    with filtered as (select x.id,x.billed_quantity,x.measured_quantity,x.quantity_variance,x.quantity_variance_pct,x.billed_amount,x.expected_amount,x.amount_variance,x.amount_variance_pct,x.status,x.calculation_snapshot,x.calculated_at,
      i.external_invoice_no,i.currency,c.service_type,m.unit_code,m.id meter_id
      from utilities.utility_comparisons x join utilities.provider_invoices i on i.id=x.invoice_id and i.tenant_id=x.tenant_id join utilities.supply_contracts c on c.id=i.contract_id left join utilities.meters m on m.id=x.meter_id
      where x.tenant_id=v.tenant_id and utilities.customer_utility_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,coalesce(m.property_id,c.property_id),coalesce(m.building_id,c.building_id),coalesce(m.unit_id,c.unit_id)) and (not v_resident or (m.unit_id=v.unit_id or c.unit_id=v.unit_id))
      and (p_id is null or x.id=p_id) and (p_status is null or x.status::text=p_status) and (p_service is null or c.service_type::text=p_service)
      and (p_query is null or trim(p_query)='' or i.external_invoice_no ilike '%'||trim(p_query)||'%')),
    page as (select *,count(*) over() total_count from filtered order by calculated_at desc,id desc limit p_limit offset p_offset)
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(page)-'total_count' order by calculated_at desc,id desc),'[]') into v_total,v_rows from page;
  else
    with filtered as (select a.id,a.type,a.severity,a.title,a.details_json,a.detected_at,a.acknowledged_at,a.resolved_at,m.unit_code,m.service_type
      from utilities.utility_anomalies a left join utilities.meters m on m.id=a.meter_id left join utilities.provider_invoices i on i.id=a.invoice_id left join utilities.supply_contracts c on c.id=i.contract_id
      where a.tenant_id=v.tenant_id and utilities.customer_utility_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,coalesce(m.property_id,c.property_id),coalesce(m.building_id,c.building_id),coalesce(m.unit_id,c.unit_id))
      and (not v_resident or coalesce(m.unit_id,c.unit_id)=v.unit_id) and (p_id is null or a.id=p_id) and (p_status is null or a.severity::text=p_status)
      and (p_service is null or coalesce(m.service_type,c.service_type)::text=p_service)
      and (p_from is null or a.detected_at::date>=p_from) and (p_to is null or a.detected_at::date<=p_to)
      and (p_query is null or trim(p_query)='' or a.title ilike '%'||trim(p_query)||'%')),
    page as (select *,count(*) over() total_count from filtered order by detected_at desc,id desc limit p_limit offset p_offset)
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(page)-'total_count' order by detected_at desc,id desc),'[]') into v_total,v_rows from page;
  end if;
  select jsonb_build_object(
    'meters',(select count(*) from utilities.meters m where m.tenant_id=v.tenant_id and utilities.customer_utility_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,m.property_id,m.building_id,m.unit_id) and (not v_resident or m.unit_id=v.unit_id)),
    'validated_readings',(select count(*) from utilities.meter_readings r join utilities.meters m on m.id=r.meter_id where r.tenant_id=v.tenant_id and r.status='validated' and utilities.customer_utility_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,m.property_id,m.building_id,m.unit_id) and (not v_resident or m.unit_id=v.unit_id)),
    'consumption',(select coalesce(sum(c.adjusted_consumption),0) from utilities.consumption_periods c join utilities.meters m on m.id=c.meter_id where c.tenant_id=v.tenant_id and utilities.customer_utility_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,m.property_id,m.building_id,m.unit_id) and (not v_resident or m.unit_id=v.unit_id)),
    'open_anomalies',(select count(*) from utilities.utility_anomalies a left join utilities.meters m on m.id=a.meter_id left join utilities.provider_invoices i on i.id=a.invoice_id left join utilities.supply_contracts c on c.id=i.contract_id where a.tenant_id=v.tenant_id and a.resolved_at is null and utilities.customer_utility_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,coalesce(m.property_id,c.property_id),coalesce(m.building_id,c.building_id),coalesce(m.unit_id,c.unit_id)) and (not v_resident or coalesce(m.unit_id,c.unit_id)=v.unit_id))
  ) into v_summary;
  if p_id is not null then v_detail:=case when v_total=1 then v_rows->0 else null end; end if;
  return jsonb_build_object('context',jsonb_build_object('id',v.id,'tenant_name',v.tenant_name,'role_code',v.role_code,'scope_type',v.scope_type),'view',p_view,'total',v_total,'rows',v_rows,'summary',v_summary,'detail',v_detail,'limit',p_limit,'offset',p_offset,'read_only',true,'generated_at',statement_timestamp());
end $$;

revoke all on function utilities.enforce_metering_integrity(),utilities.enforce_utility_invoice_scope() from public,anon,authenticated;
revoke all on function utilities.get_customer_utilities(uuid,text,text,text,text,date,date,integer,integer,uuid) from public,anon;
grant execute on function utilities.get_customer_utilities(uuid,text,text,text,text,date,date,integer,integer,uuid) to authenticated,service_role;

commit;
