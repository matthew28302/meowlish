import { chromium } from 'playwright';

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 });
const login = await ctx.request.post(`${BASE}/api/auth`, {
  data: { action: 'login', username: 'demo', password: '123456' },
});
const sc = login.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie')?.value || '';
const [n, ...r] = sc.split(';')[0].split('=');
await ctx.addCookies([{ name: n, value: r.join('='), url: BASE }]);

const p = await ctx.newPage();
await p.goto(`${BASE}/flashcards`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(3000);
await p.evaluate(async () => {
  const who = await fetch('/api/auth?userId=user_demo_default', { credentials: 'same-origin' });
  const j = await who.json().catch(() => null);
  if (j?.user) localStorage.setItem('english_for_me_user', JSON.stringify(j.user));
  localStorage.removeItem('english_for_me_logged_out');
});
await p.goto(`${BASE}/flashcards`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(4000);
await p.evaluate(() => {
  const main = document.querySelector('main');
  if (main) main.scrollTop = main.scrollHeight;
});
await p.waitForTimeout(1000);

console.log(JSON.stringify(await p.evaluate(() => {
  const main = document.querySelector('main');
  const nav = document.querySelector('nav');
  const mainR = main?.getBoundingClientRect();
  const navR = nav?.getBoundingClientRect();
  const mainStyle = main ? getComputedStyle(main) : null;
  const buttons = [...document.querySelectorAll('button')];
  const details = buttons.map((b) => {
    const r = b.getBoundingClientRect();
    return { label: (b.textContent || '').trim().slice(0, 24), top: Math.round(r.top), bottom: Math.round(r.bottom) };
  }).filter((x) => x.bottom > (navR?.top ?? 9999) - 10);

  return {
    mainPaddingBottom: mainStyle?.paddingBottom,
    mainBottom: mainR ? Math.round(mainR.bottom) : null,
    mainScrollTop: main?.scrollTop,
    mainScrollH: main?.scrollHeight,
    navTop: navR ? Math.round(navR.top) : null,
    buttonsNearNav: details,
  };
}), null, 1));

await b.close();