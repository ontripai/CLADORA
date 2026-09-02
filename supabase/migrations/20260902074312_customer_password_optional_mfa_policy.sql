begin;

create or replace function app_private.customer_mfa_required()
returns boolean
language sql
stable
security definer
set search_path=pg_catalog,identity
as $$
  select case
    when auth.uid() is null then true
    else exists(
      select 1
      from identity.memberships m
      join identity.roles r on r.id=m.role_id
      where m.user_id=auth.uid()
        and m.status='active'
        and m.starts_at<=statement_timestamp()
        and (m.ends_at is null or m.ends_at>statement_timestamp())
        and lower(r.code) in ('association_admin','property_manager','president','censor')
    )
  end;
$$;

revoke all on function app_private.customer_mfa_required() from public,anon,authenticated,service_role;

create or replace function platform.my_customer_mfa_requirement()
returns boolean
language plpgsql
stable
security definer
set search_path=''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode='42501';
  end if;
  return app_private.customer_mfa_required();
end;
$$;

revoke all on function platform.my_customer_mfa_requirement() from public,anon,service_role;
grant execute on function platform.my_customer_mfa_requirement() to authenticated;

create or replace function app_private.customer_context_is_active(p_context_id uuid)
returns boolean language sql stable security definer
set search_path=pg_catalog,identity
as $$
  select (
    not app_private.customer_mfa_required()
    or coalesce((auth.jwt()->>'aal')='aal2',false)
  ) and exists(
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
  if app_private.customer_mfa_required() and coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501'; end if;
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
  if app_private.customer_mfa_required() and coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501'; end if;
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

create or replace function finance.get_customer_ledger(
  p_context_id uuid,
  p_query text default null,
  p_status text default null,
  p_account_type text default null,
  p_from date default null,
  p_to date default null,
  p_limit integer default 25,
  p_offset integer default 0,
  p_journal_id uuid default null
) returns jsonb language plpgsql stable security definer
set search_path=pg_catalog,finance,identity,platform,portfolio,occupancy
as $$
declare
  v record; v_workspace uuid; v_party uuid; v_is_resident boolean; v_is_tenant boolean; v_total bigint;
  v_journals jsonb; v_accounts jsonb; v_periods jsonb; v_trial jsonb; v_detail jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if app_private.customer_mfa_required() and coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501'; end if;
  if p_limit<1 or p_limit>100 or p_offset<0 then raise exception 'invalid_pagination' using errcode='22023'; end if;
  if p_status is not null and p_status not in ('draft','posted','reversed') then raise exception 'invalid_status' using errcode='22023'; end if;
  if p_account_type is not null and p_account_type not in ('asset','liability','equity','income','expense') then raise exception 'invalid_account_type' using errcode='22023'; end if;

  select g.*,m.id membership_key,m.role_id,r.code role_code,r.name role_name,t.legal_name tenant_name
  into v from identity.context_grants g
  join identity.memberships m on m.id=g.membership_id and m.tenant_id=g.tenant_id
  join identity.roles r on r.id=m.role_id join platform.tenants t on t.id=m.tenant_id
  where g.id=p_context_id and m.user_id=auth.uid() and m.status='active'
    and m.starts_at<=statement_timestamp() and (m.ends_at is null or m.ends_at>statement_timestamp())
    and g.starts_at<=statement_timestamp() and (g.ends_at is null or g.ends_at>statement_timestamp());
  if not found then raise exception 'customer_context_access_denied' using errcode='42501'; end if;
  if lower(v.role_code) not in ('association_admin','property_manager','president','censor','owner','tenant_resident') then
    raise exception 'ledger_role_denied' using errcode='42501';
  end if;
  if not exists(select 1 from identity.role_permissions rp join identity.permissions p on p.id=rp.permission_id
    where rp.role_id=v.role_id and rp.effect='allow' and p.code='finance.ledger.read') then
    raise exception 'ledger_permission_required' using errcode='42501';
  end if;
  select w.id into v_workspace from platform.customer_workspaces w
  where w.tenant_id=v.tenant_id and w.lifecycle_status='ACTIVE' order by w.id limit 1;
  if v_workspace is null or not exists(select 1 from platform.workspace_entitlements e
    where e.customer_workspace_id=v_workspace and e.entitlement_key='module.accounting'
      and e.valid_from<=statement_timestamp() and (e.valid_until is null or e.valid_until>statement_timestamp())
      and (case when e.override_value_json is not null and e.override_expires_at>statement_timestamp()
        then e.override_value_json='true'::jsonb else e.boolean_value is true end)) then
    raise exception 'ledger_entitlement_required' using errcode='42501';
  end if;

  v_is_resident:=lower(v.role_code) in ('owner','tenant_resident');
  v_is_tenant:=lower(v.role_code)='tenant_resident';
  if v_is_resident then
    if v.scope_type<>'unit' then raise exception 'resident_unit_context_required' using errcode='42501'; end if;
    select mp.party_id into v_party from identity.membership_parties mp
    where mp.membership_id=v.membership_key and mp.tenant_id=v.tenant_id;
    if v_party is null then raise exception 'resident_party_mapping_required' using errcode='42501'; end if;
    if lower(v.role_code)='owner' and not exists(select 1 from portfolio.ownerships o where o.tenant_id=v.tenant_id
      and o.unit_id=v.unit_id and o.party_id=v_party and o.valid_from<=current_date and (o.valid_to is null or o.valid_to>current_date)) then
      raise exception 'ownership_required' using errcode='42501';
    end if;
    if lower(v.role_code)='tenant_resident' and not exists(select 1 from occupancy.leases l where l.tenant_id=v.tenant_id
      and l.unit_id=v.unit_id and l.tenant_party_id=v_party and l.status='active'
      and l.starts_on<=current_date and (l.ends_on is null or l.ends_on>current_date)) then
      raise exception 'active_lease_required' using errcode='42501';
    end if;
  end if;

  with visible_journals as (
    select j.* from finance.journals j where j.tenant_id=v.tenant_id
      and (v.scope_type='tenant'
        or (v.scope_type='property' and j.property_id=v.property_id)
        or (v.scope_type='building' and j.property_id=(select b.property_id from portfolio.buildings b where b.id=v.building_id and b.tenant_id=v.tenant_id))
        or (v.scope_type='unit' and exists(select 1 from finance.journal_entries x where x.journal_id=j.id and x.unit_id=v.unit_id
          and (not v_is_tenant or x.party_id is null or x.party_id=v_party))))
      and (p_journal_id is null or j.id=p_journal_id)
      and (p_status is null or j.status::text=p_status)
      and (p_from is null or j.occurred_on>=p_from) and (p_to is null or j.occurred_on<=p_to)
      and (p_query is null or length(trim(p_query))=0 or j.description ilike '%'||trim(p_query)||'%' or j.journal_no::text ilike '%'||trim(p_query)||'%' or j.source_type ilike '%'||trim(p_query)||'%')
  ), totals as (
    select j.id,coalesce(sum(e.amount) filter(where e.side='debit' and (not v_is_resident or (e.unit_id=v.unit_id and (not v_is_tenant or e.party_id is null or e.party_id=v_party)))),0) debit_total,
      coalesce(sum(e.amount) filter(where e.side='credit' and (not v_is_resident or (e.unit_id=v.unit_id and (not v_is_tenant or e.party_id is null or e.party_id=v_party)))),0) credit_total
    from visible_journals j left join finance.journal_entries e on e.journal_id=j.id group by j.id
  ), page as (
    select j.*,t.debit_total,t.credit_total,count(*) over() total_count
    from visible_journals j join totals t on t.id=j.id order by j.occurred_on desc,j.journal_no desc limit p_limit offset p_offset
  )
  select coalesce(max(total_count),0),coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'journal_no',journal_no,'occurred_on',occurred_on,'currency',currency,'description',description,
    'source_type',source_type,'status',status,'posted_at',posted_at,'debit_total',debit_total,
    'credit_total',credit_total,'balanced',debit_total=credit_total) order by occurred_on desc,journal_no desc),'[]'::jsonb)
  into v_total,v_journals from page;

  select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'code',a.code,'name',a.name,'type',a.type,'currency',a.currency,'balance',a.balance)
    order by a.code),'[]'::jsonb) into v_accounts from (
    select ac.id,ac.code,ac.name,ac.type,ac.currency,
      coalesce(sum(case when e.side='debit' then e.amount else -e.amount end)
        filter(where j.status in ('posted','reversed') and (not v_is_resident or (e.unit_id=v.unit_id and (not v_is_tenant or e.party_id is null or e.party_id=v_party)))),0) balance
    from finance.accounts ac left join finance.journal_entries e on e.account_id=ac.id
    left join finance.journals j on j.id=e.journal_id and j.status in ('posted','reversed')
    where ac.tenant_id=v.tenant_id and (p_account_type is null or ac.type::text=p_account_type)
      and (v.scope_type='tenant' or ac.property_id is null or ac.property_id=v.property_id
        or ac.property_id=(select b.property_id from portfolio.buildings b where b.id=v.building_id)
        or ac.property_id=(select b.property_id from portfolio.units u join portfolio.buildings b on b.id=u.building_id where u.id=v.unit_id))
    group by ac.id
  ) a;

  select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'starts_on',p.starts_on,'ends_on',p.ends_on,
    'status',p.status,'closed_at',p.closed_at) order by p.starts_on desc),'[]'::jsonb)
  into v_periods from finance.accounting_periods p
  where p.tenant_id=v.tenant_id and (v.scope_type='tenant' or p.property_id is null or p.property_id=v.property_id
    or p.property_id=(select b.property_id from portfolio.buildings b where b.id=v.building_id)
    or p.property_id=(select b.property_id from portfolio.units u join portfolio.buildings b on b.id=u.building_id where u.id=v.unit_id));

  select jsonb_build_object('debit',coalesce(sum(e.amount) filter(where e.side='debit'),0),
    'credit',coalesce(sum(e.amount) filter(where e.side='credit'),0),
    'balanced',coalesce(sum(e.amount) filter(where e.side='debit'),0)=coalesce(sum(e.amount) filter(where e.side='credit'),0))
  into v_trial from finance.journal_entries e join finance.journals j on j.id=e.journal_id
  where j.tenant_id=v.tenant_id and j.status in ('posted','reversed')
    and (not v_is_resident or (e.unit_id=v.unit_id and (not v_is_tenant or e.party_id is null or e.party_id=v_party)))
    and (v.scope_type='tenant' or j.property_id=v.property_id
      or j.property_id=(select b.property_id from portfolio.buildings b where b.id=v.building_id)
      or (v.scope_type='unit' and e.unit_id=v.unit_id));

  if p_journal_id is not null then
    select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'account_code',a.code,'account_name',a.name,
      'side',e.side,'amount',e.amount,'memo',e.memo,'unit_id',e.unit_id) order by e.created_at,e.id),'[]'::jsonb)
    into v_detail from finance.journal_entries e join finance.accounts a on a.id=e.account_id
    where e.journal_id=p_journal_id
      and (not v_is_resident or (e.unit_id=v.unit_id and (not v_is_tenant or e.party_id is null or e.party_id=v_party)));
  end if;

  return jsonb_build_object('context',jsonb_build_object('id',v.id,'tenant_name',v.tenant_name,'role_code',v.role_code,'scope_type',v.scope_type),
    'total',v_total,'journals',v_journals,'accounts',v_accounts,'periods',v_periods,'trial_balance',v_trial,
    'detail',coalesce(v_detail,'[]'::jsonb),'limit',p_limit,'offset',p_offset,'read_only',true,'generated_at',statement_timestamp());
