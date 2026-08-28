begin;

create index if not exists "attachments_ticket_id_idx"
on "maintenance"."attachments" ("ticket_id");

create index if not exists "attachments_uploaded_by_idx"
on "maintenance"."attachments" ("uploaded_by");

create index if not exists "attachments_work_order_id_idx"
on "maintenance"."attachments" ("work_order_id");

create index if not exists "maintenance_plans_asset_id_idx"
on "maintenance"."maintenance_plans" ("asset_id");

create index if not exists "maintenance_plans_tenant_id_idx"
on "maintenance"."maintenance_plans" ("tenant_id");

create index if not exists "purchase_orders_approved_by_idx"
on "maintenance"."purchase_orders" ("approved_by");

create index if not exists "purchase_orders_ledger_journal_id_idx"
on "maintenance"."purchase_orders" ("ledger_journal_id");

create index if not exists "purchase_orders_quote_id_idx"
on "maintenance"."purchase_orders" ("quote_id");

create index if not exists "purchase_orders_vendor_id_idx"
on "maintenance"."purchase_orders" ("vendor_id");

create index if not exists "purchase_orders_work_order_id_idx"
on "maintenance"."purchase_orders" ("work_order_id");

create index if not exists "sla_measurements_contract_id_idx"
on "maintenance"."sla_measurements" ("contract_id");

create index if not exists "sla_measurements_tenant_id_idx"
on "maintenance"."sla_measurements" ("tenant_id");

create index if not exists "ticket_work_orders_tenant_id_idx"
on "maintenance"."ticket_work_orders" ("tenant_id");

create index if not exists "ticket_work_orders_work_order_id_idx"
on "maintenance"."ticket_work_orders" ("work_order_id");

create index if not exists "tickets_asset_id_idx"
on "maintenance"."tickets" ("asset_id");

create index if not exists "tickets_building_id_idx"
on "maintenance"."tickets" ("building_id");

create index if not exists "tickets_property_id_idx"
on "maintenance"."tickets" ("property_id");

create index if not exists "tickets_reported_by_idx"
on "maintenance"."tickets" ("reported_by");

create index if not exists "tickets_unit_id_idx"
on "maintenance"."tickets" ("unit_id");

create index if not exists "vendor_contracts_property_id_idx"
on "maintenance"."vendor_contracts" ("property_id");

create index if not exists "vendor_contracts_tenant_id_idx"
on "maintenance"."vendor_contracts" ("tenant_id");

create index if not exists "vendor_contracts_vendor_id_idx"
on "maintenance"."vendor_contracts" ("vendor_id");

create index if not exists "vendor_quotes_tenant_id_idx"
on "maintenance"."vendor_quotes" ("tenant_id");

create index if not exists "vendor_quotes_vendor_id_idx"
on "maintenance"."vendor_quotes" ("vendor_id");

create index if not exists "vendors_party_id_idx"
on "maintenance"."vendors" ("party_id");

create index if not exists "work_order_assignments_contract_id_idx"
on "maintenance"."work_order_assignments" ("contract_id");

create index if not exists "work_order_assignments_tenant_id_idx"
on "maintenance"."work_order_assignments" ("tenant_id");

create index if not exists "work_order_assignments_vendor_id_idx"
on "maintenance"."work_order_assignments" ("vendor_id");

create index if not exists "work_order_checklist_items_completed_by_idx"
on "maintenance"."work_order_checklist_items" ("completed_by");

create index if not exists "work_order_checklist_items_tenant_id_idx"
on "maintenance"."work_order_checklist_items" ("tenant_id");

create index if not exists "work_order_costs_allocation_run_id_idx"
on "maintenance"."work_order_costs" ("allocation_run_id");

create index if not exists "work_order_costs_charge_category_id_idx"
on "maintenance"."work_order_costs" ("charge_category_id");

create index if not exists "work_order_costs_journal_id_idx"
on "maintenance"."work_order_costs" ("journal_id");

