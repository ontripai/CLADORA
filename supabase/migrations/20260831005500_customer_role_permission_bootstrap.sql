begin;

-- Canonical global customer roles are reference authorization data. They must
-- exist independently of the optional synthetic development seed.
insert into identity.roles(tenant_id,code,name,is_system)
values
  (null,'association_admin','Association Administrator',true),
  (null,'property_manager','Property Manager',true),
  (null,'president','Association President',true),
  (null,'censor','Censor / Financial Auditor',true),
  (null,'owner','Owner',true),
  (null,'tenant_resident','Tenant / Resident',true)
on conflict(tenant_id,code) do update
set name=excluded.name,is_system=true;

with approved(role_code,permission_code) as (
  values
    ('association_admin','finance.ledger.read'),
    ('property_manager','finance.ledger.read'),
    ('president','finance.ledger.read'),
    ('censor','finance.ledger.read'),
    ('owner','finance.ledger.read'),
    ('tenant_resident','finance.ledger.read'),
    ('association_admin','billing.receivables.read'),
    ('property_manager','billing.receivables.read'),
    ('president','billing.receivables.read'),
    ('censor','billing.receivables.read'),
    ('owner','billing.receivables.read'),
    ('tenant_resident','billing.receivables.read'),
    ('association_admin','payments.reconciliation.read'),
    ('property_manager','payments.reconciliation.read'),
    ('president','payments.reconciliation.read'),
    ('censor','payments.reconciliation.read'),
    ('owner','payments.reconciliation.read'),
    ('tenant_resident','payments.reconciliation.read'),
    ('association_admin','finance.allocations.read'),
    ('property_manager','finance.allocations.read'),
    ('president','finance.allocations.read'),
    ('censor','finance.allocations.read'),
    ('owner','finance.allocations.read'),
    ('tenant_resident','finance.allocations.read'),
    ('association_admin','utilities.metering.read'),
    ('property_manager','utilities.metering.read'),
    ('president','utilities.metering.read'),
    ('censor','utilities.metering.read'),
    ('owner','utilities.metering.read'),
    ('tenant_resident','utilities.metering.read'),
    ('association_admin','maintenance.assets.read'),
    ('property_manager','maintenance.assets.read'),
    ('president','maintenance.assets.read'),
    ('censor','maintenance.assets.read'),
    ('owner','maintenance.assets.read'),
    ('tenant_resident','maintenance.assets.read'),
    ('association_admin','governance.meetings.read'),
    ('property_manager','governance.meetings.read'),
    ('president','governance.meetings.read'),
    ('censor','governance.meetings.read'),
    ('owner','governance.meetings.read'),
    ('tenant_resident','governance.meetings.read'),
    ('association_admin','communications.feed.read'),
    ('property_manager','communications.feed.read'),
    ('president','communications.feed.read'),
    ('censor','communications.feed.read'),
    ('owner','communications.feed.read'),
    ('tenant_resident','communications.feed.read'),
    ('association_admin','documents.vault.read'),
    ('property_manager','documents.vault.read'),
    ('president','documents.vault.read'),
    ('censor','documents.vault.read'),
    ('owner','documents.vault.read'),
    ('tenant_resident','documents.vault.read'),
    ('association_admin','occupancy.registry.read'),
    ('property_manager','occupancy.registry.read'),
    ('president','occupancy.registry.read'),
    ('censor','occupancy.registry.read'),
    ('owner','occupancy.registry.read'),
    ('tenant_resident','occupancy.registry.read'),
    ('association_admin','security.access.read'),
    ('property_manager','security.access.read'),
    ('president','security.access.read'),
    ('censor','security.access.read'),
    ('owner','security.access.read'),
    ('tenant_resident','security.access.read'),
    ('association_admin','maintenance.procurement.read'),
    ('property_manager','maintenance.procurement.read'),
    ('president','maintenance.procurement.read'),
    ('censor','maintenance.procurement.read')
)
insert into identity.role_permissions(role_id,permission_id,effect)
select r.id,p.id,'allow'
from approved a
join identity.roles r on r.tenant_id is null and lower(r.code)=a.role_code
join identity.permissions p on p.code=a.permission_code
on conflict(role_id,permission_id) do update set effect='allow';

do $$
begin
  if (select count(*) from identity.roles
      where tenant_id is null and code in
        ('association_admin','property_manager','president','censor','owner','tenant_resident')) <> 6 then
    raise exception 'canonical_customer_role_bootstrap_failed';
  end if;

  if (select count(*)
      from identity.role_permissions rp
      join identity.roles r on r.id=rp.role_id
      join identity.permissions p on p.id=rp.permission_id
      where r.tenant_id is null
        and rp.effect='allow'
        and p.code in (
          'finance.ledger.read','billing.receivables.read','payments.reconciliation.read',
          'finance.allocations.read','utilities.metering.read','maintenance.assets.read',
          'governance.meetings.read','communications.feed.read','documents.vault.read',
          'occupancy.registry.read','security.access.read','maintenance.procurement.read'
        )) <> 70 then
    raise exception 'customer_read_permission_backfill_failed';
  end if;
end $$;

commit;
