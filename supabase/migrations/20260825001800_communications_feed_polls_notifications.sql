begin;

create schema if not exists communications;
grant usage on schema communications to authenticated;
create type communications.channel_scope as enum ('tenant','property','building','unit','direct');
create type communications.post_status as enum ('draft','published','archived','removed');

create table communications.channels (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  property_id uuid references portfolio.properties(id) on delete restrict, building_id uuid references portfolio.buildings(id) on delete restrict,
  unit_id uuid references portfolio.units(id) on delete restrict, scope communications.channel_scope not null, name text not null,
  is_private boolean not null default true, status platform.record_status not null default 'active', created_at timestamptz not null default statement_timestamp(),
  check((scope='tenant' and property_id is null and building_id is null and unit_id is null) or (scope='property' and property_id is not null and building_id is null and unit_id is null) or (scope='building' and building_id is not null and unit_id is null) or (scope='unit' and unit_id is not null) or scope='direct')
);
create table communications.channel_members (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  channel_id uuid not null references communications.channels(id) on delete cascade, membership_id uuid not null references identity.memberships(id) on delete cascade,
  role text not null default 'member', joined_at timestamptz not null default statement_timestamp(), muted_until timestamptz, unique(channel_id,membership_id)
);
create table communications.posts (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  channel_id uuid not null references communications.channels(id) on delete restrict, author_membership_id uuid references identity.memberships(id) on delete restrict,
  title text, body text not null, post_type text not null default 'update', status communications.post_status not null default 'draft',
  pinned_until timestamptz, published_at timestamptz, created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp()
);
create table communications.comments (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  post_id uuid not null references communications.posts(id) on delete cascade, parent_comment_id uuid references communications.comments(id) on delete cascade,
  author_membership_id uuid not null references identity.memberships(id) on delete restrict, body text not null, removed_at timestamptz,
  created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp()
);
create table communications.reactions (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict, post_id uuid references communications.posts(id) on delete cascade,
  comment_id uuid references communications.comments(id) on delete cascade, membership_id uuid not null references identity.memberships(id) on delete cascade,
  reaction text not null, created_at timestamptz not null default statement_timestamp(),
  check((post_id is not null)::integer+(comment_id is not null)::integer=1), unique nulls not distinct(post_id,comment_id,membership_id,reaction)
);
create table communications.polls (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  post_id uuid not null unique references communications.posts(id) on delete cascade, question text not null, multiple_choice boolean not null default false,
  opens_at timestamptz not null, closes_at timestamptz, anonymous boolean not null default false, result_snapshot jsonb, created_at timestamptz not null default statement_timestamp(),
  check(closes_at is null or closes_at>opens_at)
);
create table communications.poll_options (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  poll_id uuid not null references communications.polls(id) on delete cascade, label text not null, sequence_no integer not null check(sequence_no>0), unique(poll_id,sequence_no)
);
create table communications.poll_responses (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  poll_id uuid not null references communications.polls(id) on delete restrict, option_id uuid not null references communications.poll_options(id) on delete restrict,
  membership_id uuid not null references identity.memberships(id) on delete restrict, responded_at timestamptz not null default statement_timestamp(),
  unique(poll_id,option_id,membership_id)
);
create table communications.notifications (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references platform.tenants(id) on delete restrict,
  membership_id uuid not null references identity.memberships(id) on delete cascade, type text not null, title text not null, body text,
  action_url text, payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default statement_timestamp(), read_at timestamptz
);
create table communications.notification_preferences (
  tenant_id uuid not null references platform.tenants(id) on delete restrict, membership_id uuid not null references identity.memberships(id) on delete cascade,
  channel text not null, event_type text not null, enabled boolean not null default true, quiet_hours jsonb, updated_at timestamptz not null default statement_timestamp(),
  primary key(membership_id,channel,event_type)
);

