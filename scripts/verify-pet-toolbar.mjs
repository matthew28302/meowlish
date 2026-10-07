// Kiểm chứng D2: toolbar /pet phải có ĐÚNG 3 nút hành động + 1 nút "Thêm",
// và mọi nút phải nằm trong khung nhìn ở mọi kích thước.
import { chromium } from 'playwright';

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const b = await chromium.launch();

const ACTIONS = ['ném bóng', 'gọi bé', 'đi ngủ', 'thức dậy'];
const MORE_ITEMS = ['cho ăn', 'cửa hàng & thử đồ', 'tủ đồ', 'cảnh quan', 'đổi bé'];

let fail = 0;
const row = (label, expected, actual) => {
  const ok = expected === actual;
  if (!ok) fail++;
  console.log(`| ${label} | ${expected} | ${actual} | ${ok ? 'PASS' : 'FAIL'} |`);
};

console.log('| Kiem tra | Mong doi | Thuc te | Ket qua |');
console.log('|---|---|---|---|');

for (const [name, width, height] of [
  ['GalaxyFold', 344, 882],
  ['GalaxyS20', 360, 800],
  ['iPhoneSE', 375, 667],
  ['iPhone15Pro', 393, 852],
  ['iPadMini', 768, 1024],
  ['Desktop', 1280, 900],
]) {
  const ctx = await b.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const login = await ctx.request.post(`${BASE}/api/auth`, {
    data: { action: 'login', username: 'demo', password: '123456' },
  });
  const sc = login.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie')?.value || '';
  const [n, ...r] = sc.split(';')[0].split('=');
  await ctx.addCookies([{ name: n, value: r.join('='), url: BASE }]);

  const p = await ctx.newPage();
  await p.goto(`${BASE}/pet`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p.waitForTimeout(3000);
  // App đọc cả cookie lẫn localStorage để quyết định đăng nhập.
  await p.evaluate(async () => {
    const who = await fetch('/api/auth?userId=user_demo_default', { credentials: 'same-origin' });
    const j = await who.json().catch(() => null);
    if (j?.user) {
      localStorage.setItem('english_for_me_user', JSON.stringify(j.user));
      localStorage.removeItem('english_for_me_logged_out');
    }
  });
  await p.goto(`${BASE}/pet`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p.waitForTimeout(4000);

  // Toolbar nằm trong tab "sanctuary" — mặc định mở ở tab "farm".
  const sancTab = p.locator('button').filter({ hasText: /Sân Vườn|sanctuary|Linh Vật/i }).first();
  if (await sancTab.count() > 0) {
    await sancTab.click().catch(() => {});
    await p.waitForTimeout(2000);
  }

  const m = await p.evaluate(
    ({ vw, actions }) => {
      const btns = [...document.querySelectorAll('button')];
      const inToolbar = (label) => {
        const el = btns.find((x) => (x.textContent || '').trim().toLowerCase().includes(label));
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), inView: r.right <= vw + 1 && r.left >= -1 };
      };
      const found = actions.map((a) => ({ a, ...(inToolbar(a) || {}) }));
      const more = inToolbar('thêm');
      return { found, more, vw };
    },
    { vw: width, actions: ACTIONS }
  );

  const found = m.found.filter((x) => x.w > 0);
  row(`${name} ${width}px — so nut hanh dong hien thi`, 3, found.length);
  for (const a of found) {
    row(`${name} ${width}px — "${a.a}" lot khoi ${width}px`, true, a.inView);
    row(`${name} ${width}px — "${a.a}" cao >= 44px`, true, a.h >= 44);
  }
  row(`${name} ${width}px — co nut "Them"`, true, Boolean(m.more && m.more.w > 0));
  if (m.more) row(`${name} ${width}px — nut "Them" lot khoi`, true, m.more.inView);

  // Mở menu "Thêm" rồi kiểm tra 5 mục.
  if (m.more) {
    await p.evaluate(() => {
      const el = [...document.querySelectorAll('button')].find((x) =>
        (x.textContent || '').trim().toLowerCase().includes('thêm')
      );
      el?.click();
    });
    await p.waitForTimeout(500);
    const items = await p.evaluate((names) => {
      const menu = document.querySelector('[role="menu"]');
      if (!menu) return null;
      const out = {};
      for (const it of menu.querySelectorAll('[role="menuitem"]')) {
        const t = (it.textContent || '').trim().toLowerCase();
        const r = it.getBoundingClientRect();
        out[t.split('\n')[0].trim()] = { w: Math.round(r.width), h: Math.round(r.height), inView: r.right <= window.innerWidth + 1 };
      }
      return out;
    }, MORE_ITEMS);
    if (!items) {
      row(`${name} ${width}px — menu "Them" mo duoc`, true, false);
    } else {
      row(`${name} ${width}px — menu co du 5 muc`, 5, Object.keys(items).length);
      for (const [k, v] of Object.entries(items)) {
        row(`${name} ${width}px — muc "${k}" cao >= 44px`, true, v.h >= 44);
      }
    }
    // Đóng menu lại.
    await p.keyboard.press('Escape').catch(() => {});
    await p.evaluate(() => {
      const c = document.querySelector('button[aria-label="Đóng menu"]');
      c?.click();
    });
  }
  await ctx.close();
}

await b.close();
console.log('');
console.log(fail === 0 ? 'PASS  toolbar /pet dung 3 nut hanh dong + nut Them, vua moi khung nhin.' : `FAIL  ${fail} truong hop sai.`);
if (fail > 0) process.exitCode = 1;