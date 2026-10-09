// Kiểm chứng 2 fix pet page (2026-10-09):
//   1. Menu "Thêm" mở LÊN TRÊN (bottom-full) — không rơi ra ngoài viewport
//   2. Coins: GET-read không đè localStorage (read-your-writes)
import { chromium } from 'playwright';

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 393, height: 852 } });

const login = await ctx.request.post(`${BASE}/api/auth`, {
  data: { action: 'login', username: 'demo', password: '123456' },
});
const sc = login.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie')?.value ?? '';
const [n, ...r] = sc.split(';')[0].split('=');
if (n) await ctx.addCookies([{ name: n, value: r.join('='), url: BASE }]);

const p = await ctx.newPage();
await p.goto(`${BASE}/pet`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(3000);
await p.evaluate(async () => {
  const res = await fetch('/api/auth?userId=user_demo_default', { credentials: 'same-origin' });
  const d = await res.json().catch(() => null);
  if (d?.user) localStorage.setItem('english_for_me_user', JSON.stringify(d.user));
  localStorage.removeItem('english_for_me_logged_out');
});
await p.goto(`${BASE}/pet`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(5000);

// Guest gate + AuthModal đè lên (fix H5: children vẫn trong DOM) — đóng modal
// trước khi bấm Thêm. Escape giờ đóng được nhờ focus-trap (gỡ cả gate).
const modalVisible = await p.evaluate(() => {
  const m = document.querySelector('[role="dialog"]');
  return !!m && getComputedStyle(m).display !== 'none';
});
if (modalVisible) {
  await p.keyboard.press('Escape');
  await p.waitForTimeout(800);
  // Nếu Escape không đóng được (focus chưa trong modal), bấm nút Đóng cửa sổ.
  const stillOpen = await p.evaluate(() => {
    const m = document.querySelector('[role="dialog"]');
    return !!m && getComputedStyle(m).display !== 'none';
  });
  if (stillOpen) {
    const closeBtn = p.locator('[role="dialog"] button', { hasText: /Đóng|X/i }).first();
    if ((await closeBtn.count()) > 0) await closeBtn.click().catch(() => {});
    await p.waitForTimeout(600);
  }
}

let fails = 0;

// --- Chuyển sang tab "Sân Vườn Linh Vật" (chứa thanh công cụ + nút "Thêm") ---
const sanctuaryTab = p.locator('button', { hasText: 'Sân Vườn Linh Vật' }).first();
if ((await sanctuaryTab.count()) === 0) {
  console.log('| tab "Sân Vườn Linh Vật" tồn tại                        | true | false | FAIL |');
  fails++;
} else {
  await sanctuaryTab.click();
  await p.waitForTimeout(3000);
}
const row = (check, expected, actual, ok) => {
  if (!ok) fails++;
  console.log(`| ${check.padEnd(48)} | ${expected} | ${actual} | ${ok ? 'PASS' : 'FAIL'} |`);
};

console.log('| Kiem tra | Mong doi | Thuc te | Ket qua |');
console.log('|---|---|---|---|');

// --- Fix 1: menu "Thêm" mở lên trên ---
const moreBtn = p.locator('button[aria-haspopup="menu"]').first();
const hasMore = (await moreBtn.count()) > 0;
row('nut Them (aria-haspopup=menu) ton tai', 'true', hasMore, hasMore);

if (hasMore) {
  const btnR = await moreBtn.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
  });
  row('nut Them nam gan day man hinh', '< 852', `${btnR.bottom}`, btnR.bottom <= 852);

  await moreBtn.click();
  await p.waitForTimeout(700);

  const menu = await p.evaluate(() => {
    const m = document.querySelector('[role="menu"]');
    if (!m) return null;
    const r = m.getBoundingClientRect();
    const s = getComputedStyle(m);
    return {
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      height: Math.round(r.height),
      position: s.position,
      inViewport: r.top >= 0 && r.bottom <= window.innerHeight,
      itemCount: m.querySelectorAll('[role="menuitem"]').length,
      // Toàn bộ menu nằm trong viewport?
      fullyVisible: r.top >= 0 && r.bottom <= window.innerHeight + 1,
    };
  });

  if (menu) {
    row(`menu mo co ${menu.itemCount} muc`, '5', menu.itemCount, menu.itemCount === 5);
    row('menu MO LEN TREN (top < nut Them)', 'true', `menu.top=${menu.top} < btn.top=${btnR.top}`, menu.top < btnR.top);
    row('menu toan bo trong viewport', 'true', `top=${menu.top} bottom=${menu.bottom}`, menu.fullyVisible);
    row('menu khong bi cat (bottom <= 852)', 'true', menu.bottom, menu.bottom <= 852);

    // A/B: đo lại với class CŨ (top-full mt-2) để chứng minh layout cũ bị vỡ.
    const oldPos = await p.evaluate(() => {
      const m = document.querySelector('[role="menu"]');
      if (!m) return null;
      m.classList.remove('bottom-full', 'mb-2');
      m.classList.add('top-full', 'mt-2');
      const r = m.getBoundingClientRect();
      const res = { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight };
      // trả lại class gốc để không để lại trạng thái lệch
      m.classList.remove('top-full', 'mt-2');
      m.classList.add('bottom-full', 'mb-2');
      return res;
    });
    if (oldPos) {
      row('layout CU (top-full) bi cat ben duoi viewport', `bottom > 852`, `bottom=${oldPos.bottom} (vh=${oldPos.vh})`, oldPos.bottom > oldPos.vh);
      row('layout MOI giu duoc so voi layout CU', 'bottom giam', `${oldPos.bottom} -> ${menu.bottom}`, menu.bottom < oldPos.bottom);
    }

    // Escape đóng menu (WAI-ARIA menu pattern)
    await p.keyboard.press('Escape');
    await p.waitForTimeout(500);
    const closedByEsc = await p.evaluate(() => !document.querySelector('[role="menu"]'));
    row('Escape dong duoc menu', 'true', closedByEsc, closedByEsc);
  } else {
    row('menu role=menu mo duoc', 'true', 'khong tim thay', false);
  }

  // Đóng menu lại (nếu còn mở)
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
}

