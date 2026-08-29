# ADR-CLD-032 — Operational Audit Trail & Security Event Explorer

Status: Accepted  
Task: CLADORA-ENG-015

## Decision

The Platform Control Plane exposes audit events only through a bounded, read-only
RPC. Direct authenticated table access is revoked so callers cannot bypass
recursive snapshot redaction. The underlying ledger remains append-only.

Every read requires AAL2 and an active Platform Role. Super Admin may read global
and customer events. Auditor reads require an active audit or workspace
assignment. Operations reads require a workspace assignment and an operational
action category. Finance reads require a commercial or workspace assignment and
a commercial action category. Unassigned and AAL1 callers fail closed.

## Workspace resolution

Events are associated with a workspace from an explicit snapshot workspace key
or from the referenced workspace, contract, entitlement, assignment,
provisioning, or support record. Events that cannot be resolved remain global and
are visible only to Super Admin.

## Sensitive data

Snapshot objects and arrays are recursively redacted to a bounded depth.
Credential, token, session, authorization, cookie, CAPTCHA, and key-like fields
are replaced with [REDACTED]. Reasons containing those sensitive labels are
fully redacted. API responses use Cache-Control: no-store, private and
Vary: Cookie.

## Release boundary

Production acceptance is read-only. It must not create, edit, or delete audit
events or any customer, identity, commercial, or provisioning data.
