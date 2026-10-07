import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const OUT = 'C:/Users/NVX/AppData/Local/Temp/opencode/shots4';
fs.mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
const width = 360;
const ctx = await b.newContext({ viewport: { width, height: 700 }, deviceScaleFactor: 2 });
const login = await ctx.request.post(`${BASE}/api/auth`, {
  data: { action: 'login', username: 'demo', password: '123456' },
});
const sc = login.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie')?.value || '';
const [n, ...r] = sc.split(';')[0].split('=');
await ctx.addCookies([{ name: n, value: r.join('='), url: BASE }]);

const p = await ctx.newPage();
await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(2500);
await p.evaluate(async () => {
  const j = await (await fetch('/api/auth?userId=user_demo_default', { credentials: 'same-origin' })).json();
  if (j?.user) localStorage.setItem('english_for_me_user', JSON.stringify(j.user));
  localStorage.removeItem('english_for_me_logged_out');
});
await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(4000);
await p.screenshot({ path: `${OUT}/header-360.png` });
await p.screenshot({ path: `${OUT}/header-360-top.png`, clip: { x: 0, y: 0, width, height: 90 } });
console.log(`Luu tai ${OUT}`);
await b.close();