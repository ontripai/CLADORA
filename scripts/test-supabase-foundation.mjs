import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
let assertions = 0;
const check = (value, message) => {
  assert.ok(value, message);
  assertions += 1;
};

const env = read('src/lib/supabase/env.ts');
const browser = read('src/lib/supabase/client.ts');
const server = read('src/lib/supabase/server.ts');
const session = read('src/lib/supabase/proxy.ts');
const proxy = read('src/proxy.ts');
const protectedLayout = read('src/app/[lang]/app/layout.tsx');
const login = read('src/components/auth/LoginForm.tsx');
const mfaPage = read('src/app/[lang]/mfa/page.tsx');
const mfaChallenge = read('src/components/auth/MfaChallengeForm.tsx');
const accountSecurity = read('src/components/auth/AccountSecurityPanel.tsx');
const platformLayout = read('src/app/[lang]/platform/(control-plane)/layout.tsx');
const demoSelector = read('src/components/demo/DemoRoleSelector.tsx');
const demoRouter = read('src/app/[lang]/demo/app/[...slug]/page.tsx');
const dashboardPage = read('src/app/[lang]/app/dashboard/page.tsx');
const accountingPage = read('src/app/[lang]/app/accounting/page.tsx');
const admin = read('src/lib/supabase/admin.ts');
const serverEnv = read('src/lib/supabase/server-env.ts');
const invitationApi = read('src/app/api/platform/v1/workspaces/[id]/invitations/route.ts');
const callback = read('src/app/[lang]/auth/callback/route.ts');
const acceptanceApi = read('src/app/api/auth/accept-invitation/route.ts');
const acceptancePage = read('src/app/[lang]/accept-invitation/page.tsx');
const onboardingPage = read('src/app/[lang]/app/onboarding/page.tsx');
const operationalWorkspacesPage = read('src/app/[lang]/platform/(control-plane)/workspaces/page.tsx');
const operationalWorkspacesTable = read('src/components/platform/OperationalWorkspacesTable.tsx');
const platformApiRoutes = [
  'src/app/api/platform/v1/workspaces/route.ts',
  'src/app/api/platform/v1/workspaces/[id]/transitions/route.ts',
  'src/app/api/platform/v1/workspaces/[id]/contracts/route.ts',
  'src/app/api/platform/v1/workspaces/[id]/entitlements/[key]/route.ts',
  'src/app/api/platform/v1/workspaces/[id]/provisioning-runs/route.ts',
  'src/app/api/platform/v1/workspaces/[id]/invitations/route.ts',
  'src/app/api/platform/v1/assignments/route.ts',
  'src/app/api/platform/v1/assignments/[id]/revoke/route.ts',
  'src/app/api/platform/v1/audit-events/route.ts',
].map(read);
const example = read('.env.example');
const nextConfig = read('next.config.mjs');
const packageJson = JSON.parse(read('package.json'));

