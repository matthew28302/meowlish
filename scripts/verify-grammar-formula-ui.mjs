import { chromium } from 'playwright';

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } });

const login = await ctx.request.post(`${BASE}/api/auth`, {
  data: { action: 'login', username: 'demo', password: '123456' },
});
const sc = login.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie')?.value ?? '';
const [n, ...r] = sc.split(';')[0].split('=');
if (n) await ctx.addCookies([{ name: n, value: r.join('='), url: BASE }]);

const p = await ctx.newPage();
await p.goto(`${BASE}/grammar`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(3000);
await p.evaluate(async () => {
  const res = await fetch('/api/auth?userId=user_demo_default', { credentials: 'same-origin' });
  const d = await res.json().catch(() => null);
  if (d?.user) localStorage.setItem('english_for_me_user', JSON.stringify(d.user));
  localStorage.removeItem('english_for_me_logged_out');
});
await p.goto(`${BASE}/grammar`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(5000);

// Chọn bài "Thì Hiện Tại Đơn vs Tiếp Diễn"
await p.locator('h4', { hasText: 'Thì Hiện Tại Đơn vs Tiếp Diễn' }).first().click();
await p.waitForTimeout(2000);

const m = await p.evaluate(() => {
  const text = document.body.innerText;
  // Công thức nằm cạnh nhãn "MÔ HÌNH KHỐI LEGO TRỰC QUAN"
  const i = text.indexOf('MÔ HÌNH KHỐI LEGO TRỰC QUAN');
  const formula = i >= 0 ? text.slice(i, i + 260) : '(khong tim thay nhan)';
  // Đếm khối lego: mỗi khối hiển thị label + word
  const labels = ['SUBJECT', 'ROUTINE (V1)', 'TIME SIGNAL', 'IN PROGRESS'];
  return {
    formula,
    slotCount: (text.slice(i, i + 260).match(/\[[^\]]+\]/g) || []).length,
    labelsFound: labels.filter((l) => text.toUpperCase().includes(l)),
  };
});

console.log('=== Cong thuc hien thi tren UI ===');
console.log(m.formula);
console.log('\nSo slot trong cong thuc :', m.slotCount);
console.log('Khoi lego tim thay     :', m.labelsFound.join(' | '));

const ok = m.slotCount === 4 && m.labelsFound.length === 4;
console.log('\n' + (ok ? 'PASS — cong thuc 4 slot khop 4 khoi.' : 'FAIL — van lech.'));
process.exitCode = ok ? 0 : 1;
await b.close();
