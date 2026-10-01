/**
 * Đo lại silhouette trên /fitcheck (pet trần, nền trắng) — metric robust:
 * mỗi hàng lấy DÀI CHUỖI LIỀN MẠCH DÀI NHẤT (chống tay/đuôi/arnings chệch),
 * và dùng median thay vì p90.
 * Xuất scripts/_fit-data.json
 */
import { chromium } from 'playwright';
import fs from 'fs';

const SPECIES = ['owl','cat','dog','fox','panda','bunny','hello_kitty','kuromi','cinnamoroll','my_melody','pompompurin','keroppi','chopper','karoo','bepo','kurama','pakkun','gamakichi','hedwig','crookshanks','fawkes','goose','rocket','alligator_loki','doraemon','dorami','kirby'];

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
page.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 200)));
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

const data = await page.evaluate(async (SPECIES) => {
  const N = 6; // 6 px / unit -> 384x384
  const out = {};
  const cells = Array.from(document.querySelectorAll('.grid > div'));

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
          c.width = 64 * N; c.height = 64 * N;
          const g = c.getContext('2d');
          g.clearRect(0, 0, c.width, c.height);
          g.drawImage(img, 0, 0, c.width, c.height);
          resolve({ data: g.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height });
        } catch (e) { resolve({ error: String(e) }); }
      };
      img.onerror = () => resolve({ error: 'img.onerror' });
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    });

  for (const sp of SPECIES) {
    const cell = cells.find((c) => (c.innerText || '').split('\n')[0].trim() === sp);
    if (!cell) { out[sp] = { error: 'no-cell' }; continue; }
    const svg = cell.querySelector('svg[viewBox="0 0 64 64"]');
    if (!svg) { out[sp] = { error: 'no-svg' }; continue; }

    const r = await rasterize(svg);
    if (r.error) { out[sp] = { error: r.error }; continue; }
    const { data, w, h } = r;

    // mask alpha>=100 (loại bóng rgba .18 = alpha 46)
    const mask = new Uint8Array(w * h);
    let top = -1, bottom = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] >= 100) { mask[y * w + x] = 1; if (top < 0) top = y; bottom = y; }
      }
    }
    if (top < 0) { out[sp] = { error: 'empty' }; continue; }

    const u = 1 / N;
    // mỗi hàng: chuỗi liền mạch dài nhất (start, len)
    const runs = [];
    for (let y = 0; y < h; y++) {
      let best = { s: -1, l: 0 }, cur = -1;
      for (let x = 0; x <= w; x++) {
        const on = x < w && mask[y * w + x] === 1;
        if (on && cur < 0) cur = x;
        if (!on && cur >= 0) { if (x - cur > best.l) best = { s: cur, l: x - cur }; cur = -1; }
      }
      runs.push(best);
    }

    const bodyTop = top * u;
    const bodyBottom = (bottom + 1) * u;

    // ---- Tách ĐẦU / THÂN bằng đường cổ: tìm đỉnh rộng nhất của đầu,
    //     rồi quét xuống tới khi bề rộng sụt dưới 60% -> đó là đường cổ.
    //     Band outfit bắt đầu từ đường cổ (tránh tai/cánh thõng xuống ô nhiễm số đo).
    const bodyH = bottom - top + 1;
    const headScanEnd = top + Math.round(bodyH * 0.6);
    let yMax = top, maxW = 0;
    for (let y = top; y <= Math.min(headScanEnd, bottom); y++) {
      const rr = runs[y];
      if (rr.l > maxW) { maxW = rr.l; yMax = y; }
    }
    let neckY = -1;
    if (maxW > 0) {
      for (let y = yMax; y <= bottom; y++) {
        if (runs[y].l > 0 && runs[y].l < maxW * 0.6) { neckY = y; break; }
      }
    }
    if (neckY < 0) neckY = top + Math.round(bodyH * 0.45); // fallback

    // ---- BAND OUTFIT: từ đường cổ, nhưng tối đa 14.5 unit (cao outfit canonical) ----
    const bandBottomPx = bottom;
    const bandTopPx = Math.max(neckY, top, bottom - Math.round(14.5 / u));
    const band = [];
    for (let y = bandTopPx; y <= bandBottomPx; y++) {
      const rr = runs[y];
      if (rr.l <= 0) continue;
      band.push({ w: rr.l * u, c: (rr.s + rr.l / 2) * u });
    }
    const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
    const torsoWidth = med(band.map((b) => b.w));
    const torsoCenterX = med(band.map((b) => b.c));

    // ---- HEAD: 14 unit đầu ----
    const headBotPx = Math.min(bottom, top + Math.round(14 / u));
    const head = [];
    for (let y = top; y <= headBotPx; y++) { const rr = runs[y]; if (rr.l > 0) head.push(rr.l * u); }
    const headWidth = head.length ? Math.max(...head) : 0;
    const headTopWidth = runs[top].l > 0 ? runs[top].l * u : 0;
    // độ rộng tại đỉnh đầu +3 unit (vị trí đặt vành mũ)
    const yAt3 = Math.min(h - 1, top + Math.round(3 / u));
    const headAt3 = runs[yAt3].l > 0 ? runs[yAt3].l * u : 0;

    out[sp] = {
      bodyTop: +bodyTop.toFixed(2),
      bodyBottom: +bodyBottom.toFixed(2),
      neckY: +(neckY * u).toFixed(2),
      maxHeadW: +(maxW * u).toFixed(2),
      torsoWidth: +torsoWidth.toFixed(2),
      torsoCenterX: +torsoCenterX.toFixed(2),
      headWidth: +headWidth.toFixed(2),
      headTopWidth: +headTopWidth.toFixed(2),
      headAt3: +headAt3.toFixed(2),
    };
  }
  return out;
}, SPECIES);

fs.writeFileSync('scripts/_fit-data.json', JSON.stringify(data, null, 2));
console.log('species          | top   | bot   | neckY | torsoW | torsoCX | maxHeadW');
for (const [sp, d] of Object.entries(data)) {
  if (d.error) { console.log(`${sp.padEnd(16)} ERROR ${d.error}`); continue; }
  console.log(
    `${sp.padEnd(16)} ${String(d.bodyTop).padStart(5)} ${String(d.bodyBottom).padStart(5)} ${String(d.neckY).padStart(5)} ${String(d.torsoWidth).padStart(6)} ${String(d.torsoCenterX).padStart(7)} ${String(d.maxHeadW).padStart(7)}`
  );
}
await browser.close();
