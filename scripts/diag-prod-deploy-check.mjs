// Prod da deploy ban moi chua? + tuoi deploy.
const BASE = process.env.PROBE_BASE || 'https://meowlish.io.vn';
const html = await (await fetch(`${BASE}/pet`)).text();
const srcs = [...new Set([...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]))];

let warn = null;
let menuNew = null;
let menuOld = null;
for (const s of srcs) {
  const js = await (await fetch(`${BASE}${s}`)).text();
  if (js.includes('Chua dat bien moi truong ADMIN_EMAIL')) warn = s;
  if (js.includes('bottom-full mb-2 z-50')) menuNew = s;
  if (js.includes('top-full mt-2 z-50')) menuOld = s;
}
console.log('bundle co CANH BAO ADMIN_EMAIL moi :', warn || 'KHONG (deploy cu)');
console.log('bundle co LAYOUT MENU moi          :', menuNew || 'KHONG (deploy cu)');
console.log('bundle co LAYOUT MENU cu           :', menuOld || 'KHONG');

const r = await fetch(`${BASE}${srcs[0]}`, { method: 'HEAD' });
console.log('build gan nhat (last-modified)    :', r.headers.get('last-modified'));
console.log('age (giay)                        :', r.headers.get('age'));
console.log('x-vercel-id                       :', r.headers.get('x-vercel-id'));