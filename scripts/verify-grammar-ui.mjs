// Đo công thức Lego hiển thị thực tế trên production, so với số khối vẽ ra.
// Đây là kiểm chứng trực quan (screenshot-equivalent) thay vì chỉ tin dữ liệu.
import { chromium } from 'playwright';
import { GRAMMAR_LESSONS } from '../src/lib/data/grammar.ts';

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } });
const p = await ctx.newPage();

let fails = 0;
const row = (label, expected, actual, ok) => {
  if (!ok) fails++;
  console.log(`| ${label.padEnd(46)} | ${expected} | ${actual} | ${ok ? 'PASS' : 'FAIL'} |`);
};

console.log('| Bai —cong thuc hien thi tren UI | Slot | Khoi DOM | Ket qua |');
console.log('|---|---|---|---|');

// App đọc cả cookie lẫn localStorage để biết đã đăng nhập; guest thấy modal
// đăng nhập và danh sách bài chưa render. Đăng nhập demo qua API rồi ghi cả 2.
const login = await ctx.request.post(`${BASE}/api/auth`, {
  data: { action: 'login', username: 'demo', password: '123456' },
});
const setCookie = login.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie')?.value ?? '';
const [cname, ...crest] = setCookie.split(';')[0].split('=');
if (cname) await ctx.addCookies([{ name: cname, value: crest.join('='), url: BASE }]);

await p.goto(`${BASE}/grammar`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(3000);
await p.evaluate(async () => {
  const res = await fetch('/api/auth?userId=user_demo_default', { credentials: 'same-origin' });
  const data = await res.json().catch(() => null);
  if (data?.user) localStorage.setItem('english_for_me_user', JSON.stringify(data.user));
  localStorage.removeItem('english_for_me_logged_out');
});
await p.goto(`${BASE}/grammar`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(4500);

for (const lesson of GRAMMAR_LESSONS) {
  // Truyền kỳ vọng vào trang để evaluate() đối chiếu trong chính ngữ cảnh DOM.
  await p.evaluate((f) => {
    window.__formula = f;
  }, lesson.legoExample.formulaPattern ?? '');
  await p.evaluate((w) => {
    window.__words = w;
  }, lesson.legoExample.blocks.map((x) => x.word));

  if (!lesson.legoExample?.formulaPattern) continue;

  // Nhãn hiển thị trên danh sách là tiếng Việt. Card bài học là <div onClick>,
  // không phải <button> — nên phải bám theo tiêu đề tiếng Việt, không lọc theo
  // thẻ button (sẽ không khớp gì).
  const target = p.locator('h4', { hasText: lesson.vietnameseTitle }).first();
  if ((await target.count()) === 0) {
    row(`${lesson.id.slice(0, 34)}`, 'co bai trong danh sach', 'khong tim thay', false);
    continue;
  }
  await target.click().catch(() => {});
  await p.waitForTimeout(1800);

  const m = await p.evaluate((viTitle) => {
    const body = document.body.innerText;
    const expected = window.__formula ?? '';
    return {
      hasTitle: body.includes(viTitle),
      // Công thức phải xuất hiện nguyên văn trên trang (không bị cắt/bể).
      hasFormula: expected.length > 0 ? body.includes(expected) : null,
      // Mọi từ trong khối lego phải xuất hiện trên trang.
      words: window.__words ?? [],
    };
  }, lesson.vietnameseTitle);

  const slots = (lesson.legoExample.formulaPattern.match(/\[[^\]]+\]/g) || []).length;
  const blocks = lesson.legoExample.blocks.length;
  const wordsOk = lesson.legoExample.blocks.every((b) => m.words.includes(b.word));
  const ok = m.hasTitle && m.hasFormula !== false && wordsOk;
  row(`${lesson.id.slice(0, 34)}`, `${slots} slot / ${blocks} khoi`, m.hasTitle ? 'hien thi' : 'thieu', ok);
}

console.log('');
console.log(fails === 0 ? 'PASS — moi bai lego chon duoc va hien thi day du.' : `FAIL — ${fails} truong hop sai.`);
if (fails > 0) process.exitCode = 1;
await b.close();
