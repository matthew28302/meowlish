/**
 * Kiểm tra AuthModal có tự mở lại sau khi đóng + điều hướng không.
 * Usage: node scripts/modal-reopen.mjs [url]
 */
import { chromium, devices } from 'playwright';

const BASE_URL = process.argv[2] || 'http://192.168.56.1:3000';
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'], defaultBrowserType: undefined, locale: 'vi-VN' });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
page.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)));

console.log('=== MODAL REOPEN TEST ===', BASE_URL);
await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(5000);

const modalState = async () => (await page.evaluate(() => !!document.querySelector('.z-\\[10000\\]')));
const closeModal = async () => {
  const btn = await page.evaluate(() => {
    const m = document.querySelector('.z-\\[10000\\]');
    const b = m && m.querySelector('button[title]');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)];
  });
  if (!btn) return false;
  await page.touchscreen.tap(btn[0], btn[1]);
  await page.waitForTimeout(800);
  return !(await modalState());
};

console.log('  modal sau 5s:', (await modalState()) ? 'OPEN' : 'closed');
console.log('  đóng modal:', (await closeModal()) ? 'OK ✅' : 'FAIL ❌');

// theo dõi modal trong 5 giây sau khi đóng -> có tự mở lại không?
for (let i = 1; i <= 5; i++) {
  await page.waitForTimeout(1000);
  const s = await modalState();
  console.log(`   +${i}s modal:`, s ? 'MỞ LẠI ❌' : 'đóng');
}

// điều hướng tới /pet (KHÔNG nằm trong danh sách loại trừ)
console.log('\n  navigate -> /pet bằng touch (bottom nav "Thú Cưng")...');
let nav = await page.evaluate(() => {
  const a = Array.from(document.querySelectorAll('a[href="/pet"]')).find((x) => {
    const r = x.getBoundingClientRect();
    return r.width > 20 && r.height > 20 && r.top >= 0 && r.bottom <= window.innerHeight;
  });
  if (!a) return null;
  const r = a.getBoundingClientRect();
  const cx = Math.round(r.x + r.width / 2);
  const cy = Math.round(r.y + r.height / 2);
  const top = document.elementFromPoint(cx, cy);
  return {
    pt: [cx, cy],
    hitTestOk: top === a || a.contains(top),
    topEl: top ? top.tagName + '.' + (top.className?.baseVal ?? top.className ?? '').toString().slice(0, 60) : 'none',
    modalOpen: !!document.querySelector('.z-\\[10000\\]'),
  };
});
console.log('  pre-tap:', JSON.stringify(nav));
if (nav) nav = nav.pt;
if (nav) {
  await page.touchscreen.tap(nav[0], nav[1]);
  await page.waitForTimeout(3500);
  console.log('  url:', page.url());
  const reopened = await modalState();
  console.log('  modal sau điều hướng:', reopened ? 'TỰ MỞ LẠI ❌ (chặn người dùng)' : 'KHÔNG mở lại ✅');
  if (reopened) {
    console.log('  => người dùng đóng modal, bấm nav, modal lại hiện => cảm giác "không thao tác được"');
    await closeModal();
  }
} else {
  console.log('  không tìm thấy nav /pet trong viewport ❌');
}

// thử một route khác nữa
console.log('\n  navigate -> /grammar ...');
await page.goto(BASE_URL + '/grammar', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(4000);
console.log('  modal tại /grammar:', (await modalState()) ? 'OPEN ❌' : 'closed ✅');

console.log('\n[ERRORS]', errs.length ? errs.slice(0, 6) : 'none');
await browser.close();
