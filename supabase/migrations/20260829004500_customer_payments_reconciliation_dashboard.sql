begin;

insert into identity.permissions(code,resource,action,description)
values('payments.reconciliation.read','payments.reconciliation','read','Read payment allocation and reconciliation data in an authorized customer context')
on conflict(code) do nothing;

insert into identity.role_permissions(role_id,permission_id,effect)
select r.id,p.id,'allow' from identity.roles r cross join identity.permissions p
where p.code='payments.reconciliation.read' and lower(r.code) in ('association_admin','property_manager','president','censor','owner','tenant_resident')
on conflict(role_id,permission_id) do update set effect='allow';

create index if not exists payments_scope_paid_idx on payments.payments(tenant_id,property_id,unit_id,payer_party_id,paid_at,id);
create index if not exists payments_journal_id_idx on payments.payments(journal_id);
create index if not exists reconciliation_payment_status_idx on payments.reconciliation_matches(payment_id,status);
create index if not exists reconciliation_receivable_status_idx on payments.reconciliation_matches(receivable_id,status);

create or replace function payments.protect_confirmed_reconciliation()
returns trigger language plpgsql security definer
set search_path=pg_catalog,payments,billing
as $$
declare v_tx payments.bank_transactions; v_payment payments.payments; v_receivable billing.receivables; v_invoice billing.invoices; v_sum numeric(20,4);
begin
  if tg_op in ('UPDATE','DELETE') and old.status='confirmed' and (tg_op='DELETE' or new is distinct from old) then
    raise exception 'confirmed_reconciliation_is_immutable';
  end if;
  if tg_op='DELETE' or new.status<>'confirmed' then return case when tg_op='DELETE' then old else new end; end if;
  select * into v_tx from payments.bank_transactions where id=new.bank_transaction_id and tenant_id=new.tenant_id;
  if not found then raise exception 'bank_transaction_tenant_mismatch'; end if;
  if v_tx.direction<>'credit' then raise exception 'only_credit_transactions_can_be_reconciled'; end if;
  select coalesce(sum(matched_amount),0) into v_sum from payments.reconciliation_matches
    where bank_transaction_id=new.bank_transaction_id and status='confirmed' and id<>new.id;
  if v_sum+new.matched_amount>v_tx.amount then raise exception 'bank_transaction_overallocated'; end if;
  if new.payment_id is not null then
    select * into v_payment from payments.payments where id=new.payment_id and tenant_id=new.tenant_id;
    if not found or v_payment.currency<>v_tx.currency then raise exception 'payment_currency_mismatch'; end if;
    select coalesce(sum(matched_amount),0) into v_sum from payments.reconciliation_matches
      where payment_id=new.payment_id and status='confirmed' and id<>new.id;
    if v_sum+new.matched_amount>v_payment.amount then raise exception 'payment_overallocated'; end if;
  end if;
  if new.receivable_id is not null then
    select r,i into v_receivable,v_invoice from billing.receivables r join billing.invoices i on i.id=r.invoice_id
      where r.id=new.receivable_id and r.tenant_id=new.tenant_id;
    if not found or v_invoice.currency<>v_tx.currency then raise exception 'receivable_currency_mismatch'; end if;
    select coalesce(sum(matched_amount),0) into v_sum from payments.reconciliation_matches
      where receivable_id=new.receivable_id and status='confirmed' and id<>new.id;
    if v_sum+new.matched_amount>greatest(v_receivable.original_amount-v_receivable.credited_amount,0) then raise exception 'receivable_overallocated'; end if;
  end if;
  return new;
end $$;

drop trigger if exists reconciliation_integrity_protect on payments.reconciliation_matches;
create trigger reconciliation_integrity_protect before insert or update or delete on payments.reconciliation_matches
for each row execute function payments.protect_confirmed_reconciliation();

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
  if coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501'; end if;
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

revoke all on function payments.protect_confirmed_reconciliation() from public,anon,authenticated;
revoke all on function payments.get_customer_payments(uuid,text,text,text,date,date,integer,integer,uuid) from public,anon;
grant execute on function payments.get_customer_payments(uuid,text,text,text,date,date,integer,integer,uuid) to authenticated,service_role;

commit;
