# ADR-CLD-023: Platform Control Plane Foundation, Roles, Assignments, Contracts, Entitlements & Provisioning

- **Status**: Approved & Implemented (CLADORA-ENG-009)
- **Authority**: CLADORA Platform Control Plane Architecture Change Package v3.0
- **Scope**: Internal Platform Control Plane, Commercial Lifecycle, Internal Roles, Scoped Customer Assignments, Subscription Plans, Contracts, Entitlements, Idempotent Provisioning, Support Access, and Audit Integrity.

---

## 1. Executive Summary & Context

CLADORA unifies double-entry accounting truth, 5D owner-tenant rights, and residential building management across homeowner associations, property management enterprises, and owner portfolios.

To maintain strict compliance with European and Romanian data protection principles (GDPR) and audit-grade architectural integrity, **ADR-CLD-023** establishes the structural, database, and application separation between the **Platform Control Plane** (internal CLADORA operations, commercial contracts, provisioning, and billing) and the **Customer Data Plane** (operational associations, financial general ledgers, meter readings, and resident data).

---

## 2. Core Architectural Invariants

1. **Logical Separation**: Platform Control Plane and Customer Data Plane remain logically isolated.
2. **Tenant Model Compatibility**: Existing `platform.tenants` records are preserved and mapped 1-to-1 to `platform.customer_workspaces`.
3. **Default Deny**: Cross-workspace access is denied by default at the database RLS layer.
4. **Authorization Formula**:
   $$\text{Platform Access} = \text{Role} + \text{Customer Assignment} + \text{Scope} + \text{Entitlement} + \text{Time Constraint} + \text{Workspace Lifecycle State}$$
5. **No Universal Customer Role**: `PLATFORM_SUPER_ADMIN` has no routine unrestricted access to Customer Data Plane private records. Break-glass and support access require short-lived, dual-control, ticket-referenced grants.
6. **Append-Only Audit**: All sensitive lifecycle transitions, role grants/revocations, and customer assignments are recorded immutably in `audit.events`. Ordinary application users cannot update or delete audit records.
7. **Zero Client Trust**: Authorization is strictly enforced server-side and via database RLS. No authorization authority is derived from `auth.users.raw_user_meta_data`.

---

## 3. Platform Role Matrix

| Role | Permitted Scope | Customer Data Access | Restricted Operations |
|---|---|---|---|
| `PLATFORM_SUPER_ADMIN` | Internal user & role assignments, global platform configuration, emergency break-glass | No ordinary access (short-lived audited dual-control only) | Cannot read private financial/building data without explicit audited grant |
| `PLATFORM_OPERATIONS` | Assigned customer workspaces, capacity configuration, provisioning runs/tasks, primary admin invite staging | Assigned workspaces only | Cannot modify contracts, commercial billing, or sensitive platform roles |
| `PLATFORM_FINANCE` | Assigned commercial workspace records, contracts, subscription tiers, plan entitlements | Commercial metadata only | No access to operational/building records; cannot grant self data plane access |
| `PLATFORM_SUPPORT` | Assigned support cases/customers, technical diagnostics | Non-sensitive technical status (sensitive data requires temporary dual-control grant) | Cannot modify contracts, financial plans, or platform user roles |
| `PLATFORM_AUDITOR` | Authorized control plane audit records, role histories, transition logs | Read-only | Strictly read-only; all INSERT, UPDATE, DELETE, and mutation RPCs are denied |

---

## 4. Database Entities & Migration Map

### Migrations Implemented:
- `20260825002200_platform_control_plane_users_roles.sql`:
  - `platform.platform_users`
  - `platform.platform_role_assignments`
  - Helper functions: `app_private.current_platform_user_id()`, `app_private.has_platform_role()`, `app_private.is_platform_user()`
