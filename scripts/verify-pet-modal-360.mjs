// Debug 6: modal shop /pet trên màn 360px (M13: font 9px -> 11/12px, kiểm không vỡ).
// Kiểm tra: không tràn ngang trang + modal, badge/chip vẫn rounded-full.
import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 360, height: 800 } });
const login = await ctx.request.post(`${BASE}/api/auth`, {
  data: { action: 'login', username: 'demo', password: '123456' },
});
const sc = login.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie')?.value || '';
const [n, ...r] = sc.split(';')[0].split('=');
await ctx.addCookies([{ name: n, value: r.join('='), url: BASE }]);
const page = await ctx.newPage();
await page.goto(`${BASE}/pet`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
await page.keyboard.press('Escape');
await page.waitForTimeout(700);
await page.locator('button', { hasText: 'Sân Vườn Linh Vật' }).first().click();
await page.waitForTimeout(1500);
await page.locator('button[title="Thêm chức năng"]').click();
await page.waitForTimeout(500);
await page.locator('button', { hasText: 'Cửa Hàng & Thử Đồ' }).first().click();
await page.waitForTimeout(1500);

const check = await page.evaluate(() => {
  const docOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  const modal = document.querySelector('.rounded-2xl.rounded-3xl, [class*="max-w-4xl"]');
  const badges = [...document.querySelectorAll('span,div')]
    .filter((s) => ['✨ MẶC', '👀 THỬ', '✓ Đã có', 'Kho: x', 'Đang xem thử'].some((t) => (s.textContent || '').trim().startsWith(t)) && s.children.length === 0)
    .slice(0, 8)
    .map((s) => {
      const c = getComputedStyle(s);
      const b = s.getBoundingClientRect();
      return {
        text: (s.textContent || '').trim().slice(0, 16),
        fs: c.fontSize,
        radius: c.borderRadius,
        w: Math.round(b.width),
        overflowRight: Math.round(b.right) > document.documentElement.clientWidth,
      };
    });
  // Nút hành động: text có bị tràn ra ngoài nút không?
  const btns = [...document.querySelectorAll('button')]
    .filter((b) => (b.textContent || '').includes('xu'))
    .slice(0, 6)
    .map((b) => {
      const bb = b.getBoundingClientRect();
      return {
        text: (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30),
        w: Math.round(bb.width),
        h: Math.round(bb.height),
        scrollW: b.scrollWidth,
        clientW: b.clientWidth,
        textOverflow: b.scrollWidth > b.clientWidth + 1,
      };
    });
  return { docOverflow, modalFound: !!modal, badges, btns };
});
console.log(JSON.stringify(check, null, 1));
await page.screenshot({ path: 'scripts/shot-shop-modal-360.png', fullPage: false });
console.log('screenshot: scripts/shot-shop-modal-360.png');
await browser.close();