check(env.includes('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'), 'publishable key env is required');
check(!env.includes('SERVICE_ROLE'), 'service-role key is absent from application env');
check(browser.includes('createBrowserClient<Database>'), 'browser client is typed');
check(server.includes('createServerClient<Database>'), 'server client is typed');
check(server.includes('await cookies()'), 'server client awaits request cookies');
check(session.includes('supabase.auth.getClaims()'), 'middleware verifies signed claims');
check(!session.includes('auth.getSession()'), 'middleware never trusts getSession');
check(session.includes("/^\\/(ro|en|fa)\\/app"), 'all localized app routes are protected');
check(proxy.includes('export async function proxy'), 'Next.js 16 proxy entry point is used');
check(proxy.includes("'/:lang(ro|en|fa)/app/:path*'"), 'route matcher protects localized app');
check(protectedLayout.includes("export const dynamic = 'force-dynamic'"), 'protected pages cannot use shared static caching');
check(protectedLayout.includes('supabase.auth.getClaims()'), 'server layout independently verifies signed claims');
check(protectedLayout.includes('redirect(`/${lang}/login'), 'server layout rejects unauthenticated access');
check(login.includes('signInWithPassword'), 'login submits to Supabase Auth');
check(login.includes('role="alert"'), 'login failures are accessible');
check(login.includes('getAuthenticatorAssuranceLevel'), 'login evaluates the session authenticator assurance level');
check(mfaPage.includes('supabase.auth.getClaims()'), 'MFA page requires an authenticated session');
check(mfaChallenge.includes('challengeAndVerify'), 'MFA challenge verifies a TOTP factor');
check(accountSecurity.includes("factorType: 'totp'"), 'account security supports TOTP enrollment');
check(accountSecurity.includes("scope: 'others'"), 'account security can revoke other sessions');
check(accountSecurity.includes('minLength={12}'), 'password change UI enforces a 12-character minimum');
check(accountSecurity.includes('current_password: currentPassword'), 'password changes supply the current password to Supabase Auth');
check(accountSecurity.includes('autoComplete="current-password"'), 'password change UI collects the current password securely');
check(protectedLayout.includes('getAuthenticatorAssuranceLevel'), 'customer data plane enforces enrolled MFA');
check(platformLayout.includes('getAuthenticatorAssuranceLevel'), 'platform control plane enforces enrolled MFA');
check(demoSelector.includes('`/${lang}/demo/app/dashboard`'), 'demo role selection stays in the public demo data plane');
check(!demoSelector.includes('`/${lang}/app/dashboard`'), 'demo role selection never enters the protected customer app');
check(demoRouter.includes('DashboardPage'), 'public demo router renders the interactive dashboard without Auth');
check(demoRouter.includes('<DashboardPage params={pageParams} demoMode />'), 'demo router enables isolated dashboard links');
check(demoRouter.includes('<AccountingPage params={pageParams} demoMode />'), 'demo router enables isolated accounting links');
check(dashboardPage.includes("props.demoMode ? 'demo/app' : 'app'"), 'dashboard links respect the active data plane');
check(accountingPage.includes("props.demoMode ? 'demo/app' : 'app'"), 'accounting links respect the active data plane');
check(admin.includes("import 'server-only'"), 'admin client is server-only');
check(admin.includes('persistSession: false'), 'admin client never persists sessions');
check(serverEnv.includes('SUPABASE_SECRET_KEY'), 'server secret has an isolated environment boundary');
check(serverEnv.includes("startsWith('sb_secret_')"), 'only new server secret key format is accepted');
check(invitationApi.includes('inviteUserByEmail'), 'platform invitation dispatch uses Supabase Auth admin');
check(invitationApi.includes('revoke_workspace_invitation'), 'failed Auth delivery compensates by revoking database invitation');
check(!invitationApi.includes('invitation_token: row.invitation_token'), 'raw invitation token is absent from API responses');
check(callback.includes('httpOnly: true'), 'callback stores invitation token in an HttpOnly cookie');
check(callback.includes("destination.searchParams.delete('token')"), 'callback removes invitation token from the browser URL');
check(acceptanceApi.includes("request.headers.get('origin')"), 'acceptance POST enforces same-origin requests');
check(acceptanceApi.includes('supabase.auth.getClaims()'), 'acceptance endpoint verifies signed claims');
check(acceptanceApi.includes("'get_my_primary_admin_onboarding'"), 'acceptance resolves onboarding state through an actor-scoped RPC');
check(!acceptanceApi.includes("from('customer_workspaces')"), 'customer acceptance never bypasses platform workspace RLS with a direct read');
check(acceptancePage.includes("get('cladora-invitation')"), 'acceptance page reads the server-only invitation cookie');
check(platformApiRoutes.every((route) => route.includes('hasPlatformAal2')), 'every platform API route independently enforces AAL2');
check(onboardingPage.includes("rpc('get_my_primary_admin_onboarding'"), 'onboarding page derives state through the actor-scoped RPC');
check(!onboardingPage.includes('query.version'), 'onboarding page never trusts a caller-supplied workspace version');
check(!operationalWorkspacesPage.includes('mockWorkspaces'), 'operational workspace page contains no demo workspace fixtures');
check(operationalWorkspacesPage.includes('OperationalWorkspacesTable'), 'operational workspace page renders the live workspace table');
check(operationalWorkspacesTable.includes('/api/platform/v1/workspaces?limit='), 'workspace table reads through the protected platform API');
check(operationalWorkspacesTable.includes('cache: "no-store"'), 'workspace requests never use shared browser caching');
check(operationalWorkspacesTable.includes('credentials: "same-origin"'), 'workspace requests carry only same-origin session credentials');
check(operationalWorkspacesTable.includes('AbortController'), 'workspace requests are cancelled during navigation');
check(operationalWorkspacesTable.includes('role="alert"'), 'workspace load failures are announced accessibly');
check(example.includes('YOUR_PUBLISHABLE_KEY'), 'example contains placeholders only');
check(!example.includes('SERVICE_ROLE'), 'example does not request service-role credentials');
check(nextConfig.includes('https://*.supabase.co'), 'CSP permits Supabase HTTPS');
check(nextConfig.includes('wss://*.supabase.co'), 'CSP permits Supabase Realtime');
check(packageJson.dependencies['@supabase/ssr'] && packageJson.dependencies['@supabase/supabase-js'], 'Supabase dependencies are pinned');

console.log(`Supabase application foundation: ${assertions}/${assertions} assertions passed.`);
