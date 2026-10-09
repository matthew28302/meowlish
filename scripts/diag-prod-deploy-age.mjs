// Bao dong cao tuoi cua bundle production + header trien khai Vercel.
const BASE = process.env.PROBE_BASE || 'https://meowlish.io.vn';
const html = await (await fetch(`${BASE}/pet`)).text();
const srcs = [...new Set([...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]))];

const r = await fetch(`${BASE}${srcs[0]}`);
console.log('bundle dau tien :', srcs[0]);
console.log('last-modified  :', r.headers.get('last-modified'));
console.log('age            :', r.headers.get('age'), 'giay');
console.log('x-vercel-id    :', r.headers.get('x-vercel-id'));
console.log('x-matched-path :', r.headers.get('x-matched-path'));
console.log('server         :', r.headers.get('server'));
console.log('cf-cache-status:', r.headers.get('cf-cache-status'));

// Bundle nao chua layout menu (de biet dang phuc vu the nao)
for (const s of srcs) {
  const js = await (await fetch(`${BASE}${s}`)).text();
  if (js.includes('top-full mt-2 z-50') || js.includes('bottom-full mb-2 z-50')) {
    const cr = await fetch(`${BASE}${s}`, { method: 'HEAD' });
    console.log('\nchunk chua layout menu:', s);
    console.log('  last-modified:', cr.headers.get('last-modified'));
    console.log('  age           :', cr.headers.get('age'), 'giay');
    console.log('  la layout CU? :', js.includes('top-full mt-2 z-50'));
  }
}