end $$;

create or replace function billing.get_customer_billing(
  p_context_id uuid,
  p_query text default null,
  p_status text default null,
  p_from date default null,
  p_to date default null,
  p_limit integer default 25,
  p_offset integer default 0,
  p_invoice_id uuid default null
) returns jsonb language plpgsql stable security definer
set search_path=pg_catalog,billing,identity,platform,portfolio,occupancy,finance
as $$
declare
  v record; v_workspace uuid; v_party uuid; v_is_resident boolean; v_is_tenant boolean;
  v_total bigint; v_rows jsonb; v_summary jsonb; v_aging jsonb; v_lines jsonb; v_journal jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if app_private.customer_mfa_required() and coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501'; end if;
  if p_limit<1 or p_limit>100 or p_offset<0 then raise exception 'invalid_pagination' using errcode='22023'; end if;
  if p_status is not null and p_status not in ('draft','issued','partially_paid','paid','void','credited','overdue') then
    raise exception 'invalid_status' using errcode='22023';
  end if;

  select g.*,m.id membership_key,m.role_id,r.code role_code,r.name role_name,t.legal_name tenant_name
  into v from identity.context_grants g
  join identity.memberships m on m.id=g.membership_id and m.tenant_id=g.tenant_id
  join identity.roles r on r.id=m.role_id join platform.tenants t on t.id=m.tenant_id
  where g.id=p_context_id and m.user_id=auth.uid() and m.status='active'
    and m.starts_at<=statement_timestamp() and (m.ends_at is null or m.ends_at>statement_timestamp())
    and g.starts_at<=statement_timestamp() and (g.ends_at is null or g.ends_at>statement_timestamp());
  if not found then raise exception 'customer_context_access_denied' using errcode='42501'; end if;
  if lower(v.role_code) not in ('association_admin','property_manager','president','censor','owner','tenant_resident') then
    raise exception 'billing_role_denied' using errcode='42501';
  end if;
  if not exists(select 1 from identity.role_permissions rp join identity.permissions p on p.id=rp.permission_id
    where rp.role_id=v.role_id and rp.effect='allow' and p.code='billing.receivables.read') then
    raise exception 'billing_permission_required' using errcode='42501';
  end if;
  select w.id into v_workspace from platform.customer_workspaces w
  where w.tenant_id=v.tenant_id and w.lifecycle_status='ACTIVE' order by w.id limit 1;
  if v_workspace is null or not exists(select 1 from platform.workspace_entitlements e
    where e.customer_workspace_id=v_workspace and e.entitlement_key='module.billing'
      and e.valid_from<=statement_timestamp() and (e.valid_until is null or e.valid_until>statement_timestamp())
      and (case when e.override_value_json is not null and e.override_expires_at>statement_timestamp()
        then e.override_value_json='true'::jsonb else e.boolean_value is true end)) then
    raise exception 'billing_entitlement_required' using errcode='42501';
  end if;

  v_is_resident:=lower(v.role_code) in ('owner','tenant_resident');
  v_is_tenant:=lower(v.role_code)='tenant_resident';
  if v_is_resident then
    if v.scope_type<>'unit' then raise exception 'resident_unit_context_required' using errcode='42501'; end if;
    select mp.party_id into v_party from identity.membership_parties mp
    where mp.membership_id=v.membership_key and mp.tenant_id=v.tenant_id;
    if v_party is null then raise exception 'resident_party_mapping_required' using errcode='42501'; end if;
    if not v_is_tenant and not exists(select 1 from portfolio.ownerships o where o.tenant_id=v.tenant_id
      and o.unit_id=v.unit_id and o.party_id=v_party and o.valid_from<=current_date and (o.valid_to is null or o.valid_to>current_date)) then
      raise exception 'ownership_required' using errcode='42501';
    end if;
    if v_is_tenant and not exists(select 1 from occupancy.leases l where l.tenant_id=v.tenant_id
      and l.unit_id=v.unit_id and l.tenant_party_id=v_party and l.status='active'
      and l.starts_on<=current_date and (l.ends_on is null or l.ends_on>current_date)) then
      raise exception 'active_lease_required' using errcode='42501';
    end if;
  end if;

  with visible as (
    select i.*,r.original_amount,r.paid_amount,r.credited_amount,
      greatest(r.original_amount-r.paid_amount-r.credited_amount,0) outstanding_amount,j.journal_no
    from billing.invoices i join billing.receivables r on r.invoice_id=i.id and r.tenant_id=i.tenant_id
    left join finance.journals j on j.id=i.journal_id and j.tenant_id=i.tenant_id
    where i.tenant_id=v.tenant_id
      and (v.scope_type='tenant' or i.property_id=v.property_id
        or i.property_id=(select b.property_id from portfolio.buildings b where b.id=v.building_id and b.tenant_id=v.tenant_id)
        or (v.scope_type='unit' and i.unit_id=v.unit_id))
      and (not v_is_resident or (i.unit_id=v.unit_id and (not v_is_tenant or i.liable_party_id=v_party)))
  ), filtered as (
    select * from visible x where (p_invoice_id is null or x.id=p_invoice_id)
      and (p_status is null or (p_status='overdue' and due_on<current_date and outstanding_amount>0)
        or (p_status<>'overdue' and status::text=p_status))
      and (p_from is null or issued_on>=p_from) and (p_to is null or issued_on<=p_to)
      and (p_query is null or length(trim(p_query))=0 or x.invoice_no::text ilike '%'||trim(p_query)||'%'
        or exists(select 1 from billing.invoice_lines l where l.invoice_id=x.id and l.description ilike '%'||trim(p_query)||'%'))
  ), page as (
    select *,count(*) over() total_count from filtered order by coalesce(due_on,period_end) desc,invoice_no desc limit p_limit offset p_offset
  )
  select coalesce(max(total_count),0),coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'invoice_no',invoice_no,'period_start',period_start,'period_end',period_end,'issued_on',issued_on,'due_on',due_on,
    'currency',currency,'subtotal',subtotal,'tax_total',tax_total,'total',total,'status',status,
    'original_amount',original_amount,'paid_amount',paid_amount,'credited_amount',credited_amount,
    'outstanding_amount',outstanding_amount,'overdue',due_on<current_date and outstanding_amount>0,
    'journal_id',journal_id,'journal_no',journal_no) order by coalesce(due_on,period_end) desc,invoice_no desc),'[]'::jsonb)
  into v_total,v_rows from page;

  with scoped as (
    select i.*,r.paid_amount,greatest(r.original_amount-r.paid_amount-r.credited_amount,0) outstanding
    from billing.invoices i join billing.receivables r on r.invoice_id=i.id and r.tenant_id=i.tenant_id
    where i.tenant_id=v.tenant_id and (v.scope_type='tenant' or i.property_id=v.property_id
      or i.property_id=(select b.property_id from portfolio.buildings b where b.id=v.building_id and b.tenant_id=v.tenant_id)
      or (v.scope_type='unit' and i.unit_id=v.unit_id))
      and (not v_is_resident or (i.unit_id=v.unit_id and (not v_is_tenant or i.liable_party_id=v_party)))
      and i.status not in ('draft','void','credited')
  ), grouped as (
    select currency,coalesce(sum(total),0) invoice_total,coalesce(sum(paid_amount),0) paid_total,
      coalesce(sum(outstanding),0) outstanding_total,count(*) invoice_count,
      count(*) filter(where due_on<current_date and outstanding>0) overdue_count
    from scoped group by currency
  ) select coalesce(jsonb_agg(jsonb_build_object('currency',currency,'invoice_total',invoice_total,
    'paid_total',paid_total,'outstanding_total',outstanding_total,'invoice_count',invoice_count,
    'overdue_count',overdue_count) order by currency),'[]'::jsonb) into v_summary from grouped;

  with scoped as (
    select i.currency,i.due_on,greatest(r.original_amount-r.paid_amount-r.credited_amount,0) outstanding
    from billing.invoices i join billing.receivables r on r.invoice_id=i.id and r.tenant_id=i.tenant_id
    where i.tenant_id=v.tenant_id and (v.scope_type='tenant' or i.property_id=v.property_id
      or i.property_id=(select b.property_id from portfolio.buildings b where b.id=v.building_id and b.tenant_id=v.tenant_id)
      or (v.scope_type='unit' and i.unit_id=v.unit_id))
      and (not v_is_resident or (i.unit_id=v.unit_id and (not v_is_tenant or i.liable_party_id=v_party)))
      and i.status not in ('draft','void','credited')
  ), grouped as (
    select currency,
      coalesce(sum(outstanding) filter(where due_on is null or due_on>=current_date),0) current_amount,
      coalesce(sum(outstanding) filter(where current_date-due_on between 1 and 30),0) days_1_30,
      coalesce(sum(outstanding) filter(where current_date-due_on between 31 and 60),0) days_31_60,
      coalesce(sum(outstanding) filter(where current_date-due_on between 61 and 90),0) days_61_90,
      coalesce(sum(outstanding) filter(where current_date-due_on>90),0) days_90_plus
    from scoped group by currency
  ) select coalesce(jsonb_agg(jsonb_build_object('currency',currency,'current',current_amount,
    'days_1_30',days_1_30,'days_31_60',days_31_60,'days_61_90',days_61_90,'days_90_plus',days_90_plus)
    order by currency),'[]'::jsonb) into v_aging from grouped;

  if p_invoice_id is not null then
    select coalesce(jsonb_agg(jsonb_build_object('id',l.id,'description',l.description,'quantity',l.quantity,
      'unit_price',l.unit_price,'tax_rate',l.tax_rate,'line_subtotal',l.line_subtotal,'line_tax',l.line_tax)
      order by l.created_at,l.id),'[]'::jsonb) into v_lines
    from billing.invoice_lines l join billing.invoices i on i.id=l.invoice_id
    where l.invoice_id=p_invoice_id and i.tenant_id=v.tenant_id
      and (v.scope_type='tenant' or i.property_id=v.property_id
        or i.property_id=(select b.property_id from portfolio.buildings b where b.id=v.building_id)
        or (v.scope_type='unit' and i.unit_id=v.unit_id))
      and (not v_is_resident or (i.unit_id=v.unit_id and (not v_is_tenant or i.liable_party_id=v_party)));
    select jsonb_build_object('id',j.id,'journal_no',j.journal_no,'status',j.status,'occurred_on',j.occurred_on,
      'entries',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'account_code',a.code,'side',e.side,'amount',e.amount)
        order by e.created_at,e.id) from finance.journal_entries e join finance.accounts a on a.id=e.account_id where e.journal_id=j.id),'[]'::jsonb))
    into v_journal from billing.invoices i join finance.journals j on j.id=i.journal_id and j.tenant_id=i.tenant_id
    where i.id=p_invoice_id and i.tenant_id=v.tenant_id
      and (v.scope_type='tenant' or i.property_id=v.property_id
        or i.property_id=(select b.property_id from portfolio.buildings b where b.id=v.building_id)
        or (v.scope_type='unit' and i.unit_id=v.unit_id))
      and (not v_is_resident or (i.unit_id=v.unit_id and (not v_is_tenant or i.liable_party_id=v_party)));
  end if;

  return jsonb_build_object('context',jsonb_build_object('id',v.id,'tenant_name',v.tenant_name,'role_code',v.role_code,'scope_type',v.scope_type),
    'total',v_total,'invoices',v_rows,'summary',v_summary,'aging',v_aging,'lines',coalesce(v_lines,'[]'::jsonb),
    'journal',v_journal,'limit',p_limit,'offset',p_offset,'read_only',true,'generated_at',statement_timestamp());
