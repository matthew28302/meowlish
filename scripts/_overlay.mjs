/** Vẽ khung canonical của outfit (x20-44, y38.5-53) lên pet TRẦN để so alignment. */
import { chromium } from 'playwright';
import fs from 'fs';

fs.mkdirSync('scratch/overlay', { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();

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

// chèn rect khung canonical vào MỖI svg pet (chỉ svg thứ nhất trong mỗi cell = pet trần)
await page.evaluate(() => {
  const cells = Array.from(document.querySelectorAll('.grid > div'));
  cells.forEach((cell) => {
    const svgs = cell.querySelectorAll('svg[viewBox="0 0 64 64"]');
    const bare = svgs[0]; // pet trần
    if (!bare) return;
    const NS = 'http://www.w3.org/2000/svg';
    // khung outfit canonical
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', '20'); r.setAttribute('y', '38.5');
    r.setAttribute('width', '24'); r.setAttribute('height', '14.5');
    r.setAttribute('fill', 'none'); r.setAttribute('stroke', '#ff0000');
    r.setAttribute('stroke-width', '0.6');
    bare.appendChild(r);
    // đường giữa + đường đáy
    const l1 = document.createElementNS(NS, 'line');
    l1.setAttribute('x1', '0'); l1.setAttribute('x2', '64');
    l1.setAttribute('y1', '53'); l1.setAttribute('y2', '53');
    l1.setAttribute('stroke', '#ff00ff'); l1.setAttribute('stroke-width', '0.3');
    l1.setAttribute('stroke-dasharray', '2 2');
    bare.appendChild(l1);
    // grid 8 unit
    for (let g = 8; g < 64; g += 8) {
      const gl = document.createElementNS(NS, 'line');
      gl.setAttribute('x1', String(g)); gl.setAttribute('x2', String(g));
      gl.setAttribute('y1', '0'); gl.setAttribute('y2', '64');
      gl.setAttribute('stroke', 'rgba(0,0,255,0.35)'); gl.setAttribute('stroke-width', '0.2');
      bare.appendChild(gl);
      const gh = document.createElementNS(NS, 'line');
      gh.setAttribute('x1', '0'); gh.setAttribute('x2', '64');
      gh.setAttribute('y1', String(g)); gh.setAttribute('y2', String(g));
      gh.setAttribute('stroke', 'rgba(0,0,255,0.35)'); gh.setAttribute('stroke-width', '0.2');
      bare.appendChild(gh);
    }
  });
  return document.querySelectorAll('.grid > div').length;
});

await page.waitForTimeout(400);
const n = await page.evaluate(() => document.querySelectorAll('.grid > div').length);
console.log('cells:', n);

const cells = await page.$$('.grid > div');
for (let i = 0; i < cells.length; i++) {
  try {
    await cells[i].scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    const label = await cells[i].evaluate((e) => (e.innerText || '').split('\n')[0]);
    await cells[i].screenshot({ path: `scratch/overlay/${String(i).padStart(2, '0')}-${label}.png` });
  } catch (e) { /* skip */ }
}
console.log('saved');
await browser.close();
