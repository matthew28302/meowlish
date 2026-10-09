// Production phuc vu ban build nao? Do bang marker client-side (chu ASCII) cua tung commit.
// Email template / adminAuth la SERVER-side nen KHONG xuat hien trong bundle —
// khong dung lam marker (probe cu sai).
const BASE = process.env.PROBE_BASE || 'https://meowlish.io.vn';

const html = await (await fetch(`${BASE}/pet`)).text();
const scripts = [...new Set([...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => new URL(m[1], BASE).href))];
const css = [...new Set([...html.matchAll(/<link[^>]*href="([^"]+\.css)"/g)].map((m) => new URL(m[1], BASE).href))];

let allJs = '';
for (const s of scripts) allJs += await (await fetch(s)).text().catch(() => '');
let allCss = '';
for (const c of css) allCss += await (await fetch(c)).text().catch(() => '');
const blob = allJs + allCss;

// Marker CHI co o client-side, la chu ASCII nen khong bi escape trong bundle.
const MARKERS = [
  ['bd7136c 06:18 ICT', 'tap-target', 'class tap-target (639b252)'],
  ['639b252 ~06:1x', 'overscroll-none', 'placeholder de kiem chung co hieu luc'],
  ['3eee66f', 'prefers-reduced-motion', 'block reduced-motion trong globals.css'],
  ['5aa5820 10:48 ICT', 'bottom-full mb-2 z-50', 'fix menu "Them"'],
  ['CAN DUNG', 'top-full mt-2 z-50', 'layout menu CU (khong con sau fix)'],
];

console.log(`Quet ${scripts.length} script + ${css.length} css\n`);
console.log('| Marker | Chuoi | Ket qua |');
console.log('|---|---|---|');
for (const [where, needle, desc] of MARKERS) {
  const hit = blob.includes(needle);
  console.log(`| ${where} | \`${needle}\` | ${hit ? 'CO' : 'KHONG'} — ${desc} |`);
}

const r = await fetch(`${scripts[0]}`, { method: 'HEAD' });
console.log(`\nBuild gan nhat : ${r.headers.get('last-modified')}`);
console.log(`Age            : ${r.headers.get('age')} giay`);
console.log(`\n=> Build tren production ${blob.includes('bottom-full mb-2 z-50') ? 'CO' : 'KHONG'} commit 5aa5820 (10:48 ICT)`);
console.log(`=> Commit 5aa5820 da duoc build luc 13:13 ICT (06:13 GMT). Neu bundle van co layout CU,`);
console.log(`   nghia la Vercel build tu commit CU — dung nut "Redeploy" cua mot deployment CU.`);