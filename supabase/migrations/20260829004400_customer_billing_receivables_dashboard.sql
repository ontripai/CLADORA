begin;

insert into identity.permissions(code,resource,action,description)
values('billing.receivables.read','billing.receivables','read','Read invoices and receivables within an authorized customer context')
on conflict(code) do nothing;

create index if not exists invoices_scope_due_idx on billing.invoices(tenant_id,property_id,unit_id,due_on,status,id);
create index if not exists invoices_liable_party_id_idx on billing.invoices(liable_party_id);
create index if not exists invoices_journal_id_idx on billing.invoices(journal_id);
create index if not exists receivables_tenant_invoice_idx on billing.receivables(tenant_id,invoice_id);

create or replace function billing.protect_issued_invoice()
returns trigger language plpgsql security definer set search_path=pg_catalog,billing
as $$ declare s billing.invoice_status; lines_subtotal numeric(20,4); lines_tax numeric(20,4); begin
  if tg_table_name='invoices' then
    if tg_op='DELETE' and old.status<>'draft' then raise exception 'issued_invoice_is_immutable'; end if;
    if tg_op='UPDATE' and old.status in ('paid','void','credited') and new is distinct from old then
      raise exception 'terminal_invoice_is_immutable';
    end if;
    if tg_op='UPDATE' and old.status<>'draft' and
      (new.tenant_id,new.property_id,new.unit_id,new.liable_party_id,new.period_start,new.period_end,new.issued_on,new.due_on,
       new.currency,new.subtotal,new.tax_total,new.allocation_run_id,new.journal_id,new.issued_snapshot)
      is distinct from
      (old.tenant_id,old.property_id,old.unit_id,old.liable_party_id,old.period_start,old.period_end,old.issued_on,old.due_on,
       old.currency,old.subtotal,old.tax_total,old.allocation_run_id,old.journal_id,old.issued_snapshot) then
      raise exception 'issued_invoice_financial_fields_are_immutable';
    end if;
    if tg_op='UPDATE' and old.status='draft' and new.status<>'draft' then
      select coalesce(sum(line_subtotal),0),coalesce(sum(line_tax),0) into lines_subtotal,lines_tax
      from billing.invoice_lines where invoice_id=old.id;
      if lines_subtotal<>new.subtotal or lines_tax<>new.tax_total then raise exception 'invoice_totals_do_not_match_lines'; end if;
      new.issued_on=coalesce(new.issued_on,current_date);
      new.issued_snapshot=coalesce(new.issued_snapshot,jsonb_build_object('invoice_id',new.id,'subtotal',new.subtotal,'tax_total',new.tax_total,'currency',new.currency));
    end if;
    return case when tg_op='DELETE' then old else new end;
  end if;
  select status into s from billing.invoices where id=coalesce(new.invoice_id,old.invoice_id);
  if s<>'draft' then raise exception 'issued_invoice_lines_are_immutable'; end if;
  return case when tg_op='DELETE' then old else new end;
end; $$;

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
  if coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501'; end if;
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

revoke all on function billing.get_customer_billing(uuid,text,text,date,date,integer,integer,uuid) from public,anon;
grant execute on function billing.get_customer_billing(uuid,text,text,date,date,integer,integer,uuid) to authenticated,service_role;

commit;
