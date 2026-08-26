begin;

create schema if not exists governance;
grant usage on schema governance to authenticated;
create type governance.meeting_status as enum ('draft','announced','open','adjourned','closed','cancelled');
create type governance.vote_status as enum ('draft','open','closed','cancelled');

create table governance.meetings (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  property_id uuid not null references portfolio.properties(id) on delete restrict, title text not null, meeting_type text not null,
  scheduled_at timestamptz not null, location_text text, remote_join_url text, status governance.meeting_status not null default 'draft',
  quorum_rule jsonb not null, announced_at timestamptz, opened_at timestamptz, closed_at timestamptz,
  created_by uuid references auth.users(id) on delete restrict, created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp()
);
create table governance.agenda_items (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  meeting_id uuid not null references governance.meetings(id) on delete cascade, sequence_no integer not null check(sequence_no>0),
  title text not null, description text, decision_required boolean not null default false, attachments_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default statement_timestamp(), unique(meeting_id,sequence_no)
);
create table governance.eligibility_snapshots (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  meeting_id uuid not null references governance.meetings(id) on delete restrict, unit_id uuid not null references portfolio.units(id) on delete restrict,
  party_id uuid not null references portfolio.parties(id) on delete restrict, ownership_share numeric(12,10) not null check(ownership_share>0 and ownership_share<=1),
  voting_weight numeric(20,10) not null check(voting_weight>0), eligible boolean not null default true, reason text,
  snapshot_json jsonb not null, created_at timestamptz not null default statement_timestamp(), unique(meeting_id,unit_id,party_id)
);
create table governance.attendance (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  meeting_id uuid not null references governance.meetings(id) on delete restrict, eligibility_id uuid not null references governance.eligibility_snapshots(id) on delete restrict,
  represented_by_party_id uuid references portfolio.parties(id) on delete restrict, attendance_mode text not null,
  checked_in_at timestamptz not null default statement_timestamp(), proxy_evidence_path text, unique(meeting_id,eligibility_id)
);
create table governance.votes (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  meeting_id uuid not null references governance.meetings(id) on delete restrict, agenda_item_id uuid not null references governance.agenda_items(id) on delete restrict,
  question text not null, status governance.vote_status not null default 'draft', voting_method text not null default 'weighted',
  opens_at timestamptz, closes_at timestamptz, result_snapshot jsonb, created_at timestamptz not null default statement_timestamp(),
  unique(agenda_item_id)
);
create table governance.vote_options (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  vote_id uuid not null references governance.votes(id) on delete cascade, code text not null, label text not null, sequence_no integer not null check(sequence_no>0),
  created_at timestamptz not null default statement_timestamp(), unique(vote_id,code), unique(vote_id,sequence_no)
);
create table governance.ballots (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  vote_id uuid not null references governance.votes(id) on delete restrict, eligibility_id uuid not null references governance.eligibility_snapshots(id) on delete restrict,
  option_id uuid not null references governance.vote_options(id) on delete restrict, voting_weight numeric(20,10) not null check(voting_weight>0),
  cast_by uuid references auth.users(id) on delete restrict, cast_at timestamptz not null default statement_timestamp(), receipt_hash text not null,
  unique(vote_id,eligibility_id), unique(tenant_id,receipt_hash)
);
create table governance.resolutions (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  meeting_id uuid not null references governance.meetings(id) on delete restrict, agenda_item_id uuid not null references governance.agenda_items(id) on delete restrict,
  resolution_no text not null, title text not null, text_body text not null, adopted boolean not null, result_snapshot jsonb not null,
  effective_on date, created_at timestamptz not null default statement_timestamp(), unique(meeting_id,resolution_no)
);
create table governance.minutes (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  meeting_id uuid not null references governance.meetings(id) on delete restrict, version integer not null default 1 check(version>0),
  content_json jsonb not null, object_path text, sha256 text, approved_at timestamptz, approved_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(), unique(meeting_id,version)
);

create or replace function governance.protect_closed_vote()
returns trigger language plpgsql security definer set search_path=pg_catalog,governance
as $$ declare s governance.vote_status; begin
  if tg_table_name='votes' then
    if tg_op='DELETE' and old.status='closed' then raise exception 'closed_vote_is_immutable'; end if;
    if tg_op='UPDATE' and old.status='closed' and new is distinct from old then raise exception 'closed_vote_is_immutable'; end if;
    if tg_op='UPDATE' and old.status='open' and new.status='closed' then new.closes_at=coalesce(new.closes_at,statement_timestamp()); end if;
    return case when tg_op='DELETE' then old else new end;
  end if;
  select status into s from governance.votes where id=coalesce(new.vote_id,old.vote_id);
  if s<>'open' then raise exception 'ballot_requires_open_vote'; end if;
  return case when tg_op='DELETE' then old else new end;
end; $$;
create trigger votes_protect before update or delete on governance.votes for each row execute function governance.protect_closed_vote();
create trigger ballots_open_vote before insert or update or delete on governance.ballots for each row execute function governance.protect_closed_vote();
create or replace function governance.protect_vote_option()
returns trigger language plpgsql security definer set search_path=pg_catalog,governance
as $$ declare s governance.vote_status; begin
  select status into s from governance.votes where id=coalesce(new.vote_id,old.vote_id);
  if s<>'draft' then raise exception 'vote_options_require_draft_vote'; end if;
  return case when tg_op='DELETE' then old else new end;
end; $$;
create trigger vote_options_draft_vote before insert or update or delete on governance.vote_options for each row execute function governance.protect_vote_option();
create trigger meetings_updated_at before update on governance.meetings for each row execute function app_private.set_updated_at();

do $$ declare t text; begin foreach t in array array['meetings','agenda_items','eligibility_snapshots','attendance','votes','vote_options','ballots','resolutions','minutes'] loop execute format('alter table governance.%I enable row level security',t); end loop; end $$;
create policy meetings_context_read on governance.meetings for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_property(property_id));
create policy agenda_context_read on governance.agenda_items for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from governance.meetings m where m.id=meeting_id and app_private.can_access_property(m.property_id)));
create policy eligibility_self_read on governance.eligibility_snapshots for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_unit(unit_id));
create policy attendance_context_read on governance.attendance for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from governance.meetings m where m.id=meeting_id and app_private.can_access_property(m.property_id)));
create policy votes_context_read on governance.votes for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from governance.meetings m where m.id=meeting_id and app_private.can_access_property(m.property_id)));
create policy vote_options_context_read on governance.vote_options for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from governance.votes v join governance.meetings m on m.id=v.meeting_id where v.id=vote_id and app_private.can_access_property(m.property_id)));
create policy ballots_self_read on governance.ballots for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from governance.eligibility_snapshots e where e.id=eligibility_id and app_private.can_access_unit(e.unit_id)));
create policy resolutions_context_read on governance.resolutions for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from governance.meetings m where m.id=meeting_id and app_private.can_access_property(m.property_id)));
create policy minutes_context_read on governance.minutes for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from governance.meetings m where m.id=meeting_id and app_private.can_access_property(m.property_id)));
grant select on all tables in schema governance to authenticated;
grant all on all tables in schema governance to service_role;
revoke all on function governance.protect_closed_vote(),governance.protect_vote_option() from public;

commit;