create or replace function app_private.can_access_channel(target_channel uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,communications
as $$ select exists(select 1 from communications.channels c where c.id=target_channel and c.tenant_id=app_private.active_tenant_id() and ((c.scope='tenant' and app_private.is_active_member(c.tenant_id)) or (c.scope='property' and app_private.can_access_property(c.property_id)) or (c.scope='building' and app_private.can_access_building(c.building_id)) or (c.scope='unit' and app_private.can_access_unit(c.unit_id)) or (c.scope='direct' and exists(select 1 from communications.channel_members cm where cm.channel_id=c.id and cm.membership_id=app_private.active_membership_id())))); $$;
revoke all on function app_private.can_access_channel(uuid) from public;
grant execute on function app_private.can_access_channel(uuid) to authenticated,service_role;

create or replace function communications.enforce_poll_response()
returns trigger language plpgsql security definer set search_path=pg_catalog,communications
as $$ declare p communications.polls%rowtype; existing_count integer; begin
  select * into p from communications.polls where id=new.poll_id;
  if not found or statement_timestamp()<p.opens_at or (p.closes_at is not null and statement_timestamp()>=p.closes_at) then raise exception 'poll_is_not_open'; end if;
  if not exists(select 1 from communications.poll_options o where o.id=new.option_id and o.poll_id=new.poll_id) then raise exception 'poll_option_mismatch'; end if;
  if not p.multiple_choice then
    select count(*) into existing_count from communications.poll_responses r where r.poll_id=new.poll_id and r.membership_id=new.membership_id and (tg_op='INSERT' or r.id<>new.id);
    if existing_count>0 then raise exception 'single_choice_poll_allows_one_response'; end if;
  end if;
  return new;
end; $$;
create trigger poll_responses_validate before insert or update on communications.poll_responses for each row execute function communications.enforce_poll_response();
revoke all on function communications.enforce_poll_response() from public;

do $$ declare t text; begin foreach t in array array['channels','channel_members','posts','comments','reactions','polls','poll_options','poll_responses','notifications','notification_preferences'] loop execute format('alter table communications.%I enable row level security',t); end loop; end $$;
create policy channels_context_read on communications.channels for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_channel(id));
create policy channel_members_self_read on communications.channel_members for select to authenticated using(tenant_id=app_private.active_tenant_id() and (membership_id=app_private.active_membership_id() or app_private.can_access_channel(channel_id)));
create policy posts_context_read on communications.posts for select to authenticated using(tenant_id=app_private.active_tenant_id() and app_private.can_access_channel(channel_id));
create policy comments_context_read on communications.comments for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from communications.posts p where p.id=post_id and app_private.can_access_channel(p.channel_id)));
create policy reactions_context_read on communications.reactions for select to authenticated using(tenant_id=app_private.active_tenant_id() and ((post_id is not null and exists(select 1 from communications.posts p where p.id=post_id and app_private.can_access_channel(p.channel_id))) or (comment_id is not null and exists(select 1 from communications.comments c join communications.posts p on p.id=c.post_id where c.id=comment_id and app_private.can_access_channel(p.channel_id)))));
create policy polls_context_read on communications.polls for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from communications.posts p where p.id=post_id and app_private.can_access_channel(p.channel_id)));
create policy poll_options_context_read on communications.poll_options for select to authenticated using(tenant_id=app_private.active_tenant_id() and exists(select 1 from communications.polls x join communications.posts p on p.id=x.post_id where x.id=poll_id and app_private.can_access_channel(p.channel_id)));
create policy poll_responses_self_read on communications.poll_responses for select to authenticated using(tenant_id=app_private.active_tenant_id() and membership_id=app_private.active_membership_id());
create policy notifications_self_read on communications.notifications for select to authenticated using(tenant_id=app_private.active_tenant_id() and membership_id=app_private.active_membership_id());
create policy notification_preferences_self_read on communications.notification_preferences for select to authenticated using(tenant_id=app_private.active_tenant_id() and membership_id=app_private.active_membership_id());
grant select on all tables in schema communications to authenticated;
grant all on all tables in schema communications to service_role;

commit;
