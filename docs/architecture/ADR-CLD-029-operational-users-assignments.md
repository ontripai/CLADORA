# ADR-CLD-029 — Operational Users and Assignment Control

Status: Accepted — 2026-08-29

## Decision

Platform Users and Customer Assignments are served only through authenticated, AAL2-protected platform APIs. The browser receives no Auth user identifier. Every response is private and non-cacheable.

User and role visibility is limited to self, Platform Super Admin, or active users sharing a currently valid customer workspace through a role-compatible scope. Assignment visibility follows the same least-privilege matrix:

- Operations: `workspace`
- Finance: `workspace` or `commercial`
- Support: `workspace`, `support`, or `technical`
- Auditor: `workspace` or `audit`

Missing, revoked, future, expired, wrong-scope, or cross-customer assignments fail closed.

Only Platform Super Admin may create or revoke a Customer Assignment. Mutations require a trusted same-origin request, an explicit 8–500 character reason, a valid scope, and a valid time interval. Overlapping active assignments for the same user, workspace, scope, and scope identifier are rejected. Grant and revoke actions remain audited.

Role assignment remains read-only in this slice. Production acceptance must not create, edit, or revoke a real Auth user, role, invitation, or Customer Assignment.

## Consequences

The UI can support list, search, filters, pagination, details, scheduled access, expiry, creation, and revocation without using privileged browser credentials. RLS remains the authoritative defense if an API query is broadened accidentally.
