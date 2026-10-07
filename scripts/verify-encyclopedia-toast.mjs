// Kiểm chứng D5: guest bấm bookmark ở /encyclopedia thấy toast (trước đây im lặng).
import { chromium } from 'playwright';

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();

const errors = [];
p.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));

await p.goto(`${BASE}/encyclopedia`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(5000);

// Đảm bảo trạng thái guest: xóa session storage để getCurrentUser() = null
await p.evaluate(() => {
  localStorage.removeItem('english_for_me_user');
  localStorage.setItem('english_for_me_logged_out', '1');
});
await p.waitForTimeout(1000);

// Tìm nút "Lưu Bookmark" — chỉ hiện khi đã chọn 1 entry.
// Nếu chưa có, bấm 1 mục từ trong danh sách để mở detail trước.
let saveBtn = p.locator('button', { hasText: 'Lưu Bookmark' });
if ((await saveBtn.count()) === 0) {
  // Bấm mục từ đầu tiên trong danh sách
  const wordBtn = p.locator('button', { hasText: /^hello$/ }).first();
  if ((await wordBtn.count()) > 0) {
    await wordBtn.click().catch(() => {});
    await p.waitForTimeout(1500);
  }
  saveBtn = p.locator('button', { hasText: 'Lưu Bookmark' });
}
const btnCount = await saveBtn.count();
if (btnCount > 0) {
  await saveBtn.first().click().catch(() => {});
}

await p.waitForTimeout(1500);

const toast = await p.evaluate(() => {
  const els = [...document.querySelectorAll('div')].filter((d) => {
    const t = (d.textContent || '').trim();
    const s = getComputedStyle(d);
    return (
      s.position === 'fixed' &&
      t.length > 5 &&
      t.length < 120 &&
      (t.includes('đăng nhập') || t.includes('lưu') || t.includes('hết hạn') || t.includes('kết nối'))
    );
  });
  return els.map((d) => (d.textContent || '').trim().slice(0, 80));
});

console.log('| Kiem tra | Mong doi | Thuc te | Ket qua |');
console.log('|---|---|---|---|');
const hasToast = toast.length > 0;
console.log(`| guest bấm "Lưu Bookmark" hien toast | true | ${hasToast} | ${hasToast ? 'PASS' : 'FAIL'} |`);
console.log(`| tim thay nut Luu Bookmark | true | ${btnCount > 0} | ${btnCount > 0 ? 'PASS' : 'FAIL'} |`);
console.log(`| noi dung toast | co dang nhap/luu | ${toast[0] || 'KHONG CO'} | ${toast[0] ? 'PASS' : 'FAIL'} |`);
console.log(`| pageerror khi load | 0 | ${errors.length} | ${errors.length === 0 ? 'PASS' : 'FAIL'} |`);
if (errors.length) console.log('  errors:', errors.slice(0, 2));

await b.close();
process.exitCode = hasToast && toast[0] && errors.length === 0 ? 0 : 1;
