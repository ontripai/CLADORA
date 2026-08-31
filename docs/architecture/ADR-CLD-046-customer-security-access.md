# ADR-CLD-046 — Customer security access registry

## Decision

CLADORA exposes physical-access metadata through one AAL2-only, context-bound, permission- and entitlement-gated security-definer RPC. Raw tables remain unavailable to browser roles. Production acceptance is read-only: the API has only `GET`, never issues credentials or visitor passes, never records events, and cannot unlock a door, open a gate, call an intercom, or communicate with access-control hardware.

Credential identifiers are represented by a deliberately masked display value and a one-way hash. Raw UID, PIN, QR/barcode/unlock tokens, identity documents, biometrics, camera images and controller secrets are absent from the public projection. Visitor labels and vehicle identifiers are masked. Errors are generic and responses are `no-store, private`.

The database computes effective credential/visitor status, time eligibility, mapping eligibility and access decisions. Integrity triggers fail closed on invalid or cross-tenant links, out-of-scope points, expired mappings, invalid ownership/lease context, overlapping credential assignments and access outside invitation periods. Finalized snapshots are immutable; access logs and lifecycle histories are append-only.

## Scope boundary

No hardware SDK, webhook, Realtime channel, Edge Function, biometric processing, camera pipeline, Storage object, controller command or mutable customer API is introduced. The demo tree is untouched. Migration `20260829005300` contains DDL, role permission metadata and grants only; it creates no customer, credential, visitor, access-event or other production business data.
