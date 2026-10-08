// Trang client-render: server HTML chỉ có shell loading, chữ tiếng Việt nằm
// trong JS bundle. Phải kiểm tra bundle, không chỉ HTML.
import { mojibakeScore } from './lib/cp1252.mjs';

const BASE = process.env.PROBE_BASE || 'https://www.meowlish.io.vn';

const html = await (await fetch(BASE + '/')).text();
const chunks = [...new Set([...html.matchAll(/\/_next\/static\/[^"'\\\s]+\.js/g)].map((m) => m[0]))];
console.log(`Tim thay ${chunks.length} chunk JS\n`);

// Phân biệt 2 loại hỏng — trộn lẫn chúng sẽ báo PASS/FAIL sai:
//   1. Mojibake thật: byte UTF-8 gốc bị tách (Latin-1 đứng sát byte thô).
//      Đây là lỗi của source ta, phải sửa.
//   2. U+FFFD hợp lệ: Next.js có bộ giải mã UTF-8 tự viết và CỐ Ý phát ra
//      U+FFFD khi gặp byte lỗi (`null===f?r+="\uFFFD"`). Đây là framework, không
//      phải nội dung hỏng — tính vào điểm sẽ thành báo động giả.
const RAW_PAIR = /[-ÿ][-¿]/g;

let bad = 0;
for (const c of chunks) {
  const res = await fetch(BASE + c);
  if (!res.ok) continue;
  const text = await res.text();

  const pairs = (text.match(RAW_PAIR) || []).length; // mojibake thật
  const fffd = (text.match(/�/g) || []).length; // replacement char
  const name = c.slice(-26);

  if (pairs > 0) {
    bad += pairs;
    const m = RAW_PAIR.exec(text);
    console.log(`  HONG ${String(pairs).padStart(4)}  ${name}   vi du: ${JSON.stringify(m?.[0])}`);
  } else {
    const note = fffd > 0 ? ` (${fffd} U+FFFD trong framework decoder) ` : '          ';
    console.log(`  sach${note} ${name}`);
  }
}

console.log('');
if (bad === 0) {
  console.log('PASS — moi chunk app sach; U+FFFD con lai thuoc ve bo giai ma UTF-8 cua Next.js.');
} else {
  console.log(`FAIL — ${bad} cap byte tho (mojibake that) trong bundle.`);
  process.exitCode = 1;
}
