// Review toàn bộ production: mojibake, font, metadata.
// Node xử lý UTF-8 đúng — PowerShell/Invoke-WebRequest trên Windows giải mã
// UTF-8 theo ANSI nên báo giả (hiện `?` thay cho dấu tiếng Việt).
import { mojibakeScore } from './lib/cp1252.mjs';

const BASE = process.env.PROBE_BASE || 'https://www.meowlish.io.vn';

const PAGES = [
  '/',
  '/vocabulary',
  '/grammar',
  '/encyclopedia',
  '/flashcards',
  '/exam',
  '/pet',
  '/support',
  '/bookmarks',
  '/practice/speaking',
  '/practice/writing',
  '/practice/listening',
  '/practice/roleplay',
  '/reset-password',
  '/duahau',
  '/pet-test',
  '/fitcheck',
  '/robots.txt',
  '/sitemap.xml',
];

let fails = 0;
const row = (page, check, expected, actual, ok) => {
  if (!ok) fails++;
  console.log(`| ${page.padEnd(20)} | ${check.padEnd(28)} | ${expected} | ${actual} | ${ok ? 'PASS' : 'FAIL'} |`);
};

console.log('| Trang | Kiem tra | Mong doi | Thuc te | Ket qua |');
console.log('|---|---|---|---|---|');

for (const p of PAGES) {
  let res, text;
  try {
    res = await fetch(BASE + p, { redirect: 'follow' });
    text = await res.text();
  } catch (e) {
    row(p, 'truy cap', '200', `ERR ${e.message}`.slice(0, 20), false);
    continue;
  }

  row(p, 'HTTP status', '200', res.status, res.status === 200);

  // Charset phải là utf-8. XML khai báo trong prolog, không phải header
  // (`application/xml` không bắt buộc charset) — kiểm tra đúng chỗ, tránh
  // báo FAIL giả cho sitemap.xml.
  const ctype = res.headers.get('content-type') || '';
  const isXml = /xml/.test(ctype) || p.endsWith('.xml');
  const hasUtf8 = isXml
    ? /encoding=["']?utf-8/i.test(text.slice(0, 120))
    : /charset=utf-8/i.test(ctype);
  row(p, isXml ? 'charset trong prolog' : 'charset utf-8 header', 'true', hasUtf8, hasUtf8);

  // Mojibake: ký tự Latin-1 đứng cạnh byte thô.
  const score = mojibakeScore(text);
  row(p, 'mo diem mojibake', '0', score, score === 0);

  // Thay thế U+FFFD do giải mã hỏng.
  const bad = (text.match(/�/g) || []).length;
  row(p, 'ky tu thay the U+FFFD', '0', bad, bad === 0);

  if (!p.endsWith('.txt') && !p.endsWith('.xml') && p !== '/reset-password') {
    // Metadata tiếng Việt phải ra đúng chữ.
    const t = /<title>([^<]*)<\/title>/.exec(text)?.[1] || '';
    const d = /<meta name="description" content="([^"]*)"/.exec(text)?.[1] || '';
    const titleOk = t.length > 0 && mojibakeScore(t) === 0 && /[A-Za-zÀ-ỹ]/.test(t);
    row(p, 'title tieng Viet sach', 'OK', titleOk ? 'OK' : `LOI(${t.slice(0, 18)})`, titleOk);
    const descOk = d.length > 20 && mojibakeScore(d) === 0;
    row(p, 'description sach', 'OK', descOk ? 'OK' : 'LOI', descOk);
  }

  // Font: phải có preload/biểu mẫu font, và css phải khai báo font-family.
  if (!p.endsWith('.txt') && !p.endsWith('.xml')) {
    const hasFontRef = /fonts\.googleapis\.com/.test(text) || /__variable/.test(text) || /_next\/static\/immutable\/media\/.*\.woff2/.test(text);
    row(p, 'co khai bao font', 'true', hasFontRef, hasFontRef);
    // Font files phải trả 200 (không 404 ⇒ không rơi về font hệ thống).
    const woff = [...text.matchAll(/\/_next\/static\/immutable\/media\/[a-z0-9]+\.woff2/g)].map((m) => m[0]);
    let fontOk = woff.length === 0;
    if (woff.length > 0) {
      const codes = await Promise.all(woff.map((u) => fetch(BASE + u).then((r) => r.status).catch(() => 0)));
      fontOk = codes.every((c) => c === 200);
    }
    row(p, 'font file phai 200', 'true', fontOk ? 'true' : 'LOI', fontOk);
  }
}

console.log('');
console.log(fails === 0 ? 'PASS — toan bo trang sach, dung font.' : `FAIL — ${fails} truong hop sai.`);
if (fails > 0) process.exitCode = 1;
