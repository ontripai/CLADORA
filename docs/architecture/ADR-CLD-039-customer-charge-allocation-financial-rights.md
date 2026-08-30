# ADR-CLD-039 — Customer Charge Allocation & Financial Rights

Status: Accepted · Task: CLADORA-ENG-022

## Decision

The authenticated customer application exposes charge rules, allocation runs, and allocation lines only through `finance.get_customer_allocations`. The RPC owns the AAL2, active membership/context, role, permission, entitlement, ownership, party-mapping, lease, scope, and time authorization boundary. Production acceptance is read-only and creates or changes no customer record.

Allocation evidence remains database-calculated and explainable. Final runs and their inputs/items are immutable. Invoice sources must match tenant, property, currency, and amount. Every line must reference an effective versioned rule and include formula, evidence, reason, legal debtor, and operational payer. Over-allocation, invalid ownership/lease, expired rules, and cross-tenant access fail closed.

Owner visibility is restricted to current owned units and owner/shared liabilities. Tenant visibility requires a mapped party plus an active lease and is restricted to tenant-liable lines. Raw authentication, banking, token, secret, session, password, and CAPTCHA material is never projected.

`/demo/app` remains isolated. The production UI and API use no shared cache and expose no mutation endpoint for allocation lifecycle actions.
