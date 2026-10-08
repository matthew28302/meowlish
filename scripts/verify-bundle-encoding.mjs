// Trang client-render: server HTML chỉ có shell loading, chữ tiếng Việt nằm
// trong JS bundle. Phải kiểm tra bundle, không chỉ HTML.
import { mojibakeScore } from './lib/cp1252.mjs';

const BASE = 'https://www.meowlish.io.vn';

const html = await (await fetch(BASE + '/')).text();
const chunks = [...new Set([...html.matchAll(/\/_next\/static\/[^"'\\\s]+\.js/g)].map((m) => m[0]))];
console.log(`Tim thay ${chunks.length} chunk JS\n`);

let totalBad = 0;
for (const c of chunks) {
  const res = await fetch(BASE + c);
  if (!res.ok) continue;
  const text = await res.text();
  const score = mojibakeScore(text);
  if (score > 0) {
    totalBad += score;
    // In một mẫu để đối chiếu bằng mắt.
    const m = /[À-ÿ][\x80-\xbf¡¢£¤¥¦§¨©ª«­®¯°±²³´µ¶·¸¹º»¼½¾¿]{1,4}/.exec(text);
    console.log(`  MOJIBAKE ${String(score).padStart(5)}  ${c}`);
    if (m) console.log(`             vi du: ${JSON.stringify(m[0])}`);
  } else {
    console.log(`  sach          ${c.slice(-28)}`);
  }
}

console.log(`\nTong diem mojibake trong bundle: ${totalBad}`);
console.log(totalBad > 0 ? '=> PRODUCTION DANG HONG' : '=> Bundle sach');