end $$;

create or replace function payments.get_customer_payments(
  p_context_id uuid,p_view text default 'payments',p_query text default null,p_status text default null,
  p_from date default null,p_to date default null,p_limit integer default 25,p_offset integer default 0,p_id uuid default null
) returns jsonb language plpgsql stable security definer
set search_path=pg_catalog,payments,billing,finance,identity,platform,portfolio,occupancy
as $$
declare v record; v_workspace uuid; v_party uuid; v_resident boolean; v_tenant boolean;
  v_total bigint; v_rows jsonb; v_matches jsonb; v_summary jsonb; v_detail jsonb; v_journal jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if app_private.customer_mfa_required() and coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501'; end if;
  if p_view not in ('payments','reconciliation') or p_limit<1 or p_limit>100 or p_offset<0 then raise exception 'invalid_query' using errcode='22023'; end if;
  select g.*,m.id membership_key,m.role_id,r.code role_code,r.name role_name,t.legal_name tenant_name into v
  from identity.context_grants g join identity.memberships m on m.id=g.membership_id and m.tenant_id=g.tenant_id
  join identity.roles r on r.id=m.role_id join platform.tenants t on t.id=m.tenant_id
  where g.id=p_context_id and m.user_id=auth.uid() and m.status='active'
    and m.starts_at<=statement_timestamp() and (m.ends_at is null or m.ends_at>statement_timestamp())
    and g.starts_at<=statement_timestamp() and (g.ends_at is null or g.ends_at>statement_timestamp());
  if not found then raise exception 'customer_context_access_denied' using errcode='42501'; end if;
  if lower(v.role_code) not in ('association_admin','property_manager','president','censor','owner','tenant_resident') then raise exception 'payment_role_denied' using errcode='42501'; end if;
  if not exists(select 1 from identity.role_permissions rp join identity.permissions p on p.id=rp.permission_id
    where rp.role_id=v.role_id and rp.effect='allow' and p.code='payments.reconciliation.read') then raise exception 'payment_permission_required' using errcode='42501'; end if;
  select w.id into v_workspace from platform.customer_workspaces w where w.tenant_id=v.tenant_id and w.lifecycle_status='ACTIVE' order by w.id limit 1;
  if v_workspace is null or not exists(select 1 from platform.workspace_entitlements e where e.customer_workspace_id=v_workspace
    and e.entitlement_key='module.payments' and e.valid_from<=statement_timestamp() and (e.valid_until is null or e.valid_until>statement_timestamp())
    and (case when e.override_value_json is not null and e.override_expires_at>statement_timestamp() then e.override_value_json='true'::jsonb else e.boolean_value is true end))
    then raise exception 'payment_entitlement_required' using errcode='42501'; end if;
  v_resident:=lower(v.role_code) in ('owner','tenant_resident'); v_tenant:=lower(v.role_code)='tenant_resident';
  if v_resident then
    if v.scope_type<>'unit' then raise exception 'resident_unit_context_required' using errcode='42501'; end if;
    select mp.party_id into v_party from identity.membership_parties mp where mp.membership_id=v.membership_key and mp.tenant_id=v.tenant_id;
    if v_party is null then raise exception 'resident_party_mapping_required' using errcode='42501'; end if;
    if not v_tenant and not exists(select 1 from portfolio.ownerships o where o.tenant_id=v.tenant_id and o.unit_id=v.unit_id and o.party_id=v_party
      and o.valid_from<=current_date and (o.valid_to is null or o.valid_to>current_date)) then raise exception 'ownership_required' using errcode='42501'; end if;
    if v_tenant and not exists(select 1 from occupancy.leases l where l.tenant_id=v.tenant_id and l.unit_id=v.unit_id and l.tenant_party_id=v_party
      and l.status='active' and l.starts_on<=current_date and (l.ends_on is null or l.ends_on>current_date)) then raise exception 'active_lease_required' using errcode='42501'; end if;
  end if;

  with visible as (
    select p.*,j.journal_no,coalesce((select sum(rm.matched_amount) from payments.reconciliation_matches rm where rm.payment_id=p.id and rm.status='confirmed'),0) allocated_amount
    from payments.payments p left join finance.journals j on j.id=p.journal_id and j.tenant_id=p.tenant_id where p.tenant_id=v.tenant_id
      and (v.scope_type='tenant' or p.property_id=v.property_id or p.property_id=(select b.property_id from portfolio.buildings b where b.id=v.building_id and b.tenant_id=v.tenant_id) or (v.scope_type='unit' and p.unit_id=v.unit_id))
      and (not v_resident or (p.unit_id=v.unit_id and (not v_tenant or p.payer_party_id=v_party)))
  ), filtered as (select * from visible x where (p_id is null or id=p_id) and (p_status is null or status::text=p_status)
    and (p_from is null or paid_at::date>=p_from) and (p_to is null or paid_at::date<=p_to)
    and (p_query is null or length(trim(p_query))=0 or coalesce(provider_ref,'') ilike '%'||trim(p_query)||'%' or coalesce(journal_no::text,'') ilike '%'||trim(p_query)||'%')),
  page as (select *,count(*) over() total_count from filtered order by paid_at desc,id desc limit p_limit offset p_offset)
  select coalesce(max(total_count),0),coalesce(jsonb_agg(jsonb_build_object('id',id,'provider_ref',provider_ref,'amount',amount,'currency',currency,
    'paid_at',paid_at,'status',status,'allocated_amount',allocated_amount,'unallocated_amount',greatest(amount-allocated_amount,0),
    'journal_id',journal_id,'journal_no',journal_no) order by paid_at desc,id desc),'[]'::jsonb) into v_total,v_rows from page;

  with visible as (
    select rm.*,bt.booked_on,bt.direction,bt.amount transaction_amount,bt.currency,
      p.provider_ref,i.invoice_no,coalesce(p.unit_id,i.unit_id) unit_id,coalesce(p.payer_party_id,i.liable_party_id) party_id
    from payments.reconciliation_matches rm join payments.bank_transactions bt on bt.id=rm.bank_transaction_id and bt.tenant_id=rm.tenant_id
    left join payments.payments p on p.id=rm.payment_id and p.tenant_id=rm.tenant_id left join billing.receivables br on br.id=rm.receivable_id and br.tenant_id=rm.tenant_id
    left join billing.invoices i on i.id=br.invoice_id and i.tenant_id=rm.tenant_id join payments.bank_accounts ba on ba.id=bt.bank_account_id
    where rm.tenant_id=v.tenant_id and (v.scope_type='tenant' or ba.property_id=v.property_id
      or ba.property_id=(select b.property_id from portfolio.buildings b where b.id=v.building_id and b.tenant_id=v.tenant_id)
      or (v.scope_type='unit' and coalesce(p.unit_id,i.unit_id)=v.unit_id))
      and (not v_resident or (coalesce(p.unit_id,i.unit_id)=v.unit_id and (not v_tenant or coalesce(p.payer_party_id,i.liable_party_id)=v_party)))
  ), filtered as (select * from visible x where (p_id is null or id=p_id) and (p_status is null or status::text=p_status)
    and (p_from is null or booked_on>=p_from) and (p_to is null or booked_on<=p_to)
    and (p_query is null or length(trim(p_query))=0 or coalesce(provider_ref,'') ilike '%'||trim(p_query)||'%' or coalesce(invoice_no::text,'') ilike '%'||trim(p_query)||'%')),
  page as (select *,count(*) over() total_count from filtered order by booked_on desc,id desc limit p_limit offset p_offset)
  select case when p_view='reconciliation' then coalesce(max(total_count),0) else v_total end,
    coalesce(jsonb_agg(jsonb_build_object('id',id,'booked_on',booked_on,'direction',direction,'transaction_amount',transaction_amount,
      'currency',currency,'matched_amount',matched_amount,'confidence',confidence,'status',status,'provider_ref',provider_ref,'invoice_no',invoice_no)
      order by booked_on desc,id desc),'[]'::jsonb) into v_total,v_matches from page;

  with pay_rows as (select p.*,coalesce((select sum(rm.matched_amount) from payments.reconciliation_matches rm where rm.payment_id=p.id and rm.status='confirmed'),0) allocated
    from payments.payments p where p.tenant_id=v.tenant_id
    and (v.scope_type='tenant' or p.property_id=v.property_id or p.property_id=(select b.property_id from portfolio.buildings b where b.id=v.building_id) or (v.scope_type='unit' and p.unit_id=v.unit_id))
    and (not v_resident or (p.unit_id=v.unit_id and (not v_tenant or p.payer_party_id=v_party)))),
  grouped as (select currency,coalesce(sum(amount) filter(where status='settled'),0) paid,coalesce(sum(allocated),0) reconciled,
    coalesce(sum(greatest(amount-allocated,0)) filter(where status in ('pending','settled')),0) unallocated,count(*) filter(where allocated=0) unmatched_count
    from pay_rows group by currency)
  select coalesce(jsonb_agg(jsonb_build_object('currency',currency,'paid',paid,'reconciled',reconciled,'unallocated',unallocated,
    'unmatched_count',unmatched_count) order by currency),'[]'::jsonb) into v_summary from grouped;

  if p_id is not null and p_view='payments' then
    select jsonb_build_object('id',j.id,'journal_no',j.journal_no,'status',j.status,'occurred_on',j.occurred_on,'entries',coalesce((select jsonb_agg(
      jsonb_build_object('id',e.id,'account_code',a.code,'side',e.side,'amount',e.amount) order by e.created_at,e.id)
      from finance.journal_entries e join finance.accounts a on a.id=e.account_id where e.journal_id=j.id),'[]'::jsonb)) into v_journal
    from payments.payments p join finance.journals j on j.id=p.journal_id and j.tenant_id=p.tenant_id where p.id=p_id and p.tenant_id=v.tenant_id
      and (v.scope_type='tenant' or p.property_id=v.property_id or (v.scope_type='unit' and p.unit_id=v.unit_id))
      and (not v_resident or (p.unit_id=v.unit_id and (not v_tenant or p.payer_party_id=v_party)));
  end if;
  return jsonb_build_object('context',jsonb_build_object('id',v.id,'tenant_name',v.tenant_name,'role_code',v.role_code,'scope_type',v.scope_type),
    'view',p_view,'total',v_total,'payments',v_rows,'reconciliations',v_matches,'summary',v_summary,'journal',v_journal,
    'limit',p_limit,'offset',p_offset,'read_only',true,'generated_at',statement_timestamp());
