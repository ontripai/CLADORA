begin;

create type finance.accounting_period_status as enum ('open','closed');
create table finance.accounting_periods (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references platform.tenants(id) on delete restrict,
  property_id uuid references portfolio.properties(id) on delete restrict,
  starts_on date not null,
  ends_on date not null,
  status finance.accounting_period_status not null default 'open',
  closed_at timestamptz,
  snapshot_json jsonb,
  created_at timestamptz not null default statement_timestamp(),
  unique nulls not distinct (tenant_id,property_id,starts_on,ends_on),
  check (ends_on>=starts_on),
  check ((status='open' and closed_at is null and snapshot_json is null) or
    (status='closed' and closed_at is not null and snapshot_json is not null))
);
create index accounting_periods_scope_date_idx on finance.accounting_periods(tenant_id,property_id,starts_on,ends_on);
create or replace function finance.protect_accounting_period()
returns trigger language plpgsql security definer set search_path=pg_catalog,finance
as $$ begin
  if old.status='closed' then raise exception 'closed_accounting_period_is_immutable'; end if;
  return case when tg_op='DELETE' then old else new end;
end $$;
create trigger accounting_periods_immutable before update or delete on finance.accounting_periods
for each row execute function finance.protect_accounting_period();
alter table finance.accounting_periods enable row level security;
create policy accounting_periods_context_read on finance.accounting_periods for select to authenticated
using(tenant_id=app_private.active_tenant_id() and (property_id is null or app_private.can_access_property(property_id)));
grant select on finance.accounting_periods to authenticated;
grant all on finance.accounting_periods to service_role;
revoke all on function finance.protect_accounting_period() from public,anon,authenticated;
grant execute on function finance.protect_accounting_period() to service_role;

create table identity.membership_parties (
  membership_id uuid primary key references identity.memberships(id) on delete cascade,
  tenant_id uuid not null references platform.tenants(id) on delete restrict,
  party_id uuid not null references portfolio.parties(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  unique (tenant_id, party_id)
);
create index membership_parties_tenant_party_idx on identity.membership_parties(tenant_id,party_id);
alter table identity.membership_parties enable row level security;
create policy membership_parties_self_read on identity.membership_parties for select to authenticated
using (exists(select 1 from identity.memberships m where m.id=membership_id and m.user_id=(select auth.uid()) and m.tenant_id=tenant_id));
grant select on identity.membership_parties to authenticated;
grant all on identity.membership_parties to service_role;

insert into identity.permissions(code,resource,action,description)
values('finance.ledger.read','finance.ledger','read','Read the customer accounting ledger within an authorized context')
on conflict(code) do nothing;

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
  if coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'mfa_required' using errcode='42501'; end if;
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

revoke all on function finance.get_customer_ledger(uuid,text,text,text,date,date,integer,integer,uuid) from public,anon;
grant execute on function finance.get_customer_ledger(uuid,text,text,text,date,date,integer,integer,uuid) to authenticated,service_role;

commit;
