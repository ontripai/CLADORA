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
const operationalWorkspacesApi = read('src/app/api/platform/v1/workspaces/route.ts');
const operationalContractsPage = read('src/app/[lang]/platform/(control-plane)/contracts/page.tsx');
const operationalContractsPanel = read('src/components/platform/OperationalContractsPanel.tsx');
const operationalContractsApi = read('src/app/api/platform/v1/contracts/route.ts');
const contractsAcceptanceDecision = read('docs/architecture/CLADORA-ENG-011B-acceptance-decisions.md');
const auditorScopeAdr = read('docs/architecture/ADR-CLD-028-assignment-scoped-auditor.md');
const auditorScopeMigration = read('supabase/migrations/20260829003500_auditor_assignment_scoped_reads.sql');
const operationalUsersPage = read('src/app/[lang]/platform/(control-plane)/users/page.tsx');
const operationalUsersPanel = read('src/components/platform/OperationalPlatformUsersPanel.tsx');
const operationalUsersApi = read('src/app/api/platform/v1/users/route.ts');
const operationalAssignmentsPage = read('src/app/[lang]/platform/(control-plane)/assignments/page.tsx');
const operationalAssignmentsPanel = read('src/components/platform/OperationalAssignmentsPanel.tsx');
const operationalAssignmentsApi = read('src/app/api/platform/v1/assignments/route.ts');
const operationalRevokeApi = read('src/app/api/platform/v1/assignments/[id]/revoke/route.ts');
const operationalAssignmentsMigration = read('supabase/migrations/20260829003600_operational_users_assignments.sql');
const operationalAssignmentsAdr = read('docs/architecture/ADR-CLD-029-operational-users-assignments.md');
const operationalPlansPage = read('src/app/[lang]/platform/(control-plane)/plans/page.tsx');
const operationalPlansPanel = read('src/components/platform/OperationalPlansPanel.tsx');
const operationalPlansApi = read('src/app/api/platform/v1/plans/route.ts');
const operationalPlanActivateApi = read('src/app/api/platform/v1/plans/[id]/activate/route.ts');
const operationalPlanRetireApi = read('src/app/api/platform/v1/plans/[id]/retire/route.ts');
const operationalPlansMigration = read('supabase/migrations/20260829003700_operational_subscription_plans.sql');
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
  'src/app/api/platform/v1/contracts/route.ts',
  'src/app/api/platform/v1/plans/route.ts',
  'src/app/api/platform/v1/plans/[id]/activate/route.ts',
  'src/app/api/platform/v1/plans/[id]/retire/route.ts',
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
check(operationalWorkspacesApi.includes("['workspace', 'audit'].includes(assignment.scope_type)"), 'Auditor workspace reads require workspace or audit scope');
check(operationalWorkspacesApi.includes("authCtx.roles.every((role) => role === 'PLATFORM_AUDITOR')"), 'Auditor-only workspace filtering preserves additive access from separately authorized roles');
check(!operationalWorkspacesApi.includes("['PLATFORM_SUPER_ADMIN', 'PLATFORM_AUDITOR']"), 'Auditor has no global workspace API bypass');
check(!operationalContractsPage.includes('mockContracts'), 'operational contracts page contains no demo contract fixtures');
check(operationalContractsPage.includes('OperationalContractsPanel'), 'operational contracts page renders the live contracts panel');
check(operationalContractsPanel.includes('/api/platform/v1/contracts?limit='), 'contracts panel reads through the protected platform API');
check(operationalContractsPanel.includes('cache: "no-store"'), 'contract requests never use shared browser caching');
check(operationalContractsPanel.includes('credentials: "same-origin"'), 'contract requests carry only same-origin session credentials');
check(operationalContractsPanel.includes('AbortController'), 'contract requests are cancelled during navigation');
check(operationalContractsPanel.includes('role="alert"'), 'contract load failures are announced accessibly');
check(operationalContractsApi.includes('UNAUTHORIZED_PLATFORM_ACCESS') && operationalContractsApi.includes('status: 401'), 'contracts API rejects unauthenticated callers');
check(operationalContractsApi.includes('MFA_REQUIRED') && operationalContractsApi.includes('status: 403'), 'contracts API rejects AAL1 sessions');
check(operationalContractsApi.includes('["PLATFORM_SUPER_ADMIN", "PLATFORM_FINANCE", "PLATFORM_AUDITOR"]'), 'contracts API allows only the approved read roles');
check(!operationalContractsApi.includes('["PLATFORM_SUPER_ADMIN", "PLATFORM_OPERATIONS", "PLATFORM_FINANCE", "PLATFORM_AUDITOR"]'), 'Operations is explicitly excluded from contract reads');
check(operationalContractsApi.includes('allowedScopes.add("commercial")'), 'assigned Finance reads require workspace or commercial scope');
check(operationalContractsApi.includes('workspaceIds.length ? workspaceIds : [EMPTY_UUID]'), 'unassigned Finance access fails closed');
check(operationalContractsApi.includes('allowedScopes.add("audit")'), 'assigned Auditor reads require workspace or audit scope');
check(!operationalContractsApi.includes('["PLATFORM_SUPER_ADMIN", "PLATFORM_AUDITOR"]'), 'Auditor has no global application read bypass');
check(operationalContractsApi.includes('.lte("valid_from", now)') && operationalContractsApi.includes('valid_until.is.null,valid_until.gt.'), 'only currently valid entitlements are returned');
check(!operationalContractsApi.includes('.limit(200)'), 'entitlement retrieval is not silently capped at 200 rows');
check(operationalContractsPanel.includes('function hasActiveOverride') && operationalContractsPanel.includes('expiresAt > now'), 'expired entitlement overrides are ignored');
check(contractsAcceptanceDecision.includes('Status: RESOLVED — ASSIGNMENT-SCOPED AUDITOR'), 'Auditor assignment decision is recorded as resolved');
check(auditorScopeAdr.includes('missing, revoked, future, expired, wrong-scope, or cross-customer assignment fails closed'), 'architecture records fail-closed Auditor assignment semantics');
check(auditorScopeMigration.includes("has_customer_assignment(customer_workspace_id, 'audit')"), 'RLS requires audit or umbrella workspace assignment for Auditor data reads');
check(!auditorScopeMigration.includes("or app_private.has_platform_role('PLATFORM_AUDITOR')\n  or"), 'RLS migration contains no standalone global Auditor bypass');
check(!operationalUsersPage.includes('mockUsers') && operationalUsersPage.includes('OperationalPlatformUsersPanel'), 'platform users page uses the live operational panel');
check(operationalUsersPanel.includes('/api/platform/v1/users?') && operationalUsersPanel.includes("cache: 'no-store'"), 'users panel reads the protected non-cached API');
check(operationalUsersApi.includes('UNAUTHORIZED_PLATFORM_ACCESS') && operationalUsersApi.includes('MFA_REQUIRED'), 'users API explicitly rejects unauthorized and AAL1 callers');
check(!operationalUsersApi.includes('auth_user_id'), 'users API never returns Auth user identifiers');
check(!operationalAssignmentsPage.includes('mockAssignments') && operationalAssignmentsPage.includes('OperationalAssignmentsPanel'), 'assignment page uses the live operational panel');
check(operationalAssignmentsPanel.includes('/api/platform/v1/assignments') && operationalAssignmentsPanel.includes("cache:'no-store'"), 'assignment panel uses the protected non-cached API');
check(operationalAssignmentsApi.includes("hasPlatformRole(authCtx, 'PLATFORM_SUPER_ADMIN')"), 'only Super Admin may create assignments');
check(operationalRevokeApi.includes("hasPlatformRole(authCtx, 'PLATFORM_SUPER_ADMIN')"), 'only Super Admin may revoke assignments');
check(operationalAssignmentsApi.includes('hasTrustedMutationOrigin') && operationalRevokeApi.includes('hasTrustedMutationOrigin'), 'assignment mutations enforce trusted origin');
check(operationalAssignmentsMigration.includes('duplicate_assignment: overlapping active assignment exists'), 'database rejects overlapping active assignments');
check(operationalAssignmentsMigration.includes("has_platform_role('PLATFORM_AUDITOR')") && operationalAssignmentsMigration.includes("scope_type in ('workspace', 'audit')"), 'Auditor visibility remains assignment scoped');
check(operationalAssignmentsAdr.includes('Production acceptance must not create, edit, or revoke'), 'production non-mutation acceptance boundary is documented');
check(!operationalPlansPage.includes('mockPlans') && operationalPlansPage.includes('OperationalPlansPanel'), 'plans page uses the live operational panel');
check(operationalPlansPanel.includes('/api/platform/v1/plans?') && operationalPlansPanel.includes("cache:'no-store'"), 'plans panel uses the protected non-cached API');
check(operationalPlansApi.includes('UNAUTHORIZED_PLATFORM_ACCESS') && operationalPlansApi.includes('MFA_REQUIRED'), 'plans API rejects unauthorized and AAL1 callers');
check(operationalPlansApi.includes("'PLATFORM_OPERATIONS', 'PLATFORM_FINANCE', 'PLATFORM_AUDITOR'"), 'approved plan read roles are explicit');
check(operationalPlansApi.includes("hasPlatformRole(access.auth, 'PLATFORM_SUPER_ADMIN')"), 'only Super Admin receives plan management capability');
check([operationalPlansApi, operationalPlanActivateApi, operationalPlanRetireApi].every((route) => route.includes('hasTrustedMutationOrigin')), 'all plan mutations require trusted same-origin requests');
check([operationalPlansApi, operationalPlanActivateApi, operationalPlanRetireApi].every((route) => route.includes('no-store, private')), 'all plan API responses prohibit shared caching');
check(operationalPlansMigration.includes('published_plan_immutable') && operationalPlansMigration.includes('retired_plan_immutable'), 'published and retired versions are immutable');
check(operationalPlansMigration.includes('active_plan_version_overlap') && operationalPlansMigration.includes('subscription_plans_one_active_code_idx'), 'active version overlap is prevented transactionally and by index');
check(operationalPlansMigration.includes("has_customer_assignment(c.customer_workspace_id, 'audit')"), 'Auditor plan reads require audit or workspace assignment');
check(contractsAcceptanceDecision.includes('No environment variable was changed'), 'Preview limitation is recorded without changing environment configuration');
check(example.includes('YOUR_PUBLISHABLE_KEY'), 'example contains placeholders only');
check(!example.includes('SERVICE_ROLE'), 'example does not request service-role credentials');
check(nextConfig.includes('https://*.supabase.co'), 'CSP permits Supabase HTTPS');
check(nextConfig.includes('wss://*.supabase.co'), 'CSP permits Supabase Realtime');
check(packageJson.dependencies['@supabase/ssr'] && packageJson.dependencies['@supabase/supabase-js'], 'Supabase dependencies are pinned');

console.log(`Supabase application foundation: ${assertions}/${assertions} assertions passed.`);
