/** Chụp zoom từng sprite pet (DPR cao) để đánh giá fit đồ. */
import { chromium, devices } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:3000';
const OUT = process.argv[3] || 'scratch/zoom';
const SPECIES_FILTER = process.argv[4] || null; // substring filter

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 4 });
const page = await ctx.newPage();
await page.goto(BASE + '/pet-test', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(2500);
// dismiss auth modal
for (let i = 0; i < 6; i++) {
  const did = await page.evaluate(() => {
    const m = document.querySelector('.z-\\[10000\\]');
    const b = m && m.querySelector('button[title]');
    if (b) { b.click(); return true; }
    return false;
  });
  await page.waitForTimeout(500);
  if (!did) break;
}
await page.waitForTimeout(800);

const items = await page.evaluate(() => {
  const svgs = Array.from(document.querySelectorAll('svg[viewBox="0 0 64 64"]'));
  return svgs.map((svg, i) => {
    const r = svg.getBoundingClientRect();
    // tìm tiêu đề gần nhất phía trên
    let node = svg;
    let label = '';
    for (let d = 0; d < 6 && node; d++) {
      node = node.parentElement;
      if (!node) break;
      const t = (node.innerText || '').replace(/\s+/g, ' ').trim();
      if (t && t.length < 90) { label = t; break; }
    }
    return { i, label, x: r.x, y: r.y, w: r.width, h: r.height };
  });
});

console.log(`found ${items.length} sprites`);
let saved = 0;
for (const it of items) {
  if (it.w < 8 || it.h < 8) continue;
  if (it.y < 0 || it.y > 900) continue;
  if (SPECIES_FILTER && !it.label.toLowerCase().includes(SPECIES_FILTER.toLowerCase())) continue;
  const pad = 6;
  const clip = {
    x: Math.max(0, it.x - pad),
    y: Math.max(0, it.y - pad),
    width: Math.min(1440 - Math.max(0, it.x - pad), it.w + pad * 2),
    height: it.h + pad * 2,
  };
  const name = `${OUT}-${String(it.i).padStart(2, '0')}.png`;
  try {
    await page.screenshot({ path: name, clip });
    console.log(`  saved ${name} :: ${it.label.slice(0, 60)}`);
    saved++;
  } catch (e) {
    console.log(`  skip ${it.label.slice(0, 40)} :: ${String(e).slice(0, 60)}`);
  }
}
console.log('total saved:', saved);
await browser.close();
