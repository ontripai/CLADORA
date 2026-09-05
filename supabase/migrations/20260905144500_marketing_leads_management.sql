begin;

-- =============================================================================
-- Migration: 20260905144500_marketing_leads_management.sql
-- Description: Production-ready Marketing Leads and Database Rate Limits
-- =============================================================================

create table if not exists public.marketing_leads (
  id uuid default gen_random_uuid() primary key,
  reference_id text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  lead_type text not null check (lead_type in ('contact', 'pilot')),
  full_name text not null check (length(trim(full_name)) between 1 and 255),
  email text not null check (length(trim(email)) between 3 and 255),
  phone text check (phone is null or length(phone) <= 50),
  role text check (role is null or length(role) <= 100),
  building_type text check (building_type is null or length(building_type) <= 100),
  units_count integer check (units_count is null or (units_count > 0 and units_count <= 10000)),
  current_software text check (current_software is null or length(current_software) <= 100),
  city text check (city is null or length(city) <= 100),
  county text check (county is null or length(county) <= 100),
  message text check (message is null or length(message) <= 5000),
  locale text not null check (locale in ('ro', 'en', 'fa')),
  source_page text check (source_page is null or length(source_page) <= 255),
  utm_source text check (utm_source is null or length(utm_source) <= 100),
  utm_medium text check (utm_medium is null or length(utm_medium) <= 100),
  utm_campaign text check (utm_campaign is null or length(utm_campaign) <= 100),
  utm_content text check (utm_content is null or length(utm_content) <= 100),
  utm_term text check (utm_term is null or length(utm_term) <= 100),
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'converted', 'rejected', 'spam')),
  consent_privacy boolean not null check (consent_privacy = true),
  consent_timestamp timestamptz not null default now(),
  ip_hash text check (ip_hash is null or length(ip_hash) <= 128),
  user_agent text check (user_agent is null or length(user_agent) <= 255),
  metadata jsonb not null default '{}'::jsonb,
  submission_fingerprint text check (submission_fingerprint is null or length(submission_fingerprint) <= 128)
);

create unique index if not exists idx_marketing_leads_reference_id on public.marketing_leads (reference_id);
create index if not exists idx_marketing_leads_created_at on public.marketing_leads (created_at desc);
create index if not exists idx_marketing_leads_status on public.marketing_leads (status);
create index if not exists idx_marketing_leads_lead_type on public.marketing_leads (lead_type);
create index if not exists idx_marketing_leads_email on public.marketing_leads (email);
create index if not exists idx_marketing_leads_fingerprint on public.marketing_leads (submission_fingerprint);

-- Rate limits storage for serverless-safe rate limiting
create table if not exists public.marketing_rate_limits (
  id uuid default gen_random_uuid() primary key,
  action_key text not null check (length(action_key) <= 128),
  request_count integer not null default 1 check (request_count > 0),
  window_start timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists idx_marketing_rate_limits_lookup on public.marketing_rate_limits (action_key, expires_at);

-- Row Level Security
alter table public.marketing_leads enable row level security;
alter table public.marketing_rate_limits enable row level security;

-- Revoke all direct anonymous / authenticated access
revoke all on table public.marketing_leads from public, anon, authenticated;
revoke all on table public.marketing_rate_limits from public, anon, authenticated;

-- Grant access strictly to service_role
grant select, insert, update on table public.marketing_leads to service_role;
grant select, insert, update, delete on table public.marketing_rate_limits to service_role;

-- Rate limit verification function (invoked strictly by service_role)
create or replace function public.consume_marketing_rate_limit(
  p_action_key text,
  p_max_requests integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  current_count integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_expires_at timestamptz := v_now + make_interval(secs => p_window_seconds);
  v_record_id uuid;
  v_count integer;
  v_record_expires timestamptz;
begin
  -- Prune expired rows for this key
  delete from public.marketing_rate_limits
  where action_key = p_action_key and expires_at < v_now;

  -- Check existing active window
  select id, request_count, expires_at
  into v_record_id, v_count, v_record_expires
  from public.marketing_rate_limits
  where action_key = p_action_key and expires_at >= v_now
  for update;

  if v_record_id is null then
    insert into public.marketing_rate_limits (action_key, request_count, window_start, expires_at)
    values (p_action_key, 1, v_now, v_expires_at);

    return query select true, 1, 0;
  elsif v_count < p_max_requests then
    update public.marketing_rate_limits
    set request_count = request_count + 1
    where id = v_record_id;

    return query select true, v_count + 1, 0;
  else
    return query select
      false,
      v_count,
      greatest(1, extract(epoch from (v_record_expires - v_now))::integer);
  end if;
end;
$$;

revoke all on function public.consume_marketing_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_marketing_rate_limit(text, integer, integer) to service_role;

commit;
