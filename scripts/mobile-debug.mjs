/**
 * Mobile debug: elementFromPoint stack + touch tap thực sự, chạy qua localhost hoặc IP LAN.
 * Usage: node scripts/mobile-debug.mjs [url]
 */
import { chromium, devices } from 'playwright';

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const device = devices['iPhone 13'];

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...device, defaultBrowserType: undefined, locale: 'vi-VN' });
const page = await ctx.newPage();

const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 300)));
page.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 300)));
const failed = [];
page.on('requestfailed', (r) => failed.push(`${r.url().slice(0, 110)} :: ${r.failure()?.errorText}`));
const badStatus = [];
page.on('response', (r) => {
  if (r.status() >= 400) badStatus.push(`${r.status()} ${r.url().slice(0, 110)}`);
});

console.log('=== MOBILE DEBUG ===');
console.log('URL:', BASE_URL);

const t0 = Date.now();
await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 90000 });
console.log('loaded in', Date.now() - t0, 'ms');
await page.waitForTimeout(2500);

// --- hydration check ---
const hydration = await page.evaluate(() => {
  const nextRoot = document.getElementById('__next');
  return {
    hasReactRoot: !!nextRoot && (nextRoot._reactRootContainer !== undefined || Object.keys(nextRoot).some((k) => k.startsWith('__reactFiber') || k.startsWith('__reactContainer'))),
    bodyDataReact: !!document.body.getAttribute('data-reactroot') || Object.keys(document.body).some((k) => k.startsWith('__reactContainer')),
    interactiveWithHandlers: (() => {
      // any element with a react click prop? detect via fiber keys
      const b = document.querySelector('button');
      return b ? Object.keys(b).some((k) => k.startsWith('__reactProps')) : null;
    })(),
    readyState: document.readyState,
    scripts: document.scripts.length,
  };
});
console.log('\n[HYDRATION]', JSON.stringify(hydration));

// --- elementFromPoint full stack ---
const points = [
  ['header icon 38,32', 38, 32],
  ['center 195,332', 195, 332],
  ['bottom nav Thêm 345,633', 345, 633],
  ['bottom nav Thú Cưng 195,633', 195, 633],
  ['bottom nav Lộ Trình 45,633', 45, 633],
];

const stacks = await page.evaluate((pts) => {
  return pts.map(([label, x, y]) => {
    const out = { label, x, y, stack: [] };
    const seen = new Set();
    let el = document.elementFromPoint(x, y);
    while (el && el !== document.documentElement && !seen.has(el)) {
      seen.add(el);
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      out.stack.push({
        tag: el.tagName,
        cls: (el.className?.baseVal ?? el.className ?? '').toString().slice(0, 70),
        txt: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40),
        pe: cs.pointerEvents,
        vis: cs.visibility,
        op: cs.opacity,
        z: cs.zIndex,
        pos: cs.position,
        rect: `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`,
      });
      el = el.parentElement;
    }
    return out;
  });
}, points);

console.log('\n[ELEMENT-FROM-POINT STACKS]');
stacks.forEach((s) => {
  console.log(`\n * ${s.label}`);
  s.stack.slice(0, 6).forEach((e, i) => {
    console.log(`   ${i + 1}. ${e.tag} z=${e.z} ${e.pos} pe=${e.pe} vis=${e.vis} op=${e.op} rect=[${e.rect}] "${e.txt}"`);
    console.log(`      .${e.cls}`);
  });
});

// --- AuthModal presence ---
const auth = await page.evaluate(() => {
  const el = document.querySelector('.z-\\[10000\\]');
  if (!el) return { present: false };
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  let node = el;
  const chain = [];
  while (node && node !== document.documentElement) {
    const c = getComputedStyle(node);
    chain.push(`${node.tagName}[d=${c.display},v=${c.visibility},pe=${c.pointerEvents},op=${c.opacity}]`);
    node = node.parentElement;
  }
  return { present: true, rect: `${r.width}x${r.height}`, style: { display: cs.display, visibility: cs.visibility, pe: cs.pointerEvents, opacity: cs.opacity }, chain };
});
console.log('\n[AUTHMODAL z-10000]', JSON.stringify(auth, null, 1));

// --- REAL touch tests ---
console.log('\n[TOUCH TESTS]');

// 1. bottom nav -> /pet
const navInfo = await page.evaluate(() => {
  const a = Array.from(document.querySelectorAll('a[href]')).find(
    (x) => (x.getAttribute('href') || '').includes('/pet')
  );
  if (!a) return null;
  const r = a.getBoundingClientRect();
  return { href: a.getAttribute('href'), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
});
console.log('  nav /pet target:', JSON.stringify(navInfo));
if (navInfo && navInfo.w > 0) {
  const before = page.url();
  await page.touchscreen.tap(navInfo.x, navInfo.y);
  await page.waitForTimeout(2500);
  const after = page.url();
  console.log('  => ', after !== before ? `PASS navigated to ${after}` : `FAIL still ${after}`);
  if (after === before) {
    // try again with explicit tap on the deepest element
    const deep = await page.evaluate((p) => {
      const el = document.elementFromPoint(p.x, p.y);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { tag: el.tagName, cls: (el.className?.baseVal ?? el.className ?? '').toString().slice(0, 60), txt: (el.innerText || '').slice(0, 30), center: [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)] };
    }, navInfo);
    console.log('  deepest element at target:', JSON.stringify(deep));
    if (deep) {
      await page.touchscreen.tap(deep.center[0], deep.center[1]);
      await page.waitForTimeout(2500);
      console.log('  => retry:', page.url() !== before ? `PASS -> ${page.url()}` : `FAIL still ${page.url()}`);
    }
  }
}

// if navigated, go back
if (page.url() !== BASE_URL && page.url() !== BASE_URL + '/') {
  await page.goBack({ waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1500);
}

console.log('\n[FAILED REQUESTS]', failed.length ? failed.slice(0, 10) : 'none');
console.log('[HTTP >=400]', badStatus.length ? badStatus.slice(0, 10) : 'none');
console.log('[ERRORS]', errs.length ? errs.slice(0, 10) : 'none');

await page.screenshot({ path: 'scratch/mobile-debug.png' });
console.log('\nScreenshot -> scratch/mobile-debug.png');

await browser.close();
