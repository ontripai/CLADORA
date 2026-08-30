# ADR-CLD-035 — Authenticated customer context dashboard

## Decision

The protected customer application never trusts a tenant or context identifier supplied by the browser. Two bounded security-definer RPC projections revalidate the authenticated actor, AAL2, active membership, tenant equality, context scope and both membership/context time windows on every request. Function execution is revoked from PUBLIC and anonymous callers.

The active context identifier is kept only in versioned session storage; it is an untrusted selector, not an authorization credential. The database rejects a forged, expired or cross-tenant selector. Responses use private no-store headers.

The authenticated shell and dashboard have no dependency on DemoStore, demo personas or fixed KPIs. /demo/app retains the original demo dashboard and shell. Until operational customer modules receive their own live vertical slices, authenticated navigation exposes only the live dashboard.

No Auth metadata or JWT custom tenant claims are changed. No production tenant, membership, context, role or customer data is required or created by this slice.

## Consequences

- Context switching supports multiple active tenant memberships without stale JWT authorization.
- Counts are computed within the validated tenant and property/building/unit scope.
- Role permissions and effective workspace entitlement keys are returned as bounded metadata for subsequent module slices.
- AAL1, expired grants and cross-tenant IDs fail closed.
