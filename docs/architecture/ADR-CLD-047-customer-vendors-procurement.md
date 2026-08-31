# ADR-CLD-047 — Customer Vendors, Service Contracts & Procurement Registry

Status: Accepted · Task: CLADORA-ENG-030

## Decision

CLADORA exposes customer procurement evidence through the read-only `maintenance.get_customer_procurement` database contract. The contract requires an AAL2 session, an active and time-bounded customer context, an approved commercial oversight role, the explicit `maintenance.procurement.read` permission, an active customer Workspace and the effective `module.maintenance` entitlement.

The approved roles are `association_admin`, `property_manager`, `president` and `censor`. Owner and tenant-resident roles are denied because vendor pricing, quotes and purchase orders contain association-level commercial information. Property, building and unit contexts remain limited to procurement activity associated with the resolved property or an exactly scoped work order.

The projection includes vendors, service-contract periods and commercial terms, quote totals, purchase-order lifecycle and SLA measurements. It excludes encrypted contract references, quote scope snapshots, purchase-order snapshots, approver identity, personal contact fields and raw compliance payloads. Ledger relationships are reduced to a boolean. Direct authenticated access to the underlying maintenance tables remains revoked.

The customer API is `GET` only and all responses, including errors, use `Cache-Control: no-store, private`. The UI provides localized RO/EN/FA loading, empty, error, filtering, pagination and detail states. Persian uses the existing RTL application shell. `/demo/app` is unchanged.

## Delivery boundary

Migration `20260831005400_customer_vendors_contracts_procurement_registry.sql` is versioned in the repository but is not applied to Supabase Remote by this task. Only CI and the automatically generated Vercel Preview are authorized. Merge, Production deployment, Auth, SMTP, CAPTCHA, environment variables, users and customer data remain outside scope.
