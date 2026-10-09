// Prod dang chay commit nao? Do bang chuoi danh dau co trong tung commit.
const BASE = process.env.PROBE_BASE || 'https://meowlish.io.vn';
const MARKERS = [
  ['44ee6cb', 'Dance-cat.gif', 'template email meow + GIF'],
  ['44ee6cb', 'cat-forgot.gif', 'template email meow + GIF'],
  ['639b252', 'Xóa tìm kiếm & xem tất cả', 'a11y/encyclopedia empty-state'],
  ['5aa5820', 'bottom-full mb-2 z-50', 'menu Them mo len tren'],
  ['5b57769', 'Chua dat bien moi truong ADMIN_EMAIL', 'canh bao ADMIN_EMAIL'],
];

const seen = new Map();
const collect = async (url, depth = 0) => {
  if (seen.has(url) || depth > 3) return;
  seen.set(url, true);
  let text;
  try {
    text = await (await fetch(url)).text();
  } catch {
    return;
  }
  for (const [, needle] of MARKERS) {
    if (text.includes(needle) && !text.__hits) text.__hits = new Set();
    if (text.includes(needle)) text.__hits.add(needle);
  }
  // Turbopack: cac chunk con duoc tham chieu bang duong dan tuong doi
  for (const m of text.matchAll(/"(\.\/)?(\.\.\/)?_?next\/static\/immutable\/chunks\/[A-Za-z0-9_\-./]+\.js"/g)) {
    void m;
  }
  const paths = [...text.matchAll(/static\/immutable\/chunks\/[A-Za-z0-9_\-]+\.js/g)].map((m) => m[0]);
  for (const p of new Set(paths)) await collect(new URL(p, url).href, depth + 1);
};

const html = await (await fetch(`${BASE}/pet`)).text();
const entry = [...new Set([...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => new URL(m[1], BASE).href))];
for (const e of entry) await collect(e);

// Quet lai toan bo phan da tai, tim marker
const found = new Set();
for (const url of seen.keys()) {
  const t = await (await fetch(url)).text().catch(() => '');
  for (const [sha, needle, desc] of MARKERS) {
    if (t.includes(needle)) found.add(`${sha} :: ${desc}`);
  }
}
console.log(`Da quet ${seen.size} chunk.\n`);
console.log('MARKER co tren production:');
let last = '';
for (const [sha, , desc] of MARKERS) {
  const has = [...found].some((f) => f.startsWith(sha));
  console.log(`  ${has ? 'CO ' : 'KHONG'}  ${sha}  ${desc}`);
  if (has) last = sha;
}
console.log(`\n=> Commit moi nhat ma production DA co: ${last || 'chua xac dinh'}`);