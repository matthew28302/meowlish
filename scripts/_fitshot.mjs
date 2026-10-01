/** Chụp trang fitcheck. Usage: node scripts/_fitshot.mjs [scale] */
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:3000';
fs.mkdirSync('scratch/fit', { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 250)));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSERR', m.text().slice(0, 250)); });

await page.goto(BASE + '/fitcheck', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(3000);

for (let i = 0; i < 8; i++) {
  const did = await page.evaluate(() => {
    const m = document.querySelector('.z-\\[10000\\]');
    const b = m && m.querySelector('button[title]');
    if (b) { b.click(); return true; }
    return false;
  });
  await page.waitForTimeout(400);
  if (!did) break;
}
await page.waitForTimeout(800);

await page.screenshot({ path: 'scratch/fit/overview.png', fullPage: true });
console.log('saved scratch/fit/overview.png');

// chụp từng hàng để nhìn rõ hơn
const cells = await page.$$('.grid > div');
console.log('cells:', cells.length);
for (let i = 0; i < cells.length; i++) {
  try {
    await cells[i].scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
    const label = await cells[i].evaluate((e) => (e.innerText || '').split('\n')[0]);
    await cells[i].screenshot({ path: `scratch/fit/${String(i).padStart(2, '0')}-${label}.png` });
  } catch (e) { /* skip */ }
}
console.log('done');
await browser.close();
