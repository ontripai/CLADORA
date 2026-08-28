begin;

drop policy if exists profiles_self_read on identity.profiles;
create policy profiles_self_read
on identity.profiles
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists profiles_self_update on identity.profiles;
create policy profiles_self_update
on identity.profiles
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists memberships_self_read on identity.memberships;
create policy memberships_self_read
on identity.memberships
for select
to authenticated
using (
  user_id = (select auth.uid())
  and tenant_id = app_private.active_tenant_id()
);

drop policy if exists review_decisions_self_read on utilities.review_decisions;
create policy review_decisions_self_read
on utilities.review_decisions
for select
to authenticated
using (
  tenant_id = app_private.active_tenant_id()
  and actor_id = (select auth.uid())
);

drop policy if exists access_events_self_read on documents.access_events;
create policy access_events_self_read
on documents.access_events
for select
to authenticated
using (
  tenant_id = app_private.active_tenant_id()
  and actor_id = (select auth.uid())
);

commit;