- `20260825002300_customer_workspaces_assignments_lifecycle.sql`:
  - `platform.customer_workspaces` (references `platform.tenants(id)`)
  - `platform.platform_customer_assignments`
  - `platform.transition_workspace_lifecycle(...)` RPC with optimistic concurrency protection (`expected_version`)
  - Helper functions: `app_private.has_customer_assignment()`, `app_private.can_access_platform_workspace()`
- `20260825002400_subscription_plans_contracts_entitlements.sql`:
  - `platform.subscription_plans` (versioned feature & limit schemas)
  - `platform.workspace_contracts`
  - `platform.workspace_entitlements` (typed validation: numeric, boolean, string, array, json)
  - `platform.entitlement_usage_ledger` (idempotent consumption tracking)
  - `platform.enforce_entitlement_quota(...)` transactional quota enforcement RPC
- `20260825002500_provisioning_support_access_audit_control.sql`:
  - `platform.provisioning_runs` (unique idempotency keys)
  - `platform.provisioning_tasks` (ordered, retryable tasks)
  - `platform.support_access_requests` & `platform.support_access_grants` (dual-control approval)
  - `platform.create_provisioning_run(...)` & `platform.approve_support_access(...)` RPCs
  - Audit RLS policy extensions for platform auditor access

---

## 5. Workspace Lifecycle State Machine

```
LEAD ───► UNDER_REVIEW ───► APPROVED ───► CONTRACT_PENDING ───► PAYMENT_PENDING
                                                                     │
                                                                     ▼
                                                               PROVISIONING
                                                                     │
                                                                     ▼
                                                                  ACTIVE ◄───► PAST_DUE
                                                                     │            │
                                                                     ▼            ▼
                                                                 SUSPENDED ───────┘
                                                                     │
                                                                     ▼
                                                                TERMINATED
                                                                     │
                                                                     ▼
                                                                 ARCHIVED (Terminal)
```

### Transition Invariants:
- `ARCHIVED` is terminal and immutable.
- `TERMINATED` can only transition to `ARCHIVED`.
- `ACTIVE` for `PRODUCTION` workspaces requires full primary administrator onboarding (guarded in ENG-009, delivered in ENG-010).

---

## 6. Route Structure & Security

- **Public Marketing Overview**: `/{lang}/platform`
- **Protected Platform Control Plane Subroutes**:
  - `/{lang}/platform/overview`
  - `/{lang}/platform/workspaces`
  - `/{lang}/platform/contracts`
  - `/{lang}/platform/plans`
  - `/{lang}/platform/users`
  - `/{lang}/platform/assignments`
  - `/{lang}/platform/provisioning`
  - `/{lang}/platform/audit`
  - `/{lang}/platform/support`
- **Route Protection**:
  - Edge/Proxy: `src/proxy.ts` and `src/lib/supabase/proxy.ts` intercept unauthenticated requests.
  - Server Layout: `src/app/[lang]/platform/(control-plane)/layout.tsx` validates session claims and resolves `getPlatformAuthContext()`. Unauthorized customers are redirected with `reason=unauthorized_platform`.

---

## 7. Deferred Scope & Open Production Decisions

### Deferred to CLADORA-ENG-010:
- Public customer self-registration
- Complete primary administrator invitation acceptance flow
- Customer onboarding wizard

### Open Production Decisions (Configurable Boundaries):
1. **Support-Access Maximum Duration**: Default set to 4 hours; Production policy to establish final emergency boundaries.
2. **Support Approver Matrix**: Requester cannot self-approve (dual control); Super Admin emergency overrides are fully audited.
3. **Past Due Grace Period**: Commercial policy to define grace duration before suspension.
4. **Billing Provider**: Direct Stripe / SEPA integration deferred to commercial billing milestone.

---

## 8. Deployment Safety Confirmation

- **Supabase Remote**: Unchanged throughout this task.
- **Vercel Production**: Unchanged throughout this task.
- **Customer Data Plane**: Zero migrations modified or renumbered; zero tables dropped or renamed.
