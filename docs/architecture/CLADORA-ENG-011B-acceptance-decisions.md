# CLADORA-ENG-011B Acceptance Decisions

**Status: RESOLVED — ASSIGNMENT-SCOPED AUDITOR**

**Applies to:** Draft PR #24

**Recorded:** 2026-08-29

**Change boundary:** Application hardening, versioned migration, local/temporary CI validation, and architecture documentation. No Supabase Remote, Auth, user, customer-data, Vercel environment, Production, or merge action is authorized.

## 1. Auditor contract visibility

The architecture authority selected the assignment-scoped model on 2026-08-29. A `PLATFORM_AUDITOR` may read a customer Workspace and its related contracts and entitlements only when the actor has a currently active Customer Assignment for that Workspace with scope `audit` or `workspace`.

The decision applies the approved access formula without a global Auditor exception:

`Role + Customer Assignment + Scope + Entitlement + Time Constraint + Workspace Lifecycle State`

`workspace` remains the umbrella assignment scope. `audit` is an explicit least-privilege scope for Auditor reads. Assignment status and `valid_from` / `valid_until` constraints are evaluated by the shared authorization helpers.

### Implementation record

- Application APIs filter Auditor workspace and contract reads by active `audit` or `workspace` assignments and fail closed when none exist.
- Migration `20260829003500_auditor_assignment_scoped_reads.sql` adds `audit` to the database scope constraint and replaces the relevant RLS policies.
- RLS covers customer Workspaces, contracts, entitlements, related usage rows, and assignment records visible to the Auditor.
- The Auditor remains read-only; this decision adds no mutation permission.
- pgTAP test `024_auditor_assignment_scoped_reads.test.sql` proves assigned, wrong-scope, expired, cross-customer, and read-only behavior.

The former global Auditor exception is removed. Draft PR #24 remains unmerged pending the normal acceptance process, not because of an unresolved Auditor-scope decision.

## 2. Entitlement time semantics

The Contracts UI represents active Workspace Entitlements. The API must therefore include only rows where:

- `valid_from <= now`; and
- `valid_until IS NULL OR valid_until > now`.

An override is effective only when it has a non-null value, a parseable expiry, and `override_expires_at > now`. Expired or malformed overrides fall back to the base entitlement value without changing stored audit history.

## 3. Vercel Preview limitation and safe path

The current Preview redirects protected routes to Login with `reason=configuration` because the public Supabase URL and publishable key are intentionally scoped to Production only.

No environment variable was changed by this task.

The recommended future acceptance environment is a dedicated, isolated non-production Supabase project containing synthetic fixtures and Preview-scoped publishable credentials. Pointing Preview at the Production Supabase project is not approved because it would expose acceptance activity to real platform state. Until an isolated environment is separately authorized, CI/static authorization tests are the permitted verification boundary.
