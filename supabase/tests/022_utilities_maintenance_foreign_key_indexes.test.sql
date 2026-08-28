begin;
set local search_path = public, extensions;

select plan(5);

create temporary table expected_ops_fk_indexes (
  schema_name text not null,
  table_name text not null,
  index_name text not null,
  primary key (schema_name, index_name)
) on commit drop;

insert into expected_ops_fk_indexes (schema_name, table_name, index_name) values
    ('maintenance', 'attachments', 'attachments_ticket_id_idx'),
    ('maintenance', 'attachments', 'attachments_uploaded_by_idx'),
    ('maintenance', 'attachments', 'attachments_work_order_id_idx'),
    ('maintenance', 'maintenance_plans', 'maintenance_plans_asset_id_idx'),
    ('maintenance', 'maintenance_plans', 'maintenance_plans_tenant_id_idx'),
    ('maintenance', 'purchase_orders', 'purchase_orders_approved_by_idx'),
    ('maintenance', 'purchase_orders', 'purchase_orders_ledger_journal_id_idx'),
    ('maintenance', 'purchase_orders', 'purchase_orders_quote_id_idx'),
    ('maintenance', 'purchase_orders', 'purchase_orders_vendor_id_idx'),
    ('maintenance', 'purchase_orders', 'purchase_orders_work_order_id_idx'),
    ('maintenance', 'sla_measurements', 'sla_measurements_contract_id_idx'),
    ('maintenance', 'sla_measurements', 'sla_measurements_tenant_id_idx'),
    ('maintenance', 'ticket_work_orders', 'ticket_work_orders_tenant_id_idx'),
    ('maintenance', 'ticket_work_orders', 'ticket_work_orders_work_order_id_idx'),
    ('maintenance', 'tickets', 'tickets_asset_id_idx'),
    ('maintenance', 'tickets', 'tickets_building_id_idx'),
    ('maintenance', 'tickets', 'tickets_property_id_idx'),
    ('maintenance', 'tickets', 'tickets_reported_by_idx'),
    ('maintenance', 'tickets', 'tickets_unit_id_idx'),
    ('maintenance', 'vendor_contracts', 'vendor_contracts_property_id_idx'),
    ('maintenance', 'vendor_contracts', 'vendor_contracts_tenant_id_idx'),
    ('maintenance', 'vendor_contracts', 'vendor_contracts_vendor_id_idx'),
    ('maintenance', 'vendor_quotes', 'vendor_quotes_tenant_id_idx'),
    ('maintenance', 'vendor_quotes', 'vendor_quotes_vendor_id_idx'),
    ('maintenance', 'vendors', 'vendors_party_id_idx'),
    ('maintenance', 'work_order_assignments', 'work_order_assignments_contract_id_idx'),
    ('maintenance', 'work_order_assignments', 'work_order_assignments_tenant_id_idx'),
    ('maintenance', 'work_order_assignments', 'work_order_assignments_vendor_id_idx'),
    ('maintenance', 'work_order_checklist_items', 'work_order_checklist_items_completed_by_idx'),
    ('maintenance', 'work_order_checklist_items', 'work_order_checklist_items_tenant_id_idx'),
    ('maintenance', 'work_order_costs', 'work_order_costs_allocation_run_id_idx'),
    ('maintenance', 'work_order_costs', 'work_order_costs_charge_category_id_idx'),
    ('maintenance', 'work_order_costs', 'work_order_costs_journal_id_idx'),
    ('maintenance', 'work_order_costs', 'work_order_costs_purchase_order_id_idx'),
    ('maintenance', 'work_order_costs', 'work_order_costs_tenant_id_idx'),
    ('maintenance', 'work_order_costs', 'work_order_costs_work_order_id_idx'),
    ('maintenance', 'work_order_events', 'work_order_events_actor_id_idx'),
    ('maintenance', 'work_order_events', 'work_order_events_tenant_id_idx'),
    ('maintenance', 'work_order_events', 'work_order_events_work_order_id_idx'),
    ('maintenance', 'work_orders', 'work_orders_asset_id_idx'),
    ('maintenance', 'work_orders', 'work_orders_assigned_membership_id_idx'),
    ('maintenance', 'work_orders', 'work_orders_building_id_idx'),
    ('maintenance', 'work_orders', 'work_orders_created_by_idx'),
    ('maintenance', 'work_orders', 'work_orders_plan_id_idx'),
    ('maintenance', 'work_orders', 'work_orders_property_id_idx'),
    ('maintenance', 'work_orders', 'work_orders_unit_id_idx'),
    ('utilities', 'consumption_periods', 'consumption_periods_end_reading_id_idx'),
    ('utilities', 'consumption_periods', 'consumption_periods_start_reading_id_idx'),
    ('utilities', 'consumption_periods', 'consumption_periods_tenant_id_idx'),
    ('utilities', 'ingestion_documents', 'ingestion_documents_invoice_id_idx'),
    ('utilities', 'ingestion_documents', 'ingestion_documents_run_id_idx'),
    ('utilities', 'ingestion_documents', 'ingestion_documents_source_id_idx'),
    ('utilities', 'ingestion_runs', 'ingestion_runs_source_id_idx'),
    ('utilities', 'ingestion_runs', 'ingestion_runs_tenant_id_idx'),
    ('utilities', 'ingestion_sources', 'ingestion_sources_contract_id_idx'),
    ('utilities', 'ingestion_sources', 'ingestion_sources_tenant_id_idx'),
    ('utilities', 'invoice_meter_links', 'invoice_meter_links_consumption_period_id_idx'),
    ('utilities', 'invoice_meter_links', 'invoice_meter_links_meter_id_idx'),
    ('utilities', 'invoice_meter_links', 'invoice_meter_links_tenant_id_idx'),
    ('utilities', 'meter_readings', 'meter_readings_entered_by_idx'),
    ('utilities', 'meter_readings', 'meter_readings_supersedes_reading_id_idx'),
    ('utilities', 'meter_readings', 'meter_readings_validated_by_idx'),
    ('utilities', 'meters', 'meters_building_id_idx'),
    ('utilities', 'meters', 'meters_parent_meter_id_idx'),
    ('utilities', 'meters', 'meters_property_id_idx'),
    ('utilities', 'meters', 'meters_unit_id_idx'),
    ('utilities', 'ocr_extractions', 'ocr_extractions_invoice_id_idx'),
    ('utilities', 'ocr_extractions', 'ocr_extractions_tenant_id_idx'),
    ('utilities', 'ocr_field_candidates', 'ocr_field_candidates_reviewed_by_idx'),
    ('utilities', 'ocr_field_candidates', 'ocr_field_candidates_tenant_id_idx'),
    ('utilities', 'provider_invoice_lines', 'provider_invoice_lines_category_id_idx'),
    ('utilities', 'provider_invoice_lines', 'provider_invoice_lines_invoice_id_idx'),
    ('utilities', 'provider_invoice_lines', 'provider_invoice_lines_tenant_id_idx'),
    ('utilities', 'provider_invoices', 'provider_invoices_approved_by_idx'),
    ('utilities', 'provider_invoices', 'provider_invoices_contract_id_idx'),
    ('utilities', 'provider_invoices', 'provider_invoices_ledger_journal_id_idx'),
    ('utilities', 'review_decisions', 'review_decisions_actor_id_idx'),
    ('utilities', 'review_decisions', 'review_decisions_task_id_idx'),
    ('utilities', 'review_decisions', 'review_decisions_tenant_id_idx'),
    ('utilities', 'review_tasks', 'review_tasks_anomaly_id_idx'),
    ('utilities', 'review_tasks', 'review_tasks_assigned_to_idx'),
    ('utilities', 'review_tasks', 'review_tasks_decided_by_idx'),
    ('utilities', 'review_tasks', 'review_tasks_extraction_id_idx'),
    ('utilities', 'review_tasks', 'review_tasks_invoice_id_idx'),
    ('utilities', 'review_tasks', 'review_tasks_tenant_id_idx'),
    ('utilities', 'supply_contracts', 'supply_contracts_building_id_idx'),
    ('utilities', 'supply_contracts', 'supply_contracts_property_id_idx'),
    ('utilities', 'supply_contracts', 'supply_contracts_provider_id_idx'),
    ('utilities', 'supply_contracts', 'supply_contracts_tenant_id_idx'),
    ('utilities', 'supply_contracts', 'supply_contracts_unit_id_idx'),
    ('utilities', 'utility_anomalies', 'utility_anomalies_acknowledged_by_idx'),
    ('utilities', 'utility_anomalies', 'utility_anomalies_comparison_id_idx'),
    ('utilities', 'utility_anomalies', 'utility_anomalies_invoice_id_idx'),
    ('utilities', 'utility_anomalies', 'utility_anomalies_meter_id_idx'),
    ('utilities', 'utility_anomalies', 'utility_anomalies_resolved_by_idx'),
    ('utilities', 'utility_anomalies', 'utility_anomalies_tenant_id_idx'),
    ('utilities', 'utility_comparisons', 'utility_comparisons_consumption_period_id_idx'),
    ('utilities', 'utility_comparisons', 'utility_comparisons_invoice_line_id_idx'),
    ('utilities', 'utility_comparisons', 'utility_comparisons_meter_id_idx'),
    ('utilities', 'utility_comparisons', 'utility_comparisons_resolved_by_idx'),
    ('utilities', 'utility_comparisons', 'utility_comparisons_tenant_id_idx');

