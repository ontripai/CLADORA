begin;
set local search_path = public, extensions;

select plan(5);

create temporary table expected_core_fk_indexes (
  schema_name text not null,
  table_name text not null,
  index_name text not null,
  primary key (schema_name, index_name)
) on commit drop;

insert into expected_core_fk_indexes (schema_name, table_name, index_name) values
    ('billing', 'invoice_lines', 'invoice_lines_allocation_item_id_idx'),
    ('billing', 'invoice_lines', 'invoice_lines_category_id_idx'),
    ('billing', 'invoice_lines', 'invoice_lines_invoice_id_idx'),
    ('billing', 'invoice_lines', 'invoice_lines_tenant_id_idx'),
    ('billing', 'invoices', 'invoices_allocation_run_id_idx'),
    ('billing', 'invoices', 'invoices_journal_id_idx'),
    ('billing', 'invoices', 'invoices_liable_party_id_idx'),
    ('billing', 'invoices', 'invoices_property_id_idx'),
    ('billing', 'invoices', 'invoices_unit_id_idx'),
    ('billing', 'receivables', 'receivables_tenant_id_idx'),
    ('finance', 'accounts', 'accounts_parent_account_id_idx'),
    ('finance', 'accounts', 'accounts_property_id_idx'),
    ('finance', 'allocation_inputs', 'allocation_inputs_category_id_idx'),
    ('finance', 'allocation_inputs', 'allocation_inputs_run_id_idx'),
    ('finance', 'allocation_inputs', 'allocation_inputs_tenant_id_idx'),
    ('finance', 'allocation_items', 'allocation_items_responsible_party_id_idx'),
    ('finance', 'allocation_items', 'allocation_items_run_id_idx'),
    ('finance', 'allocation_items', 'allocation_items_unit_id_idx'),
    ('finance', 'allocation_rules', 'allocation_rules_charge_category_id_idx'),
    ('finance', 'allocation_rules', 'allocation_rules_tenant_id_idx'),
    ('finance', 'allocation_runs', 'allocation_runs_approved_by_idx'),
    ('finance', 'allocation_runs', 'allocation_runs_journal_id_idx'),
    ('finance', 'allocation_runs', 'allocation_runs_tenant_id_idx'),
    ('finance', 'charge_categories', 'charge_categories_default_expense_account_id_idx'),
    ('finance', 'journal_entries', 'journal_entries_account_id_idx'),
    ('finance', 'journal_entries', 'journal_entries_journal_id_idx'),
    ('finance', 'journal_entries', 'journal_entries_party_id_idx'),
    ('finance', 'journal_entries', 'journal_entries_unit_id_idx'),
    ('finance', 'journals', 'journals_posted_by_idx'),
    ('finance', 'journals', 'journals_property_id_idx'),
    ('finance', 'journals', 'journals_reversal_of_id_idx'),
    ('identity', 'context_grants', 'context_grants_membership_id_idx'),
    ('identity', 'context_grants', 'context_grants_tenant_id_idx'),
    ('identity', 'delegations', 'delegations_context_grant_id_idx'),
    ('identity', 'delegations', 'delegations_grantee_membership_id_idx'),
    ('identity', 'delegations', 'delegations_grantor_membership_id_idx'),
    ('identity', 'delegations', 'delegations_tenant_id_idx'),
    ('identity', 'memberships', 'memberships_role_id_idx'),
    ('identity', 'memberships', 'memberships_user_id_idx'),
    ('identity', 'role_permissions', 'role_permissions_permission_id_idx'),
    ('occupancy', 'access_assets', 'access_assets_building_id_idx'),
    ('occupancy', 'access_assets', 'access_assets_unit_id_idx'),
    ('occupancy', 'access_assignments', 'access_assignments_asset_id_idx'),
    ('occupancy', 'access_assignments', 'access_assignments_party_id_idx'),
    ('occupancy', 'access_assignments', 'access_assignments_tenant_id_idx'),
    ('occupancy', 'cost_responsibilities', 'cost_responsibilities_lease_id_idx'),
    ('occupancy', 'leases', 'leases_landlord_party_id_idx'),
    ('occupancy', 'leases', 'leases_tenant_party_id_idx'),
    ('occupancy', 'leases', 'leases_unit_id_idx'),
    ('occupancy', 'occupancies', 'occupancies_unit_id_idx'),
    ('occupancy', 'occupants', 'occupants_party_id_idx'),
    ('payments', 'bank_accounts', 'bank_accounts_property_id_idx'),
    ('payments', 'bank_transactions', 'bank_transactions_batch_id_idx'),
    ('payments', 'import_batches', 'import_batches_imported_by_idx'),
    ('payments', 'import_batches', 'import_batches_tenant_id_idx'),
    ('payments', 'payments', 'payments_journal_id_idx'),
    ('payments', 'payments', 'payments_payer_party_id_idx'),
    ('payments', 'payments', 'payments_property_id_idx'),
    ('payments', 'payments', 'payments_unit_id_idx'),
    ('payments', 'reconciliation_matches', 'reconciliation_matches_confirmed_by_idx'),
    ('payments', 'reconciliation_matches', 'reconciliation_matches_payment_id_idx'),
    ('payments', 'reconciliation_matches', 'reconciliation_matches_receivable_id_idx'),
    ('portfolio', 'addresses', 'addresses_tenant_id_idx'),
    ('portfolio', 'entrances', 'entrances_tenant_id_idx'),
    ('portfolio', 'ownerships', 'ownerships_party_id_idx'),
    ('portfolio', 'ownerships', 'ownerships_unit_id_idx'),
    ('portfolio', 'parties', 'parties_tenant_id_idx'),
    ('portfolio', 'properties', 'properties_address_id_idx'),
    ('portfolio', 'units', 'units_entrance_id_idx');

