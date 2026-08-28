# ADR-CLD-027: Platform AAL2 Enforcement and Actor-Scoped Onboarding State

- **Status:** Accepted
- **Date:** 2026-08-28
- **Task:** CLADORA-ENG-010C-HARDENING-01
- **Supersedes:** UI-only reliance on the Platform Control Plane layout for MFA enforcement

## Context

The Platform Control Plane layout required a verified TOTP factor and an AAL2 session, but Route Handlers and privileged database RPCs remained independently reachable. The customer onboarding page also accepted the workspace version from URL state even though the database already exposed an actor-scoped onboarding-state function.

## Decision

Platform authorization is fail-closed at both application and database boundaries:

1. Every `/api/platform/v1/**` Route Handler requires a signed platform session at AAL2 before role or assignment evaluation.
2. `app_private.has_platform_role(...)` returns a role only when the caller has a current AAL2 JWT. Existing RLS policies and privileged RPCs therefore deny AAL1 callers even when invoked directly through the Data API.
3. Service-role policies remain separate and are not weakened.
4. Customer onboarding derives `workspace_version` and completion status exclusively through `platform.get_my_primary_admin_onboarding(...)`; URL input carries only the workspace identifier.
5. Production activation errors enumerate the complete gate: accepted primary-admin access, active membership, verified MFA, and completed onboarding.

## Security invariants

- UI navigation is never treated as an authorization boundary.
- An active platform role without AAL2 grants no cross-customer access.
- AAL1 callers cannot execute privileged Control Plane RPCs.
- Onboarding optimistic concurrency uses the database-derived workspace version.
- No customer, Auth, invitation, SMTP, CAPTCHA, or production data is created by this repository change.

## Verification

- pgTAP `019_platform_aal2_enforcement.test.sql` proves AAL1 denial, AAL2 authorization, RLS behavior, privileged RPC behavior, and immutable audit creation.
- Application contract checks ensure every Platform API imports the AAL2 guard and the onboarding page does not trust `query.version`.
- Remote deployment of migration `20260825003000` requires a separate explicit approval.