select ok(
  (select count(*) = 101 from expected_ops_fk_indexes),
  'utilities and maintenance FK package contains exactly 101 indexes'
);

select ok(
  not exists (
    select 1
    from expected_ops_fk_indexes e
    left join pg_indexes i
      on i.schemaname = e.schema_name
     and i.tablename = e.table_name
     and i.indexname = e.index_name
    where i.indexname is null
  ),
  'all expected utilities and maintenance FK indexes exist'
);

select ok(
  not exists (
    select 1
    from expected_ops_fk_indexes e
    join pg_class idx on idx.relname = e.index_name
    join pg_namespace n on n.oid = idx.relnamespace and n.nspname = e.schema_name
    join pg_index ix on ix.indexrelid = idx.oid
    where not ix.indisvalid or not ix.indisready
  ),
  'all expected utilities and maintenance FK indexes are valid and ready'
);

select ok(
  not exists (
    select 1
    from expected_ops_fk_indexes e
    join pg_class idx on idx.relname = e.index_name
    join pg_namespace n on n.oid = idx.relnamespace and n.nspname = e.schema_name
    join pg_index ix on ix.indexrelid = idx.oid
    where ix.indisunique
  ),
  'utilities and maintenance FK support indexes do not introduce uniqueness'
);

select ok(
  not exists (
    with fk as (
      select con.conrelid, con.conkey
      from pg_constraint con
      join pg_class tbl on tbl.oid = con.conrelid
      join pg_namespace n on n.oid = tbl.relnamespace
      where con.contype = 'f'
        and n.nspname in ('utilities','maintenance')
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
  'every foreign key in utilities and maintenance has a covering index'
);

select * from finish();
rollback;
