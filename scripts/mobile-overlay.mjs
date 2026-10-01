/**
 * Điều tra overlay che phủ element tương tác trên mobile.
 * Usage: node scripts/mobile-overlay.mjs [url]
 */
import { chromium, devices } from 'playwright';

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const device = devices['iPhone 13'];

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...device, defaultBrowserType: undefined, locale: 'vi-VN' });
const page = await ctx.newPage();

const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 250)));
page.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 250)));

console.log('=== OVERLAY INVESTIGATION ===');
console.log('URL:', BASE_URL);
await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);

const report = await page.evaluate(() => {
  const out = { overlayStack: [], blockedTargets: [], vh: window.innerHeight, vw: window.innerWidth };

  // 1. Toàn bộ element có position fixed/sticky + to, có thể che
  document.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' && cs.position !== 'sticky') return;
    const r = el.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    const covers =
      r.width >= window.innerWidth * 0.9 && r.height >= window.innerHeight * 0.5;
    out.overlayStack.push({
      tag: el.tagName,
      cls: (el.className?.baseVal ?? el.className ?? '').toString().slice(0, 95),
      pos: cs.position,
      z: cs.zIndex,
      pe: cs.pointerEvents,
      box: `${Math.round(r.width)}x${Math.round(r.height)}`,
      xy: `${Math.round(r.x)},${Math.round(r.y)}`,
      coversScreen: covers,
      ariaHidden: el.getAttribute('aria-hidden'),
    });
  });

  // 2. Với mọi button/a hiển thị, xem elementFromPoint có trúng nó không
  document.querySelectorAll('button, a[href]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    if (r.right < 0 || r.left > window.innerWidth) return;
    const cx = r.x + r.width / 2;
    const cy = r.y + r.height / 2;
    const top = document.elementFromPoint(cx, cy);
    const blocked = top !== el && !el.contains(top);
    if (blocked) {
      out.blockedTargets.push({
        label: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 35) || '(icon)',
        tag: el.tagName,
        center: `${Math.round(cx)},${Math.round(cy)}`,
        size: `${Math.round(r.width)}x${Math.round(r.height)}`,
        blockedBy: {
          tag: top?.tagName,
          cls: (top?.className?.baseVal ?? top?.className ?? '').toString().slice(0, 90),
          pe: top ? getComputedStyle(top).pointerEvents : null,
          box: top ? `${Math.round(top.getBoundingClientRect().width)}x${Math.round(top.getBoundingClientRect().height)}` : null,
          isDescendantOfTarget: el.contains(top),
        },
      });
    }
  });

  return out;
});

console.log(`\nViewport: ${report.vw}x${report.vh}`);
console.log(`\n[1] Fixed/Sticky elements (${report.overlayStack.length}):`);
report.overlayStack.forEach((o) => {
  const flag = o.coversScreen ? '  <<< COVERS SCREEN' : '';
  console.log(`   ${o.pos} z=${o.z} pe=${o.pe} ${o.box} @${o.xy} ${o.tag}.${o.cls}${flag}`);
});

console.log(`\n[2] BLOCKED interactive targets (${report.blockedTargets.length}):`);
report.blockedTargets.forEach((b) => {
  console.log(`   "${b.label}" ${b.tag} ${b.size} @${b.center}`);
  console.log(`      -> blocked by ${b.blockedBy.tag}.${b.blockedBy.cls}`);
  console.log(`         pe=${b.blockedBy.pe} box=${b.blockedBy.box} isDescendant=${b.blockedBy.isDescendantOfTarget}`);
});

if (!report.blockedTargets.length) console.log('   (none - mọi element đều có thể bấm)');

console.log('\n[ERRORS]', errs.length ? errs.slice(0, 6) : 'none');
await browser.close();
