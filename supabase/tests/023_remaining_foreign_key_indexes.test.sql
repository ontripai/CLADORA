begin;
set local search_path = public, extensions;

select plan(5);

create temporary table expected_remaining_fk_indexes (
 schema_name text not null,
 table_name text not null,
 index_name text not null,
 primary key(schema_name,index_name)
) on commit drop;

insert into expected_remaining_fk_indexes(schema_name,table_name,index_name) values
    ('assets', 'asset_categories', 'asset_categories_parent_id_idx'),
    ('assets', 'asset_components', 'asset_components_component_asset_id_idx'),
    ('assets', 'asset_components', 'asset_components_tenant_id_idx'),
    ('assets', 'asset_history', 'asset_history_actor_id_idx'),
    ('assets', 'asset_history', 'asset_history_asset_id_idx'),
    ('assets', 'asset_history', 'asset_history_tenant_id_idx'),
    ('assets', 'asset_history', 'asset_history_ticket_id_idx'),
    ('assets', 'asset_history', 'asset_history_work_order_id_idx'),
    ('assets', 'asset_warranties', 'asset_warranties_asset_id_idx'),
    ('assets', 'asset_warranties', 'asset_warranties_provider_party_id_idx'),
    ('assets', 'asset_warranties', 'asset_warranties_tenant_id_idx'),
    ('assets', 'assets', 'assets_building_id_idx'),
    ('assets', 'assets', 'assets_category_id_idx'),
    ('assets', 'assets', 'assets_property_id_idx'),
    ('assets', 'assets', 'assets_unit_id_idx'),
    ('communications', 'channel_members', 'channel_members_membership_id_idx'),
    ('communications', 'channel_members', 'channel_members_tenant_id_idx'),
    ('communications', 'channels', 'channels_building_id_idx'),
    ('communications', 'channels', 'channels_property_id_idx'),
    ('communications', 'channels', 'channels_tenant_id_idx'),
    ('communications', 'channels', 'channels_unit_id_idx'),
    ('communications', 'comments', 'comments_author_membership_id_idx'),
    ('communications', 'comments', 'comments_parent_comment_id_idx'),
    ('communications', 'comments', 'comments_post_id_idx'),
    ('communications', 'comments', 'comments_tenant_id_idx'),
    ('communications', 'notification_preferences', 'notification_preferences_tenant_id_idx'),
    ('communications', 'notifications', 'notifications_membership_id_idx'),
    ('communications', 'notifications', 'notifications_tenant_id_idx'),
    ('communications', 'poll_options', 'poll_options_tenant_id_idx'),
    ('communications', 'poll_responses', 'poll_responses_membership_id_idx'),
    ('communications', 'poll_responses', 'poll_responses_option_id_idx'),
    ('communications', 'poll_responses', 'poll_responses_tenant_id_idx'),
    ('communications', 'polls', 'polls_tenant_id_idx'),
    ('communications', 'posts', 'posts_author_membership_id_idx'),
    ('communications', 'posts', 'posts_channel_id_idx'),
    ('communications', 'posts', 'posts_tenant_id_idx'),
    ('communications', 'reactions', 'reactions_comment_id_idx'),
    ('communications', 'reactions', 'reactions_membership_id_idx'),
    ('communications', 'reactions', 'reactions_tenant_id_idx'),
    ('documents', 'access_events', 'access_events_actor_id_idx'),
    ('documents', 'access_events', 'access_events_document_id_idx'),
    ('documents', 'access_events', 'access_events_tenant_id_idx'),
    ('documents', 'access_events', 'access_events_version_id_idx'),
    ('documents', 'document_links', 'document_links_tenant_id_idx'),
    ('documents', 'document_versions', 'document_versions_uploaded_by_idx'),
    ('documents', 'documents', 'documents_created_by_idx'),
    ('documents', 'documents', 'documents_folder_id_idx'),
    ('documents', 'documents', 'documents_property_id_idx'),
    ('documents', 'documents', 'documents_tenant_id_idx'),
    ('documents', 'folders', 'folders_parent_id_idx'),
    ('documents', 'folders', 'folders_property_id_idx'),
    ('documents', 'legal_records', 'legal_records_document_id_idx'),
    ('documents', 'legal_records', 'legal_records_property_id_idx'),
    ('documents', 'legal_records', 'legal_records_tenant_id_idx'),
    ('governance', 'agenda_items', 'agenda_items_tenant_id_idx'),
    ('governance', 'attendance', 'attendance_eligibility_id_idx'),
    ('governance', 'attendance', 'attendance_represented_by_party_id_idx'),
    ('governance', 'attendance', 'attendance_tenant_id_idx'),
    ('governance', 'ballots', 'ballots_cast_by_idx'),
    ('governance', 'ballots', 'ballots_eligibility_id_idx'),
    ('governance', 'ballots', 'ballots_option_id_idx'),
    ('governance', 'eligibility_snapshots', 'eligibility_snapshots_party_id_idx'),
    ('governance', 'eligibility_snapshots', 'eligibility_snapshots_tenant_id_idx'),
    ('governance', 'eligibility_snapshots', 'eligibility_snapshots_unit_id_idx'),
    ('governance', 'meetings', 'meetings_created_by_idx'),
    ('governance', 'meetings', 'meetings_property_id_idx'),
    ('governance', 'meetings', 'meetings_tenant_id_idx'),
    ('governance', 'minutes', 'minutes_approved_by_idx'),
    ('governance', 'minutes', 'minutes_tenant_id_idx'),
    ('governance', 'resolutions', 'resolutions_agenda_item_id_idx'),
    ('governance', 'resolutions', 'resolutions_tenant_id_idx'),
    ('governance', 'vote_options', 'vote_options_tenant_id_idx'),
    ('governance', 'votes', 'votes_meeting_id_idx'),
    ('governance', 'votes', 'votes_tenant_id_idx'),
    ('migration_hub', 'cutovers', 'cutovers_approved_by_idx'),
    ('migration_hub', 'cutovers', 'cutovers_tenant_id_idx'),
    ('migration_hub', 'field_mappings', 'field_mappings_tenant_id_idx'),
    ('migration_hub', 'import_batches', 'import_batches_tenant_id_idx'),
    ('migration_hub', 'projects', 'projects_created_by_idx'),
    ('migration_hub', 'projects', 'projects_property_id_idx'),
    ('migration_hub', 'projects', 'projects_tenant_id_idx'),
    ('migration_hub', 'reconciliation_items', 'reconciliation_items_tenant_id_idx'),
    ('migration_hub', 'reconciliation_runs', 'reconciliation_runs_approved_by_idx'),
    ('migration_hub', 'reconciliation_runs', 'reconciliation_runs_project_id_idx'),
    ('migration_hub', 'reconciliation_runs', 'reconciliation_runs_tenant_id_idx'),
    ('migration_hub', 'staged_records', 'staged_records_tenant_id_idx'),
    ('migration_hub', 'validation_results', 'validation_results_tenant_id_idx');

