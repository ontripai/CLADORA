# ADR-CLD-044: Customer document vault and secure evidence projection

## Decision

Production document discovery uses one read-only, security-definer projection. It derives the caller from `auth.uid()`, requires AAL2, an active membership and context grant, `documents.vault.read`, and an effective `module.documents` entitlement. Property, building, unit, ownership, party, lease, role, classification and explicit document grants are evaluated in the database and fail closed.

The projection returns business metadata, immutable version hashes, retention and legal-hold status, evidence availability and typed links. It never returns storage object paths, bucket details, raw metadata, uploader identities, signed URLs or download capabilities. Direct authenticated reads from the document schema are revoked.

Published versions and finalized retention snapshots are immutable. Legal holds prevent document mutation or deletion, lifecycle history is append-only, classification downgrade is rejected, and typed links validate the target tenant before insertion.

## Release boundary

Production acceptance is read-only: the UI and API provide no create, edit, upload, replace, publish, archive, delete, restore, share, download, legal-hold or retention mutation. `/demo/app` remains independent. Storage configuration and bucket policies are outside this release.
