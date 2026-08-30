# ADR-CLD-036: Customer accounting ledger access

Status: Accepted

## Decision

The authenticated accounting surface is a read-only projection returned by
`finance.get_customer_ledger`. The RPC validates the signed actor, AAL2,
membership and context time bounds, role permission, active workspace, and the
effective `module.accounting` entitlement before reading financial rows.

Tenant, property, building, and unit scopes are resolved in the database. An
Owner or Tenant Resident must use a unit context and have an explicit
`identity.membership_parties` mapping. The mapped party must have a current
ownership or active lease for that unit. Missing, expired, cross-tenant, or
unmapped relationships fail closed.

Debit, credit, balances, and Trial Balance are calculated from ledger rows in
Postgres. Posted journals and their entries remain protected by the existing
immutability triggers. The API exposes GET only and returns private, no-store
responses; the production UI contains no mutation controls. Public demo routes
continue to use their isolated DemoStore component.

`membership_parties` intentionally has no production backfill in this release.
It is only an authorization bridge; creating real mappings remains a separate,
explicitly controlled operational action.

## Security boundary

- No encrypted party or bank fields are selected by the RPC.
- Journal detail returns accounting fields only.
- Owner and Tenant Resident rows are constrained to the authorized unit and
  mapped party where a party is present.
- All direct grants are limited to authenticated/service roles; anonymous and
  public execution are revoked.
- Acceptance and smoke testing are non-mutating in Production.
