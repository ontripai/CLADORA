begin;

insert into identity.permissions(code,resource,action,description)
values ('maintenance.assets.read','maintenance','read','Read authorized assets and maintenance evidence')
on conflict(code) do update set resource=excluded.resource,action=excluded.action,description=excluded.description;

insert into identity.role_permissions(role_id,permission_id,effect)
select r.id,p.id,'allow' from identity.roles r cross join identity.permissions p
where lower(r.code) in ('association_admin','property_manager','president','censor','owner','tenant_resident')
  and p.code='maintenance.assets.read'
on conflict(role_id,permission_id) do update set effect='allow';

alter table maintenance.work_order_costs
  add column if not exists invoice_id uuid references billing.invoices(id) on delete restrict;
create index if not exists work_order_costs_invoice_idx on maintenance.work_order_costs(invoice_id) where invoice_id is not null;

create unique index if not exists work_orders_active_plan_asset_unique
  on maintenance.work_orders(tenant_id,asset_id,plan_id)
  where asset_id is not null and plan_id is not null and status in ('draft','scheduled','assigned','in_progress','blocked');
create unique index if not exists work_orders_active_ad_hoc_asset_title_unique
  on maintenance.work_orders(tenant_id,asset_id,lower(title))
  where asset_id is not null and plan_id is null and status in ('draft','scheduled','assigned','in_progress','blocked');

create or replace function maintenance.customer_maintenance_scope_matches(p_scope text,p_property uuid,p_building uuid,p_unit uuid,target_property uuid,target_building uuid,target_unit uuid)
returns boolean language sql immutable set search_path=pg_catalog
as $$ select case p_scope when 'tenant' then true when 'property' then target_property=p_property when 'building' then target_building=p_building when 'unit' then target_unit=p_unit else false end $$;
revoke all on function maintenance.customer_maintenance_scope_matches(text,uuid,uuid,uuid,uuid,uuid,uuid) from public,anon,authenticated;

