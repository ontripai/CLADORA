# ADR-CLD-024: Secure Workspace Invitation Foundation

- **Status**: Approved for implementation
- **Task**: CLADORA-ENG-010A
- **Depends on**: ADR-CLD-023 / CLADORA-ENG-009
- **Scope**: Invitation data model, token lifecycle, RLS, audit, and behavioral tests

## Decision

CLADORA customer onboarding is invite-only. Public self-registration cannot create or activate a customer workspace. A primary administrator invitation may be issued only after commercial approval, contract processing, entitlement assignment, and transition of the target workspace to `PROVISIONING`.

## Security invariants

1. Invitation tokens contain 256 bits of cryptographically secure randomness.
2. The raw token is returned only once by the creation RPC and is never stored.
3. Only the SHA-256 digest is persisted.
4. Invitation lifetime is bounded to 15 minutes through 72 hours; the default is 72 hours.
5. An active invitation is unique by workspace, normalized email, role, and scope.
6. Invitations are bound to a role belonging to the workspace tenant or to a global system role.
7. Only `PLATFORM_SUPER_ADMIN` or an assigned `PLATFORM_OPERATIONS` user can create or revoke invitations.
8. Direct table mutation is denied to `anon` and `authenticated`.
9. Anonymous token validation returns minimal non-personal information and reveals nothing for invalid, expired, or revoked tokens.
10. Creation and revocation are recorded in the immutable audit stream.
11. Acceptance and Auth-user creation are explicitly deferred to CLADORA-ENG-010B.
12. Tokens, passwords, and full invitation links must never be written to audit logs.

## Lifecycle

`draft → sent → accepted`

Alternative terminal paths:

- `draft | sent → revoked`
- `draft | sent → expired`

`accepted`, `revoked`, and `expired` are terminal for the original token. Resending must create a new token and invalidate the old token in a later task.

## Database contract

Migration `20260825002700_secure_workspace_invitations.sql` adds:

- `platform.workspace_invitation_status`
- `platform.workspace_invitations`
- `platform.create_workspace_invitation(...)`
- `platform.validate_workspace_invitation(text)`
- `platform.revoke_workspace_invitation(uuid, text)`

All privileged RPCs are `SECURITY DEFINER`, have fixed `search_path`, perform actor authorization internally, and revoke default `PUBLIC EXECUTE`.

## Deferred to ENG-010B and later

- Supabase Auth admin invitation dispatch
- Email templates and SMTP provider
- Invitation acceptance and password setup
- Atomic profile, membership, and context-grant creation
- Primary administrator onboarding completion
- Resend workflow and rate limiting
- Workspace-member invitation UI
