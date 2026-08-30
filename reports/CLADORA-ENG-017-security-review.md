# CLADORA-ENG-017 Security & Acceptance Review

Date: 2026-08-29  
Decision: PASS for CI/Preview; Remote release remains gated by the authorized migration-only preflight.

- Authentication: both API and database projection require AAL2 and an approved platform role.
- Authorization: workspace visibility is computed server-side from current role, Customer Assignment, Scope, `valid_from`, `valid_until`, and assignment status. No caller-controlled scope is accepted.
- Separation: Operations receives operational data only; Finance receives commercial data only; assignment-scoped Auditor receives both permitted domains; Super Admin receives the global view.
- Data minimization: queues are bounded to 12, events to 10. Audit snapshots and support evidence are excluded. Event reason text uses the established redactor.
- Cache: page is dynamic with zero revalidation; browser fetch and API response use `no-store`, private cache controls, same-origin credentials, and cookie variance.
- Mutation boundary: Overview defines GET only and contains no mutation control. The migration creates only a read projection function and grants.
- Acceptance coverage: anonymous privilege, AAL1, Super Admin, Operations, Finance, assigned Auditor, expired Auditor, cross-customer filtering, commercial/operational separation, and bounded output.
- Production boundary: smoke testing must remain read-only and must not create or modify operational, customer, Auth, assignment, or environment data.
