# ADR-CLD-025 — Primary Administrator Invitation Acceptance

- **Status:** Proposed
- **Task:** CLADORA-ENG-010B-DB
- **Depends on:** ADR-CLD-023, ADR-CLD-024
- **Date:** 2026-08-27

## Context

A provisioned CLADORA workspace needs exactly one initial customer administrator. Invitation delivery and authentication are separate from the database authorization boundary. Acceptance must bind the authenticated Supabase Auth identity to the invitation without trusting client-supplied identity or authorization metadata.

## Decision

The database exposes one guarded acceptance RPC:

`platform.accept_primary_admin_invitation(token, display_name, locale, timezone)`

The function is `SECURITY DEFINER`, has a fixed search path, is revoked from `PUBLIC`, and is executable only by `authenticated` and `service_role`.

Acceptance is atomic and succeeds only when:

- `auth.uid()` resolves to an existing user with a confirmed email.
- The SHA-256 hash of the opaque token matches an active, unexpired invitation.
- The normalized Auth email exactly matches the invitation email.
- The workspace is in `PROVISIONING`.
- The invited role belongs to the workspace tenant and is `WORKSPACE_OWNER` or `WORKSPACE_ADMIN`.
- No different primary administrator is already bound to the workspace.

On success, one transaction:

1. creates the identity profile if absent;
2. activates or creates the tenant membership;
3. creates the tenant-scoped context grant if absent;
4. marks the invitation accepted and binds the membership;
5. records the primary administrator on the workspace;
6. appends an audit event without the raw token or invitation email.

A retry by the same authenticated user and accepted token is idempotent. A different actor cannot reuse the accepted invitation.

## Boundaries

This decision does not:

- send invitation email;
- create or modify Auth users;
- set or reset passwords;
- complete onboarding;
- unlock `PRODUCTION` activation;
- modify customer business data.

Auth delivery, callback exchange, and password setup belong to ENG-010B-AUTH. Completion criteria and the production activation gate belong to ENG-010C.

## Security invariants

- Authorization never uses `user_metadata`.
- Raw invitation tokens are never persisted or audited.
- Direct customer-workspace lifecycle mutation remains denied.
- Tenant membership and context are derived from the locked invitation and workspace rows.
- All writes either commit together or roll back together.
- RLS remains enabled; the RPC is the controlled mutation boundary.

## Verification

The pgTAP suite covers authentication, email confirmation and matching, input validation, role restrictions, atomic state creation, audit redaction, and idempotent retry. The repository package contract requires 29 migrations, 17 pgTAP files, and 436 assertions.
