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
check(example.includes('YOUR_PUBLISHABLE_KEY'), 'example contains placeholders only');
check(!example.includes('SERVICE_ROLE'), 'example does not request service-role credentials');
check(nextConfig.includes('https://*.supabase.co'), 'CSP permits Supabase HTTPS');
check(nextConfig.includes('wss://*.supabase.co'), 'CSP permits Supabase Realtime');
check(packageJson.dependencies['@supabase/ssr'] && packageJson.dependencies['@supabase/supabase-js'], 'Supabase dependencies are pinned');

console.log(`Supabase application foundation: ${assertions}/${assertions} assertions passed.`);
