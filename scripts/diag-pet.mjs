import { chromium } from 'playwright';

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 393, height: 852 } });
const login = await ctx.request.post(`${BASE}/api/auth`, {
  data: { action: 'login', username: 'demo', password: '123456' },
});
const sc = login.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie')?.value || '';
const [n, ...r] = sc.split(';')[0].split('=');
await ctx.addCookies([{ name: n, value: r.join('='), url: BASE }]);

const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });

await p.goto(`${BASE}/pet`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(5000);

console.log(JSON.stringify(await p.evaluate(() => ({
  url: location.href,
  title: document.title,
  btn: document.querySelectorAll('button').length,
  canvas: document.querySelectorAll('canvas').length,
  bodyLen: document.body.innerHTML.length,
  coNemBong: document.body.innerHTML.toLowerCase().includes('ném bóng'),
  coThem: document.body.innerHTML.toLowerCase().includes('thêm'),
  textDau: document.body.innerText.slice(0, 300),
})), null, 1));
console.log('Loi:', errors.slice(0, 5));
await b.close();