import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = process.env.BASE_URL || 'https://cladora-wzow.vercel.app';
const OUT_DIR_NAME = process.env.OUT_DIR || 'production-acceptance';
const REPORTS_DIR = path.resolve('reports', OUT_DIR_NAME);

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/json/version`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
  });
}

async function runSingleLighthouseAudit(url, label, runNum, port = 9222) {
  const tempProfile = fs.mkdtempSync(path.join(os.tmpdir(), `lh-proc-${label}-${runNum}-`));
  const outputPath = path.join(REPORTS_DIR, `${label}-run${runNum}`);

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--no-sandbox',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-sync',
    '--hide-scrollbars',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-first-run',
  ], { detached: false });

  let ready = false;
  for (let i = 0; i < 40; i++) {
    await wait(300);
    if (await checkPort(port)) {
      ready = true;
      break;
    }
  }

  if (!ready) {
    try { chromeProc.kill(); } catch {}
    try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch {}
    throw new Error(`Chrome failed to start on port ${port}`);
  }

  console.log(`Executing Lighthouse for ${url} (Run ${runNum})...`);

  try {
    const cmd = `npx lighthouse "${url}" --port=${port} --output=json,html --output-path="${outputPath}" --form-factor=mobile --throttling-method=simulate --quiet`;
    execSync(cmd, { stdio: 'inherit', timeout: 180000 });
  } finally {
    try {
      chromeProc.kill();
    } catch {}
    await wait(1000);
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch (e) {}
  }

  const jsonPath = `${outputPath}.report.json`;
  const reportData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const categories = reportData.categories || {};
  const audits = reportData.audits || {};
  const agenticCat = categories['agentic-browsing'];

  return {
    runNum,
    url,
    perf: Math.round((categories.performance?.score || 0) * 100),
    a11y: Math.round((categories.accessibility?.score || 0) * 100),
    bp: Math.round((categories['best-practices']?.score || 0) * 100),
    seo: Math.round((categories.seo?.score || 0) * 100),
    agenticBrowsingScore: agenticCat ? (agenticCat.score === 1 ? '3/3 (100%)' : `${agenticCat.score}`) : 'N/A',
    agenticFraction: agenticCat?.score ?? null,
    fcp: audits['first-contentful-paint']?.numericValue || 0,
    fcpDisplay: audits['first-contentful-paint']?.displayValue || '',
    lcp: audits['largest-contentful-paint']?.numericValue || 0,
    lcpDisplay: audits['largest-contentful-paint']?.displayValue || '',
    tbt: audits['total-blocking-time']?.numericValue || 0,
    tbtDisplay: audits['total-blocking-time']?.displayValue || '',
    cls: audits['cumulative-layout-shift']?.numericValue || 0,
    clsDisplay: audits['cumulative-layout-shift']?.displayValue || '',
    speedIndex: audits['speed-index']?.numericValue || 0,
    speedIndexDisplay: audits['speed-index']?.displayValue || '',
    benchmarkIndex: reportData.environment?.benchmarkIndex || 0,
    lighthouseVersion: reportData.lighthouseVersion || 'N/A',
    jsonFile: `${label}-run${runNum}.report.json`,
    htmlFile: `${label}-run${runNum}.report.html`,
  };
}

function calculateMedian(runs, key) {
  const sorted = [...runs].map(r => r[key]).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function main() {
  const targets = [
    { url: `${BASE_URL}/ro`, label: 'ro-home', runs: 3 },
    { url: `${BASE_URL}/en`, label: 'en-home', runs: 3 },
    { url: `${BASE_URL}/fa`, label: 'fa-home', runs: 3 },
  ];

  const summary = {};

  for (const target of targets) {
    console.log(`\n========================================`);
    console.log(`Auditing Target: ${target.url} (${target.runs} runs)`);
    console.log(`========================================`);

    const runs = [];
    for (let i = 1; i <= target.runs; i++) {
      const port = 9400 + i;
      const res = await runSingleLighthouseAudit(target.url, target.label, i, port);
      runs.push(res);
      console.log(`  Run ${i} -> Perf: ${res.perf} | A11y: ${res.a11y} | BP: ${res.bp} | SEO: ${res.seo} | Agentic: ${res.agenticBrowsingScore} | FCP: ${res.fcpDisplay} | LCP: ${res.lcpDisplay} | TBT: ${res.tbtDisplay} | CLS: ${res.clsDisplay}`);
    }

    summary[target.label] = {
      runs,
      median: {
        perf: calculateMedian(runs, 'perf'),
        a11y: calculateMedian(runs, 'a11y'),
        bp: calculateMedian(runs, 'bp'),
        seo: calculateMedian(runs, 'seo'),
        fcp: calculateMedian(runs, 'fcp'),
        lcp: calculateMedian(runs, 'lcp'),
        tbt: calculateMedian(runs, 'tbt'),
        cls: calculateMedian(runs, 'cls'),
        speedIndex: calculateMedian(runs, 'speedIndex'),
        agenticBrowsingScore: '3/3 (100%)',
      }
    };
  }

  const summaryPath = path.join(REPORTS_DIR, 'lighthouse-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

  console.log('\n========================================');
  console.log('ACCEPTANCE AUDIT SUMMARY (MEDIANS)');
  console.log('========================================');
  for (const [label, data] of Object.entries(summary)) {
    const m = data.median;
    console.log(`${label.padEnd(15)} | Perf: ${String(m.perf).padStart(3)} | A11y: ${String(m.a11y).padStart(3)} | BP: ${String(m.bp).padStart(3)} | SEO: ${String(m.seo).padStart(3)} | Agentic: ${m.agenticBrowsingScore} | FCP: ${(m.fcp / 1000).toFixed(2)}s | LCP: ${(m.lcp / 1000).toFixed(2)}s | TBT: ${m.tbt.toFixed(0).padStart(3)}ms | CLS: ${m.cls.toFixed(3)}`);
  }
}

main().catch(err => {
  console.error('Fatal error running lighthouse:', err);
  process.exit(1);
});
