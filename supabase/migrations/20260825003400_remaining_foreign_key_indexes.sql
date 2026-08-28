begin;

create index if not exists "asset_categories_parent_id_idx"
on "assets"."asset_categories" ("parent_id");

create index if not exists "asset_components_component_asset_id_idx"
on "assets"."asset_components" ("component_asset_id");

create index if not exists "asset_components_tenant_id_idx"
on "assets"."asset_components" ("tenant_id");

create index if not exists "asset_history_actor_id_idx"
on "assets"."asset_history" ("actor_id");

create index if not exists "asset_history_asset_id_idx"
on "assets"."asset_history" ("asset_id");

create index if not exists "asset_history_tenant_id_idx"
on "assets"."asset_history" ("tenant_id");

create index if not exists "asset_history_ticket_id_idx"
on "assets"."asset_history" ("ticket_id");

create index if not exists "asset_history_work_order_id_idx"
on "assets"."asset_history" ("work_order_id");

create index if not exists "asset_warranties_asset_id_idx"
on "assets"."asset_warranties" ("asset_id");

create index if not exists "asset_warranties_provider_party_id_idx"
on "assets"."asset_warranties" ("provider_party_id");

create index if not exists "asset_warranties_tenant_id_idx"
on "assets"."asset_warranties" ("tenant_id");

create index if not exists "assets_building_id_idx"
on "assets"."assets" ("building_id");

create index if not exists "assets_category_id_idx"
on "assets"."assets" ("category_id");

create index if not exists "assets_property_id_idx"
on "assets"."assets" ("property_id");

create index if not exists "assets_unit_id_idx"
on "assets"."assets" ("unit_id");

create index if not exists "channel_members_membership_id_idx"
on "communications"."channel_members" ("membership_id");

create index if not exists "channel_members_tenant_id_idx"
on "communications"."channel_members" ("tenant_id");

create index if not exists "channels_building_id_idx"
on "communications"."channels" ("building_id");

create index if not exists "channels_property_id_idx"
on "communications"."channels" ("property_id");

create index if not exists "channels_tenant_id_idx"
on "communications"."channels" ("tenant_id");

create index if not exists "channels_unit_id_idx"
on "communications"."channels" ("unit_id");

create index if not exists "comments_author_membership_id_idx"
on "communications"."comments" ("author_membership_id");

create index if not exists "comments_parent_comment_id_idx"
on "communications"."comments" ("parent_comment_id");

create index if not exists "comments_post_id_idx"
on "communications"."comments" ("post_id");

create index if not exists "comments_tenant_id_idx"
on "communications"."comments" ("tenant_id");

create index if not exists "notification_preferences_tenant_id_idx"
on "communications"."notification_preferences" ("tenant_id");

create index if not exists "notifications_membership_id_idx"
on "communications"."notifications" ("membership_id");

create index if not exists "notifications_tenant_id_idx"
on "communications"."notifications" ("tenant_id");

create index if not exists "poll_options_tenant_id_idx"
on "communications"."poll_options" ("tenant_id");

create index if not exists "poll_responses_membership_id_idx"
on "communications"."poll_responses" ("membership_id");

create index if not exists "poll_responses_option_id_idx"
on "communications"."poll_responses" ("option_id");

create index if not exists "poll_responses_tenant_id_idx"
on "communications"."poll_responses" ("tenant_id");

create index if not exists "polls_tenant_id_idx"
on "communications"."polls" ("tenant_id");

create index if not exists "posts_author_membership_id_idx"
on "communications"."posts" ("author_membership_id");

create index if not exists "posts_channel_id_idx"
on "communications"."posts" ("channel_id");

create index if not exists "posts_tenant_id_idx"
on "communications"."posts" ("tenant_id");

create index if not exists "reactions_comment_id_idx"
on "communications"."reactions" ("comment_id");

create index if not exists "reactions_membership_id_idx"
on "communications"."reactions" ("membership_id");

create index if not exists "reactions_tenant_id_idx"
on "communications"."reactions" ("tenant_id");

create index if not exists "access_events_actor_id_idx"
on "documents"."access_events" ("actor_id");

create index if not exists "access_events_document_id_idx"
on "documents"."access_events" ("document_id");

create index if not exists "access_events_tenant_id_idx"
on "documents"."access_events" ("tenant_id");

create index if not exists "access_events_version_id_idx"
on "documents"."access_events" ("version_id");

create index if not exists "document_links_tenant_id_idx"
on "documents"."document_links" ("tenant_id");