select ok((select count(*)=87 from expected_remaining_fk_indexes),
 'remaining CLADORA FK package contains exactly 87 indexes');

select ok(not exists(
 select 1 from expected_remaining_fk_indexes e
 left join pg_indexes i on i.schemaname=e.schema_name and i.tablename=e.table_name and i.indexname=e.index_name
 where i.indexname is null
), 'all expected remaining CLADORA FK indexes exist');

select ok(not exists(
 select 1 from expected_remaining_fk_indexes e
 join pg_namespace n on n.nspname=e.schema_name
 join pg_class c on c.relnamespace=n.oid and c.relname=e.index_name
 join pg_index ix on ix.indexrelid=c.oid
 where not ix.indisvalid or not ix.indisready
), 'all remaining CLADORA FK indexes are valid and ready');

select ok(not exists(
 select 1 from expected_remaining_fk_indexes e
 join pg_namespace n on n.nspname=e.schema_name
 join pg_class c on c.relnamespace=n.oid and c.relname=e.index_name
 join pg_index ix on ix.indexrelid=c.oid where ix.indisunique
), 'remaining CLADORA FK support indexes do not introduce uniqueness');

select ok(not exists(
 with fk as(
  select con.conrelid,con.conkey from pg_constraint con
  join pg_class t on t.oid=con.conrelid join pg_namespace n on n.oid=t.relnamespace
  where con.contype='f' and n.nspname in ('assets','documents','migration_hub','communications','governance')
 )
 select 1 from fk where not exists(
  select 1 from pg_index ix where ix.indrelid=fk.conrelid and ix.indisvalid and ix.indisready
  and (ix.indkey::smallint[])[0:cardinality(fk.conkey)-1]=fk.conkey
 )
), 'every foreign key in the five remaining CLADORA schemas has a covering index');

select * from finish();
rollback;
