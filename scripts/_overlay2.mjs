/** Vẽ 2 khung lên pet trần: ĐỎ = canonical cũ, XANH = khung sau transform (petFit). */
import { chromium } from 'playwright';
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/_fit-data.json', 'utf8'));
const CANON_W = 24, CANON_BOTTOM = 53, CANON_CX = 32;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const box = (sp) => {
  const d = data[sp];
  if (!d || d.error) return null;
  const bodyH = d.bodyBottom - d.bodyTop;
  const dy = clamp(d.bodyBottom - 0.07 * bodyH - CANON_BOTTOM, -9, 2);
  const sx = clamp(d.torsoWidth / CANON_W, 0.8, 1.15);
  const effCx = CANON_CX + clamp(d.torsoCenterX - CANON_CX, -2, 2);
  const dx = effCx - CANON_CX * sx;
  return {
    x: dx + 20 * sx, y: dy + 38.5, w: 24 * sx, h: 14.5,
    sx: +sx.toFixed(3), dy: +dy.toFixed(2), dx: +dx.toFixed(2),
    torsoW: d.torsoWidth,
  };
};

fs.mkdirSync('scratch/overlay2', { recursive: true });
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 3 })).newPage();
await page.goto('http://localhost:3000/fitcheck', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(2500);
for (let i = 0; i < 8; i++) {
  const did = await page.evaluate(() => {
    const m = document.querySelector('.z-\\[10000\\]');
    const b = m && m.querySelector('button[title]');
    if (b) { b.click(); return true; }
    return false;
  });
  await page.waitForTimeout(300);
  if (!did) break;
}
await page.waitForTimeout(500);

const boxes = {};
for (const sp of Object.keys(data)) { const b = box(sp); if (b) boxes[sp] = b; }

await page.evaluate((boxes) => {
  const NS = 'http://www.w3.org/2000/svg';
  const cells = Array.from(document.querySelectorAll('.grid > div'));
  cells.forEach((cell) => {
    const label = (cell.innerText || '').split('\n')[0].trim();
    const b = boxes[label];
    const svg = cell.querySelector('svg[viewBox="0 0 64 64"]');
    if (!svg || !b) return;
    const mk = (attrs) => { const e = document.createElementNS(NS, 'rect'); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); svg.appendChild(e); };
    // đỏ: canonical cũ
    mk({ x: 20, y: 38.5, width: 24, height: 14.5, fill: 'none', stroke: '#ff0000', 'stroke-width': 0.5 });
    // xanh: khung sau transform
    mk({ x: b.x, y: b.y, width: b.w, height: b.h, fill: 'none', stroke: '#00cc44', 'stroke-width': 0.7 });
  });
}, boxes);

await page.waitForTimeout(400);
const cells = await page.$$('.grid > div');
const want = process.argv.slice(2);
for (let i = 0; i < cells.length; i++) {
  try {
    await cells[i].scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    const label = await cells[i].evaluate((e) => (e.innerText || '').split('\n')[0].trim());
    if (want.length && !want.includes(label)) continue;
    await cells[i].screenshot({ path: `scratch/overlay2/${label}.png` });
  } catch (e) { /* skip */ }
}
console.log(JSON.stringify(boxes, null, 1));
await browser.close();
