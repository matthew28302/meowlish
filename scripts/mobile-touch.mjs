/**
 * Mobile touch behaviour probe v2: xác định touch event CÓ ĐẾN handler không.
 * Test: hamburger drawer, link navigation, modal mở.
 *
 * Usage: node scripts/mobile-touch.mjs [url]
 */
import { chromium, devices } from 'playwright';

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const device = devices['iPhone 13'];

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...device, defaultBrowserType: undefined, locale: 'vi-VN' });
const page = await ctx.newPage();

const errs = [];
page.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 250)));
page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 250)));

console.log('=== TOUCH BEHAVIOUR PROBE ===');
console.log('URL:', BASE_URL);

// Instrument: log every click/touch that reaches document (capture phase)
await page.addInitScript(() => {
  window.__ev = [];
  ['pointerdown', 'pointerup', 'click', 'touchstart', 'touchend'].forEach((t) =>
    document.addEventListener(
      t,
      (e) => window.__ev.push(t + '@' + (e.target?.tagName || '?')),
      { capture: true, passive: true }
    )
  );
});

await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2000);

const log = async (label) => {
  const ev = await page.evaluate(() => {
    const v = window.__ev.slice();
    window.__ev.length = 0;
    return v;
  });
  console.log(`  events after ${label}: ${ev.length ? ev.join(', ') : '(NONE)'}`);
  return ev;
};
await log('page load (reset)');

// ---------- TEST 1: hamburger menu opens mobile drawer ----------
console.log('\n[TEST 1] Hamburger (Thêm) -> mobile drawer');
const burgerInfo = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const b = btns.find((x) => (x.innerText || '').replace(/\s+/g, ' ').trim() === 'Thêm');
  if (!b) return null;
  const r = b.getBoundingClientRect();
  const cs = getComputedStyle(b);
  // what's on top of it?
  const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
  return {
    x: Math.round(r.x + r.width / 2),
    y: Math.round(r.y + r.height / 2),
    w: Math.round(r.width),
    h: Math.round(r.height),
    pe: cs.pointerEvents,
    visible: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden',
    topEl: top ? top.tagName + '.' + (top.className?.baseVal ?? top.className ?? '').toString().slice(0, 60) : 'none',
    isSelf: top === b || b.contains(top),
  };
});
console.log('  target:', JSON.stringify(burgerInfo, null, 2));

if (burgerInfo && burgerInfo.isSelf) {
  await page.touchscreen.tap(burgerInfo.x, burgerInfo.y);
  await page.waitForTimeout(700);
  const drawerOpen = await page.evaluate(() => {
    const el = document.querySelector('.animate-drawer-slide');
    if (!el) return { open: false };
    const r = el.getBoundingClientRect();
    return { open: true, w: Math.round(r.width), x: Math.round(r.x), inViewport: r.x >= -5 && r.x < window.innerWidth };
  });
  console.log('  drawer:', JSON.stringify(drawerOpen));
  await log('hamburger tap');
  console.log('  RESULT:', drawerOpen.open && drawerOpen.inViewport ? 'PASS ✅' : 'FAIL ❌');

  if (drawerOpen.open) {
    // close it
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find(
        (x) => (x.innerText || '').replace(/\s+/g, ' ').trim() === 'Thêm'
      );
      b?.click();
    });
    await page.waitForTimeout(400);
  }
} else {
  console.log('  RESULT: FAIL ❌ (button covered or not found)');
}

// ---------- TEST 2: link navigation via touch ----------
console.log('\n[TEST 2] Link navigation via touch');
const link = await page.evaluate(() => {
  const a = document.querySelector('a[href^="/"]');
  if (!a) return null;
  const r = a.getBoundingClientRect();
  return { href: a.getAttribute('href'), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
});
if (link) {
  console.log('  target:', JSON.stringify(link));
  const beforeUrl = page.url();
  await page.touchscreen.tap(link.x, link.y);
  await page.waitForTimeout(1800);
  const afterUrl = page.url();
  console.log('  before:', beforeUrl, '\n  after: ', afterUrl);
  await log('link tap');
  console.log('  RESULT:', afterUrl !== beforeUrl ? 'PASS ✅ (điều hướng)' : 'FAIL ❌ (không điều hướng)');
  if (afterUrl !== beforeUrl) await page.goBack({ waitUntil: 'networkidle' });
}

// ---------- TEST 3: does ANY touch produce a click? ----------
console.log('\n[TEST 3] Touch -> click event propagation (trên body)');
await page.evaluate(() => (window.__ev.length = 0));
const center = await page.evaluate(() => ({ x: Math.round(window.innerWidth / 2), y: Math.round(window.innerHeight / 2) }));
await page.touchscreen.tap(center.x, center.y);
await page.waitForTimeout(400);
const ev3 = await log('center tap');
console.log('  RESULT:', ev3.some((e) => e.startsWith('click')) ? 'PASS ✅ (click fires)' : 'FAIL ❌ (click KHÔNG fire)');

// ---------- TEST 4: CSS :hover-only interactive (chỉ hover mới hiện) ----------
console.log('\n[TEST 4] Elements needing hover / cursor');
const hoverIssues = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('button, a[href]').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.pointerEvents === 'none' || cs.pointerEvents === 'auto' === false) {
      out.push({ t: (el.innerText || '').slice(0, 30), pe: cs.pointerEvents });
    }
    if (cs.opacity === '0' || cs.visibility === 'hidden') {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (el.innerText || '').trim()) out.push({ t: el.innerText.slice(0, 30), hidden: true });
    }
  });
  return out.slice(0, 10);
});
console.log('  issues:', hoverIssues.length ? JSON.stringify(hoverIssues) : 'none');

// ---------- TEST 5: tap target sizes (Apple/Google recommend >=44px) ----------
console.log('\n[TEST 5] Tap target size < 44px');
const small = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('button, a[href]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (r.top > window.innerHeight || r.bottom < 0) return;
    if (r.width < 44 || r.height < 44)
      out.push({
        t: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 28) || '(icon)',
        w: Math.round(r.width),
        h: Math.round(r.height),
      });
  });
  return out.slice(0, 15);
});
console.log('  small targets:', small.length ? JSON.stringify(small, null, 1) : 'none');

console.log('\n[ERRORS]', errs.length ? errs.slice(0, 8) : 'none');

await browser.close();
