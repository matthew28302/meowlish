/**
 * E2E mobile touch test theo đúng kịch bản "điện thoại truy cập qua IP:port".
 * Usage: node scripts/mobile-e2e.mjs [url]
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

console.log('=== MOBILE E2E ===', BASE_URL);

await page.addInitScript(() => {
  window.__clicks = [];
  document.addEventListener(
    'click',
    (e) => {
      const t = e.target;
      window.__clicks.push(
        (t?.tagName || '?') + ':' + ((t?.innerText || t?.getAttribute?.('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 30))
      );
    },
    { capture: true, passive: true }
  );
});

await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(6000); // chờ isAuthChecked

const state = await page.evaluate(() => {
  const modal = document.querySelector('.z-\\[10000\\]');
  const anyButton = document.querySelector('nav button, header button');
  return {
    modalPresent: !!modal,
    modalVisible: modal ? getComputedStyle(modal).display !== 'none' : false,
    reactPropsOnButton: anyButton ? Object.keys(anyButton).some((k) => k.startsWith('__reactProps')) : null,
    firstButtonReactProps: (() => {
      const b = document.querySelector('button');
      return b ? Object.keys(b).some((k) => k.startsWith('__reactProps')) : null;
    })(),
  };
});
console.log('[STATE]', JSON.stringify(state));

// ---- TEST A: đóng modal bằng touch (nếu đang mở) ----
if (state.modalPresent) {
  const close = await page.evaluate(() => {
    const modal = document.querySelector('.z-\\[10000\\]');
    const btn = modal && modal.querySelector('button[title]');
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { title: btn.getAttribute('title'), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
  });
  console.log('\n[A] Close button:', JSON.stringify(close));
  if (close) {
    await page.touchscreen.tap(close.x, close.y);
    await page.waitForTimeout(900);
    const still = await page.evaluate(() => !!document.querySelector('.z-\\[10000\\]'));
    console.log('   modal after tap:', still ? 'STILL OPEN ❌' : 'CLOSED ✅');
  } else {
    // fallback: tap bottom-right area to dismiss
    console.log('   no close button found ❌');
  }
}

// ---- TEST B: bottom nav touch tap ----
console.log('\n[B] Bottom nav touch tap');
const nav = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('nav a[href], a[href="/pet"]'));
  const a = links.find((x) => {
    const r = x.getBoundingClientRect();
    return r.width > 20 && r.height > 20 && r.top >= 0 && r.bottom <= window.innerHeight;
  });
  if (!a) return null;
  const r = a.getBoundingClientRect();
  const cx = Math.round(r.x + r.width / 2);
  const cy = Math.round(r.y + r.height / 2);
  const top = document.elementFromPoint(cx, cy);
  return {
    href: a.getAttribute('href'),
    label: (a.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 20),
    x: cx,
    y: cy,
    hitTestOk: top === a || a.contains(top),
    topEl: top ? top.tagName + '.' + (top.className?.baseVal ?? top.className ?? '').toString().slice(0, 50) : 'none',
    reactProps: Object.keys(a).some((k) => k.startsWith('__reactProps')),
  };
});
console.log('   target:', JSON.stringify(nav));

if (nav) {
  const before = page.url();
  await page.evaluate(() => (window.__clicks.length = 0));
  await page.touchscreen.tap(nav.x, nav.y);
  await page.waitForTimeout(3000);
  const after = page.url();
  const clicks = await page.evaluate(() => window.__clicks.slice());
  console.log('   click events:', clicks.length ? clicks.join(' | ') : '(NONE)');
  console.log('   url:', before, '->', after);
  console.log('   RESULT:', after !== before ? `PASS ✅ navigated` : `FAIL ❌ no navigation`);
}

// ---- TEST C: header hamburger -> drawer ----
console.log('\n[C] Header hamburger -> drawer');
await page.evaluate(() => (window.__clicks.length = 0));
const burger = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const b = btns.find((x) => {
    const r = x.getBoundingClientRect();
    const t = (x.innerText || '').replace(/\s+/g, ' ').trim();
    return t === 'Thêm' && r.width > 20 && r.top >= 0 && r.bottom <= window.innerHeight;
  });
  if (!b) return null;
  const r = b.getBoundingClientRect();
  const cx = Math.round(r.x + r.width / 2);
  const cy = Math.round(r.y + r.height / 2);
  const top = document.elementFromPoint(cx, cy);
  return {
    x: cx,
    y: cy,
    hitTestOk: top === b || b.contains(top),
    topEl: top ? top.tagName + '.' + (top.className?.baseVal ?? top.className ?? '').toString().slice(0, 50) : 'none',
    reactProps: Object.keys(b).some((k) => k.startsWith('__reactProps')),
  };
});
console.log('   target:', JSON.stringify(burger));
if (burger) {
  await page.touchscreen.tap(burger.x, burger.y);
  await page.waitForTimeout(1000);
  const drawer = await page.evaluate(() => {
    const el = document.querySelector('.animate-drawer-slide');
    if (!el) return { open: false };
    const r = el.getBoundingClientRect();
    return { open: true, x: Math.round(r.x), w: Math.round(r.width), inViewport: r.x > -10 && r.x < window.innerWidth };
  });
  const clicks = await page.evaluate(() => window.__clicks.slice());
  console.log('   click events:', clicks.length ? clicks.join(' | ') : '(NONE)');
  console.log('   drawer:', JSON.stringify(drawer));
  console.log('   RESULT:', drawer.open && drawer.inViewport ? 'PASS ✅' : 'FAIL ❌');
}

console.log('\n[ERRORS]', errs.length ? errs.slice(0, 10) : 'none');
await page.screenshot({ path: `scratch/e2e-${BASE_URL.includes('localhost') ? 'local' : 'ip'}.png` });
await browser.close();