// --- Fix 2: coins read-your-writes ---
const coins = await p.evaluate(() => {
  const raw = localStorage.getItem('english_for_me_user');
  const parsed = raw ? JSON.parse(raw) : null;
  // Số xu HIỂN THỊ trên trang (toolbar/header), định dạng có dấu phân cách nghìn
  const shown = [...document.querySelectorAll('*')]
    .filter((e) => e.children.length === 0)
    .map((e) => (e.textContent || '').trim())
    .filter((t) => /^\d{1,3}([.,]\d{3})+$/.test(t));
  return { stored: parsed?.coins, shown };
});
row('localStorage con luu coins (khong bi xoa/ghi 1000)', 'true', String(coins.stored ?? 'null'), coins.stored !== undefined && coins.stored !== null);
row('khong co gia tri 1000 ma thuat khi DB khac', 'true', String(coins.stored), coins.stored !== 1000);
// Số hiển thị phải khớp số trong localStorage (định dạng 8.541).
const coinNum = Number(coins.stored ?? -1);
const candidates = [coinNum.toLocaleString('en-US'), coinNum.toLocaleString('vi-VN'), String(coinNum)];
row(
  'so xu HIEN THI khop localStorage',
  candidates.join(' | '),
  JSON.stringify(coins.shown),
  coins.shown.some((t) => candidates.includes(t))
);

console.log('');
console.log(fails === 0 ? 'PASS — menu mo len tren + coins read-your-writes.' : `FAIL — ${fails} truong hop sai.`);
if (fails > 0) process.exitCode = 1;
await b.close();
