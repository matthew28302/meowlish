// Đo layout ĐÃ ĐĂNG NHẬP — không phải modal đăng nhập.
//
// Bản đầu đo `/` với khách và nhận 8 nút / 1 link vì modal đăng nhập tự mở và che
// toàn bộ app shell. Đo modal là vô nghĩa cho câu hỏi về thanh trên.
//
// Cách đúng: gọi API đăng nhập để lấy cookie phiên, nhét cookie vào context,
// rồi mới tải trang. Đo theo HÌNH HỌC — không dựa vào selector, vì không biết
// chắc markup dùng thẻ nào.
import { chromium } from 'playwright';

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const USER = process.env.PROBE_USER || 'demo';
const PASS = process.env.PROBE_PASS || '123456';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });

// 1. Đăng nhập lấy cookie.
const res = await ctx.request.post(`${BASE}/api/auth`, {
  data: { action: 'login', username: USER, password: PASS },
});
if (!res.ok()) {
  console.log(`DANG NHAP THAT BAI: HTTP ${res.status()}`);
  console.log(await res.text().catch(() => ''));
  await browser.close();
  process.exit(1);
}
const setCookie = res.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie')?.value || '';
const pair = setCookie.split(';')[0];
const [cname, ...rest] = pair.split('=');
console.log(`Dang nhap OK. Cookie nhan ten "${cname}" (gia tri KHONG in ra).`);
await ctx.addCookies([
  { name: cname, value: rest.join('='), url: BASE },
]);

const results = [];
const record = (item, expected, actual, verdict) => {
  results.push({ item, expected, actual, verdict });
  console.log(`| ${item} | ${expected} | ${actual} | ${verdict} |`);
};

/**
 * App dùng CẢ cookie lẫn localStorage: `getCurrentUser()` đọc localStorage, còn
 * API xác thực bằng cookie. Chỉ đặt cookie thì client vẫn thấy khách và mở modal
 * đăng nhập — đó là hành vi đúng, không phải lỗi. Phải dựng cả hai.
 */
async function signedInPage(browser, path, width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const login = await ctx.request.post(`${BASE}/api/auth`, {
    data: { action: 'login', username: USER, password: PASS },
  });
  const sc = login.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie')?.value || '';
  const [n, ...r] = sc.split(';')[0].split('=');
  await ctx.addCookies([{ name: n, value: r.join('='), url: BASE }]);

  const page = await ctx.newPage();
  // Nạp trang trước để có cùng origin, rồi ghi localStorage và tải lại.
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.evaluate(async () => {
    const who = await fetch('/api/auth?userId=user_demo_default', { credentials: 'same-origin' });
    const j = await who.json().catch(() => null);
    const u = j?.user;
    if (!u) return;
    localStorage.setItem('english_for_me_user', JSON.stringify(u));
    localStorage.removeItem('english_for_me_logged_out');
  });
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  return { ctx, page };
}

async function measure(page, vw) {
  return page.evaluate((width) => {
    const boxes = [...document.querySelectorAll('button, a[href], [role="button"], input')]
      .map((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          label: (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30),
          left: Math.round(r.left),
          right: Math.round(r.right),
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          w: Math.round(r.width),
          h: Math.round(r.height),
          hidden: s.visibility === 'hidden' || s.opacity === '0' || s.display === 'none',
        };
      })
      .filter((x) => !x.hidden && x.w > 0 && x.h > 0);

    // Cụm control trên cùng: phần tử tương tác có `top` nhỏ nhất.
    const topBand = boxes.filter((x) => x.top < 72 && x.bottom > 0);
    const offscreen = boxes.filter((x) => x.right > width + 1 || x.left < -1);
    // Vùng chạm nhỏ hơn 44px.
    const small = boxes.filter((x) => x.w < 44 || x.h < 44);

    return {
      soControl: boxes.length,
      topBand: topBand.length,
      topBandNgoai: topBand.filter((x) => x.right > width + 1).length,
      ngoaiMep: offscreen.length,
      viDuNgoai: offscreen.slice(0, 8),
      nhoHon44: small.length,
      viDuNho: small.slice(0, 6),
      docScrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    };
  }, vw);
}

console.log('');
console.log('=== THANH TREN — do bang hinh hoc, da dang nhap ===');
console.log('| Item | Mong doi | Thuc te | Ket qua |');
console.log('|---|---|---|---|');

for (const [name, width, height] of [
  ['GalaxyFold', 344, 882],
  ['GalaxyS20', 360, 800],
  ['iPhoneSE', 375, 667],
  ['iPhone15Pro', 393, 852],
]) {
  const { ctx: c2, page } = await signedInPage(browser, '/', width, height);

  const m = await measure(page, width);
  if (m.soControl < 20) {
    record(`${name} ${width}px — do duoc app shell`, '>= 20 control', `${m.soControl} control`, 'KHONG DO DUOC');
    await c2.close();
    continue;
  }
  record(`${name} ${width}px — control lot ngoai mep phai`, 0, m.ngoaiMep, m.ngoaiMep === 0 ? 'PASS' : 'LOI');
  record(`${name} ${width}px — control trong thanh tren lot`, 0, m.topBandNgoai, m.topBandNgoai === 0 ? 'PASS' : 'LOI');
  record(`${name} ${width}px — trang tran ngang`, 0, Math.max(0, m.docScrollW - m.clientW), m.docScrollW === m.clientW ? 'PASS' : 'LOI');
  if (m.ngoaiMep > 0) {
    console.log(`       (${m.viDuNgoai.map((o) => `"${o.label || o.tag}" ${o.w}x${o.h} @[${o.left}..${o.right}]`).join(' | ')})`);
  }
  console.log(`       (thi co ${m.soControl} control, ${m.nhoHon44} nho hon 44px)`);
  if (m.nhoHon44 > 0) console.log(`       (vi du nho: ${m.viDuNho.map((o) => `"${o.label || o.tag}" ${o.w}x${o.h}`).join(' | ')})`);
  await c2.close();
}

await browser.close();

console.log('');
const loi = results.filter((r) => r.verdict === 'LOI');
const pass = results.filter((r) => r.verdict === 'PASS');
const und = results.filter((r) => r.verdict === 'KHONG DO DUOC');
console.log(`PASS ${pass.length} | LOI ${loi.length} | KHONG DO DUOC ${und.length}`);
if (loi.length) console.log('\nCan sua:'); for (const l of loi) console.log(`  - ${l.item}: ${l.actual}`);