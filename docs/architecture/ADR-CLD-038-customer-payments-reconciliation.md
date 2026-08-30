# ADR-CLD-038 — Customer Payments and Reconciliation

Status: Accepted for CLADORA-ENG-021.

The authenticated customer data plane exposes payments, confirmed allocations, assisted reconciliation suggestions and minimal ledger linkage through one read-only Postgres projection. The browser never reads payment tables directly. The API independently requires AAL2 and disables shared caching.

Authorization fails closed on active membership, active context grant, approved role, explicit `payments.reconciliation.read` permission, effective `module.payments` entitlement, scope and time bounds. Owner reads require current ownership. Tenant reads additionally require membership-to-party mapping, an active lease and matching payer or liable party. Missing, expired, cross-tenant or mismatched relationships return no privileged data.

Encrypted IBANs, counterparty bank identifiers, raw bank snapshots, remittance text, Auth data, secrets, sessions and CAPTCHA values are excluded from the projection. Financial totals are grouped by currency in Postgres. Confirmed matches are immutable, and database enforcement prevents double allocation, over-allocation and currency mismatch.

Production acceptance is non-mutating. Import, confirmation, allocation, reversal and refund workflows remain outside this slice.