create index if not exists "work_order_costs_purchase_order_id_idx"
on "maintenance"."work_order_costs" ("purchase_order_id");

create index if not exists "work_order_costs_tenant_id_idx"
on "maintenance"."work_order_costs" ("tenant_id");

create index if not exists "work_order_costs_work_order_id_idx"
on "maintenance"."work_order_costs" ("work_order_id");

create index if not exists "work_order_events_actor_id_idx"
on "maintenance"."work_order_events" ("actor_id");

create index if not exists "work_order_events_tenant_id_idx"
on "maintenance"."work_order_events" ("tenant_id");

create index if not exists "work_order_events_work_order_id_idx"
on "maintenance"."work_order_events" ("work_order_id");

create index if not exists "work_orders_asset_id_idx"
on "maintenance"."work_orders" ("asset_id");

create index if not exists "work_orders_assigned_membership_id_idx"
on "maintenance"."work_orders" ("assigned_membership_id");

create index if not exists "work_orders_building_id_idx"
on "maintenance"."work_orders" ("building_id");

create index if not exists "work_orders_created_by_idx"
on "maintenance"."work_orders" ("created_by");

create index if not exists "work_orders_plan_id_idx"
on "maintenance"."work_orders" ("plan_id");

create index if not exists "work_orders_property_id_idx"
on "maintenance"."work_orders" ("property_id");

create index if not exists "work_orders_unit_id_idx"
on "maintenance"."work_orders" ("unit_id");

create index if not exists "consumption_periods_end_reading_id_idx"
on "utilities"."consumption_periods" ("end_reading_id");

create index if not exists "consumption_periods_start_reading_id_idx"
on "utilities"."consumption_periods" ("start_reading_id");

create index if not exists "consumption_periods_tenant_id_idx"
on "utilities"."consumption_periods" ("tenant_id");

create index if not exists "ingestion_documents_invoice_id_idx"
on "utilities"."ingestion_documents" ("invoice_id");

create index if not exists "ingestion_documents_run_id_idx"
on "utilities"."ingestion_documents" ("run_id");

create index if not exists "ingestion_documents_source_id_idx"
on "utilities"."ingestion_documents" ("source_id");

create index if not exists "ingestion_runs_source_id_idx"
on "utilities"."ingestion_runs" ("source_id");

create index if not exists "ingestion_runs_tenant_id_idx"
on "utilities"."ingestion_runs" ("tenant_id");

create index if not exists "ingestion_sources_contract_id_idx"
on "utilities"."ingestion_sources" ("contract_id");

create index if not exists "ingestion_sources_tenant_id_idx"
on "utilities"."ingestion_sources" ("tenant_id");

create index if not exists "invoice_meter_links_consumption_period_id_idx"
on "utilities"."invoice_meter_links" ("consumption_period_id");

create index if not exists "invoice_meter_links_meter_id_idx"
on "utilities"."invoice_meter_links" ("meter_id");

create index if not exists "invoice_meter_links_tenant_id_idx"
on "utilities"."invoice_meter_links" ("tenant_id");

create index if not exists "meter_readings_entered_by_idx"
on "utilities"."meter_readings" ("entered_by");

create index if not exists "meter_readings_supersedes_reading_id_idx"
on "utilities"."meter_readings" ("supersedes_reading_id");

create index if not exists "meter_readings_validated_by_idx"
on "utilities"."meter_readings" ("validated_by");

create index if not exists "meters_building_id_idx"
on "utilities"."meters" ("building_id");

create index if not exists "meters_parent_meter_id_idx"
on "utilities"."meters" ("parent_meter_id");

create index if not exists "meters_property_id_idx"
on "utilities"."meters" ("property_id");

create index if not exists "meters_unit_id_idx"
on "utilities"."meters" ("unit_id");

create index if not exists "ocr_extractions_invoice_id_idx"
on "utilities"."ocr_extractions" ("invoice_id");

create index if not exists "ocr_extractions_tenant_id_idx"
on "utilities"."ocr_extractions" ("tenant_id");

