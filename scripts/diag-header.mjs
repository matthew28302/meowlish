import { chromium } from 'playwright';

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const b = await chromium.launch();

for (const width of [360, 393]) {
  const ctx = await b.newContext({ viewport: { width, height: 800 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p.waitForTimeout(3500);

  const info = await p.evaluate(() => {
    const all = [...document.querySelectorAll('button, a[href]')];
    const boxes = all
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          l: Math.round(r.left),
          rt: Math.round(r.right),
          w: Math.round(r.width),
          h: Math.round(r.height),
          label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24),
        };
      })
      .filter((x) => x.w > 0 && (x.rt > window.innerWidth + 1 || x.l < -1));

    return {
      title: document.title,
      bodyLen: document.body.innerHTML.length,
      soButton: document.querySelectorAll('button').length,
      soLink: document.querySelectorAll('a[href]').length,
      tagHeader: document.querySelectorAll('header').length,
      htmlScrollW: document.documentElement.scrollWidth,
      htmlClientW: document.documentElement.clientWidth,
      bodyScrollW: document.body.scrollWidth,
      innerW: window.innerWidth,
      ngoaiMep: boxes.length,
      viDu: boxes.slice(0, 12),
    };
  });

  console.log(`\n===== viewport ${width}px =====`);
  console.log(JSON.stringify(info, null, 1));
  await ctx.close();
}

await b.close();