# ADR-CLD-045: Customer occupancy, ownership and lease registry

## Decision

Production registry discovery uses one read-only database projection. It derives the caller from `auth.uid()`, requires AAL2, an active membership and context grant, `occupancy.registry.read`, and an effective `module.occupancy` entitlement. Scope, ownership, party mapping and active lease eligibility are evaluated in PostgreSQL and fail closed.

Administrative roles receive authorized business labels; President and Censor receive privacy-safe pseudonyms; Owner and Tenant receive only their own party, ownership, lease and occupancy records. Encrypted tax, email and phone values, authentication identifiers, document numbers and birth dates are never projected.

Ownership shares, active lease overlap, tenant boundaries, occupancy periods and finalized snapshots are protected by database triggers. Lifecycle history is append-only, and direct authenticated reads from raw party, ownership, mapping and occupancy tables are revoked.

## Release boundary

Production acceptance is read-only. No create, edit, ownership transfer, lease transition, resident mutation, party remapping or short-term occupancy operation is exposed. `/demo/app` remains independent.
