begin;

create index if not exists "invoice_lines_allocation_item_id_idx"
on "billing"."invoice_lines" ("allocation_item_id");

create index if not exists "invoice_lines_category_id_idx"
on "billing"."invoice_lines" ("category_id");

create index if not exists "invoice_lines_invoice_id_idx"
on "billing"."invoice_lines" ("invoice_id");

create index if not exists "invoice_lines_tenant_id_idx"
on "billing"."invoice_lines" ("tenant_id");

create index if not exists "invoices_allocation_run_id_idx"
on "billing"."invoices" ("allocation_run_id");

create index if not exists "invoices_journal_id_idx"
on "billing"."invoices" ("journal_id");

create index if not exists "invoices_liable_party_id_idx"
on "billing"."invoices" ("liable_party_id");

create index if not exists "invoices_property_id_idx"
on "billing"."invoices" ("property_id");

create index if not exists "invoices_unit_id_idx"
on "billing"."invoices" ("unit_id");

create index if not exists "receivables_tenant_id_idx"
on "billing"."receivables" ("tenant_id");

create index if not exists "accounts_parent_account_id_idx"
on "finance"."accounts" ("parent_account_id");

create index if not exists "accounts_property_id_idx"
on "finance"."accounts" ("property_id");

create index if not exists "allocation_inputs_category_id_idx"
on "finance"."allocation_inputs" ("category_id");

create index if not exists "allocation_inputs_run_id_idx"
on "finance"."allocation_inputs" ("run_id");

create index if not exists "allocation_inputs_tenant_id_idx"
on "finance"."allocation_inputs" ("tenant_id");

create index if not exists "allocation_items_responsible_party_id_idx"
on "finance"."allocation_items" ("responsible_party_id");

create index if not exists "allocation_items_run_id_idx"
on "finance"."allocation_items" ("run_id");

create index if not exists "allocation_items_unit_id_idx"
on "finance"."allocation_items" ("unit_id");

create index if not exists "allocation_rules_charge_category_id_idx"
on "finance"."allocation_rules" ("charge_category_id");

create index if not exists "allocation_rules_tenant_id_idx"
on "finance"."allocation_rules" ("tenant_id");

create index if not exists "allocation_runs_approved_by_idx"
on "finance"."allocation_runs" ("approved_by");

create index if not exists "allocation_runs_journal_id_idx"
on "finance"."allocation_runs" ("journal_id");

create index if not exists "allocation_runs_tenant_id_idx"
on "finance"."allocation_runs" ("tenant_id");

create index if not exists "charge_categories_default_expense_account_id_idx"
on "finance"."charge_categories" ("default_expense_account_id");

create index if not exists "journal_entries_account_id_idx"
on "finance"."journal_entries" ("account_id");

create index if not exists "journal_entries_journal_id_idx"
on "finance"."journal_entries" ("journal_id");

create index if not exists "journal_entries_party_id_idx"
on "finance"."journal_entries" ("party_id");

create index if not exists "journal_entries_unit_id_idx"
on "finance"."journal_entries" ("unit_id");

create index if not exists "journals_posted_by_idx"
on "finance"."journals" ("posted_by");

create index if not exists "journals_property_id_idx"
on "finance"."journals" ("property_id");

create index if not exists "journals_reversal_of_id_idx"
on "finance"."journals" ("reversal_of_id");

create index if not exists "context_grants_membership_id_idx"
on "identity"."context_grants" ("membership_id");

create index if not exists "context_grants_tenant_id_idx"
on "identity"."context_grants" ("tenant_id");

create index if not exists "delegations_context_grant_id_idx"
on "identity"."delegations" ("context_grant_id");

create index if not exists "delegations_grantee_membership_id_idx"
on "identity"."delegations" ("grantee_membership_id");

create index if not exists "delegations_grantor_membership_id_idx"
on "identity"."delegations" ("grantor_membership_id");

create index if not exists "delegations_tenant_id_idx"
on "identity"."delegations" ("tenant_id");

create index if not exists "memberships_role_id_idx"
on "identity"."memberships" ("role_id");

create index if not exists "memberships_user_id_idx"
on "identity"."memberships" ("user_id");

create index if not exists "role_permissions_permission_id_idx"
on "identity"."role_permissions" ("permission_id");

create index if not exists "access_assets_building_id_idx"
on "occupancy"."access_assets" ("building_id");

create index if not exists "access_assets_unit_id_idx"
on "occupancy"."access_assets" ("unit_id");

create index if not exists "access_assignments_asset_id_idx"
on "occupancy"."access_assignments" ("asset_id");

create index if not exists "access_assignments_party_id_idx"
on "occupancy"."access_assignments" ("party_id");

create index if not exists "access_assignments_tenant_id_idx"
on "occupancy"."access_assignments" ("tenant_id");

create index if not exists "cost_responsibilities_lease_id_idx"
on "occupancy"."cost_responsibilities" ("lease_id");

create index if not exists "leases_landlord_party_id_idx"
on "occupancy"."leases" ("landlord_party_id");

create index if not exists "leases_tenant_party_id_idx"
on "occupancy"."leases" ("tenant_party_id");

create index if not exists "leases_unit_id_idx"
on "occupancy"."leases" ("unit_id");

create index if not exists "occupancies_unit_id_idx"
on "occupancy"."occupancies" ("unit_id");

create index if not exists "occupants_party_id_idx"
on "occupancy"."occupants" ("party_id");

create index if not exists "bank_accounts_property_id_idx"
on "payments"."bank_accounts" ("property_id");

create index if not exists "bank_transactions_batch_id_idx"
on "payments"."bank_transactions" ("batch_id");

create index if not exists "import_batches_imported_by_idx"
on "payments"."import_batches" ("imported_by");

create index if not exists "import_batches_tenant_id_idx"
on "payments"."import_batches" ("tenant_id");

create index if not exists "payments_journal_id_idx"
on "payments"."payments" ("journal_id");

create index if not exists "payments_payer_party_id_idx"
on "payments"."payments" ("payer_party_id");

create index if not exists "payments_property_id_idx"
on "payments"."payments" ("property_id");

create index if not exists "payments_unit_id_idx"
on "payments"."payments" ("unit_id");

create index if not exists "reconciliation_matches_confirmed_by_idx"
on "payments"."reconciliation_matches" ("confirmed_by");

create index if not exists "reconciliation_matches_payment_id_idx"
on "payments"."reconciliation_matches" ("payment_id");

create index if not exists "reconciliation_matches_receivable_id_idx"
on "payments"."reconciliation_matches" ("receivable_id");

create index if not exists "addresses_tenant_id_idx"
on "portfolio"."addresses" ("tenant_id");

create index if not exists "entrances_tenant_id_idx"
on "portfolio"."entrances" ("tenant_id");

create index if not exists "ownerships_party_id_idx"
on "portfolio"."ownerships" ("party_id");

create index if not exists "ownerships_unit_id_idx"
on "portfolio"."ownerships" ("unit_id");

create index if not exists "parties_tenant_id_idx"
on "portfolio"."parties" ("tenant_id");

create index if not exists "properties_address_id_idx"
on "portfolio"."properties" ("address_id");

create index if not exists "units_entrance_id_idx"
on "portfolio"."units" ("entrance_id");

commit;
