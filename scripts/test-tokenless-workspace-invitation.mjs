import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const dispatcher = read('src/app/api/platform/v1/workspaces/[id]/invitations/route.ts');
const callbackPolicy = read('src/lib/auth/email-callback.mjs');
const continuationPage = read('src/app/[lang]/invitation-continuation/page.tsx');
const continuation = read('src/components/auth/WorkspaceInvitationContinuation.tsx');
const claimApi = read('src/app/api/auth/workspace-invitations/claim/route.ts');
const setPasswordPage = read('src/app/[lang]/set-password/page.tsx');
const migration = read('supabase/migrations/20260901075649_tokenless_workspace_invitation_contract.sql');

assert.doesNotMatch(dispatcher, /accept-invitation\?token|encodeURIComponent\(row\.invitation_token\)/);
assert.match(dispatcher, /\$\{origin\}\/\$\{parsed\.lang\}\/auth\/callback/);
assert.match(callbackPolicy, /invite: \(lang\) => `\/\$\{lang\}\/invitation-continuation`/);
assert.match(callbackPolicy, /parsed\.search/);
assert.match(callbackPolicy, /parsed\.hash/);

assert.match(continuationPage, /list_my_claimable_workspace_invitations/);
assert.match(continuationPage, /supabase\.auth\.getClaims\(\)/);
assert.match(continuationPage, /dynamic = 'force-dynamic'/);
assert.match(continuationPage, /dir=\{lang === 'fa' \? 'rtl' : 'ltr'\}/);
assert.doesNotMatch(continuationPage, /user_metadata|service_role|invitation_token|token_hash/);

assert.match(continuation, /invitation_id: selectedId/);
assert.match(continuation, /credentials: 'same-origin'/);
assert.match(continuation, /cache: 'no-store'/);
assert.match(continuation, /router\.replace\(`\/\$\{lang\}\/set-password`\)/);
assert.doesNotMatch(continuation, /workspace_id|role_id|permission|localStorage|sessionStorage|document\.cookie/);

assert.match(claimApi, /request\.headers\.get\('origin'\) !== request\.nextUrl\.origin/);
assert.match(claimApi, /supabase\.auth\.getClaims\(\)/);
assert.match(claimApi, /claim_workspace_invitation/);
assert.match(claimApi, /'Cache-Control': 'no-store, private'/);
assert.doesNotMatch(claimApi, /createAdminClient|service_role|console\./);
assert.match(setPasswordPage, /supabase\.auth\.getClaims\(\)/);
assert.match(setPasswordPage, /ResetPasswordForm lang=\{lang\} flow="invitation"/);

assert.match(migration, /create or replace function platform\.list_my_claimable_workspace_invitations\(\)/);
assert.match(migration, /create or replace function platform\.claim_workspace_invitation\(/);
assert.match(migration, /set search_path = ''/g);
assert.match(migration, /where i\.id = p_invitation_id[\s\S]*for update/);
assert.match(migration, /on conflict \(tenant_id, user_id, role_id\)/);
assert.match(migration, /context_grants_open_tenant_unique/);
assert.match(migration, /revoke all on function platform\.claim_workspace_invitation[\s\S]*public, anon, service_role/);
assert.doesNotMatch(migration, /user_metadata|raw_user_meta_data/);

console.log('Tokenless Workspace invitation contract: containment, authorization, and rollout checks passed.');
