# CLADORA-ENG-011B Acceptance Decisions

**Status: OPEN — MERGE BLOCKER**  
**Applies to:** Draft PR #24  
**Recorded:** 2026-08-29  
**Change boundary:** Documentation and application hardening only. No migration, Supabase Remote, Auth, user, customer-data, Vercel environment, Production, or merge action is authorized.

## 1. Auditor contract visibility

The current application route and the existing RLS policy both allow `PLATFORM_AUDITOR` to read all Platform Control Plane contracts without a Customer Assignment. This behavior is preserved by CLADORA-ENG-011B-FIX because changing it would require an explicit architecture decision and potentially a versioned database migration.

This conflicts with the literal universal reading of the approved access formula:

`Role + Customer Assignment + Scope + Entitlement + Time Constraint + Workspace Lifecycle State`

The role matrix describes Auditor access as read-only, but does not explicitly settle whether contract visibility is global or assignment-scoped.

### Decision required before merge

Choose and record exactly one model:

1. **Assignment-scoped Auditor** — require an active `audit` or `workspace` Customer Assignment for each visible workspace.
2. **Global Control Plane Auditor** — retain global read-only contract visibility and formally document Auditor as an explicit exception to Customer Assignment.

No code or migration in this task selects either model. Draft PR #24 must remain unmerged until the architecture authority records the decision.

## 2. Entitlement time semantics

The Contracts UI represents active Workspace Entitlements. The API must therefore include only rows where:

- `valid_from <= now`; and
- `valid_until IS NULL OR valid_until > now`.

An override is effective only when it has a non-null value, a parseable expiry, and `override_expires_at > now`. Expired or malformed overrides fall back to the base entitlement value without changing stored audit history.

## 3. Vercel Preview limitation and safe path

The current Preview redirects protected routes to Login with `reason=configuration` because the public Supabase URL and publishable key are intentionally scoped to Production only.

No environment variable was changed by this task.

The recommended future acceptance environment is a dedicated, isolated non-production Supabase project containing synthetic fixtures and Preview-scoped publishable credentials. Pointing Preview at the Production Supabase project is not approved because it would expose acceptance activity to real platform state. Until an isolated environment is separately authorized, CI/static authorization tests are the permitted verification boundary.
