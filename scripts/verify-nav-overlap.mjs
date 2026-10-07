// Kiểm chứng D3: nút hành động không bị nav dưới che.
import { chromium } from 'playwright';

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const b = await chromium.launch();

let fail = 0;
const row = (label, expected, actual) => {
  const ok = expected === actual;
  if (!ok) fail++;
  console.log(`| ${label} | ${expected} | ${actual} | ${ok ? 'PASS' : 'FAIL'} |`);
};

console.log('| Kiem tra | Mong doi | Thuc te | Ket qua |');
console.log('|---|---|---|---|');

for (const [name, width, height] of [
  ['iPhoneSE', 375, 667],
  ['iPhone15Pro', 393, 852],
]) {
  const ctx = await b.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const login = await ctx.request.post(`${BASE}/api/auth`, {
    data: { action: 'login', username: 'demo', password: '123456' },
  });
  const sc = login.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie')?.value || '';
  const [n, ...r] = sc.split(';')[0].split('=');
  await ctx.addCookies([{ name: n, value: r.join('='), url: BASE }]);

  const p = await ctx.newPage();
  await p.goto(`${BASE}/flashcards`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p.waitForTimeout(3000);
  await p.evaluate(async () => {
    const who = await fetch('/api/auth?userId=user_demo_default', { credentials: 'same-origin' });
    const j = await who.json().catch(() => null);
    if (j?.user) localStorage.setItem('english_for_me_user', JSON.stringify(j.user));
    localStorage.removeItem('english_for_me_logged_out');
  });
  await p.goto(`${BASE}/flashcards`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p.waitForTimeout(4000);

  // Scroll tới cuối vùng nội dung (main, không phải window).
  await p.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTop = main.scrollHeight;
  });
  await p.waitForTimeout(1000);

  const m = await p.evaluate(() => {
    const nav = document.querySelector('nav');
    if (!nav) return { navTop: null };
    const navR = nav.getBoundingClientRect();
    const navTop = Math.round(navR.top);

    const buttons = [...document.querySelectorAll('button')];
    const overlapped = buttons.filter((b) => {
      const r = b.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      const s = getComputedStyle(b);
      if (s.visibility === 'hidden' || s.display === 'none') return false;
      // Chỉ tính nếu tâm nút thực sự nằm trong vùng nav (kiểm bằng elementFromPoint).
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (cy < navTop) return false;
      const hit = document.elementFromPoint(cx, cy);
      return hit !== b && !b.contains(hit);
    });
    return {
      navTop,
      navH: Math.round(navR.height),
      overlappedCount: overlapped.length,
      examples: overlapped.slice(0, 4).map((b) => (b.textContent || '').trim().slice(0, 28)),
    };
  });

  const navOk = m.navTop !== null && m.navTop >= height - 100;
  row(`${name} — nav top >= ${height - 100}`, true, navOk);
  row(`${name} — nut bi nav che`, 0, m.overlappedCount);
  if (m.overlappedCount > 0) console.log(`       (vi du: ${m.examples.join(' | ')})`);
  await ctx.close();
}

await b.close();
console.log('');
console.log(fail === 0 ? 'PASS  nav khong che nut nao.' : `FAIL  ${fail} truong hop sai.`);
if (fail > 0) process.exitCode = 1;