# ADR-CLD-031: Operational workspace provisioning

## Decision

Provisioning is a controlled, idempotent run attached to one workspace. A run may be queued only while the workspace is in `PROVISIONING` and has a current active contract, an active effective plan, and at least one current contract entitlement. A partial unique index prevents concurrent queued or running runs for one workspace.

Runs follow `queued → running → completed | failed | cancelled`; failed runs may return to queued only through a retry of a failed task. Tasks follow `queued → running → completed | failed`, may be skipped when a run is cancelled, and failed tasks may return to queued. Trigger guards enforce these transitions while direct authenticated writes remain revoked.

All interactive access requires AAL2. Super Admin can read and control all runs. Operations can read and control only workspaces with a current `workspace` assignment. Auditor has read-only access only with a current `audit` or `workspace` assignment. Finance and all other platform roles have no provisioning access. RLS is the database enforcement boundary; API checks and same-origin mutation checks provide defense in depth.

## Operational boundary

Production release acceptance is read-only. It must not create, retry, cancel, or advance a real provisioning run. The lifecycle is exercised only in the isolated pgTAP database. Every permitted create, retry, and cancel operation writes an audit event.
