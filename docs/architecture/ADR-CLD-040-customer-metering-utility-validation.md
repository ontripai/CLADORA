# ADR-CLD-040 — Customer Metering, Consumption & Utility Validation

Status: Accepted · Task: CLADORA-ENG-023

## Decision

Production customer metering is read-only and is served only by `utilities.get_customer_utilities`. The RPC owns the AAL2, active membership and context, role, explicit permission, effective entitlement, scope, ownership, party mapping and lease authorization boundary. Missing, expired, cross-tenant or mismatched authorization fails closed.

Meter, reading, consumption, contract, invoice, comparison and anomaly projections never return encrypted serials, contract references, raw OCR payloads, object paths or authentication material. The UI exposes only an evidence-presence flag; binary evidence remains unavailable without a separately authorized signed-object flow.

Consumption is calculated in the database from two validated readings, multiplier and rollover evidence. Tenant, property, building, unit, parent-meter, lifecycle, contract, provider and currency relationships are database-enforced. Validated readings, approved invoices and consumption snapshots remain immutable. `/demo/app` remains independent.
