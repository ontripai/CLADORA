# ADR-CLD-041 — Customer Assets, Maintenance & Work Orders

Status: Accepted · Task: CLADORA-ENG-024

## Decision

Production customer asset and maintenance access is read-only and is served only by `maintenance.get_customer_maintenance`. The RPC owns the AAL2, active membership and context, approved role, explicit permission, effective entitlement, exact tenant/property/building/unit scope, ownership, party mapping and active-lease boundary. Missing, future, expired, cross-tenant or mismatched authorization fails closed.

Assets, components, plans, work orders, checklist tasks, vendors, SLA measurements, costs and lifecycle events are projected without encrypted serials, vendor contract references, personal contact fields, attachment paths, snapshots or authentication material. Evidence binaries require a separate signed-object flow and are not exposed by this slice.

Direct authenticated `SELECT` on the raw `assets` and `maintenance` schemas is revoked, preventing Data API callers from bypassing the safe projection. RLS remains enabled as defense in depth.

Asset hierarchy, plan, work-order, vendor-contract, invoice, journal and currency relationships are database-enforced. Duplicate active work orders are rejected. Retired assets, final work orders and cost snapshots are immutable; asset history is append-only. SLA breach, overdue state, recorded cost and next-service indicators are calculated in the database. Production acceptance is read-only and `/demo/app` remains independent.
