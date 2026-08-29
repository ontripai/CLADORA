# ADR-CLD-028: Assignment-Scoped Platform Auditor

**Status:** Accepted

**Date:** 2026-08-29

**Applies to:** Platform Control Plane customer Workspaces, contracts, entitlements, and related entitlement usage

## Context

The original Platform Control Plane RLS treated `PLATFORM_AUDITOR` as a global read role. That exception did not satisfy CLADORA's authorization formula because it omitted Customer Assignment, Scope, and Time Constraint checks.

## Decision

Auditor access is customer-assignment scoped:

- the actor must have an active `PLATFORM_AUDITOR` role;
- the target Workspace must have an active assignment for that actor;
- the assignment scope must be `audit` or the umbrella scope `workspace`;
- `valid_from` must be at or before the current statement time;
- `valid_until` must be null or later than the current statement time; and
- access remains read-only.

The application layer narrows queries before execution. PostgreSQL RLS independently enforces the same boundary for direct table reads. A missing, revoked, future, expired, wrong-scope, or cross-customer assignment fails closed.

Multiple active Platform roles are additive. An actor who separately holds another authorized role receives only the access granted by that role and its corresponding assignment scope; Auditor status does not create a global bypass.

## Implementation

- `app_private.has_customer_assignment(workspace_id, 'audit')` accepts an exact `audit` assignment or the existing umbrella `workspace` assignment and enforces lifecycle time bounds.
- `app_private.can_access_platform_workspace()` no longer grants a global Auditor exception.
- Versioned migration `20260829003500_auditor_assignment_scoped_reads.sql` replaces select policies for customer Workspaces, assignments, contracts, entitlements, and entitlement usage.
- API routes for Workspace and contract listing apply the assignment boundary before querying.

## Consequences

- Auditors require explicit provisioning per customer Workspace.
- Revocation and expiry remove visibility without application redeployment.
- Global cross-customer audits require explicit assignments and cannot be inferred from the Auditor role.
- No existing customer assignment is created or modified by the migration.

## Operational boundary

The migration may be executed only in local or temporary CI databases during this task. Supabase Remote apply, Production changes, Vercel environment changes, Auth changes, customer-data changes, and merge remain outside the authorization boundary.
