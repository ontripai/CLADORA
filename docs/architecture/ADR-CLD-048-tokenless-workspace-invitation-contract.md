# ADR-CLD-048 — Tokenless Workspace Invitation Contract

- **Status:** Proposed for local migration and Preview verification
- **Task:** CLADORA-P1-CLOSE-006C
- **Depends on:** ADR-CLD-024, ADR-CLD-025, CLADORA-P1-CLOSE-006A
- **Rollout:** Expand-first; no Remote activation in this change

## Context

The legacy workspace invitation path uses a separately generated opaque Workspace token. The dispatcher embeds that token in a nested callback destination, the callback transfers it to an HttpOnly cookie, and the acceptance RPC hashes the token to locate the invitation. The secure Auth callback introduced by 006A intentionally rejects this URL shape.

Supabase Auth already establishes a verified server-side identity through `token_hash`, `type=invite`, and `verifyOtp()`. Workspace authorization should therefore be resolved independently from database state rather than by carrying a second bearer credential through the browser.

## Decision

`invitation_id` is sufficient as a non-secret selector. A continuation table is not required because every list and claim request reconstructs authorization from:

1. `auth.uid()`;
2. the confirmed normalized email in `auth.users`;
3. a current `sent`, unexpired invitation for that email;
4. the invitation's stored Workspace, Tenant, Scope, and Role.

The selector grants no authority by itself. Random, cross-email, cross-tenant, expired, revoked, used, or unsupported-scope selectors fail closed.

Two additive RPCs form the new contract:

- `platform.list_my_claimable_workspace_invitations()` returns only minimal, user-facing choices belonging to the verified email.
- `platform.claim_workspace_invitation(uuid,text,text,text)` atomically binds the selected invitation to the verified Auth user.

Both functions are `SECURITY DEFINER` because they must read `auth.users` and controlled invitation rows. Both use an empty `search_path`, schema-qualified objects, internal identity checks, revoked default execution, and an `authenticated`-only grant. Application code never uses the Service Role for listing or claiming.

## Concurrency and lock order

Every claim uses this fixed order:

1. invitation row by primary key;
2. customer workspace row;
3. membership through unique-backed upsert;
4. tenant context grant through unique-backed upsert.

`memberships_active_unique` remains the final arbiter for an invited/active Tenant–User–Role tuple. The migration adds `context_grants_open_tenant_unique` for one open tenant grant per Membership–Tenant. Same-user retry returns `already_claimed_by_you`; another actor cannot reuse the accepted invitation. Audit evidence is emitted only for the first successful transition.

## Multiple invitations

One verified email may have multiple valid invitations. The list RPC returns each authorized invitation with a non-sensitive Workspace label and display access label. The application automatically preselects a single choice and requires explicit selection when multiple choices exist. The client submits only `invitation_id` plus profile localization fields; it cannot submit Workspace, Tenant, Role, Scope, Entitlement, or Permission.

## Scope boundary

The current invitation schema stores `scope_type` but no property, building, or unit selector. The tokenless rollout therefore accepts only `tenant` scope. Other stored scopes fail closed until a separately designed invitation-scope contract exists.

## Expand-first rollout

- Legacy token functions, token hash column, cookie consumer, and acceptance route remain unchanged for rollback containment.
- The dispatcher stops sending the raw Workspace token and redirects only to the localized Auth callback.
- A verified Invite callback continues to the localized tokenless invitation page.
- Remote email template changes and Remote migration execution require separate approval.
- Legacy removal is deferred until controlled Remote activation and production verification succeed.

## Rollback and containment

Before Remote activation, rollback is a normal code revert because the migration exists only in source control. After a separately approved additive Remote migration, application rollback can return traffic to the legacy route without dropping the new functions or indexes. Destructive cleanup must not occur until production verification confirms the tokenless path.