select ok(
  (select count(*) = 69 from expected_core_fk_indexes),
  'core FK index package contains exactly 69 indexes'
);

select ok(
  not exists (
    select 1
    from expected_core_fk_indexes e
    left join pg_indexes i
      on i.schemaname = e.schema_name
     and i.tablename = e.table_name
     and i.indexname = e.index_name
    where i.indexname is null
  ),
  'all expected core FK indexes exist'
);

select ok(
  not exists (
    select 1
    from expected_core_fk_indexes e
    join pg_class idx on idx.relname = e.index_name
    join pg_namespace n on n.oid = idx.relnamespace and n.nspname = e.schema_name
    join pg_index ix on ix.indexrelid = idx.oid
    where not ix.indisvalid or not ix.indisready
  ),
  'all expected core FK indexes are valid and ready'
);

select ok(
  not exists (
    select 1
    from expected_core_fk_indexes e
    join pg_class idx on idx.relname = e.index_name
    join pg_namespace n on n.oid = idx.relnamespace and n.nspname = e.schema_name
    join pg_index ix on ix.indexrelid = idx.oid
    where ix.indisunique
  ),
  'core FK support indexes do not introduce uniqueness constraints'
);

select ok(
  not exists (
    with fk as (
      select con.conrelid, con.conkey
      from pg_constraint con
      join pg_class tbl on tbl.oid = con.conrelid
      join pg_namespace n on n.oid = tbl.relnamespace
      where con.contype = 'f'
        and n.nspname in ('identity','portfolio','occupancy','finance','billing','payments')
    )
    select 1
    from fk
    where not exists (
      select 1
      from pg_index ix
      where ix.indrelid = fk.conrelid
        and ix.indisvalid
        and ix.indisready
        and (ix.indkey::smallint[])[0:cardinality(fk.conkey)-1] = fk.conkey
    )
  ),
  'every foreign key in the six core schemas has a covering index'
);

select * from finish();
rollback;