create or replace function maintenance.enforce_customer_maintenance_integrity()
returns trigger language plpgsql security definer set search_path=pg_catalog,assets,maintenance,portfolio,billing,finance
as $$
declare a assets.assets; w maintenance.work_orders; p maintenance.maintenance_plans; v maintenance.vendors; c maintenance.vendor_contracts;
begin
  if tg_table_schema='assets' and tg_table_name='assets' then
    if tg_op='DELETE' then
      if old.condition='retired' or old.retired_at is not null then raise exception 'retired_asset_is_immutable'; end if;
      return old;
    end if;
    if new.building_id is not null and not exists(select 1 from portfolio.buildings b where b.id=new.building_id and b.tenant_id=new.tenant_id and b.property_id=new.property_id) then raise exception 'asset_building_scope_invalid'; end if;
    if new.unit_id is not null and not exists(select 1 from portfolio.units u join portfolio.buildings b on b.id=u.building_id where u.id=new.unit_id and u.tenant_id=new.tenant_id and b.property_id=new.property_id and (new.building_id is null or b.id=new.building_id)) then raise exception 'asset_unit_scope_invalid'; end if;
    if tg_op='UPDATE' and (old.condition='retired' or old.retired_at is not null) and new is distinct from old then raise exception 'retired_asset_is_immutable'; end if;
    return new;
  elsif tg_table_schema='assets' and tg_table_name='asset_components' then
    if tg_op='DELETE' then return old; end if;
    select * into a from assets.assets where id=new.parent_asset_id and tenant_id=new.tenant_id;
    if not found or not exists(select 1 from assets.assets ca where ca.id=new.component_asset_id and ca.tenant_id=new.tenant_id and ca.property_id=a.property_id and (a.unit_id is null or ca.unit_id=a.unit_id)) then raise exception 'asset_component_scope_invalid'; end if;
    return new;
  elsif tg_table_schema='maintenance' and tg_table_name='maintenance_plans' then
    if tg_op='DELETE' then return old; end if;
    select * into a from assets.assets where id=new.asset_id and tenant_id=new.tenant_id;
    if not found then raise exception 'maintenance_plan_asset_scope_invalid'; end if;
    return new;
  elsif tg_table_schema='maintenance' and tg_table_name='work_orders' then
    if tg_op='DELETE' then if old.status in ('completed','verified') then raise exception 'final_work_order_is_immutable'; end if; return old; end if;
    if new.asset_id is not null then select * into a from assets.assets where id=new.asset_id and tenant_id=new.tenant_id; if not found or a.property_id<>new.property_id or a.building_id is distinct from new.building_id or a.unit_id is distinct from new.unit_id then raise exception 'work_order_asset_scope_invalid'; end if; end if;
    if new.plan_id is not null then select * into p from maintenance.maintenance_plans where id=new.plan_id and tenant_id=new.tenant_id; if not found or new.asset_id is null or p.asset_id<>new.asset_id then raise exception 'work_order_plan_scope_invalid'; end if; end if;
    if tg_op='UPDATE' and old.status='verified' and new is distinct from old then raise exception 'final_work_order_is_immutable'; end if;
    if tg_op='UPDATE' and old.status='completed' and new is distinct from old
      and (new.status=old.status or (to_jsonb(new)-'status'-'verified_at'-'completed_at') is distinct from (to_jsonb(old)-'status'-'verified_at'-'completed_at'))
    then raise exception 'final_work_order_is_immutable'; end if;
    return new;
  elsif tg_table_schema='maintenance' and tg_table_name in ('work_order_checklist_items','work_order_events') then
    if tg_table_name='work_order_events' and tg_op<>'INSERT' then raise exception 'work_order_events_are_append_only'; end if;
    select * into w from maintenance.work_orders where id=case when tg_op='DELETE' then old.work_order_id else new.work_order_id end and tenant_id=case when tg_op='DELETE' then old.tenant_id else new.tenant_id end;
    if not found then raise exception 'work_order_child_scope_invalid'; end if;
    if w.status in ('completed','verified') then raise exception 'final_work_order_is_immutable'; end if;
    return case when tg_op='DELETE' then old else new end;
  elsif tg_table_schema='maintenance' and tg_table_name='work_order_assignments' then
    select * into w from maintenance.work_orders where id=case when tg_op='DELETE' then old.work_order_id else new.work_order_id end and tenant_id=case when tg_op='DELETE' then old.tenant_id else new.tenant_id end;
    if tg_op='DELETE' then if w.status in ('completed','verified') then raise exception 'final_work_order_is_immutable'; end if; return old; end if;
    select * into v from maintenance.vendors where id=new.vendor_id and tenant_id=new.tenant_id;
    if w.id is null or v.id is null then raise exception 'assignment_scope_invalid'; end if;
    if new.contract_id is not null then select * into c from maintenance.vendor_contracts where id=new.contract_id and tenant_id=new.tenant_id and vendor_id=new.vendor_id and property_id=w.property_id and status='active' and starts_on<=current_date and (ends_on is null or ends_on>=current_date); if not found then raise exception 'assignment_contract_scope_invalid'; end if; end if;
    if w.status in ('completed','verified') then raise exception 'final_work_order_is_immutable'; end if;
    return new;
  elsif tg_table_schema='maintenance' and tg_table_name='ticket_work_orders' then
    select * into w from maintenance.work_orders where id=case when tg_op='DELETE' then old.work_order_id else new.work_order_id end and tenant_id=case when tg_op='DELETE' then old.tenant_id else new.tenant_id end;
    if tg_op='DELETE' then if w.status in ('completed','verified') then raise exception 'final_work_order_is_immutable'; end if; return old; end if;
    if not found or not exists(select 1 from maintenance.tickets t where t.id=new.ticket_id and t.tenant_id=new.tenant_id and t.property_id=w.property_id and t.building_id is not distinct from w.building_id and t.unit_id is not distinct from w.unit_id) then raise exception 'ticket_work_order_scope_invalid'; end if;
    return new;
  elsif tg_table_schema='maintenance' and tg_table_name='work_order_costs' then
    if tg_op='DELETE' then raise exception 'work_order_cost_snapshot_is_immutable'; end if;
    select * into w from maintenance.work_orders where id=new.work_order_id and tenant_id=new.tenant_id;
    if not found then raise exception 'work_order_cost_scope_invalid'; end if;
    if new.purchase_order_id is not null and not exists(select 1 from maintenance.purchase_orders po where po.id=new.purchase_order_id and po.tenant_id=new.tenant_id and po.work_order_id=new.work_order_id and po.currency=new.currency) then raise exception 'work_order_cost_purchase_order_invalid'; end if;
    if new.invoice_id is not null and not exists(select 1 from billing.invoices i where i.id=new.invoice_id and i.tenant_id=new.tenant_id and i.currency=new.currency) then raise exception 'work_order_cost_invoice_invalid'; end if;
    if new.journal_id is not null and not exists(select 1 from finance.journals j where j.id=new.journal_id and j.tenant_id=new.tenant_id) then raise exception 'work_order_cost_journal_invalid'; end if;
    if tg_op='UPDATE' and new is distinct from old then raise exception 'work_order_cost_snapshot_is_immutable'; end if;
    return new;
  elsif tg_table_schema='assets' and tg_table_name='asset_history' then
    if tg_op<>'INSERT' then raise exception 'asset_history_is_append_only'; end if;
    select * into a from assets.assets where id=new.asset_id and tenant_id=new.tenant_id;
    if not found then raise exception 'asset_history_scope_invalid'; end if;
    return new;
  end if;
  return case when tg_op='DELETE' then old else new end;
