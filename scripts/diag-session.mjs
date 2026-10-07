// Vì sao modal đăng nhập vẫn mở dù cookie phiên hợp lệ?
// In TỐI ĐA metadata, không in token/email/hash.
import { chromium } from 'playwright';

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 393, height: 852 } });

const login = await ctx.request.post(`${BASE}/api/auth`, {
  data: { action: 'login', username: 'demo', password: '123456' },
});
console.log(`POST /api/auth login -> HTTP ${login.status()}`);
const setCookieHeader = login.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie')?.value || '';
const cookieName = (setCookieHeader.split(';')[0] || '').split('=')[0];
console.log(`Cookie: ${cookieName} (chi lay ten, khong in gia tri)`);
const jar = await ctx.cookies();
console.log(`Cookie jar trong context: ${jar.map((c) => c.name).join(', ') || '(rong)'}`);

const p = await ctx.newPage();
await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(3000);

const seen = await p.evaluate(async () => {
  const r = await fetch('/api/auth', { credentials: 'same-origin' });
  const j = await r.json().catch(() => null);
  return {
    status: r.status,
    keys: j ? Object.keys(j) : null,
    isAuthenticated: j?.isAuthenticated ?? j?.authenticated ?? null,
    limited: j?.limited ?? null,
    userId: j?.user?.id ?? null,
    coTokenHeader: Boolean(document.cookie),
    tenCookieDoc: document.cookie.split(';').map((s) => s.split('=')[0].trim()),
  };
});
console.log('Trong browser:', JSON.stringify(seen, null, 1));
await b.close();