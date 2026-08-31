# CLADORA-ENG-028 Security Review

## Verdict

PASS for CI and Preview. Production release remains gated on successful ephemeral database CI, migration-record verification and immutable head-SHA checks.

## Controls verified

- API is GET-only and returns `Cache-Control: no-store, private`, `Pragma: no-cache`, and `Vary: Cookie`.
- Authentication is derived from Supabase claims; missing authentication returns 401 and AAL1 returns 403.
- Database authorization requires an active time-bounded membership, active time-bounded context, allowed role, `occupancy.registry.read`, and effective `module.occupancy` entitlement.
- Owner and Tenant access requires a current membership-party mapping and unit context; authorized units are derived in PostgreSQL.
- Tax, email and phone ciphertext, document identifiers, birth dates, auth identifiers and raw mapping identifiers are excluded from the projection.
- President and Censor receive pseudonymous labels; Owner and Tenant receive only self-related records.
- Cross-tenant ownership, lease, resident and party-mapping links fail closed.
- Aggregate ownership above 1, overlapping active leases, invalid empty occupancy overlap and residents outside an active lease are rejected.
- Final ownership, lease, occupancy and mapping snapshots are immutable; lifecycle events are append-only.
- Direct authenticated reads from raw occupancy, party, ownership and party-mapping tables are revoked.
- Production UI and API expose no create, update, transfer, activation, expiry, resident mutation or deletion operation.
- `/demo/app` was not modified.

## Residual notes

- The release does not claim legal or GDPR certification. It implements privacy and authorization controls designed to support those requirements.
- Local containerized database execution was unavailable in the agent environment. The GitHub Database Tests workflow is the mandatory clean-database execution gate before any remote migration or merge.
