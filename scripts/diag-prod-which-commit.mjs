// Production phuc vu commit nao? Dung marker CLIENT-SIDE dac biet cho tung commit
// (chu ASCII, khong bi escape). KHONG dung marker da ton tai o commit cu.
import { execSync } from 'child_process';

const BASE = process.env.PROBE_BASE || 'https://meowlish.io.vn';
const HEAD = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();

// Lay HTML + noi dung cua tat ca chunk/CSS.
async function fetchAll(path) {
  const html = await (await fetch(`${BASE}${path}`)).text();
  const urls = [
    ...new Set([
      ...[...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => new URL(m[1], BASE).href),
      ...[...html.matchAll(/<link[^>]*href="([^"]+\.css)"/g)].map((m) => new URL(m[1], BASE).href),
    ]),
  ];
  let blob = html;
  for (const u of urls) blob += await (await fetch(u)).text().catch(() => '');
  return { blob, count: urls.length };
}

const pages = ['/pet', '/', '/grammar', '/encyclopedia'];
let blob = '';
let total = 0;
for (const p of pages) {
  const r = await fetchAll(p);
  blob += r.blob;
  total += r.count;
}

// Marker phai la chuoi CHI xuat hien tu commit do tro di (git log -S se xac nhan).
const MARKERS = [
  ['85fe8c1', 'khop cau', 'grammar lego — muc tieu cua ban'],
  ['3a53a91', 'WebSite', 'JSON-LD WebSite (seo)'],
  ['2523f4d', 'maskedEmail', 'maskedEmail derive'],
  ['44ee6cb', 'Dance-cat.gif', 'template email meow + GIF'],
  ['639b252', 'focus-trap|Đóng menu', 'focus trap modal'],
  ['5aa5820', 'bottom-full mb-2 z-50', 'fix menu Them'],
  ['14c53a4', 'khong co MX', 'chan gui OTP khi domain khong MX'],
];

console.log(`HEAD local      : ${HEAD}`);
console.log(`Da tai ${total} asset tu ${pages.length} trang\n`);
console.log('| Commit | Marker | Trên production? |');
console.log('|---|---|---|');

const present = [];
for (const [sha, needle, desc] of MARKERS) {
  const has = new RegExp(needle).test(blob);
  if (has) present.push(sha);
  console.log(`| ${sha} | \`${needle}\` | ${has ? 'CO ✓' : 'khong'} | ${desc} |`);
}

console.log(`\n=> Commit MOI NHAT ma production co: ${present[present.length - 1] || 'chua xac dinh'}`);
console.log(`=> HEAD can deploy: ${HEAD}`);

// last-modified cua tung asset
const html = await (await fetch(`${BASE}/pet`)).text();
const first = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)][0]?.[1];
if (first) {
  const r = await fetch(`${BASE}${first}`, { method: 'HEAD' });
  console.log(`\nAsset build luc : ${r.headers.get('last-modified')} (GMT)`);
  console.log(`Age             : ${r.headers.get('age')} giay`);
}