create index if not exists "ocr_field_candidates_reviewed_by_idx"
on "utilities"."ocr_field_candidates" ("reviewed_by");

create index if not exists "ocr_field_candidates_tenant_id_idx"
on "utilities"."ocr_field_candidates" ("tenant_id");

create index if not exists "provider_invoice_lines_category_id_idx"
on "utilities"."provider_invoice_lines" ("category_id");

create index if not exists "provider_invoice_lines_invoice_id_idx"
on "utilities"."provider_invoice_lines" ("invoice_id");

create index if not exists "provider_invoice_lines_tenant_id_idx"
on "utilities"."provider_invoice_lines" ("tenant_id");

create index if not exists "provider_invoices_approved_by_idx"
on "utilities"."provider_invoices" ("approved_by");

create index if not exists "provider_invoices_contract_id_idx"
on "utilities"."provider_invoices" ("contract_id");

create index if not exists "provider_invoices_ledger_journal_id_idx"
on "utilities"."provider_invoices" ("ledger_journal_id");

create index if not exists "review_decisions_actor_id_idx"
on "utilities"."review_decisions" ("actor_id");

create index if not exists "review_decisions_task_id_idx"
on "utilities"."review_decisions" ("task_id");

create index if not exists "review_decisions_tenant_id_idx"
on "utilities"."review_decisions" ("tenant_id");

create index if not exists "review_tasks_anomaly_id_idx"
on "utilities"."review_tasks" ("anomaly_id");

create index if not exists "review_tasks_assigned_to_idx"
on "utilities"."review_tasks" ("assigned_to");

create index if not exists "review_tasks_decided_by_idx"
on "utilities"."review_tasks" ("decided_by");

create index if not exists "review_tasks_extraction_id_idx"
on "utilities"."review_tasks" ("extraction_id");

create index if not exists "review_tasks_invoice_id_idx"
on "utilities"."review_tasks" ("invoice_id");

create index if not exists "review_tasks_tenant_id_idx"
on "utilities"."review_tasks" ("tenant_id");

create index if not exists "supply_contracts_building_id_idx"
on "utilities"."supply_contracts" ("building_id");

create index if not exists "supply_contracts_property_id_idx"
on "utilities"."supply_contracts" ("property_id");

create index if not exists "supply_contracts_provider_id_idx"
on "utilities"."supply_contracts" ("provider_id");

create index if not exists "supply_contracts_tenant_id_idx"
on "utilities"."supply_contracts" ("tenant_id");

create index if not exists "supply_contracts_unit_id_idx"
on "utilities"."supply_contracts" ("unit_id");

create index if not exists "utility_anomalies_acknowledged_by_idx"
on "utilities"."utility_anomalies" ("acknowledged_by");

create index if not exists "utility_anomalies_comparison_id_idx"
on "utilities"."utility_anomalies" ("comparison_id");

create index if not exists "utility_anomalies_invoice_id_idx"
on "utilities"."utility_anomalies" ("invoice_id");

create index if not exists "utility_anomalies_meter_id_idx"
on "utilities"."utility_anomalies" ("meter_id");

create index if not exists "utility_anomalies_resolved_by_idx"
on "utilities"."utility_anomalies" ("resolved_by");

create index if not exists "utility_anomalies_tenant_id_idx"
on "utilities"."utility_anomalies" ("tenant_id");

create index if not exists "utility_comparisons_consumption_period_id_idx"
on "utilities"."utility_comparisons" ("consumption_period_id");

create index if not exists "utility_comparisons_invoice_line_id_idx"
on "utilities"."utility_comparisons" ("invoice_line_id");

create index if not exists "utility_comparisons_meter_id_idx"
on "utilities"."utility_comparisons" ("meter_id");

create index if not exists "utility_comparisons_resolved_by_idx"
on "utilities"."utility_comparisons" ("resolved_by");

create index if not exists "utility_comparisons_tenant_id_idx"
on "utilities"."utility_comparisons" ("tenant_id");

commit;
