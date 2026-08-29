# ADR-CLD-033 — Operational Support Access and Dual Control

Status: Accepted — CLADORA-ENG-016

## Decision

Support access is a short-lived, workspace-scoped privilege. It is never routine customer access. Every request requires a bounded ticket reference, reason, requested duration (15–240 minutes), scope, sensitivity and evidence. Approval requires a second AAL2 actor; requester and approver may never be the same user.

Super Admin may read and operate across the control plane. Operations may read and operate only for a current `workspace` assignment. Auditor may read only for a current `audit` or `workspace` assignment. Finance, AAL1, missing, future, expired, revoked, wrong-scope and cross-customer assignments fail closed.

The UI and API use bounded security-definer RPCs. Direct authenticated table access is revoked. Functions pin `search_path`, re-check identity, AAL2, role and assignment, lock mutable rows, and audit successful state changes. Expiration is computed from `expires_at` and therefore requires no background write.

Evidence and audit snapshots are recursively redacted for Auth, Token, Password, Secret, Session and CAPTCHA-shaped keys. Raw evidence tables are not exposed to authenticated clients.

## State and concurrency

- Request: `requested → approved` or `requested → cancelled`.
- Grant: effective `approved → expired`, or `approved → revoked`.
- Approval locks the request row and the unique request/grant relation prevents duplicate concurrent grants.
- Self-approval is rejected inside the database, independent of UI behavior.

## Production acceptance boundary

Production release acceptance is read-only. It must not create, approve, cancel or revoke a real request or grant. Verification is limited to migration metadata, unauthenticated API behavior, localized route redirects/pages, deployment health and unchanged row counts.