end $$;

create trigger a_customer_asset_integrity before insert or update or delete on assets.assets for each row execute function maintenance.enforce_customer_maintenance_integrity();
create trigger a_customer_asset_component_integrity before insert or update or delete on assets.asset_components for each row execute function maintenance.enforce_customer_maintenance_integrity();
create trigger a_customer_plan_integrity before insert or update or delete on maintenance.maintenance_plans for each row execute function maintenance.enforce_customer_maintenance_integrity();
create trigger a_customer_work_order_integrity before insert or update or delete on maintenance.work_orders for each row execute function maintenance.enforce_customer_maintenance_integrity();
create trigger a_customer_checklist_integrity before insert or update or delete on maintenance.work_order_checklist_items for each row execute function maintenance.enforce_customer_maintenance_integrity();
create trigger a_customer_event_integrity before insert or update or delete on maintenance.work_order_events for each row execute function maintenance.enforce_customer_maintenance_integrity();
create trigger a_customer_assignment_integrity before insert or update or delete on maintenance.work_order_assignments for each row execute function maintenance.enforce_customer_maintenance_integrity();
create trigger a_customer_ticket_work_order_integrity before insert or update or delete on maintenance.ticket_work_orders for each row execute function maintenance.enforce_customer_maintenance_integrity();
create trigger a_customer_cost_integrity before insert or update or delete on maintenance.work_order_costs for each row execute function maintenance.enforce_customer_maintenance_integrity();
create trigger a_customer_asset_history_integrity before insert or update or delete on assets.asset_history for each row execute function maintenance.enforce_customer_maintenance_integrity();

