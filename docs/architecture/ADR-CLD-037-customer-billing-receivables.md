# ADR-CLD-037: Customer billing and receivables projection

Status: Accepted

## Decision

Authenticated billing is exposed only through the stable, security-definer
`billing.get_customer_billing` projection. It validates the signed actor, AAL2,
active membership and context time bounds, approved customer role, explicit
`billing.receivables.read` permission, active workspace, and effective boolean
`module.billing` entitlement before reading any invoice.

Tenant, property, building, and unit context boundaries are resolved in
Postgres. Owners and tenant residents require a unit context and the existing
membership-to-party authorization bridge. An owner must have current ownership;
a tenant resident must have an active lease and can see only invoices whose
liable party is the mapped party. Missing, expired, cross-tenant, or mismatched
relationships fail closed.

Invoice, paid, outstanding, and aging values are calculated inside the database.
The projection returns invoice lines and a minimal journal link, but never bank
accounts, encrypted party fields, raw payment snapshots, Auth data, tokens, or
secrets. Issued financial fields and lines are immutable; paid, void, and
credited invoices are terminal and immutable.

The API is GET-only and sends private no-store headers. Production routes have
no mutation controls. Public `/demo/app` routing is not connected to this API and
retains its existing isolated behavior.

## Operational boundary

This migration creates no invoice, receivable, payment, allocation, party
mapping, user, assignment, or customer record. Production acceptance is
non-mutating.
