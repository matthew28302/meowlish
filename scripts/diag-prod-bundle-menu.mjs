const BASE = process.env.PROBE_BASE || 'https://meowlish.io.vn';
const html = await (await fetch(`${BASE}/pet`)).text();
const srcs = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]);
console.log('scripts:', srcs.length);
srcs.forEach((s) => console.log(' ', s));

const uniq = [...new Set(srcs)];
let bottom = null;
let top = null;
for (const s of uniq) {
  const js = await (await fetch(new URL(s, BASE).href)).text();
  if (js.includes('bottom-full mb-2 z-50')) bottom = s;
  if (js.includes('top-full mt-2 z-50')) top = s;
}
console.log('class MOI (bottom-full mb-2 z-50):', bottom || 'KHONG');
console.log('class CU  (top-full mt-2 z-50)   :', top || 'KHONG');