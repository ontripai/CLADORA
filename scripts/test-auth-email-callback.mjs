import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  AUTH_EMAIL_TYPES,
  hasDuplicateCallbackParameters,
  hasForbiddenAuthQuery,
  isSupportedAuthEmailType,
  isSupportedLocale,
  mapOtpErrorStatus,
  resolveAuthEmailDestination,
} from '../src/lib/auth/email-callback.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const callback = read('src/app/[lang]/auth/callback/route.ts');
const resultPage = read('src/app/[lang]/auth-result/page.tsx');
const proxy = read('src/proxy.ts');

assert.deepEqual(AUTH_EMAIL_TYPES, [
  'email',
  'invite',
  'magiclink',
  'recovery',
  'signup',
  'email_change',
]);
assert.equal(isSupportedLocale('ro'), true);
assert.equal(isSupportedLocale('en'), true);
assert.equal(isSupportedLocale('fa'), true);
assert.equal(isSupportedLocale('de'), false);
assert.equal(isSupportedAuthEmailType('invite'), true);
assert.equal(isSupportedAuthEmailType('recovery'), true);
assert.equal(isSupportedAuthEmailType('unknown'), false);

assert.equal(resolveAuthEmailDestination('ro', 'invite', null), '/ro/reset-password');
assert.equal(resolveAuthEmailDestination('en', 'recovery', null), '/en/reset-password');
assert.equal(resolveAuthEmailDestination('fa', 'magiclink', null), '/fa/app/dashboard');
assert.equal(resolveAuthEmailDestination('en', 'signup', '/en/app/dashboard'), '/en/app/dashboard');
assert.equal(resolveAuthEmailDestination('fa', 'email_change', '/fa/app/settings'), '/fa/app/settings');

for (const unsafeNext of [
  'https://attacker.example/steal',
  '//attacker.example/steal',
  '/en/reset-password?access_token=secret',
  '/en/reset-password#access_token=secret',
  '/fa/app/dashboard?refresh_token=secret',
  '/ro/app/dashboard/../platform/overview',
]) {
  assert.equal(resolveAuthEmailDestination('en', 'recovery', unsafeNext), null);
}
assert.equal(resolveAuthEmailDestination('de', 'recovery', null), null);
assert.equal(resolveAuthEmailDestination('en', 'invite', '/en/app/dashboard'), null);

for (const key of [
  'access_token',
  'refresh_token',
  'provider_token',
  'provider_refresh_token',
  'session',
  'session_id',
  'token',
  'code',
  'ACCESS_TOKEN',
]) {
  assert.equal(hasForbiddenAuthQuery(new URLSearchParams([[key, 'redacted']])), true);
}
assert.equal(
  hasForbiddenAuthQuery(new URLSearchParams({ token_hash: 'one-time-hash', type: 'recovery' })),
  false,
);
assert.equal(
  hasDuplicateCallbackParameters(new URLSearchParams('token_hash=a&token_hash=b&type=recovery')),
  true,
);
assert.equal(mapOtpErrorStatus('otp_expired'), 'expired');
assert.equal(mapOtpErrorStatus('unexpected_failure'), 'invalid');

assert.match(callback, /auth\.verifyOtp\(\{/);
assert.doesNotMatch(callback, /exchangeCodeForSession/);
assert.doesNotMatch(callback, /window\.location\.hash|location\.hash/);
assert.doesNotMatch(callback, /console\.(log|error|warn|info)/);
assert.match(callback, /'Referrer-Policy': 'no-referrer'/);
assert.match(callback, /'X-Robots-Tag': 'noindex, nofollow, noarchive'/);
assert.doesNotMatch(resultPage, /access_token|refresh_token|token_hash/);
assert.match(resultPage, /'confirmed'/);
assert.match(resultPage, /'expired'/);
assert.match(resultPage, /'reused'/);
assert.match(resultPage, /'missing'/);
assert.doesNotMatch(proxy, /auth\/callback.*matcher/);

console.log('Secure Auth email callback: policy, locale, redirect, and containment tests passed.');