end $$;

create or replace function finance.get_customer_allocations(
  p_context_id uuid,p_view text default 'runs',p_query text default null,p_status text default null,
  p_method text default null,p_from date default null,p_to date default null,p_limit integer default 25,
  p_offset integer default 0,p_id uuid default null
) returns jsonb language plpgsql stable security definer
set search_path=pg_catalog,finance,billing,identity,platform,portfolio,occupancy
as $$
declare v record; v_workspace uuid; v_party uuid; v_resident boolean; v_tenant boolean;
  v_property uuid; v_total bigint; v_rows jsonb; v_summary jsonb; v_detail jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if app_private.customer_mfa_required() and coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501'; end if;
  if p_view not in ('runs','rules','lines') or p_limit<1 or p_limit>100 or p_offset<0 then raise exception 'invalid_query' using errcode='22023'; end if;
  if p_method is not null and p_method not in ('meter_consumption','cpi','per_person','surface_m2','direct','fixed') then raise exception 'invalid_method' using errcode='22023'; end if;
  select g.*,m.id membership_key,m.role_id,r.code role_code,r.name role_name,t.legal_name tenant_name into v
  from identity.context_grants g join identity.memberships m on m.id=g.membership_id and m.tenant_id=g.tenant_id
  join identity.roles r on r.id=m.role_id join platform.tenants t on t.id=m.tenant_id
  where g.id=p_context_id and m.user_id=auth.uid() and m.status='active'
    and m.starts_at<=statement_timestamp() and (m.ends_at is null or m.ends_at>statement_timestamp())
    and g.starts_at<=statement_timestamp() and (g.ends_at is null or g.ends_at>statement_timestamp());
  if not found then raise exception 'customer_context_access_denied' using errcode='42501'; end if;
  if lower(v.role_code) not in ('association_admin','property_manager','president','censor','owner','tenant_resident') then raise exception 'allocation_role_denied' using errcode='42501'; end if;
  if not exists(select 1 from identity.role_permissions rp join identity.permissions p on p.id=rp.permission_id
    where rp.role_id=v.role_id and rp.effect='allow' and p.code='finance.allocations.read') then raise exception 'allocation_permission_required' using errcode='42501'; end if;
  select w.id into v_workspace from platform.customer_workspaces w where w.tenant_id=v.tenant_id and w.lifecycle_status='ACTIVE' order by w.id limit 1;
  if v_workspace is null or not exists(select 1 from platform.workspace_entitlements e where e.customer_workspace_id=v_workspace
    and e.entitlement_key='module.accounting' and e.valid_from<=statement_timestamp() and (e.valid_until is null or e.valid_until>statement_timestamp())
    and (case when e.override_value_json is not null and e.override_expires_at>statement_timestamp() then e.override_value_json='true'::jsonb else e.boolean_value is true end))
    then raise exception 'allocation_entitlement_required' using errcode='42501'; end if;
  v_property:=case when v.scope_type='property' then v.property_id when v.scope_type='building' then
    (select b.property_id from portfolio.buildings b where b.id=v.building_id and b.tenant_id=v.tenant_id)
    when v.scope_type='unit' then (select b.property_id from portfolio.units u join portfolio.buildings b on b.id=u.building_id where u.id=v.unit_id and u.tenant_id=v.tenant_id) else null end;
  v_resident:=lower(v.role_code) in ('owner','tenant_resident'); v_tenant:=lower(v.role_code)='tenant_resident';
  if v_resident then
    if v.scope_type<>'unit' then raise exception 'resident_unit_context_required' using errcode='42501'; end if;
    select mp.party_id into v_party from identity.membership_parties mp where mp.membership_id=v.membership_key and mp.tenant_id=v.tenant_id;
    if v_party is null then raise exception 'resident_party_mapping_required' using errcode='42501'; end if;
    if not v_tenant and not exists(select 1 from portfolio.ownerships o where o.tenant_id=v.tenant_id and o.unit_id=v.unit_id and o.party_id=v_party
      and o.valid_from<=current_date and (o.valid_to is null or o.valid_to>current_date)) then raise exception 'ownership_required' using errcode='42501'; end if;
    if v_tenant and not exists(select 1 from occupancy.leases l where l.tenant_id=v.tenant_id and l.unit_id=v.unit_id and l.tenant_party_id=v_party
      and l.status='active' and l.starts_on<=current_date and (l.ends_on is null or l.ends_on>current_date)) then raise exception 'active_lease_required' using errcode='42501'; end if;
  end if;

  if p_view='rules' then
    with visible as (select r.*,c.code category_code,c.name category_name from finance.allocation_rules r join finance.charge_categories c on c.id=r.charge_category_id
      where r.tenant_id=v.tenant_id and (v_property is null or r.property_id=v_property)
      and (not v_resident or exists(select 1 from finance.allocation_items a join finance.allocation_runs ar on ar.id=a.run_id
        where ar.tenant_id=v.tenant_id and ar.property_id=v_property and (a.rule_snapshot->>'rule_id')=r.id::text
        and a.unit_id=v.unit_id and (case when v_tenant then a.responsible_party_id=v_party and lower(coalesce(a.explanation_json->>'legal_debtor',''))='tenant'
          else lower(coalesce(a.explanation_json->>'legal_debtor','shared')) in ('owner','shared') end)))),
    filtered as (select * from visible where (p_id is null or id=p_id) and (p_status is null or status::text=p_status) and (p_method is null or method::text=p_method)
      and (p_from is null or valid_from>=p_from) and (p_to is null or coalesce(valid_to,'infinity'::date)<=p_to)
      and (p_query is null or trim(p_query)='' or category_code ilike '%'||trim(p_query)||'%' or category_name ilike '%'||trim(p_query)||'%')),
    page as (select *,count(*) over() total_count from filtered order by valid_from desc,id desc limit p_limit offset p_offset)
    select coalesce(max(total_count),0),coalesce(jsonb_agg(jsonb_build_object('id',id,'category_code',category_code,'category_name',category_name,'method',method,
      'parameters',parameters,'valid_from',valid_from,'valid_to',valid_to,'version',version,'status',status) order by valid_from desc,id desc),'[]'::jsonb) into v_total,v_rows from page;
  elsif p_view='runs' then
    with visible as (select r.*,j.journal_no,
      case when v_resident then coalesce((select sum(a.allocated_amount) from finance.allocation_items a where a.run_id=r.id and a.unit_id=v.unit_id
        and (case when v_tenant then a.responsible_party_id=v_party and lower(coalesce(a.explanation_json->>'legal_debtor',''))='tenant'
          else lower(coalesce(a.explanation_json->>'legal_debtor','shared')) in ('owner','shared') end)),0)
        else coalesce((select sum(i.amount) from finance.allocation_inputs i where i.run_id=r.id),0) end source_amount,
      coalesce((select sum(a.allocated_amount) from finance.allocation_items a where a.run_id=r.id
        and (not v_resident or (a.unit_id=v.unit_id and (case when v_tenant then a.responsible_party_id=v_party and lower(coalesce(a.explanation_json->>'legal_debtor',''))='tenant'
          else lower(coalesce(a.explanation_json->>'legal_debtor','shared')) in ('owner','shared') end)))),0) allocated_amount from finance.allocation_runs r
      left join finance.journals j on j.id=r.journal_id where r.tenant_id=v.tenant_id and (v_property is null or r.property_id=v_property)
      and (not v_resident or exists(select 1 from finance.allocation_items a where a.run_id=r.id and a.unit_id=v.unit_id
        and (case when v_tenant then a.responsible_party_id=v_party and lower(coalesce(a.explanation_json->>'legal_debtor',''))='tenant'
          else lower(coalesce(a.explanation_json->>'legal_debtor','shared')) in ('owner','shared') end)))),
    filtered as (select * from visible where (p_id is null or id=p_id) and (p_status is null or status::text=p_status)
      and (p_from is null or period_start>=p_from) and (p_to is null or period_end<=p_to)
      and (p_query is null or trim(p_query)='' or coalesce(journal_no,'') ilike '%'||trim(p_query)||'%' or id::text ilike '%'||trim(p_query)||'%')),
    page as (select *,count(*) over() total_count from filtered order by period_start desc,id desc limit p_limit offset p_offset)
    select coalesce(max(total_count),0),coalesce(jsonb_agg(jsonb_build_object('id',id,'period_start',period_start,'period_end',period_end,'currency',currency,'status',status,
      'source_amount',source_amount,'allocated_amount',allocated_amount,'difference',source_amount-allocated_amount,'input_hash',input_hash,'calculated_at',calculated_at,
      'approved_at',approved_at,'journal_id',journal_id,'journal_no',journal_no) order by period_start desc,id desc),'[]'::jsonb) into v_total,v_rows from page;
  else
    with visible as (select a.*,r.period_start,r.period_end,r.currency,r.status run_status,i.amount source_amount,i.source_type,i.source_id,
      c.code category_code,c.name category_name,inv.invoice_no,
      coalesce(a.explanation_json->>'legal_debtor','shared') legal_debtor,coalesce(a.explanation_json->>'operational_payer','owner') operational_payer
      from finance.allocation_items a join finance.allocation_runs r on r.id=a.run_id and r.tenant_id=a.tenant_id
      join finance.allocation_inputs i on i.id=a.input_id and i.run_id=a.run_id join finance.charge_categories c on c.id=i.category_id
      left join billing.invoices inv on i.source_type='invoice' and inv.id=i.source_id and inv.tenant_id=i.tenant_id
      where a.tenant_id=v.tenant_id and (v_property is null or r.property_id=v_property)
      and (not v_resident or (a.unit_id=v.unit_id and (case when v_tenant then a.responsible_party_id=v_party and lower(coalesce(a.explanation_json->>'legal_debtor',''))='tenant'
        else lower(coalesce(a.explanation_json->>'legal_debtor','shared')) in ('owner','shared') end)))),
    filtered as (select * from visible where (p_id is null or id=p_id) and (p_status is null or run_status::text=p_status) and (p_method is null or method::text=p_method)
      and (p_from is null or period_start>=p_from) and (p_to is null or period_end<=p_to)
      and (p_query is null or trim(p_query)='' or category_code ilike '%'||trim(p_query)||'%' or category_name ilike '%'||trim(p_query)||'%' or coalesce(invoice_no,'') ilike '%'||trim(p_query)||'%')),
    page as (select *,count(*) over() total_count from filtered order by period_start desc,id desc limit p_limit offset p_offset)
    select coalesce(max(total_count),0),coalesce(jsonb_agg(jsonb_build_object('id',id,'run_id',run_id,'period_start',period_start,'period_end',period_end,'run_status',run_status,
      'currency',currency,'category_code',category_code,'category_name',category_name,'source_type',source_type,'source_id',source_id,'source_document',invoice_no,
      'source_amount',source_amount,'method',method,'basis_value',basis_value,'basis_total',basis_total,'share_ratio',case when basis_total>0 then basis_value/basis_total else 0 end,
      'allocated_amount',allocated_amount,'legal_debtor',legal_debtor,'operational_payer',operational_payer,'rule_snapshot',rule_snapshot,'explanation',explanation_json)
      order by period_start desc,id desc),'[]'::jsonb) into v_total,v_rows from page;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('currency',currency,'source_amount',source_amount,'allocated_amount',allocated_amount,'difference',source_amount-allocated_amount,'run_count',run_count) order by currency),'[]'::jsonb)
  into v_summary from (select r.currency,coalesce(sum(i.source_amount),0) source_amount,coalesce(sum(i.allocated_amount),0) allocated_amount,count(*) run_count from finance.allocation_runs r
    left join lateral(select case when v_resident then coalesce((select sum(a.allocated_amount) from finance.allocation_items a where a.run_id=r.id and a.unit_id=v.unit_id
      and (case when v_tenant then a.responsible_party_id=v_party and lower(coalesce(a.explanation_json->>'legal_debtor',''))='tenant'
        else lower(coalesce(a.explanation_json->>'legal_debtor','shared')) in ('owner','shared') end)),0)
      else coalesce(sum(x.amount),0) end source_amount from finance.allocation_inputs x where x.run_id=r.id) i0 on true
    left join lateral(select coalesce(sum(x.allocated_amount),0) allocated_amount from finance.allocation_items x where x.run_id=r.id
      and (not v_resident or (x.unit_id=v.unit_id and (case when v_tenant then x.responsible_party_id=v_party and lower(coalesce(x.explanation_json->>'legal_debtor',''))='tenant'
        else lower(coalesce(x.explanation_json->>'legal_debtor','shared')) in ('owner','shared') end)))) a0 on true
    cross join lateral(select i0.source_amount,a0.allocated_amount) i
    where r.tenant_id=v.tenant_id and (v_property is null or r.property_id=v_property)
      and (not v_resident or exists(select 1 from finance.allocation_items a where a.run_id=r.id and a.unit_id=v.unit_id
        and (case when v_tenant then a.responsible_party_id=v_party and lower(coalesce(a.explanation_json->>'legal_debtor',''))='tenant'
          else lower(coalesce(a.explanation_json->>'legal_debtor','shared')) in ('owner','shared') end))) group by r.currency) s;
  if p_id is not null then v_detail:=case when v_total=1 then v_rows->0 else null end; end if;
  return jsonb_build_object('context',jsonb_build_object('id',v.id,'tenant_name',v.tenant_name,'role_code',v.role_code,'scope_type',v.scope_type),
    'view',p_view,'total',v_total,'rows',v_rows,'summary',v_summary,'detail',v_detail,'limit',p_limit,'offset',p_offset,'read_only',true,'generated_at',statement_timestamp());
