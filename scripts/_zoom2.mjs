/** Chụp zoom theo TÊNG CARD (element screenshot) để tên file khớp nội dung. */
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.argv[2] || 'http://localhost:3000';
fs.mkdirSync('scratch/zoom2', { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();

const dismiss = async () => {
  for (let i = 0; i < 8; i++) {
    const did = await page.evaluate(() => {
      const m = document.querySelector('.z-\\[10000\\]');
      const b = m && m.querySelector('button[title]');
      if (b) { b.click(); return true; }
      return false;
    });
    await page.waitForTimeout(400);
    if (!did) return;
  }
};

// ---------- /pet-test: chụp từng card ----------
await page.goto(BASE + '/pet-test', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(2500);
await dismiss();
await page.waitForTimeout(800);

// Card = phần tử cha gần nhất chứa svg sprite VÀ có 2 dòng text (tên + combo)
const cards = await page.evaluate(() => {
  const svgs = Array.from(document.querySelectorAll('svg[viewBox="0 0 64 64"]'));
  const out = [];
  const seen = new Set();
  for (const svg of svgs) {
    // đi lên tìm phần tử có innerText chứa '\n' (nhiều dòng) và chứa đúng svg này
    let node = svg.parentElement;
    let card = null;
    for (let d = 0; d < 7 && node; d++) {
      const t = (node.innerText || '');
      if (t.split('\n').filter(Boolean).length >= 2 && t.length < 120) { card = node; break; }
      node = node.parentElement;
    }
    if (!card) continue;
    const label = (card.innerText || '').replace(/\s+/g, '_').replace(/[^\w\-À-ỹ]+/g, '').slice(0, 46);
    if (seen.has(label)) continue;
    seen.add(label);
    out.push({ label, handle: null, idx: out.length });
    // đánh dấu để tìm lại
    card.setAttribute('data-zoom-label', label);
  }
  return out;
});
console.log('cards found:', cards.length);

let n = 0;
for (const c of cards) {
  const handle = await page.$(`[data-zoom-label="${c.label}"]`);
  if (!handle) continue;
  try {
    await handle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const file = `scratch/zoom2/${String(n).padStart(2, '0')}-${c.label}.png`;
    await handle.screenshot({ path: file });
    console.log('  ', file);
    n++;
  } catch (e) {
    console.log('   skip', c.label, String(e).slice(0, 60));
  }
}
console.log('saved', n);

// ---------- /pet: chụp con pet trong vườn ----------
await page.goto(BASE + '/pet', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(6000);
await dismiss();
await page.waitForTimeout(1500);
const petInfo = await page.evaluate(() => {
  const svgs = Array.from(document.querySelectorAll('svg[viewBox="0 0 64 64"]'));
  const s = svgs.find((x) => { const r = x.getBoundingClientRect(); return r.width > 40 && r.width < 200 && r.top > 60; });
  if (!s) return null;
  const r = s.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
console.log('garden pet rect:', JSON.stringify(petInfo));
if (petInfo) {
  const pad = 4;
  await page.screenshot({
    path: 'scratch/zoom2/garden-pet.png',
    clip: { x: petInfo.x - pad, y: petInfo.y - pad, width: petInfo.w + pad * 2, height: petInfo.h + pad * 2 },
  });
  console.log('   scratch/zoom2/garden-pet.png');
}

await browser.close();
