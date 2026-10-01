/**
 * Hydration probe: poll __reactProps trên IP origin, bắt TẤT CẢ console, check service worker.
 * Usage: node scripts/hydration-probe.mjs [url]
 */
import { chromium, devices } from 'playwright';

const BASE_URL = process.argv[2] || 'http://192.168.56.1:3000';
const device = devices['iPhone 13'];

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...device, defaultBrowserType: undefined, locale: 'vi-VN' });
const page = await ctx.newPage();

const messages = [];
page.on('console', (m) => messages.push(`[${m.type()}] ${m.text().slice(0, 300)}`));
page.on('pageerror', (e) => messages.push(`[pageerror] ${String(e).slice(0, 400)}`));
const reqs = [];
page.on('requestfailed', (r) => reqs.push(`FAIL ${r.url().slice(0, 130)} :: ${r.failure()?.errorText}`));

console.log('=== HYDRATION PROBE ===', BASE_URL);
await page.goto(BASE_URL, { waitUntil: 'load', timeout: 90000 });

// poll tới 25 giây
let hydrated = null;
for (let i = 0; i < 25; i++) {
  await page.waitForTimeout(1000);
  const s = await page.evaluate(() => {
    const btn = document.querySelector('nav a[href], button');
    const key = btn ? Object.keys(btn).find((k) => k.startsWith('__reactProps') || k.startsWith('__reactFiber')) : null;
    // React root markers anywhere
    const rootKeys = [];
    [document.body, document.documentElement, document.getElementById('__next')].forEach((el) => {
      if (!el) return;
      Object.keys(el).forEach((k) => {
        if (k.startsWith('__reactContainer') || k.startsWith('__reactFiber') || k.startsWith('__reactRoot')) rootKeys.push(el.tagName + '.' + k.slice(0, 40));
      });
    });
    return { key: key || null, rootKeys, ready: document.readyState };
  });
  if (s.key || s.rootKeys.length) {
    hydrated = { at: i + 1, ...s };
    console.log(`  hydrated after ${i + 1}s ->`, JSON.stringify(hydrated));
    break;
  }
}
if (!hydrated) console.log('  NOT HYDRATED after 25s ❌');

// service worker?
const sw = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return 'no-sw-api';
  const regs = await navigator.serviceWorker.getRegistrations();
  return regs.map((r) => r.scope).join(', ') || 'none';
});
console.log('[SERVICE WORKER]', sw);

// localStorage / auth state
const authState = await page.evaluate(() => {
  const keys = Object.keys(localStorage);
  return {
    localStorageCount: keys.length,
    interestingKeys: keys.filter((k) => /user|token|auth|session|account/i.test(k)),
    hasUser: !!localStorage.getItem('meowlish_user') || !!localStorage.getItem('user'),
  };
});
console.log('[LOCALSTORAGE]', JSON.stringify(authState));

// Số lượng script +chunk URLs
const scripts = await page.evaluate(() => Array.from(document.scripts).map((s) => s.src).filter(Boolean));
console.log('[SCRIPTS]', scripts.length);
scripts.slice(0, 30).forEach((s) => console.log('   ', s.slice(0, 140)));

// React có thực sự render không? so sánh HTML server vs client
const reactMarkers = await page.evaluate(() => {
  const b = document.querySelector('button');
  return {
    firstButton: b ? (b.innerText || '').replace(/\s+/g, ' ').slice(0, 30) : null,
    firstButtonKeys: b ? Object.keys(b).slice(0, 8) : null,
    dataReactRoot: document.body.hasAttribute('data-reactroot'),
    nextData: !!document.getElementById('__NEXT_DATA__'),
  };
});
console.log('[REACT MARKERS]', JSON.stringify(reactMarkers));

console.log('\n[CONSOLE ALL]');
messages.slice(0, 40).forEach((m) => console.log('  ', m));
if (!messages.length) console.log('   (none)');

console.log('\n[FAILED REQUESTS]');
console.log(reqs.length ? reqs.slice(0, 20).join('\n  ') : '   none');

await browser.close();