end $$;

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
  if app_private.customer_mfa_required() and coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501'; end if;
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

create or replace function maintenance.get_customer_maintenance(
  p_context_id uuid,p_view text default 'assets',p_query text default null,p_status text default null,p_priority text default null,
  p_from date default null,p_to date default null,p_limit integer default 25,p_offset integer default 0,p_id uuid default null
) returns jsonb language plpgsql stable security definer
set search_path=pg_catalog,maintenance,assets,identity,platform,portfolio,occupancy,billing,finance
as $$
declare v record; v_workspace uuid; v_party uuid; v_resident boolean; v_tenant boolean; v_total bigint; v_rows jsonb; v_summary jsonb; v_detail jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if app_private.customer_mfa_required() and coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501'; end if;
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

create or replace function governance.get_customer_governance(p_context_id uuid,p_view text default 'meetings',p_query text default null,p_status text default null,p_from date default null,p_to date default null,p_limit integer default 25,p_offset integer default 0,p_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog,governance,identity,platform,portfolio,occupancy,documents,audit
as $$
declare x record;v_workspace uuid;v_party uuid;v_resident boolean;v_tenant boolean;v_total bigint;v_rows jsonb;v_summary jsonb;v_detail jsonb;
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501';end if;
 if app_private.customer_mfa_required() and coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501';end if;
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

create or replace function communications.get_customer_communications(p_context_id uuid,p_view text default 'posts',p_query text default null,p_status text default null,p_from date default null,p_to date default null,p_limit integer default 25,p_offset integer default 0,p_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog,communications,identity,platform,portfolio,occupancy,governance,maintenance,billing,documents,audit
as $$
declare x record;v_workspace uuid;v_party uuid;v_resident boolean;v_tenant boolean;v_total bigint;v_rows jsonb;v_summary jsonb;v_detail jsonb;
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501';end if;
 if app_private.customer_mfa_required() and coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501';end if;
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

create or replace function documents.get_customer_documents(p_context_id uuid,p_view text default 'documents',p_query text default null,p_status text default null,p_classification text default null,p_from date default null,p_to date default null,p_limit integer default 25,p_offset integer default 0,p_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog,documents,identity,platform,portfolio,occupancy
as $$
declare x record;v_workspace uuid;v_party uuid;v_resident boolean;v_tenant boolean;v_total bigint;v_rows jsonb;v_summary jsonb;v_detail jsonb;
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501';end if;
 if app_private.customer_mfa_required() and coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501';end if;
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

create or replace function occupancy.get_customer_registry(p_context_id uuid,p_view text default'occupancies',p_query text default null,p_status text default null,p_kind text default null,p_from date default null,p_to date default null,p_limit integer default 25,p_offset integer default 0,p_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog,occupancy,portfolio,identity,platform,billing,payments,utilities,maintenance,governance,documents,audit
as $$
declare x record;v_workspace uuid;v_party uuid;v_total bigint;v_rows jsonb;v_summary jsonb;v_detail jsonb;
begin
 if auth.uid()is null then raise exception'authentication_required'using errcode='42501';end if;
 if app_private.customer_mfa_required() and coalesce(auth.jwt()->>'aal','aal1')<>'aal2'then raise exception'mfa_required'using errcode='42501';end if;
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
 if p_view='occupancies'then with allowed_units as(select u.id,u.code unit_code,b.name building_name,p.name property_name from portfolio.units u join portfolio.buildings b on b.id=u.building_id join portfolio.properties p on p.id=b.property_id where u.tenant_id=x.tenant_id and(x.scope_type='tenant'or p.id=x.property_id or b.id=x.building_id or u.id=x.unit_id)and(case lower(x.role_code)when'owner'then exists(select 1 from portfolio.ownerships z where z.unit_id=u.id and z.party_id=v_party and z.valid_from<=current_date and(z.valid_to is null or z.valid_to>current_date))when'tenant_resident'then exists(select 1 from occupancy.leases z where z.unit_id=u.id and z.tenant_party_id=v_party and z.status='active'and z.starts_on<=current_date and(z.ends_on is null or z.ends_on>current_date))else true end)),q as(select o.id,a.property_name,a.building_name,a.unit_code,o.kind::text,o.status::text,o.starts_at,o.ends_at,(select count(*)from occupancy.occupants z where z.occupancy_id=o.id and(lower(x.role_code)<>'tenant_resident'or z.party_id=v_party))resident_count,o.finalized_at,count(*)over()total_count from occupancy.occupancies o join allowed_units a on a.id=o.unit_id where(lower(x.role_code)<>'tenant_resident'or(exists(select 1 from occupancy.occupants z where z.occupancy_id=o.id and z.party_id=v_party)and exists(select 1 from occupancy.leases l where l.unit_id=o.unit_id and l.tenant_party_id=v_party and l.status='active'and l.starts_on<=o.starts_at::date and(l.ends_on is null or l.ends_on>=coalesce(o.ends_at::date,o.starts_at::date)))))and(p_id is null or o.id=p_id)and(p_status is null or o.status::text=p_status)and(p_kind is null or o.kind::text=p_kind)and(p_from is null or o.starts_at::date>=p_from)and(p_to is null or o.starts_at::date<=p_to)and(p_query is null or a.unit_code ilike'%'||trim(p_query)||'%'or a.building_name ilike'%'||trim(p_query)||'%')order by o.starts_at desc,o.id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='ownerships'then with q as(select o.id,u.code unit_code,b.name building_name,case when lower(x.role_code)in('association_admin','property_manager')or o.party_id=v_party then p.legal_name else'Owner · '||left(o.party_id::text,8)end party_label,p.type::text party_type,o.share,o.valid_from,o.valid_to,o.finalized_at,count(*)over()total_count from portfolio.ownerships o join portfolio.units u on u.id=o.unit_id join portfolio.buildings b on b.id=u.building_id join portfolio.parties p on p.id=o.party_id where o.tenant_id=x.tenant_id and(x.scope_type='tenant'or b.property_id=x.property_id or b.id=x.building_id or u.id=x.unit_id)and(lower(x.role_code)not in('owner','tenant_resident')or o.party_id=v_party)and(p_id is null or o.id=p_id)and(p_from is null or o.valid_from>=p_from)and(p_to is null or o.valid_from<=p_to)and(p_query is null or u.code ilike'%'||trim(p_query)||'%'or(lower(x.role_code)in('association_admin','property_manager')and p.legal_name ilike'%'||trim(p_query)||'%'))order by o.valid_from desc,o.id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='leases'then with q as(select l.id,u.code unit_code,b.name building_name,case when lower(x.role_code)in('association_admin','property_manager')or l.landlord_party_id=v_party then lp.legal_name else'Landlord · '||left(l.landlord_party_id::text,8)end landlord_label,case when lower(x.role_code)in('association_admin','property_manager')or l.tenant_party_id=v_party then tp.legal_name else'Tenant · '||left(l.tenant_party_id::text,8)end tenant_label,l.starts_on,l.ends_on,l.currency,l.status::text,l.finalized_at,count(*)over()total_count from occupancy.leases l join portfolio.units u on u.id=l.unit_id join portfolio.buildings b on b.id=u.building_id join portfolio.parties lp on lp.id=l.landlord_party_id join portfolio.parties tp on tp.id=l.tenant_party_id where l.tenant_id=x.tenant_id and(x.scope_type='tenant'or b.property_id=x.property_id or b.id=x.building_id or u.id=x.unit_id)and(lower(x.role_code)not in('owner','tenant_resident')or l.landlord_party_id=v_party or l.tenant_party_id=v_party)and(p_id is null or l.id=p_id)and(p_status is null or l.status::text=p_status)and(p_from is null or l.starts_on>=p_from)and(p_to is null or l.starts_on<=p_to)and(p_query is null or u.code ilike'%'||trim(p_query)||'%')order by l.starts_on desc,l.id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='residents'then with q as(select z.party_id id,u.code unit_code,b.name building_name,case when lower(x.role_code)in('association_admin','property_manager')or z.party_id=v_party then p.legal_name else'Resident · '||left(z.party_id::text,8)end resident_label,p.type::text party_type,z.role,z.resident_weight,o.kind::text,o.starts_at,o.ends_at,count(*)over()total_count from occupancy.occupants z join occupancy.occupancies o on o.id=z.occupancy_id join portfolio.units u on u.id=o.unit_id join portfolio.buildings b on b.id=u.building_id join portfolio.parties p on p.id=z.party_id where o.tenant_id=x.tenant_id and(x.scope_type='tenant'or b.property_id=x.property_id or b.id=x.building_id or u.id=x.unit_id)and(lower(x.role_code)not in('owner','tenant_resident')or z.party_id=v_party)and(p_query is null or u.code ilike'%'||trim(p_query)||'%'or(lower(x.role_code)in('association_admin','property_manager')and p.legal_name ilike'%'||trim(p_query)||'%'))order by o.starts_at desc,z.party_id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='parties'then with visible as(select distinct p.id,p.type,p.legal_name,p.created_at,p.archived_at from portfolio.parties p left join portfolio.ownerships ow on ow.party_id=p.id left join occupancy.leases l on l.landlord_party_id=p.id or l.tenant_party_id=p.id left join occupancy.occupants oc on oc.party_id=p.id left join occupancy.occupancies o on o.id=oc.occupancy_id where p.tenant_id=x.tenant_id and(lower(x.role_code)in('association_admin','property_manager','president','censor')or p.id=v_party)and(p_query is null or(lower(x.role_code)in('association_admin','property_manager')and p.legal_name ilike'%'||trim(p_query)||'%'))),q as(select id,type::text party_type,case when lower(x.role_code)in('association_admin','property_manager')or id=v_party then legal_name else'Party · '||left(id::text,8)end display_name,created_at,archived_at,count(*)over()total_count from visible order by created_at desc,id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='mappings'then with q as(select mp.party_id id,case when mp.party_id=v_party then p.legal_name else'Party · '||left(mp.party_id::text,8)end party_label,r.code role_code,mp.valid_from,mp.valid_until,mp.finalized_at,(mp.valid_from<=statement_timestamp()and(mp.valid_until is null or mp.valid_until>statement_timestamp()))active,count(*)over()total_count from identity.membership_parties mp join identity.memberships m on m.id=mp.membership_id join identity.roles r on r.id=m.role_id join portfolio.parties p on p.id=mp.party_id where mp.tenant_id=x.tenant_id and(lower(x.role_code)in('association_admin','property_manager')or mp.membership_id=x.membership_key)order by mp.valid_from desc,mp.party_id limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 elsif p_view='links'then with q as(select u.id,u.code unit_code,b.name building_name,p.name property_name,(select count(*)from billing.invoices i where i.unit_id=u.id and(lower(x.role_code)<>'tenant_resident'or i.liable_party_id=v_party))invoice_count,(select count(*)from billing.receivables r join billing.invoices i on i.id=r.invoice_id where i.unit_id=u.id and(lower(x.role_code)<>'tenant_resident'or i.liable_party_id=v_party))receivable_count,(select count(*)from payments.payments y where y.unit_id=u.id and(lower(x.role_code)<>'tenant_resident'or y.payer_party_id=v_party))payment_count,(select count(*)from utilities.meters m where m.unit_id=u.id)meter_count,(select count(*)from maintenance.work_orders w where w.unit_id=u.id)work_order_count,(select count(distinct e.meeting_id)from governance.eligibility_snapshots e where e.unit_id=u.id and(lower(x.role_code)<>'tenant_resident'or e.party_id=v_party))meeting_count,(select count(*)from documents.document_links d where d.entity_type='portfolio.unit'and d.entity_id=u.id)document_count,(select count(*)from audit.events a where a.tenant_id=x.tenant_id and a.entity_id=u.id)audit_event_count,count(*)over()total_count from portfolio.units u join portfolio.buildings b on b.id=u.building_id join portfolio.properties p on p.id=b.property_id where u.tenant_id=x.tenant_id and(x.scope_type='tenant'or p.id=x.property_id or b.id=x.building_id or u.id=x.unit_id)and(lower(x.role_code)not in('owner','tenant_resident')or u.id=x.unit_id)order by p.name,b.name,u.code limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;
 else with q as(select h.id,h.entity_type,h.entity_id,h.event_type,h.status_from,h.status_to,h.reason,h.rule_version,h.occurred_at,count(*)over()total_count from occupancy.lifecycle_events h where h.tenant_id=x.tenant_id and(lower(x.role_code)in('association_admin','property_manager','president','censor')or h.entity_id=v_party or h.entity_id=x.unit_id)order by h.occurred_at desc,h.id desc limit p_limit offset p_offset)select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count'),'[]')into v_total,v_rows from q;end if;
 v_detail:=case when p_id is null then null else(select r from jsonb_array_elements(v_rows)r where r->>'id'=p_id::text limit 1)end;
 return jsonb_build_object('context',jsonb_build_object('id',x.id,'role',x.role_code,'scope',x.scope_type),'view',p_view,'total',coalesce(v_total,0),'rows',coalesce(v_rows,'[]'),'summary',coalesce(v_summary,'{}'),'detail',v_detail,'read_only',true,'pii_redacted',true,'generated_at',statement_timestamp());
end $$;

create or replace function security_access.get_customer_security_access(p_context_id uuid,p_view text default'access_points',p_query text default null,p_status text default null,p_kind text default null,p_from timestamptz default null,p_to timestamptz default null,p_limit integer default 25,p_offset integer default 0,p_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog,security_access,platform,identity,portfolio,occupancy,maintenance,documents,audit
as $$
declare x record;v_workspace uuid;v_party uuid;v_total bigint;v_rows jsonb;v_summary jsonb;v_detail jsonb;
begin
 if auth.uid()is null then raise exception'authentication_required'using errcode='42501';end if;
 if app_private.customer_mfa_required() and coalesce(auth.jwt()->>'aal','aal1')<>'aal2'then raise exception'mfa_required'using errcode='42501';end if;
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

create or replace function maintenance.get_customer_procurement(
  p_context_id uuid,
  p_view text default 'vendors',
  p_query text default null,
  p_status text default null,
  p_currency text default null,
  p_from date default null,
  p_to date default null,
  p_limit integer default 25,
  p_offset integer default 0,
  p_id uuid default null
) returns jsonb
language plpgsql stable security definer
set search_path=pg_catalog,maintenance,identity,platform,portfolio
as $$
declare
  v record;
  v_workspace uuid;
  v_total bigint;
  v_rows jsonb;
  v_summary jsonb;
  v_detail jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode='42501';
  end if;
  if app_private.customer_mfa_required() and coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then
    raise exception 'mfa_required' using errcode='42501';
  end if;
  if p_view not in ('vendors','contracts','quotes','purchase_orders','sla')
    or p_limit<1 or p_limit>100 or p_offset<0
    or (p_currency is not null and p_currency !~ '^[A-Z]{3}$')
    or (p_from is not null and p_to is not null and p_from>p_to)
  then
    raise exception 'invalid_query' using errcode='22023';
  end if;

  select g.*,m.role_id,r.code role_code,t.legal_name tenant_name,
    coalesce(g.property_id,b.property_id,ub.property_id) scope_property_id
  into v
  from identity.context_grants g
  join identity.memberships m on m.id=g.membership_id and m.tenant_id=g.tenant_id
  join identity.roles r on r.id=m.role_id
  join platform.tenants t on t.id=m.tenant_id
  left join portfolio.buildings b on b.id=g.building_id and b.tenant_id=g.tenant_id
  left join portfolio.units u on u.id=g.unit_id and u.tenant_id=g.tenant_id
  left join portfolio.buildings ub on ub.id=u.building_id and ub.tenant_id=g.tenant_id
  where g.id=p_context_id and m.user_id=auth.uid() and m.status='active'
    and m.starts_at<=statement_timestamp() and (m.ends_at is null or m.ends_at>statement_timestamp())
    and g.starts_at<=statement_timestamp() and (g.ends_at is null or g.ends_at>statement_timestamp());
  if not found then
    raise exception 'customer_context_access_denied' using errcode='42501';
  end if;
  if lower(v.role_code) not in ('association_admin','property_manager','president','censor') then
    raise exception 'procurement_role_denied' using errcode='42501';
  end if;
  if not exists(
    select 1 from identity.role_permissions rp
    join identity.permissions p on p.id=rp.permission_id
    where rp.role_id=v.role_id and rp.effect='allow' and p.code='maintenance.procurement.read'
  ) then
    raise exception 'procurement_permission_required' using errcode='42501';
  end if;

  select w.id into v_workspace
  from platform.customer_workspaces w
  where w.tenant_id=v.tenant_id and w.lifecycle_status='ACTIVE'
  order by w.id limit 1;
  if v_workspace is null or not exists(
    select 1 from platform.workspace_entitlements e
    where e.customer_workspace_id=v_workspace and e.entitlement_key='module.maintenance'
      and e.valid_from<=statement_timestamp() and (e.valid_until is null or e.valid_until>statement_timestamp())
      and (case when e.override_value_json is not null and e.override_expires_at>statement_timestamp()
        then e.override_value_json='true'::jsonb else e.boolean_value is true end)
  ) then
    raise exception 'procurement_entitlement_required' using errcode='42501';
  end if;

  select jsonb_build_object(
    'vendors',(
      select count(*) from maintenance.vendors mv
      where mv.tenant_id=v.tenant_id and (
        v.scope_type='tenant'
        or exists(select 1 from maintenance.vendor_contracts vc where vc.vendor_id=mv.id and vc.tenant_id=v.tenant_id and vc.property_id=v.scope_property_id)
        or exists(select 1 from maintenance.work_order_assignments wa join maintenance.work_orders w on w.id=wa.work_order_id where wa.vendor_id=mv.id and wa.tenant_id=v.tenant_id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,w.property_id,w.building_id,w.unit_id))
      )
    ),
    'active_contracts',(
      select count(*) from maintenance.vendor_contracts vc
      where vc.tenant_id=v.tenant_id and (v.scope_type='tenant' or vc.property_id=v.scope_property_id)
        and vc.status='active' and vc.starts_on<=current_date and (vc.ends_on is null or vc.ends_on>=current_date)
    ),
    'open_quotes',(
      select count(*) from maintenance.vendor_quotes q join maintenance.work_orders w on w.id=q.work_order_id
      where q.tenant_id=v.tenant_id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,w.property_id,w.building_id,w.unit_id)
        and q.status in ('draft','active') and (q.valid_until is null or q.valid_until>=current_date)
    ),
    'purchase_orders',(
      select count(*) from maintenance.purchase_orders po join maintenance.work_orders w on w.id=po.work_order_id
      where po.tenant_id=v.tenant_id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,w.property_id,w.building_id,w.unit_id)
        and po.status not in ('cancelled','received')
    )
  ) into v_summary;

  if p_view='vendors' then
    with q as (
      select mv.id,pp.legal_name vendor_name,mv.status::text,mv.service_categories,mv.rating,mv.insurance_valid_until,
        case when mv.insurance_valid_until is null then 'unrecorded' when mv.insurance_valid_until<current_date then 'expired' else 'valid' end insurance_status,
        (select count(*) from maintenance.vendor_contracts vc where vc.vendor_id=mv.id and vc.tenant_id=v.tenant_id and (v.scope_type='tenant' or vc.property_id=v.scope_property_id) and vc.status='active' and vc.starts_on<=current_date and (vc.ends_on is null or vc.ends_on>=current_date)) active_contracts,
        (select count(*) from maintenance.vendor_quotes vq join maintenance.work_orders wo on wo.id=vq.work_order_id where vq.vendor_id=mv.id and vq.tenant_id=v.tenant_id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,wo.property_id,wo.building_id,wo.unit_id) and vq.status in ('draft','active') and (vq.valid_until is null or vq.valid_until>=current_date)) open_quotes,
        count(*) over() total_count
      from maintenance.vendors mv join portfolio.parties pp on pp.id=mv.party_id
      where mv.tenant_id=v.tenant_id and (
        v.scope_type='tenant'
        or exists(select 1 from maintenance.vendor_contracts vc where vc.vendor_id=mv.id and vc.tenant_id=v.tenant_id and vc.property_id=v.scope_property_id)
        or exists(select 1 from maintenance.work_order_assignments wa join maintenance.work_orders wo on wo.id=wa.work_order_id where wa.vendor_id=mv.id and wa.tenant_id=v.tenant_id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,wo.property_id,wo.building_id,wo.unit_id))
      )
      and (p_id is null or mv.id=p_id)
      and (p_status is null or mv.status::text=p_status)
      and (p_query is null or trim(p_query)='' or pp.legal_name ilike '%'||trim(p_query)||'%' or exists(select 1 from unnest(mv.service_categories) c where c ilike '%'||trim(p_query)||'%'))
      order by pp.legal_name,mv.id limit p_limit offset p_offset
    )
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count' order by vendor_name,id),'[]') into v_total,v_rows from q;
  elsif p_view='contracts' then
    with q as (
      select vc.id,'Contract · '||left(vc.id::text,8) contract_label,pp.legal_name vendor_name,p.name property_name,
        vc.starts_on,vc.ends_on,vc.currency,vc.rate_card,vc.sla_json sla_terms,vc.status::text,
        (vc.status='active' and vc.starts_on<=current_date and (vc.ends_on is null or vc.ends_on>=current_date)) is_current,
        count(*) over() total_count
      from maintenance.vendor_contracts vc
      join maintenance.vendors mv on mv.id=vc.vendor_id and mv.tenant_id=vc.tenant_id
      join portfolio.parties pp on pp.id=mv.party_id
      join portfolio.properties p on p.id=vc.property_id and p.tenant_id=vc.tenant_id
      where vc.tenant_id=v.tenant_id and (v.scope_type='tenant' or vc.property_id=v.scope_property_id)
        and (p_id is null or vc.id=p_id) and (p_status is null or vc.status::text=p_status) and (p_currency is null or vc.currency=p_currency)
        and (p_from is null or coalesce(vc.ends_on,'infinity'::date)>=p_from) and (p_to is null or vc.starts_on<=p_to)
        and (p_query is null or trim(p_query)='' or pp.legal_name ilike '%'||trim(p_query)||'%' or p.name ilike '%'||trim(p_query)||'%')
      order by vc.starts_on desc,vc.id desc limit p_limit offset p_offset
    )
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count' order by starts_on desc,id desc),'[]') into v_total,v_rows from q;
  elsif p_view='quotes' then
    with q as (
      select vq.id,vq.quote_ref,wo.work_order_no,wo.title work_order_title,pp.legal_name vendor_name,
        vq.subtotal,vq.tax_total,(vq.subtotal+vq.tax_total) total_amount,vq.currency,vq.valid_until,
        case when vq.valid_until<current_date and vq.status in ('draft','active') then 'expired' else vq.status::text end effective_status,
        vq.submitted_at,vq.created_at,count(*) over() total_count
      from maintenance.vendor_quotes vq
      join maintenance.work_orders wo on wo.id=vq.work_order_id and wo.tenant_id=vq.tenant_id
      join maintenance.vendors mv on mv.id=vq.vendor_id and mv.tenant_id=vq.tenant_id
      join portfolio.parties pp on pp.id=mv.party_id
      where vq.tenant_id=v.tenant_id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,wo.property_id,wo.building_id,wo.unit_id)
        and (p_id is null or vq.id=p_id)
        and (p_status is null or (case when vq.valid_until<current_date and vq.status in ('draft','active') then 'expired' else vq.status::text end)=p_status)
        and (p_currency is null or vq.currency=p_currency)
        and (p_from is null or vq.created_at::date>=p_from) and (p_to is null or vq.created_at::date<=p_to)
        and (p_query is null or trim(p_query)='' or coalesce(vq.quote_ref,'') ilike '%'||trim(p_query)||'%' or wo.title ilike '%'||trim(p_query)||'%' or pp.legal_name ilike '%'||trim(p_query)||'%')
      order by vq.created_at desc,vq.id desc limit p_limit offset p_offset
    )
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count' order by created_at desc,id desc),'[]') into v_total,v_rows from q;
  elsif p_view='purchase_orders' then
    with q as (
      select po.id,po.po_no,wo.work_order_no,wo.title work_order_title,pp.legal_name vendor_name,vq.quote_ref,
        po.subtotal,po.tax_total,(po.subtotal+po.tax_total) total_amount,po.currency,po.status::text,
        po.approved_at,po.ordered_at,po.received_at,(po.ledger_journal_id is not null) ledger_linked,po.created_at,
        count(*) over() total_count
      from maintenance.purchase_orders po
      join maintenance.work_orders wo on wo.id=po.work_order_id and wo.tenant_id=po.tenant_id
      join maintenance.vendors mv on mv.id=po.vendor_id and mv.tenant_id=po.tenant_id
      join portfolio.parties pp on pp.id=mv.party_id
      left join maintenance.vendor_quotes vq on vq.id=po.quote_id and vq.tenant_id=po.tenant_id
      where po.tenant_id=v.tenant_id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,wo.property_id,wo.building_id,wo.unit_id)
        and (p_id is null or po.id=p_id) and (p_status is null or po.status::text=p_status) and (p_currency is null or po.currency=p_currency)
        and (p_from is null or po.created_at::date>=p_from) and (p_to is null or po.created_at::date<=p_to)
        and (p_query is null or trim(p_query)='' or po.po_no::text ilike '%'||trim(p_query)||'%' or wo.title ilike '%'||trim(p_query)||'%' or pp.legal_name ilike '%'||trim(p_query)||'%')
      order by po.created_at desc,po.id desc limit p_limit offset p_offset
    )
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count' order by created_at desc,id desc),'[]') into v_total,v_rows from q;
  else
    with q as (
      select sm.id,sm.metric_code,sm.target_value,sm.actual_value,sm.unit_code,sm.met,sm.measured_at,
        wo.work_order_no,wo.title work_order_title,pp.legal_name vendor_name,
        case when vc.id is null then null else 'Contract · '||left(vc.id::text,8) end contract_label,
        count(*) over() total_count
      from maintenance.sla_measurements sm
      join maintenance.work_orders wo on wo.id=sm.work_order_id and wo.tenant_id=sm.tenant_id
      left join maintenance.vendor_contracts vc on vc.id=sm.contract_id and vc.tenant_id=sm.tenant_id
      left join maintenance.vendors mv on mv.id=vc.vendor_id and mv.tenant_id=sm.tenant_id
      left join portfolio.parties pp on pp.id=mv.party_id
      where sm.tenant_id=v.tenant_id and maintenance.customer_maintenance_scope_matches(v.scope_type::text,v.property_id,v.building_id,v.unit_id,wo.property_id,wo.building_id,wo.unit_id)
        and (p_id is null or sm.id=p_id) and (p_status is null or sm.met::text=p_status)
        and (p_from is null or sm.measured_at::date>=p_from) and (p_to is null or sm.measured_at::date<=p_to)
        and (p_query is null or trim(p_query)='' or sm.metric_code ilike '%'||trim(p_query)||'%' or wo.title ilike '%'||trim(p_query)||'%' or coalesce(pp.legal_name,'') ilike '%'||trim(p_query)||'%')
      order by sm.measured_at desc,sm.id desc limit p_limit offset p_offset
    )
    select coalesce(max(total_count),0),coalesce(jsonb_agg(to_jsonb(q)-'total_count' order by measured_at desc,id desc),'[]') into v_total,v_rows from q;
  end if;

  v_detail:=case when p_id is null then null else(select item from jsonb_array_elements(coalesce(v_rows,'[]')) item where item->>'id'=p_id::text limit 1)end;
  return jsonb_build_object(
    'context',jsonb_build_object('id',v.id,'tenant_name',v.tenant_name,'role',v.role_code,'scope',v.scope_type),
    'view',p_view,'total',coalesce(v_total,0),'rows',coalesce(v_rows,'[]'),'summary',coalesce(v_summary,'{}'),
    'detail',v_detail,'limit',p_limit,'offset',p_offset,'read_only',true,'commercial_data_redacted',true,'generated_at',statement_timestamp()
  );
end $$;

commit;