create index if not exists "document_versions_uploaded_by_idx"
on "documents"."document_versions" ("uploaded_by");

create index if not exists "documents_created_by_idx"
on "documents"."documents" ("created_by");

create index if not exists "documents_folder_id_idx"
on "documents"."documents" ("folder_id");

create index if not exists "documents_property_id_idx"
on "documents"."documents" ("property_id");

create index if not exists "documents_tenant_id_idx"
on "documents"."documents" ("tenant_id");

create index if not exists "folders_parent_id_idx"
on "documents"."folders" ("parent_id");

create index if not exists "folders_property_id_idx"
on "documents"."folders" ("property_id");

create index if not exists "legal_records_document_id_idx"
on "documents"."legal_records" ("document_id");

create index if not exists "legal_records_property_id_idx"
on "documents"."legal_records" ("property_id");

create index if not exists "legal_records_tenant_id_idx"
on "documents"."legal_records" ("tenant_id");

create index if not exists "agenda_items_tenant_id_idx"
on "governance"."agenda_items" ("tenant_id");

create index if not exists "attendance_eligibility_id_idx"
on "governance"."attendance" ("eligibility_id");

create index if not exists "attendance_represented_by_party_id_idx"
on "governance"."attendance" ("represented_by_party_id");

create index if not exists "attendance_tenant_id_idx"
on "governance"."attendance" ("tenant_id");

create index if not exists "ballots_cast_by_idx"
on "governance"."ballots" ("cast_by");

create index if not exists "ballots_eligibility_id_idx"
on "governance"."ballots" ("eligibility_id");

create index if not exists "ballots_option_id_idx"
on "governance"."ballots" ("option_id");

create index if not exists "eligibility_snapshots_party_id_idx"
on "governance"."eligibility_snapshots" ("party_id");

create index if not exists "eligibility_snapshots_tenant_id_idx"
on "governance"."eligibility_snapshots" ("tenant_id");

create index if not exists "eligibility_snapshots_unit_id_idx"
on "governance"."eligibility_snapshots" ("unit_id");

create index if not exists "meetings_created_by_idx"
on "governance"."meetings" ("created_by");

create index if not exists "meetings_property_id_idx"
on "governance"."meetings" ("property_id");

create index if not exists "meetings_tenant_id_idx"
on "governance"."meetings" ("tenant_id");

create index if not exists "minutes_approved_by_idx"
on "governance"."minutes" ("approved_by");

create index if not exists "minutes_tenant_id_idx"
on "governance"."minutes" ("tenant_id");

create index if not exists "resolutions_agenda_item_id_idx"
on "governance"."resolutions" ("agenda_item_id");

create index if not exists "resolutions_tenant_id_idx"
on "governance"."resolutions" ("tenant_id");

create index if not exists "vote_options_tenant_id_idx"
on "governance"."vote_options" ("tenant_id");

create index if not exists "votes_meeting_id_idx"
on "governance"."votes" ("meeting_id");

create index if not exists "votes_tenant_id_idx"
on "governance"."votes" ("tenant_id");

create index if not exists "cutovers_approved_by_idx"
on "migration_hub"."cutovers" ("approved_by");

create index if not exists "cutovers_tenant_id_idx"
on "migration_hub"."cutovers" ("tenant_id");

create index if not exists "field_mappings_tenant_id_idx"
on "migration_hub"."field_mappings" ("tenant_id");

create index if not exists "import_batches_tenant_id_idx"
on "migration_hub"."import_batches" ("tenant_id");

create index if not exists "projects_created_by_idx"
on "migration_hub"."projects" ("created_by");

create index if not exists "projects_property_id_idx"
on "migration_hub"."projects" ("property_id");

create index if not exists "projects_tenant_id_idx"
on "migration_hub"."projects" ("tenant_id");

create index if not exists "reconciliation_items_tenant_id_idx"
on "migration_hub"."reconciliation_items" ("tenant_id");

create index if not exists "reconciliation_runs_approved_by_idx"
on "migration_hub"."reconciliation_runs" ("approved_by");

create index if not exists "reconciliation_runs_project_id_idx"
on "migration_hub"."reconciliation_runs" ("project_id");

create index if not exists "reconciliation_runs_tenant_id_idx"
on "migration_hub"."reconciliation_runs" ("tenant_id");

create index if not exists "staged_records_tenant_id_idx"
on "migration_hub"."staged_records" ("tenant_id");

create index if not exists "validation_results_tenant_id_idx"
on "migration_hub"."validation_results" ("tenant_id");

commit;