create or replace function maintenance.get_customer_maintenance(
  p_context_id uuid,p_view text default 'assets',p_query text default null,p_status text default null,p_priority text default null,
  p_from date default null,p_to date default null,p_limit integer default 25,p_offset integer default 0,p_id uuid default null
) returns jsonb language plpgsql stable security definer
set search_path=pg_catalog,maintenance,assets,identity,platform,portfolio,occupancy,billing,finance
as $$
declare v record; v_workspace uuid; v_party uuid; v_resident boolean; v_tenant boolean; v_total bigint; v_rows jsonb; v_summary jsonb; v_detail jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501'; end if;
  if p_view not in ('assets','components','plans','work_orders','tasks','vendors','sla','costs','history') or p_limit<1 or p_limit>100 or p_offset<0 then raise exception 'invalid_query' using errcode='22023'; end if;
  if p_priority is not null and p_priority not in ('low','normal','high','urgent','emergency') then raise exception 'invalid_priority' using errcode='22023'; end if;
  select g.*,m.id membership_key,m.role_id,r.code role_code,r.name role_name,t.legal_name tenant_name into v
  from identity.context_grants g join identity.memberships m on m.id=g.membership_id and m.tenant_id=g.tenant_id
  join identity.roles r on r.id=m.role_id join platform.tenants t on t.id=m.tenant_id
  where g.id=p_context_id and m.user_id=auth.uid() and m.status='active'
    and m.starts_at<=statement_timestamp() and (m.ends_at is null or m.ends_at>statement_timestamp())
    and g.starts_at<=statement_timestamp() and (g.ends_at is null or g.ends_at>statement_timestamp());
  if not found then raise exception 'customer_context_access_denied' using errcode='42501'; end if;
  if lower(v.role_code) not in ('association_admin','property_manager','president','censor','owner','tenant_resident') then raise exception 'maintenance_role_denied' using errcode='42501'; end if;
  if not exists(select 1 from identity.role_permissions rp join identity.permissions p on p.id=rp.permission_id where rp.role_id=v.role_id and rp.effect='allow' and p.code='maintenance.assets.read') then raise exception 'maintenance_permission_required' using errcode='42501'; end if;
  select w.id into v_workspace from platform.customer_workspaces w where w.tenant_id=v.tenant_id and w.lifecycle_status='ACTIVE' order by w.id limit 1;
  if v_workspace is null or not exists(select 1 from platform.workspace_entitlements e where e.customer_workspace_id=v_workspace and e.entitlement_key='module.maintenance'
    and e.valid_from<=statement_timestamp() and (e.valid_until is null or e.valid_until>statement_timestamp())
    and (case when e.override_value_json is not null and e.override_expires_at>statement_timestamp() then e.override_value_json='true'::jsonb else e.boolean_value is true end))
    then raise exception 'maintenance_entitlement_required' using errcode='42501'; end if;
  v_resident:=lower(v.role_code) in ('owner','tenant_resident'); v_tenant:=lower(v.role_code)='tenant_resident';
  if v_resident then
    if v.scope_type<>'unit' then raise exception 'resident_unit_context_required' using errcode='42501'; end if;
    select mp.party_id into v_party from identity.membership_parties mp where mp.membership_id=v.membership_key and mp.tenant_id=v.tenant_id;
    if v_party is null then raise exception 'resident_party_mapping_required' using errcode='42501'; end if;
    if not v_tenant and not exists(select 1 from portfolio.ownerships o where o.tenant_id=v.tenant_id and o.unit_id=v.unit_id and o.party_id=v_party and o.valid_from<=current_date and (o.valid_to is null or o.valid_to>current_date)) then raise exception 'ownership_required' using errcode='42501'; end if;
    if v_tenant and not exists(select 1 from occupancy.leases l where l.tenant_id=v.tenant_id and l.unit_id=v.unit_id and l.tenant_party_id=v_party and l.status='active' and l.starts_on<=current_date and (l.ends_on is null or l.ends_on>current_date)) then raise exception 'active_lease_required' using errcode='42501'; end if;
  end if;

  if p_view='assets' then
    with filtered as (select a.id,a.asset_code,a.name,a.scope,a.condition,a.criticality,a.manufacturer,a.model,right(a.serial_fingerprint,8) serial_suffix,a.installed_on,a.expected_life_months,a.replacement_cost,a.currency,a.status,a.retired_at,
      c.code category_code,c.name category_name,p.name property_name,b.name building_name,u.code unit_code,(select count(*) from assets.asset_documents d where d.asset_id=a.id) document_count,
      (select min(mp.next_due_at) from maintenance.maintenance_plans mp where mp.asset_id=a.id and mp.status='active') next_service_at
      from assets.assets a join assets.asset_categories c on c.id=a.category_id left join portfolio.properties p on p.id=a.property_id left join portfolio.buildings b on b.id=a.building_id left join portfolio.units u on u.id=a.unit_id
      where a.tenant_id=v.tenant_id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,a.property_id,a.building_id,a.unit_id) and (not v_resident or a.unit_id=v.unit_id)
      and (p_id is null or a.id=p_id) and (p_status is null or a.status::text=p_status or a.condition::text=p_status) and (p_query is null or trim(p_query)='' or a.asset_code ilike '%'||trim(p_query)||'%' or a.name ilike '%'||trim(p_query)||'%' or coalesce(c.name,'') ilike '%'||trim(p_query)||'%')),
    page as (select *,count(*) over() total_count from filtered order by criticality desc,name,id limit p_limit offset p_offset)
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(page)-'total_count' order by criticality desc,name,id),'[]') into v_total,v_rows from page;
  elsif p_view='components' then
    with filtered as (select ac.id,ac.quantity,ac.installed_on,ac.removed_on,pa.id parent_asset_id,pa.asset_code parent_code,pa.name parent_name,ca.id component_asset_id,ca.asset_code component_code,ca.name component_name,ca.condition,ca.status
      from assets.asset_components ac join assets.assets pa on pa.id=ac.parent_asset_id join assets.assets ca on ca.id=ac.component_asset_id
      where ac.tenant_id=v.tenant_id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,pa.property_id,pa.building_id,pa.unit_id) and (not v_resident or pa.unit_id=v.unit_id)
      and (p_id is null or ac.id=p_id) and (p_status is null or ca.status::text=p_status or ca.condition::text=p_status) and (p_query is null or trim(p_query)='' or pa.name ilike '%'||trim(p_query)||'%' or ca.name ilike '%'||trim(p_query)||'%')),
    page as (select *,count(*) over() total_count from filtered order by parent_name,component_name,id limit p_limit offset p_offset)
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(page)-'total_count' order by parent_name,component_name,id),'[]') into v_total,v_rows from page;
  elsif p_view='plans' then
    with filtered as (select mp.id,mp.name,mp.trigger_type,mp.estimated_duration_minutes,mp.default_priority,mp.next_due_at,mp.last_generated_at,mp.status,a.id asset_id,a.asset_code,a.name asset_name,a.condition,
      (mp.next_due_at is not null and mp.next_due_at<statement_timestamp()) overdue
      from maintenance.maintenance_plans mp join assets.assets a on a.id=mp.asset_id
      where mp.tenant_id=v.tenant_id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,a.property_id,a.building_id,a.unit_id) and (not v_resident or a.unit_id=v.unit_id)
      and (p_id is null or mp.id=p_id) and (p_status is null or mp.status::text=p_status) and (p_priority is null or mp.default_priority::text=p_priority) and (p_from is null or mp.next_due_at::date>=p_from) and (p_to is null or mp.next_due_at::date<=p_to)
      and (p_query is null or trim(p_query)='' or mp.name ilike '%'||trim(p_query)||'%' or a.name ilike '%'||trim(p_query)||'%')),
    page as (select *,count(*) over() total_count from filtered order by next_due_at nulls last,id limit p_limit offset p_offset)
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(page)-'total_count' order by next_due_at nulls last,id),'[]') into v_total,v_rows from page;
  elsif p_view='work_orders' then
    with filtered as (select w.id,w.work_order_no,w.title,w.description,w.priority,w.status,w.scheduled_start,w.scheduled_end,w.started_at,w.completed_at,w.verified_at,w.completion_summary,w.created_at,
      a.asset_code,a.name asset_name,p.name property_name,b.name building_name,u.code unit_code,mp.name plan_name,
      va.vendor_name,coalesce(sc.cost_totals,'{}'::jsonb) cost_totals,sc.invoice_ids,sc.journal_ids,tw.ticket_no,
      case when w.status not in ('completed','verified','cancelled') and coalesce(w.scheduled_end,w.scheduled_start)<statement_timestamp() then true else false end overdue
      from maintenance.work_orders w left join assets.assets a on a.id=w.asset_id left join maintenance.maintenance_plans mp on mp.id=w.plan_id left join portfolio.properties p on p.id=w.property_id left join portfolio.buildings b on b.id=w.building_id left join portfolio.units u on u.id=w.unit_id
      left join lateral(select pp.legal_name vendor_name from maintenance.work_order_assignments wa join maintenance.vendors mv on mv.id=wa.vendor_id join portfolio.parties pp on pp.id=mv.party_id where wa.work_order_id=w.id order by wa.assigned_at desc limit 1) va on true
      left join lateral(select (select jsonb_object_agg(x.currency,x.total) from (select wc.currency,sum(wc.amount) total from maintenance.work_order_costs wc where wc.work_order_id=w.id group by wc.currency) x) cost_totals,
        (select jsonb_agg(distinct wc.invoice_id) filter(where wc.invoice_id is not null) from maintenance.work_order_costs wc where wc.work_order_id=w.id) invoice_ids,
        (select jsonb_agg(distinct wc.journal_id) filter(where wc.journal_id is not null) from maintenance.work_order_costs wc where wc.work_order_id=w.id) journal_ids) sc on true
      left join lateral(select t.ticket_no from maintenance.ticket_work_orders x join maintenance.tickets t on t.id=x.ticket_id where x.work_order_id=w.id order by t.reported_at desc limit 1) tw on true
      where w.tenant_id=v.tenant_id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,w.property_id,w.building_id,w.unit_id) and (not v_resident or w.unit_id=v.unit_id)
      and (p_id is null or w.id=p_id) and (p_status is null or w.status::text=p_status) and (p_priority is null or w.priority::text=p_priority) and (p_from is null or w.created_at::date>=p_from) and (p_to is null or w.created_at::date<=p_to)
      and (p_query is null or trim(p_query)='' or w.title ilike '%'||trim(p_query)||'%' or w.work_order_no::text ilike '%'||trim(p_query)||'%' or coalesce(a.name,'') ilike '%'||trim(p_query)||'%')),
    page as (select *,count(*) over() total_count from filtered order by created_at desc,id desc limit p_limit offset p_offset)
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(page)-'total_count' order by created_at desc,id desc),'[]') into v_total,v_rows from page;
  elsif p_view='tasks' then
    with filtered as (select i.id,i.sequence_no,i.label,i.required,i.completed,i.completed_at,w.id work_order_id,w.work_order_no,w.title work_order_title,w.priority,w.status work_order_status,w.created_at
      from maintenance.work_order_checklist_items i join maintenance.work_orders w on w.id=i.work_order_id
      where i.tenant_id=v.tenant_id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,w.property_id,w.building_id,w.unit_id) and (not v_resident or w.unit_id=v.unit_id)
      and (p_id is null or i.id=p_id) and (p_status is null or (case when i.completed then 'completed' else 'pending' end)=p_status) and (p_priority is null or w.priority::text=p_priority) and (p_query is null or trim(p_query)='' or i.label ilike '%'||trim(p_query)||'%' or w.title ilike '%'||trim(p_query)||'%')),
    page as (select *,count(*) over() total_count from filtered order by created_at desc,sequence_no,id limit p_limit offset p_offset)
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(page)-'total_count' order by created_at desc,sequence_no,id),'[]') into v_total,v_rows from page;
  elsif p_view='vendors' then
    with filtered as (select mv.id,mv.status,mv.service_categories,mv.rating,mv.insurance_valid_until,pp.legal_name vendor_name,
      count(distinct wa.work_order_id) assigned_work_orders,count(distinct vc.id) active_contracts
      from maintenance.vendors mv join portfolio.parties pp on pp.id=mv.party_id
      left join maintenance.work_order_assignments wa on wa.vendor_id=mv.id left join maintenance.work_orders w on w.id=wa.work_order_id
      left join maintenance.vendor_contracts vc on vc.vendor_id=mv.id and vc.status='active' and vc.starts_on<=current_date and (vc.ends_on is null or vc.ends_on>=current_date)
      where mv.tenant_id=v.tenant_id and (exists(select 1 from maintenance.vendor_contracts x where x.vendor_id=mv.id and x.tenant_id=v.tenant_id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,x.property_id,null,null))
        or exists(select 1 from maintenance.work_order_assignments xwa join maintenance.work_orders xw on xw.id=xwa.work_order_id where xwa.vendor_id=mv.id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,xw.property_id,xw.building_id,xw.unit_id)))
      and (not v_resident or exists(select 1 from maintenance.work_order_assignments xwa join maintenance.work_orders xw on xw.id=xwa.work_order_id where xwa.vendor_id=mv.id and xw.unit_id=v.unit_id))
      and (p_id is null or mv.id=p_id) and (p_status is null or mv.status::text=p_status) and (p_query is null or trim(p_query)='' or pp.legal_name ilike '%'||trim(p_query)||'%' or exists(select 1 from unnest(mv.service_categories) s where s ilike '%'||trim(p_query)||'%'))
      group by mv.id,pp.legal_name), page as (select *,count(*) over() total_count from filtered order by vendor_name,id limit p_limit offset p_offset)
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(page)-'total_count' order by vendor_name,id),'[]') into v_total,v_rows from page;
  elsif p_view='sla' then
    with filtered as (select s.id,s.metric_code,s.target_value,s.actual_value,s.unit_code,s.met,s.measured_at,w.id work_order_id,w.work_order_no,w.title work_order_title,w.priority,w.status,
      case when s.met is false then true else false end breached
      from maintenance.sla_measurements s join maintenance.work_orders w on w.id=s.work_order_id
      where s.tenant_id=v.tenant_id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,w.property_id,w.building_id,w.unit_id) and (not v_resident or w.unit_id=v.unit_id)
      and (p_id is null or s.id=p_id) and (p_status is null or (case when s.met then 'met' else 'breached' end)=p_status) and (p_priority is null or w.priority::text=p_priority) and (p_from is null or s.measured_at::date>=p_from) and (p_to is null or s.measured_at::date<=p_to)
      and (p_query is null or trim(p_query)='' or s.metric_code ilike '%'||trim(p_query)||'%' or w.title ilike '%'||trim(p_query)||'%')),
    page as (select *,count(*) over() total_count from filtered order by measured_at desc,id desc limit p_limit offset p_offset)
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(page)-'total_count' order by measured_at desc,id desc),'[]') into v_total,v_rows from page;
  elsif p_view='costs' then
    with filtered as (select wc.id,wc.category_code,wc.description,wc.amount,wc.currency,wc.incurred_on,wc.purchase_order_id,wc.invoice_id,wc.journal_id,wc.allocation_run_id,w.id work_order_id,w.work_order_no,w.title work_order_title
      from maintenance.work_order_costs wc join maintenance.work_orders w on w.id=wc.work_order_id
      where wc.tenant_id=v.tenant_id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,w.property_id,w.building_id,w.unit_id) and (not v_resident or w.unit_id=v.unit_id)
      and (p_id is null or wc.id=p_id) and (p_status is null or wc.category_code=p_status) and (p_from is null or wc.incurred_on>=p_from) and (p_to is null or wc.incurred_on<=p_to)
      and (p_query is null or trim(p_query)='' or wc.description ilike '%'||trim(p_query)||'%' or w.title ilike '%'||trim(p_query)||'%')),
    page as (select *,count(*) over() total_count from filtered order by incurred_on desc,id desc limit p_limit offset p_offset)
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(page)-'total_count' order by incurred_on desc,id desc),'[]') into v_total,v_rows from page;
  else
    with filtered as (select h.id,h.event_type,h.reason,h.occurred_at,h.work_order_id,h.ticket_id,a.id asset_id,a.asset_code,a.name asset_name
      from assets.asset_history h join assets.assets a on a.id=h.asset_id
      where h.tenant_id=v.tenant_id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,a.property_id,a.building_id,a.unit_id) and (not v_resident or a.unit_id=v.unit_id)
      and (p_id is null or h.id=p_id) and (p_status is null or h.event_type=p_status) and (p_from is null or h.occurred_at::date>=p_from) and (p_to is null or h.occurred_at::date<=p_to)
      and (p_query is null or trim(p_query)='' or h.event_type ilike '%'||trim(p_query)||'%' or coalesce(h.reason,'') ilike '%'||trim(p_query)||'%' or a.name ilike '%'||trim(p_query)||'%')),
    page as (select *,count(*) over() total_count from filtered order by occurred_at desc,id desc limit p_limit offset p_offset)
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(page)-'total_count' order by occurred_at desc,id desc),'[]') into v_total,v_rows from page;
  end if;

  select jsonb_build_object(
    'assets',(select count(*) from assets.assets a where a.tenant_id=v.tenant_id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,a.property_id,a.building_id,a.unit_id) and (not v_resident or a.unit_id=v.unit_id)),
    'open_work_orders',(select count(*) from maintenance.work_orders w where w.tenant_id=v.tenant_id and w.status in ('draft','scheduled','assigned','in_progress','blocked') and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,w.property_id,w.building_id,w.unit_id) and (not v_resident or w.unit_id=v.unit_id)),
    'overdue',(select count(*) from maintenance.work_orders w where w.tenant_id=v.tenant_id and w.status not in ('completed','verified','cancelled') and coalesce(w.scheduled_end,w.scheduled_start)<statement_timestamp() and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,w.property_id,w.building_id,w.unit_id) and (not v_resident or w.unit_id=v.unit_id)),
    'cost_total',(select coalesce(jsonb_object_agg(x.currency,x.total),'{}'::jsonb) from (select wc.currency,sum(wc.amount) total from maintenance.work_order_costs wc join maintenance.work_orders w on w.id=wc.work_order_id where wc.tenant_id=v.tenant_id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,w.property_id,w.building_id,w.unit_id) and (not v_resident or w.unit_id=v.unit_id) group by wc.currency) x)
  ) into v_summary;
  if p_id is not null then v_detail:=case when v_total=1 then v_rows->0 else null end; end if;
  return jsonb_build_object('context',jsonb_build_object('id',v.id,'tenant_name',v.tenant_name,'role_code',v.role_code,'scope_type',v.scope_type),'view',p_view,'total',v_total,'rows',v_rows,'summary',v_summary,'detail',v_detail,'limit',p_limit,'offset',p_offset,'read_only',true,'generated_at',statement_timestamp());
end $$;

revoke all on function maintenance.enforce_customer_maintenance_integrity() from public,anon,authenticated;
revoke select on all tables in schema assets from authenticated;
revoke select on all tables in schema maintenance from authenticated;
revoke all on function maintenance.get_customer_maintenance(uuid,text,text,text,text,date,date,integer,integer,uuid) from public,anon;
grant execute on function maintenance.get_customer_maintenance(uuid,text,text,text,text,date,date,integer,integer,uuid) to authenticated,service_role;

commit;
