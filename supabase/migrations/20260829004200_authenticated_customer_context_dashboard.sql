begin;

create or replace function app_private.customer_context_is_active(p_context_id uuid)
returns boolean language sql stable security definer
set search_path=pg_catalog,identity
as $$
  select coalesce((auth.jwt()->>'aal')='aal2',false) and exists(
    select 1 from identity.context_grants g
    join identity.memberships m on m.id=g.membership_id and m.tenant_id=g.tenant_id
    where g.id=p_context_id and m.user_id=auth.uid() and m.status='active'
      and m.starts_at<=statement_timestamp() and (m.ends_at is null or m.ends_at>statement_timestamp())
      and g.starts_at<=statement_timestamp() and (g.ends_at is null or g.ends_at>statement_timestamp())
  );
$$;
revoke all on function app_private.customer_context_is_active(uuid) from public;
grant execute on function app_private.customer_context_is_active(uuid) to authenticated,service_role;

create or replace function platform.list_my_customer_contexts()
returns table(context_id uuid,membership_id uuid,tenant_id uuid,tenant_name text,role_code text,role_name text,scope_type text,property_id uuid,building_id uuid,unit_id uuid,context_label text,starts_at timestamptz,ends_at timestamptz)
language plpgsql stable security definer
set search_path=pg_catalog,platform,identity,portfolio
as $$ begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501'; end if;
  return query
  select g.id,m.id,m.tenant_id,t.legal_name,r.code,r.name,g.scope_type::text,g.property_id,g.building_id,g.unit_id,
    coalesce(u.code,b.name,p.name,t.legal_name),g.starts_at,g.ends_at
  from identity.memberships m join identity.context_grants g on g.membership_id=m.id and g.tenant_id=m.tenant_id
  join platform.tenants t on t.id=m.tenant_id join identity.roles r on r.id=m.role_id
  left join portfolio.properties p on p.id=g.property_id and p.tenant_id=g.tenant_id
  left join portfolio.buildings b on b.id=g.building_id and b.tenant_id=g.tenant_id
  left join portfolio.units u on u.id=g.unit_id and u.tenant_id=g.tenant_id
  where m.user_id=auth.uid() and m.status='active' and m.starts_at<=statement_timestamp()
    and (m.ends_at is null or m.ends_at>statement_timestamp()) and g.starts_at<=statement_timestamp()
    and (g.ends_at is null or g.ends_at>statement_timestamp())
  order by t.legal_name,coalesce(u.code,b.name,p.name,t.legal_name),g.id;
end $$;

create or replace function platform.get_customer_dashboard(p_context_id uuid)
returns jsonb language plpgsql stable security definer
set search_path=pg_catalog,platform,identity,portfolio,maintenance,billing,communications
as $$ declare
  v record; v_workspace uuid; v_entitlements jsonb; v_permissions jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501'; end if;
  select g.*,m.id membership_key,m.role_id,r.code role_code,r.name role_name,t.legal_name tenant_name
  into v from identity.context_grants g join identity.memberships m on m.id=g.membership_id and m.tenant_id=g.tenant_id
  join identity.roles r on r.id=m.role_id join platform.tenants t on t.id=m.tenant_id
  where g.id=p_context_id and m.user_id=auth.uid() and m.status='active'
    and m.starts_at<=statement_timestamp() and (m.ends_at is null or m.ends_at>statement_timestamp())
    and g.starts_at<=statement_timestamp() and (g.ends_at is null or g.ends_at>statement_timestamp());
  if not found then raise exception 'customer_context_access_denied' using errcode='42501'; end if;
  select w.id into v_workspace from platform.customer_workspaces w where w.tenant_id=v.tenant_id and w.lifecycle_status='ACTIVE' order by w.id limit 1;
  select coalesce(jsonb_agg(e.entitlement_key order by e.entitlement_key),'[]'::jsonb) into v_entitlements
  from platform.workspace_entitlements e where e.customer_workspace_id=v_workspace
    and e.valid_from<=statement_timestamp() and (e.valid_until is null or e.valid_until>statement_timestamp());
  select coalesce(jsonb_agg(distinct p.code order by p.code),'[]'::jsonb) into v_permissions
  from identity.role_permissions rp join identity.permissions p on p.id=rp.permission_id where rp.role_id=v.role_id and rp.effect='allow';
  return jsonb_build_object(
    'context',jsonb_build_object('id',v.id,'tenant_id',v.tenant_id,'tenant_name',v.tenant_name,'role_code',v.role_code,'role_name',v.role_name,'scope_type',v.scope_type,'property_id',v.property_id,'building_id',v.building_id,'unit_id',v.unit_id),
    'workspace_id',v_workspace,'permissions',v_permissions,'entitlements',v_entitlements,
    'modules',jsonb_build_array('dashboard'),
    'kpis',jsonb_build_object(
      'properties',(select count(*) from portfolio.properties p where p.tenant_id=v.tenant_id and (v.scope_type='tenant' or p.id=v.property_id or p.id=(select b.property_id from portfolio.buildings b where b.id=v.building_id) or p.id=(select b.property_id from portfolio.units u join portfolio.buildings b on b.id=u.building_id where u.id=v.unit_id))),
      'buildings',(select count(*) from portfolio.buildings b where b.tenant_id=v.tenant_id and (v.scope_type='tenant' or b.property_id=v.property_id or b.id=v.building_id or b.id=(select u.building_id from portfolio.units u where u.id=v.unit_id))),
      'units',(select count(*) from portfolio.units u join portfolio.buildings b on b.id=u.building_id where u.tenant_id=v.tenant_id and (v.scope_type='tenant' or b.property_id=v.property_id or u.building_id=v.building_id or u.id=v.unit_id)),
      'open_work_orders',(select count(*) from maintenance.work_orders w where w.tenant_id=v.tenant_id and w.status not in ('completed','verified','cancelled') and (v.scope_type='tenant' or w.property_id=v.property_id or w.building_id=v.building_id or w.unit_id=v.unit_id)),
      'unread_notifications',(select count(*) from communications.notifications n where n.tenant_id=v.tenant_id and n.membership_id=v.membership_key and n.read_at is null),
      'outstanding_amount',(select coalesce(sum(rc.outstanding_amount),0) from billing.receivables rc join billing.invoices i on i.id=rc.invoice_id join portfolio.units u on u.id=i.unit_id join portfolio.buildings b on b.id=u.building_id where rc.tenant_id=v.tenant_id and (v.scope_type='tenant' or i.property_id=v.property_id or u.building_id=v.building_id or u.id=v.unit_id))
    ),'generated_at',statement_timestamp()
  );
end $$;

revoke all on function platform.list_my_customer_contexts(),platform.get_customer_dashboard(uuid) from public,anon;
grant execute on function platform.list_my_customer_contexts(),platform.get_customer_dashboard(uuid) to authenticated,service_role;

commit;
