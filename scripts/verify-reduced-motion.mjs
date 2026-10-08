// A11y M13 — verify prefers-reduced-motion được tôn trọng.
// Playwright emulate `prefers-reduced-motion: reduce`, đo animation-duration /
// animation-iteration-count của các phần tử có animation vô hạn (flame mascot,
// float-soft, pixel-*, pet-*). Kỳ vọng: duration ~0.01ms và iteration-count 1.
//
// Cách chạy: node scripts/verify-reduced-motion.mjs
import { chromium } from 'playwright';

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const DEMO_PASS = '123456'; // tài khoản demo công khai của repo (README)

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  reducedMotion: 'reduce',
});
const login = await ctx.request.post(`${BASE}/api/auth`, {
  data: { action: 'login', username: 'demo', password: DEMO_PASS },
});
if (login.ok()) {
  const sc = login.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie')?.value || '';
  const [n, ...r] = sc.split(';')[0].split('=');
  await ctx.addCookies([{ name: n, value: r.join('='), url: BASE }]);
}

const page = await ctx.newPage();
await page.goto(`${BASE}/pet`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(5000);

// Mở modal shop: vào tab SANCTUARY trước (mặc định là farm), rồi menu "Thêm".
let shopOpen = false;
try {
  const tab = page.locator('button', { hasText: 'Sân Vườn Linh Vật' }).first();
  if (await tab.isVisible({ timeout: 6000 }).catch(() => false)) {
    await tab.click();
    await page.waitForTimeout(1500);
  }
  const more = page.locator('button[title="Thêm chức năng"]').first();
  if (await more.isVisible({ timeout: 6000 }).catch(() => false)) {
    await more.click();
    await page.waitForTimeout(500);
    const item = page.locator('button', { hasText: 'Cửa Hàng & Thử Đồ' }).first();
    if (await item.isVisible({ timeout: 2500 }).catch(() => false)) {
      await item.click();
      await page.waitForTimeout(1500);
      shopOpen = true;
    }
  }
} catch { /* bỏ qua */ }
if (!shopOpen) console.log('(không mở nổi modal shop — đo /pet thường)');

const probes = [
  '.animate-flame',
  '.animate-float-soft',
  '.animate-pixel-idle',
  '.animate-pet-waddle-walk',
  '.animate-pet-float-idle',
  '.animate-pet-tail-idle',
  '.animate-swing-pendulum',
];

const results = await page.evaluate((selectors) => {
  return selectors.map((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { sel, found: false };
    const s = getComputedStyle(el);
    return {
      sel,
      found: true,
      duration: s.animationDuration,
      iteration: s.animationIterationCount,
      name: s.animationName,
    };
  });
}, probes);

// Trang chủ có MascotCompanion (.animate-float-soft) + Zap .animate-flame.
const page2 = await ctx.newPage();
await page2.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page2.waitForTimeout(3500);
const results2 = await page2.evaluate((selectors) => {
  return selectors.map((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { sel, found: false };
    const s = getComputedStyle(el);
    return {
      sel,
      found: true,
      duration: s.animationDuration,
      iteration: s.animationIterationCount,
      name: s.animationName,
    };
  });
}, probes);

console.log('');
console.log('=== PREFERS-REDUCED-MOTION: reduce — đo animation-duration thật ===');
let allPass = true;
let measured = 0;
for (const r of [...results, ...results2]) {
  if (!r.found) {
    continue; // selector không có trên trang này — in gộp ở dưới
  }
  measured++;
  const ok = parseFloat(r.duration) <= 0.02 && r.iteration === '1';
  if (!ok) allPass = false;
  console.log(`| ${r.sel} | ~0.01ms × 1 | ${r.duration} × ${r.iteration} (${r.name}) | ${ok ? 'PASS' : 'FAIL'} |`);
}
const missing = probes.filter((sel) => ![...results, ...results2].some((r) => r.sel === sel && r.found));
if (missing.length) console.log(`(không tìm thấy trên 2 trang: ${missing.join(', ')})`);

// Kiểm tra cả transition-duration bị tắt (một nút bất kỳ).
const trans = await page.evaluate(() => {
  const btn = document.querySelector('button');
  return btn ? getComputedStyle(btn).transitionDuration : null;
});
if (trans !== null) {
  const tOk = trans.split(',').every((t) => parseFloat(t) <= 0.02);
  if (!tOk) allPass = false;
  console.log(`| button transition-duration | ~0.01ms | ${trans} | ${tOk ? 'PASS' : 'FAIL'} |`);
}

console.log(allPass ? '\nKET QUA: PASS — reduced-motion được tôn trọng.' : '\nKET QUA: FAIL — vẫn còn animation chạy.');
await browser.close();
process.exit(allPass ? 0 : 1);
