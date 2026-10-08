// Đo font thực sự đã apply trong browser. Đây là nơi mojibake/biến dạng chữ
// thực sự lộ ra — probe HTML không bắt được vì trang client-render.
import { chromium } from 'playwright';

const BASE = process.env.PROBE_BASE || 'https://www.meowlish.io.vn';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();

let fails = 0;
const row = (page, check, expected, actual, ok) => {
  if (!ok) fails++;
  console.log(`| ${page.padEnd(20)} | ${check.padEnd(26)} | ${expected} | ${actual} | ${ok ? 'PASS' : 'FAIL'} |`);
};

console.log('| Trang | Kiem tra | Mong doi | Thuc te | Ket qua |');
console.log('|---|---|---|---|---|');

// Font khai báo trong CSS của app.
const css = await (await fetch(BASE + '/')).text();
const fontVars = [...css.matchAll(/--font-[a-z-]+/g)].map((m) => m[0]);

for (const route of ['/', '/vocabulary', '/grammar', '/pet', '/encyclopedia', '/support']) {
  await p.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // App đăng nhập bằng cookie + localStorage; chờ React hydrate.
  await p.waitForTimeout(3500);

  const m = await p.evaluate(() => {
    // Chữ tiếng Việt có dấu ở heading — nơi lỗi font/biến dạng lộ rõ nhất.
    const pick = (sel) => document.querySelector(sel);
    const el = pick('h1, h2, h3') || pick('body');
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      text: (el.textContent || '').trim().slice(0, 44),
      family: cs.fontFamily,
      size: cs.fontSize,
      loaded: document.fonts ? document.fonts.status : 'n/a',
      // Font đã thực sự nạp chưa (không phải chỉ khai báo).
      checked: document.fonts ? document.fonts.check(`16px ${cs.fontFamily.split(',')[0]}`) : null,
    };
  });

  if (!m) {
    row(route, 'co text de do', 'OK', 'khong tim thay', false);
    continue;
  }

  // Mojibake trong DOM: byte thô còn sót lại sau khi React render.
  const domScore = (m.text.match(/[-ÿ][-¿]/g) || []).length;
  row(route, 'DOM khong mojibake', '0', domScore, domScore === 0);

  row(route, 'co font-family that', 'true', !!m.family && m.family !== 'serif', !!m.family);

  // Chữ tiếng Việt phải hiện đúng dấu. Kiểm tra trên TẤT CẢ heading chứ không
  // chỉ heading đầu tiên — heading đầu có thể là chuỗi ASCII thuần (nhãn, tên
  // nút) và khiến probe báo FAIL giả dù trang hoàn toàn sạch.
  const scan = await p.evaluate(() => {
    const heads = [...document.querySelectorAll('h1,h2,h3')].slice(0, 40);
    const texts = heads.map((h) => (h.textContent || '').trim()).filter(Boolean);
    return { total: texts.length, texts };
  });

  const hasViet = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(scan.texts.join(' '));
  row(route, `co dau Viet trong ${scan.total} heading`, 'true', hasViet, hasViet);

  row(route, 'font da nap', 'loaded', m.loaded, m.loaded === 'loaded');

  // In heading đầu để đối chiếu kết quả bằng mắt khi có FAIL.
  console.log(`| ${route.padEnd(20)} | mau heading dau          | - | ${JSON.stringify(scan.texts[0]?.slice(0, 38) ?? '(khong co)')} | - |`);
}

console.log('');
console.log('font vars trong HTML:', fontVars.length ? [...new Set(fontVars)].join(', ') : '(khong tim thay)');
console.log(fails === 0 ? 'PASS — font render dung tren tat ca trang.' : `FAIL — ${fails} truong hop sai.`);
if (fails > 0) process.exitCode = 1;

await b.close();
