# ADR-CLD-043: Customer communications and notifications projection

## Decision

Production communications use one read-only, security-definer database projection. The projection derives the caller from `auth.uid()`, requires AAL2, an active membership and context grant, the `communications.feed.read` permission, and an effective `module.communications` entitlement. Customer, property, building and unit scope are resolved in the database; private and direct channels additionally require active channel membership.

Owners require a current ownership and residents require an active party mapping and lease for their selected unit. The API accepts no caller-supplied tenant or membership identity and fails closed when any authorization input is missing or expired.

Poll responses remain behind the projection. Results expose option totals, response count, eligible audience, calculation time and rule version without respondent identifiers. Notifications are limited to the current membership and omit payloads, recipient identifiers and action URLs. Attachments and storage paths are not projected; related documents are represented only by an availability flag.

Database triggers reject duplicate or out-of-window poll responses, invalid options, missing private-channel membership, comments on closed posts, mutation of finalized polls, and mutation of append-only links. Raw authenticated table reads are revoked so RLS cannot be bypassed by an overly broad client query.

## Release boundary

Production acceptance is read-only: UI and API provide no publish, comment, reaction, poll response, mark-as-read, archive, subscription, upload or delete mutation. `/demo/app` remains independent. This design supports privacy and Romanian association-law workflows but does not claim or guarantee legal compliance.
