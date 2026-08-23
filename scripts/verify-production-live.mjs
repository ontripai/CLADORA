import https from 'https';
import assert from 'assert';

const BASE_URL = 'https://cladora-wzow.vercel.app';

function fetchUrl(path) {
  return new Promise((resolve, reject) => {
    https.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', reject);
  });
}

async function runLiveVerification() {
  console.log('=== RUNNING AUTHORITATIVE LIVE PRODUCTION VERIFICATION ===\n');
  console.log(`Target Domain: ${BASE_URL}\n`);

  // 1. Root redirect check
  const root = await fetchUrl('/');
  console.log(`[1] Root (/) Status: ${root.statusCode}`);
  assert.ok(root.statusCode === 307 || root.statusCode === 308 || root.statusCode === 200, 'Root redirect status valid');

  // 2. Locales root tags, directions, and heroes
  const ro = await fetchUrl('/ro');
  console.log(`[2] /ro Status: ${ro.statusCode}`);
  assert.strictEqual(ro.statusCode, 200);
  assert.ok(ro.body.includes('lang="ro"'), '/ro contains lang="ro"');
  assert.ok(ro.body.includes('dir="ltr"'), '/ro contains dir="ltr"');
  assert.ok(ro.body.includes('Administreaz\u0103 cl\u0103diri'), '/ro contains humanized hero');
  assert.ok(ro.body.includes('Vezi de unde vine fiecare sum\u0103'), '/ro contains financial truth title');
  assert.ok(ro.body.includes('Solicit\u0103 acces \u00een pilot'), '/ro contains primary CTA');
  assert.ok(!ro.body.includes('30-50%'), '/ro has NO 30-50% metric');

  const en = await fetchUrl('/en');
  console.log(`[3] /en Status: ${en.statusCode}`);
  assert.strictEqual(en.statusCode, 200);
  assert.ok(en.body.includes('lang="en"'), '/en contains lang="en"');
  assert.ok(en.body.includes('dir="ltr"'), '/en contains dir="ltr"');
  assert.ok(en.body.includes('Manage buildings and residential properties'), '/en contains humanized hero');
  assert.ok(en.body.includes('See Where Every Charge Comes From'), '/en contains financial truth title');
  assert.ok(en.body.includes('Apply for Pilot Access'), '/en contains primary CTA');
  assert.ok(!en.body.includes('30-50%'), '/en has NO 30-50% metric');

  const fa = await fetchUrl('/fa');
  console.log(`[4] /fa Status: ${fa.statusCode}`);
  assert.strictEqual(fa.statusCode, 200);
  assert.ok(fa.body.includes('lang="fa"'), '/fa contains lang="fa"');
  assert.ok(fa.body.includes('dir="rtl"'), '/fa contains dir="rtl"');
  assert.ok(fa.body.includes('ساختمان\u200cها و املاک خود را'), '/fa contains humanized hero');
  assert.ok(fa.body.includes('منشأ هر مبلغ را روشن ببینید'), '/fa contains financial truth title');
  assert.ok(fa.body.includes('درخواست حضور در پایلوت'), '/fa contains primary CTA');
  assert.ok(!fa.body.includes('۳۰ تا ۵۰٪'), '/fa has NO ۳۰ تا ۵۰٪ metric');

  // 3. Smoke test key public routes across all 3 locales
  const publicRoutes = [
    '/platform', '/solutions/associations', '/solutions/property-owners',
    '/solutions/property-managers', '/solutions/residents', '/solutions/tenants',
    '/modules', '/migration', '/pricing', '/security', '/resources/faq',
    '/pilot', '/about', '/contact', '/privacy', '/terms', '/cookies',
    '/accessibility', '/demo', '/login'
  ];

  console.log(`\n[5] Testing 20 public routes across 3 locales (60 endpoints)...`);
  for (const r of publicRoutes) {
    for (const lang of ['ro', 'en', 'fa']) {
      const res = await fetchUrl(`/${lang}${r}`);
      if (res.statusCode !== 200) {
        console.error(`❌ FAILED: /${lang}${r} returned status ${res.statusCode}`);
        process.exit(1);
      }
    }
  }
  console.log('✅ All 60 public localized endpoints returned HTTP 200 OK!');

  // 4. Smoke test application routes across all 3 locales
  const appRoutes = [
    '/app/dashboard', '/app/accounting', '/app/accounting/allocations',
    '/app/accounting/month-close', '/app/meters', '/app/maintenance',
    '/app/governance', '/app/portfolio', '/app/migration/shadow-ledger',
    '/app/communications', '/app/documents', '/app/audit', '/app/settings'
  ];

  console.log(`\n[6] Testing 13 application routes across 3 locales (39 endpoints)...`);
  for (const r of appRoutes) {
    for (const lang of ['ro', 'en', 'fa']) {
      const res = await fetchUrl(`/${lang}${r}`);
      if (res.statusCode !== 200) {
        console.error(`❌ FAILED: /${lang}${r} returned status ${res.statusCode}`);
        process.exit(1);
      }
    }
  }
  console.log('✅ All 39 application localized endpoints returned HTTP 200 OK!');

  // 5. SEO Live Verification
  console.log(`\n[7] Testing SEO endpoints...`);
  const robots = await fetchUrl('/robots.txt');
  console.log(`- robots.txt Status: ${robots.statusCode}`);
  assert.strictEqual(robots.statusCode, 200);
  assert.ok(robots.body.includes('https://cladora-wzow.vercel.app/sitemap.xml'), 'robots.txt references correct sitemap');

  const sitemap = await fetchUrl('/sitemap.xml');
  console.log(`- sitemap.xml Status: ${sitemap.statusCode}`);
  assert.strictEqual(sitemap.statusCode, 200);
  assert.ok(sitemap.body.includes('https://cladora-wzow.vercel.app/ro'), 'sitemap contains /ro');
  assert.ok(sitemap.body.includes('https://cladora-wzow.vercel.app/en'), 'sitemap contains /en');
  assert.ok(sitemap.body.includes('https://cladora-wzow.vercel.app/fa'), 'sitemap contains /fa');
  assert.ok(!sitemap.body.includes('/app/'), 'sitemap excludes /app/ routes');

  console.log('\n🎉 ALL LIVE PRODUCTION SMOKE AND SEO CHECKS PASSED WITH 100% SUCCESS!');
}

runLiveVerification().catch(err => {
  console.error('Fatal live verification error:', err);
  process.exit(1);
});
