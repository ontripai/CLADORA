# ADR-CLD-030: Operational subscription plans and entitlement catalogue

## Decision

Subscription plans are immutable, versioned commercial definitions. New versions start as `draft`; only an AAL2 `PLATFORM_SUPER_ADMIN` may create, activate, or retire them through audited database functions. Published fields cannot be edited in place. Activation rejects an overlapping active version of the same plan code.

Plan reads require AAL2. Super Admin sees the complete catalogue. Operations, Finance, and Auditor see only plans connected through a contract to a workspace for which they hold a current assignment: `workspace` for Operations, `commercial` or `workspace` for Finance, and `audit` or `workspace` for Auditor. Dependency counts use the same actor-scoped rules and do not expose customer identities.

The web API repeats role and AAL2 checks, requires same-origin mutation requests, returns `Cache-Control: no-store, private` with `Vary: Cookie`, and relies on RLS as the database enforcement boundary.

## Consequences

- A published version is corrected by creating a new draft version, never by rewriting history.
- An active version must be retired before an overlapping replacement can be activated.
- Operations can understand the plan attached to assigned workspaces without receiving commercial contract details.
- Production acceptance performs read-only smoke tests; it never exercises lifecycle mutations against real plans.
