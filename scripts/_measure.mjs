/**
 * Đo hình dáng thân (silhouette) của 27 loài pet trực tiếp trong browser,
 * từ đó tính anchor fit cho quần áo.
 *
 * Bước 1: render SVG ra canvas (transparent bg) -> mask = alpha >= 100 (loại bóng rgba .18)
 * Bước 2: tính bodyTop/bodyBottom, và band 16 unit cuối (đúng chiều cao áo canonical y38..54)
 * Bước 3: xuất scripts/_fit-data.json
 *
 * Usage: node scripts/_measure.mjs [url]
 */
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.argv[2] || 'http://localhost:3000';
const SPECIES = ['owl','cat','dog','fox','panda','bunny','hello_kitty','kuromi','cinnamoroll','my_melody','pompompurin','keroppi','chopper','karoo','bepo','kurama','pakkun','gamakichi','hedwig','crookshanks','fawkes','goose','rocket','alligator_loki','doraemon','dorami','kirby'];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 200)));

await page.goto(BASE + '/pet-test', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(2500);

// đóng modal đăng nhập
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
await page.waitForTimeout(600);

const data = await page.evaluate(async (SPECIES) => {
  const N = 4; // 4 px per unit -> 256x256
  const out = {};

  const svgs = Array.from(document.querySelectorAll('svg[viewBox="0 0 64 64"]'));

  const getLabel = (svg) => {
    let n = svg.parentElement;
    for (let d = 0; d < 7 && n; d++) {
      const t = (n.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean);
      if (t.length >= 1 && t[0].length < 40) return t[0];
      n = n.parentElement;
    }
    return '';
  };

  const rasterize = (svg) =>
    new Promise((resolve) => {
      const clone = svg.cloneNode(true);
      clone.setAttribute('width', String(64 * N));
      clone.setAttribute('height', String(64 * N));
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const xml = new XMLSerializer().serializeToString(clone);
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = 64 * N;
          c.height = 64 * N;
          const g = c.getContext('2d');
          g.clearRect(0, 0, c.width, c.height);
          g.drawImage(img, 0, 0, c.width, c.height);
          resolve({ data: g.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height });
        } catch (e) {
          resolve({ error: String(e) });
        }
      };
      img.onerror = () => resolve({ error: 'img.onerror' });
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    });

  for (const sp of SPECIES) {
    const svg = svgs.find((s) => getLabel(s) === sp);
    if (!svg) { out[sp] = { error: 'not-found' }; continue; }

    const r = await rasterize(svg);
    if (r.error) { out[sp] = { error: r.error }; continue; }

    const { data, w, h } = r;
    const rows = new Array(h).fill(-1); // min x
    const rowsMax = new Array(h).fill(-1);
    let top = -1, bottom = -1;
    for (let y = 0; y < h; y++) {
      let mn = -1, mx = -1;
      for (let x = 0; x < w; x++) {
        const a = data[(y * w + x) * 4 + 3];
        if (a >= 100) { if (mn < 0) mn = x; mx = x; }
      }
      rows[y] = mn; rowsMax[y] = mx;
      if (mn >= 0) { if (top < 0) top = y; bottom = y; }
    }
    if (top < 0) { out[sp] = { error: 'empty' }; continue; }

    const u = 1 / N; // 1 px = u units
    const bodyTop = top * u;
    const bodyBottom = (bottom + 1) * u;

    // ---- band áo: 16 unit cuối (canonical height y38..54) ----
    const bandTopPx = Math.max(top, Math.round((bodyBottom - 16) / u));
    const widths = [];
    for (let y = bandTopPx; y <= bottom; y++) {
      if (rows[y] < 0) continue;
      widths.push({ y, w: (rowsMax[y] - rows[y] + 1) * u, c: ((rowsMax[y] + rows[y]) / 2) * u });
    }
    const sortedW = widths.map((x) => x.w).sort((a, b) => a - b);
    const p90 = sortedW.length ? sortedW[Math.floor(sortedW.length * 0.9)] : 0;
    // center = trung vị weighted (chống đuôi chệch)
    const totalW = widths.reduce((s, x) => s + x.w, 0);
    let acc = 0, centerX = 32;
    for (const x of widths) { acc += x.w; if (acc >= totalW / 2) { centerX = x.c; break; } }

    // ---- đầu (cho mũ): 14 unit đầu ----
    const headBotPx = Math.min(bottom, top + Math.round(14 / u));
    const headW = [];
    for (let y = top; y <= headBotPx; y++) {
      if (rows[y] < 0) continue;
      headW.push((rowsMax[y] - rows[y] + 1) * u);
    }
    const maxHeadW = headW.length ? Math.max(...headW) : 0;
    // chiều rộng ở đúng đỉnh đầu (dùng cho position mũ)
    const headTopRowW = rows[top] >= 0 ? (rowsMax[top] - rows[top] + 1) * u : 0;

    out[sp] = {
      bodyTop: +bodyTop.toFixed(2),
      bodyBottom: +bodyBottom.toFixed(2),
      bodyWidth: +(p90).toFixed(2),
      bodyCenterX: +centerX.toFixed(2),
      headTop: +bodyTop.toFixed(2),
      headWidth: +maxHeadW.toFixed(2),
      headTopWidth: +headTopRowW.toFixed(2),
      svgW: +(svg.getBoundingClientRect().width).toFixed(1),
    };
  }
  return out;
}, SPECIES);

fs.writeFileSync('scripts/_fit-data.json', JSON.stringify(data, null, 2));

console.log('species | bodyTop | bodyBottom | width | centerX | headW');
for (const [sp, d] of Object.entries(data)) {
  if (d.error) { console.log(`${sp.padEnd(17)} ERROR ${d.error}`); continue; }
  console.log(
    `${sp.padEnd(17)} ${String(d.bodyTop).padStart(6)} ${String(d.bodyBottom).padStart(6)} ${String(d.bodyWidth).padStart(6)} ${String(d.bodyCenterX).padStart(6)} ${String(d.headWidth).padStart(6)}`
  );
}

await browser.close();
