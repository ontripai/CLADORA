# ADR-CLD-042: Customer governance and meetings projection

## Status

Accepted for CLADORA-ENG-025.

## Decision

Production governance pages use a single read-only, security-definer database projection. The projection resolves the authenticated AAL2 user, active membership and context grant, role permission, effective `module.governance` entitlement, and exact property/building/unit scope before returning data. Owner access additionally requires current ownership; tenant access requires a current party mapping and active lease.

Raw authenticated reads from the governance schema are revoked. Secret-ballot responses expose only per-option and total weights and never voter, ballot receipt, eligibility, or party identifiers. Tenants cannot read invitations, attendance, or proxies and receive only explicitly tenant-visible meetings, finalized votes, resolutions, minutes, and public document metadata. Storage object paths are not returned.

Quorum and vote totals are calculated in PostgreSQL from immutable eligibility snapshots and insert-only ballots. Integrity triggers reject ineligible, mistimed, duplicate, or mismatched ballots; overlapping or invalid proxies; and changes to adopted resolutions, approved minutes, or lifecycle history. Results retain rule version, basis, evidence availability, and calculation time so they remain explainable.

The UI and API are GET-only and prohibit shared caching. `/demo/app` remains an isolated demonstration surface.

## Compliance boundary

The model is designed to support evidence and controls relevant to Legea 196/2018 and GDPR. It does not claim or guarantee legal compliance. Production acceptance is read-only and must not create or alter meetings, votes, proxies, resolutions, minutes, documents, or customer data.

## Failure mode

Missing AAL2, membership, context, permission, entitlement, party mapping, ownership, lease, or matching scope fails closed. Unredacted ballot identity or document paths are never part of the projection contract.
