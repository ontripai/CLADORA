# ADR-CLD-034 — Operational Control Plane Overview

Status: Accepted — 2026-08-29

The Overview is a read-only projection exposed by one parameterless `SECURITY DEFINER` RPC. The database derives visibility from the authenticated actor; caller-supplied workspace scopes are never accepted. AAL2 and an approved platform role are mandatory.

Commercial and operational domains are separated. Operations receives only assigned workspace operational metrics; Finance receives only assigned `commercial` or umbrella `workspace` metrics; Auditor receives both domains only for current `audit` or `workspace` assignments; Super Admin receives the global projection. Missing, future, expired, revoked, wrong-scope, and cross-customer assignments fail closed.

The response is bounded to 12 attention items and 10 recent events. Recent events contain only operational metadata and a redacted reason, never snapshots, credentials, Auth data, evidence, tokens, secrets, sessions, passwords, or CAPTCHA values. API and browser requests use `no-store`; Overview exposes no mutation endpoint or control.

Production acceptance is read-only. It must not create or alter customer or operational data, Auth, environment variables, or platform assignments.
