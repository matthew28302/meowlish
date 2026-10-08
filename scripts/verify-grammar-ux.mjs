// Kiểm chứng 2 sửa đổi UX trên /grammar bằng đo geometry thật:
//   H3 — nút "Quay lại danh sách" xuất hiện, bấm được, cuộn sidebar vào khung nhìn
//   H6 — công thức đọc được (font-size, không bị cắt)
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

let fails = 0;
const row = (check, expected, actual, ok) => {
  if (!ok) fails++;
  console.log(`| ${check.padEnd(44)} | ${expected} | ${actual} | ${ok ? 'PASS' : 'FAIL'} |`);
};

console.log('| Kiem tra | Mong doi | Thuc te | Ket qua |');
console.log('|---|---|---|---|');

// --- H3: nút quay lại ---
const back = p.locator('button', { hasText: 'Quay lại danh sách bài' }).first();
const hasBack = (await back.count()) > 0;
row('H3 — nút "Quay lại danh sách" tồn tại', 'true', hasBack, hasBack);

if (hasBack) {
  const m = await back.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), visible: r.width > 0 && r.height > 0 };
  });
  row('H3 — nút hiển thị trên desktop', 'true', m.visible, m.visible);
  row('H3 — chiều cao nút >= 44px', '>= 44', m.h, m.h >= 44);
}

// Công thức phải đọc được: font >= 14px, không bị cắt bởi overflow.
const formula = await p.evaluate(() => {
  // Công thức nằm trong div font-mono dưới nhãn "Mô Hình Khối Lego Trực Quan".
  const label = [...document.querySelectorAll('*')].find((e) =>
    /Mô Hình Khối Lego Trực Quan/i.test(e.textContent || '') && e.children.length === 0
  );
  if (!label) return { found: false };
  const box = label.parentElement?.querySelector('.font-mono');
  if (!box) return { found: false };
  const cs = getComputedStyle(box);
  const r = box.getBoundingClientRect();
  return {
    found: true,
    fontSize: parseFloat(cs.fontSize),
    text: (box.textContent || '').trim(),
    // Bị cắt nếu chiều cao nhỏ hơn số dòng * line-height.
    clipped: box.scrollHeight > box.clientHeight + 1,
    width: Math.round(r.width),
  };
});
row('H6 — tìm thấy khối công thức', 'true', formula.found, formula.found);
if (formula.found) {
  row('H6 — cỡ chữ công thức >= 14px', '>= 14', formula.fontSize, formula.fontSize >= 14);
  row('H6 — công thức không bị cắt', 'false', formula.clipped, !formula.clipped);
}

// Bấm nút quay lại → sidebar phải cuộn vào khung nhìn.
if (hasBack) {
  const before = await p.evaluate(
    () => document.getElementById('grammar-lesson-list')?.getBoundingClientRect().top ?? null
  );
  await back.click().catch(() => {});
  await p.waitForTimeout(900);
  const after = await p.evaluate(
    () => document.getElementById('grammar-lesson-list')?.getBoundingClientRect().top ?? null
  );
  const inView = after !== null && after < 400 && after > -50;
  row('H3 — bấm quay lại cuộn list vào khung nhìn', 'true', `top ${Math.round(after ?? -999)}`, inView);
}

console.log('');
console.log(fails === 0 ? 'PASS — H3 + H6 da duoc sua.' : `FAIL — ${fails} truong hop sai.`);
if (fails > 0) process.exitCode = 1;
await b.close();
