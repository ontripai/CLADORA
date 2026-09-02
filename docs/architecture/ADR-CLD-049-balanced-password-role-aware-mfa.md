# ADR-CLD-049 — Balanced Password and Role-Aware MFA

Status: Proposed for controlled rollout
Task: `CLADORA-P1-CLOSE-006I`

## Decision

CLADORA uses one application password policy: at least eight characters containing at least one Latin letter and one number.

Customer MFA is role-aware:

- `owner` and `tenant_resident`: enrollment is optional. A user who elects to enroll a verified TOTP factor must satisfy AAL2 on subsequent sessions.
- `association_admin`, `property_manager`, `president`, and `censor`: verified TOTP and AAL2 remain mandatory.
- Any user with at least one active sensitive customer membership is treated as MFA-required across the customer data plane. Mixed roles therefore fail closed.
- Every Platform role, onboarding completion, provisioning, support access, and other privileged or write operation keeps its existing AAL2 requirement.

## Enforcement boundaries

The browser does not decide whether a role is sensitive. The server layout calls `platform.my_customer_mfa_requirement()`, which derives the decision from active memberships and server-owned role records. Customer RPCs independently enforce the same `app_private.customer_mfa_required()` predicate. API routes authenticate the session and delegate final role-aware AAL authorization to those RPCs.

## Rollout

The migration is expand-compatible. Applying application code before the migration fails closed because the new resolver is unavailable. Applying the migration before application code preserves the previous UI-level MFA gate. Supabase Remote apply, Auth password settings, Merge, and Production deployment require separate approval.
