/**
 * Mobile touch diagnostic: mở site bằng iPhone emulation (hasTouch:true, isMobile:true)
 * và kiểm tra vì sao "không ấn được".
 *
 * Usage: node scripts/mobile-probe.mjs [url]
 */
import { chromium, devices } from 'playwright';

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const device = devices['iPhone 13'];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  ...device,
  defaultBrowserType: undefined, // chromium, not webkit
  locale: 'vi-VN',
});
const page = await ctx.newPage();

const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];

page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300));
});
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 300)));
page.on('requestfailed', (r) =>
  failedRequests.push(`${r.url().slice(0, 120)} :: ${r.failure()?.errorText}`)
);

console.log('=== MOBILE PROBE ===');
console.log('URL:', BASE_URL);
console.log('Device:', device.userAgent.slice(0, 60), '| touch:', device.hasTouch, '| mobile:', device.isMobile);

await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);

// ---- 1. viewport & meta ----
const meta = await page.evaluate(() => ({
  viewport: document.querySelector('meta[name="viewport"]')?.content || '(MISSING)',
  innerW: window.innerWidth,
  innerH: window.innerHeight,
  dpr: window.devicePixelRatio,
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
  horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  hoverNone: matchMedia('(hover: none)').matches,
  pointerCoarse: matchMedia('(pointer: coarse)').matches,
}));
console.log('\n[1] VIEWPORT:', JSON.stringify(meta, null, 2));

// ---- 2. full-screen overlays that could swallow taps ----
const overlays = await page.evaluate(() => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pts = [
    [vw * 0.5, vh * 0.5],
    [vw * 0.2, vh * 0.25],
    [vw * 0.8, vh * 0.75],
    [vw * 0.5, vh * 0.1],
    [vw * 0.5, vh * 0.9],
  ];
  return pts.map(([x, y]) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return { x: Math.round(x), y: Math.round(y), hit: null };
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(x),
      y: Math.round(y),
      tag: el.tagName,
      cls: (el.className?.baseVal ?? el.className ?? '').toString().slice(0, 110),
      pe: cs.pointerEvents,
      ta: cs.touchAction,
      box: `${Math.round(r.width)}x${Math.round(r.height)}`,
      isLeafInteractive: !!el.closest('button,a,input,select,textarea,[role="button"]'),
    };
  });
});
console.log('\n[2] elementFromPoint @ tap targets:');
overlays.forEach((o) => console.log('   ', JSON.stringify(o)));

// ---- 3. real touch tap test on interactive elements ----
const tapTargets = await page.evaluate(() => {
  const out = [];
  const els = Array.from(document.querySelectorAll('button, a[href], [role="button"]'));
  for (const el of els.slice(0, 40)) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (r.width < 4 || r.height < 4) continue;
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
    if (r.bottom < 0 || r.top > window.innerHeight) continue; // only visible in viewport
    out.push({
      text: (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 45),
      tag: el.tagName,
      w: Math.round(r.width),
      h: Math.round(r.height),
      x: Math.round(r.x + r.width / 2),
      y: Math.round(r.y + r.height / 2),
      pe: cs.pointerEvents,
    });
  }
  return out;
});
console.log(`\n[3] ${tapTargets.length} interactive elements visible in viewport`);

let tapOk = 0;
let tapFail = 0;
const failures = [];
for (const t of tapTargets.slice(0, 12)) {
  try {
    const before = await page.evaluate(
      ([x, y]) => {
        const el = document.elementFromPoint(x, y);
        return el ? el.tagName + '|' + (el.className?.baseVal ?? el.className ?? '').toString().slice(0, 50) : 'none';
      },
      [t.x, t.y]
    );
    // Real touch tap
    await page.touchscreen.tap(t.x, t.y);
    await page.waitForTimeout(450);
    const after = await page.evaluate(
      ([x, y]) => {
        const el = document.elementFromPoint(x, y);
        return el ? el.tagName + '|' + (el.className?.baseVal ?? el.className ?? '').toString().slice(0, 50) : 'none';
      },
      [t.x, t.y]
    );
    const changed = before !== after;
    if (changed) tapOk++;
    else {
      tapFail++;
      failures.push({ ...t, before, after });
    }
    console.log(`    tap "${t.text}" (${t.w}x${t.h}) pe=${t.pe} -> ${changed ? 'RESPONDED' : 'NO CHANGE'}`);
  } catch (e) {
    tapFail++;
    failures.push({ ...t, error: String(e).slice(0, 100) });
  }
}

// ---- 4. body/html pointer-events & touch-action ----
const rootStyles = await page.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { pe: cs.pointerEvents, ta: cs.touchAction, pos: cs.position, ov: cs.overflow };
  };
  return { html: pick('html'), body: pick('body') };
});
console.log('\n[4] ROOT STYLES:', JSON.stringify(rootStyles));

console.log('\n[5] CONSOLE ERRORS:', consoleErrors.length ? consoleErrors.slice(0, 10) : 'none');
console.log('[6] PAGE ERRORS:', pageErrors.length ? pageErrors.slice(0, 10) : 'none');
console.log('[7] FAILED REQUESTS:', failedRequests.length ? failedRequests.slice(0, 10) : 'none');
console.log(`\n[8] TAP SUMMARY: ok=${tapOk} fail=${tapFail}`);
if (failures.length) console.log('    FAILURES:', JSON.stringify(failures, null, 2));

// screenshot
const shot = await page.screenshot({ path: 'scratch/mobile-home.png', fullPage: false });
console.log('\nScreenshot -> scratch/mobile-home.png');

await browser.close();
