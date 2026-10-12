// Render Lottie VECTOR (nguồn gốc 512×512) → GIF 440×440 cho email.
//
// Ba điểm quyết định chất lượng (đều đã sửa so với bản đầu):
//
// 1) RENDER ĐÚNG CỠ, KHÔNG THU NHỎ LẠI.
//    Bản cũ vẽ 512 CSS px × deviceScaleFactor 2 = 1024 px rồi Lanczos hạ về
//    440 ⇒ giảm 2.33× làm mềm/cạo cạnh. Nay vẽ thẳng 220 CSS px × 2 = 440 px
//    ⇒ vector được rasterize đúng kích thước dùng, KHÔNG resample.
//
// 2) DITHERING CÓ TRẬT TỰ (Bayer 8×8).
//    Giới hạn cứng 256 màu của GIF ⇒ dải màu mượt (thân mèo trắng, lông
//    cam) bị dạn sọc. Dither phá vỡ dải thành chấm nhẹ, mắt thường chịu
//    tốt hơn nhiều so với dạng băng màu phẳng.
//
// 3) BẢNG MÀU CHUNG + TRA CỨU NHANH.
//    Một palette dùng cho mọi khung (không nhấp nháy màu) và bảng tra cứu
//    nearest-color theo lập phương RGB 5 bit nên dither nhanh, không cần quét
//    256 màu cho từng điểm ảnh.
//
// Cách chạy:  node scripts/render-lottie-gifs.mjs
// Đầu vào :  temp/Dance cat.json, temp/cat Mark loading.json
// Đầu ra :  public/Dance-cat.gif, public/cat-forgot.gif
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { chromium } from 'playwright';
import gifencPkg from 'gifenc';

const { GIFEncoder, quantize } = gifencPkg;

/**
 * Đọc animationData từ file `.lottie` (định dạng ZIP của LottieFiles).
 *
 * `.lottie` = ZIP chứa `manifest.json` + `animations/<id>.json`. Chỉ cần phần
 * tĳnh (stored, method 0) và deflate (method 8) — đủ cho file Lottie.
 * Nếu đầu vào đã là JSON thì trả về luôn (tiện cho file export dạng .json).
 */
function readLottie(file) {
  const buf = fs.readFileSync(file);
  // JSON thuần: bắt đầu bằng '{'
  if (buf[0] === 0x7b || buf[0] === 0xef) {
    return JSON.parse(buf.toString('utf8').replace(/^﻿/, ''));
  }
  // Dò central directory để lấy danh sách entry
  const eocd = buf.lastIndexOf(0x06054b50);
  if (eocd === -1) throw new Error(`Không phải file .lottie/ZIP hợp lệ: ${file}`);
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;
    if (!name.toLowerCase().endsWith('.json') || name.toLowerCase().endsWith('manifest.json')) continue;

    const lhNameLen = buf.readUInt16LE(localOff + 26);
    const lhExtraLen = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lhNameLen + lhExtraLen;
    const raw = buf.subarray(dataStart, dataStart + compSize);
    const data = method === 0 ? raw : zlib.inflateRawSync(raw);
    return JSON.parse(data.toString('utf8'));
  }
  throw new Error(`Không tìm thấy animation JSON trong .lottie: ${file}`);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Kích thước ảnh (px thiết kế) = 2 × khung hiển thị trong email.
//   440 = hiển thị 220px (mặc định, hợp thẻ 600px)
//   520 = hiển thị 260px (chi tiết nhiều hơn, thử nghiệm)
// Ghi đè bằng argv:  node scripts/render-lottie-gifs.mjs [kích-thước] [thư-mục-đích]
//   node scripts/render-lottie-gifs.mjs            → 440px vào public/
//   node scripts/render-lottie-gifs.mjs 520 temp/email-preview → bản thử nghiệm
const OUT = Number(process.argv[2]) || 440;
const OUT_DIR = process.argv[3] ? path.resolve(process.cwd(), process.argv[3]) : path.join(ROOT, 'public');
const CSS = OUT / 2; // vẽ ở N CSS px, deviceScaleFactor 2 ⇒ đúng OUT px
const DSF = 2;
const STEP = 2; // giữ mỗi frame thứ N, delay × N để giữ tốc độ gốc
const DITHER_SPREAD = 26; // biên độ nhiễu dither (0 = không dither)
// Sai số màu tối đa vẫn coi là "vùng phẳng" (không dither): pixel đã khớp
// palette ổn thì giữ nguyên để nền trắng phẳng không bị nhiễu.
const FLAT_TOLERANCE = 12;

// Ứng dụng: đọc file Lottie vector 512×512 (bản gốc) rồi "chụp" thành GIF cho
// email — vì email không chạy được Lottie/SVG.
// Nguồn: bản commit trong repo (tái lập được) — link lottie.host là bản sao
// có checksum trùng khớp, tải lại không cho chất lượng cao hơn.
const LOTTIE_DIR = path.join(ROOT, 'scripts', 'assets', 'lottie');

const jobs = [
  {
    src: path.join(LOTTIE_DIR, 'cat-dance.lottie'),
    dest: path.join(OUT_DIR, 'Dance-cat.gif'),
    label: 'Dance-cat.gif (mèo nhảy múa — email xác thực)',
  },
  {
    src: path.join(LOTTIE_DIR, 'cat-loading.lottie'),
    dest: path.join(OUT_DIR, 'cat-forgot.gif'),
    label: 'cat-forgot.gif (mèo chóng mặt — email quên mật khẩu)',
  },
];

const lottieSrc = fs.readFileSync(
  path.join(ROOT, 'node_modules', 'lottie-web', 'build', 'player', 'lottie.min.js'),
  'utf8'
);

// Ma trận Bayer 8×8 chuẩn hóa về [-0.5, 0.5].
const BAYER8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
].map((row) => row.map((v) => v / 64 - 0.5));

/** Chụp từng khung hình của animation (đã render ở đúng kích thước cần dùng). */
async function renderFrames(browser, animationData) {
  const ip = Number(animationData.ip ?? 0);
  const op = Number(animationData.op ?? 0);
  const fr = Number(animationData.fr ?? 30);
  const frames = [];
  for (let f = ip; f < op; f += STEP) frames.push(f);
  const delay = Math.round((1000 / fr) * STEP); // giữ nguyên tốc độ gốc

  const page = await browser.newPage({
    viewport: { width: CSS, height: CSS },
    deviceScaleFactor: DSF,
  });
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:transparent">
       <div id="box" style="width:${CSS}px;height:${CSS}px"></div>
     </body></html>`
  );
  await page.addScriptTag({ content: lottieSrc });
  await page.evaluate((data) => {
    window.__anim = window.lottie.loadAnimation({
      container: document.getElementById('box'),
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData: data,
    });
  }, animationData);

  const box = page.locator('#box');
  const shots = [];
  for (const f of frames) {
    await page.evaluate((frame) => {
      window.__anim.goToAndStop(frame, true);
      return new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)))
      );
    }, f);
    // omitBackground: nền trong; sẽ composite lên trắng ở bước sau.
    shots.push(await box.screenshot({ omitBackground: true, type: 'png' }));
  }
  await page.close();
  return { shots, delay };
}

/**
 * PNG → RGBA, **GIỮ NỀN TRONG SUỐT**.
 *
 * KHÔNG được flatten thành trắng đục. Đã xảy ra lỗi thật: bản flatten nền
 * trắng khiến GIF mất trong email — email client ở chế độ tối (dark mode)
 * tự đảo màu ảnh có nền sáng thành nền tối, mèo cũng bị đảo màu nên gần như
 * biến mất. Bản GIF gốc của LottieFiles giữ alpha và hiển thị tốt.
 *
 * Nền trong suốt cũng giúp GIF hợp với mọi nền thư (kể cả nền tối) thay vì
 * bị một khối trắng 440px chặn giữa email.
 */
async function toRgba(shot) {
  return sharp(shot)
    .ensureAlpha() // PNG trong suốt → RGBA, giữ alpha
    .raw()
    .toBuffer();
}

/** Ngưỡng alpha coi là "trong suốt" (GIF chỉ hỗ trợ trong suốt 1 bit). */
const ALPHA_CUTOFF = 128;

/**
 * Palette chung cho mọi khung ⇒ không nhấp nháy màu giữa các frame.
 *
 * Chỉ gom pixel **đục** (alpha >= ALPHA_CUTOFF). Nền trong suốt chiếm ~70% ảnh,
 * nếu đưa cả vào palette thì 256 chỗ bị phí cho màu rác ở vùng nền ⇒ mèo chỉ
 * còn ~80 màu ⇒ vỡ sạc màu. Gom riêng pixel đục thì 256 màu dồn hết cho con mèo.
 */
function buildGlobalPalette(frames) {
  const picks = frames.filter((_, i) => i % Math.max(1, Math.floor(frames.length / 8)) === 0).slice(0, 8);
  const opaque = [];
  for (const p of picks) {
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3] < ALPHA_CUTOFF) continue; // bỏ pixel trong suốt
      opaque.push(p[i], p[i + 1], p[i + 2], 255);
    }
  }
  const buf = Buffer.from(opaque);
  const palette = quantize(buf, 256);
  // Dành index 0 cho "trong suốt". Đặt nó thành màu phổ biến nhất thay vì đen:
  // nếu client nào bỏ qua cờ trong suốt thì ảnh vẫn dễ chịu, không thành khối đen.
  palette[0] = mostCommonOpaqueColor(buf);
  return palette;
}

/** Màu xuất hiện nhiều nhất trong buffer RGBA — màu dự phòng cho index 0. */
function mostCommonOpaqueColor(rgba) {
  const counts = new Map();
  for (let i = 0; i < rgba.length; i += 4) {
    const key = (rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2];
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let best = 0;
  let bestN = -1;
  for (const [k, n] of counts) {
    if (n > bestN) {
      bestN = n;
      best = k;
    }
  }
  return best;
}

/** Cộng nhiễu Bayer 8×8 vào ảnh RGBA (dither trên ẢNH NGUỒN, không phải trên
 *  bảng tra 5-bit) — sau đó mới ép palette. Cách này giữ được phép tìm màu gần
 *  nhất CHÍNH XÁC của thư viện thay vì bảng tra lưới 5-bit (lưới 5-bit làm
 *  lệch tới ±4 mức màu, đủ để cạnh bị "nhão"). */
function addBayerNoise(rgba, spread) {
  const out = Buffer.from(rgba);
  for (let y = 0; y < OUT; y++) {
    const brow = BAYER8[y & 7];
    for (let x = 0; x < OUT; x++) {
      const p = (y * OUT + x) * 4;
      const d = brow[x & 7] * spread;
      for (let c = 0; c < 3; c++) {
        const v = out[p + c] + d;
        out[p + c] = v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
      }
    }
  }
  return out;
}

/**
 * Bảng tra cứu nearest-color: ô lập phương RGB 5 bit (32³ = 32768 ô) → chỉ số
 * palette.
 *
 * Dùng bảng tra này thay vì `applyPalette` của gifenc: đo thực tế cho thấy
 * `applyPalette` sinh chỉ số rối hơn (nhiễu lẫn quanh nhiều palette entry) →
 * LZW nén kém, file nặng hơn ~10× (68 KB → 748 KB cho cùng nội dung).
 * Bảng tra tự tìm màu gần nhất với khoảng cách perceptual cho kết quả vừa
 * nhỏ hơn vừa sạch hơn.
 */
function buildLookup(palette) {
  const SIZE = 32;
  const lut = new Uint8Array(SIZE * SIZE * SIZE);
  for (let i = 0; i < 256; i++) {
    const c = palette[i];
    prArr[i] = (c >> 16) & 255;
    pgArr[i] = (c >> 8) & 255;
    pbArr[i] = c & 255;
  }
  for (let r = 0; r < SIZE; r++) {
    const rr = (r * 255) / (SIZE - 1);
    for (let g = 0; g < SIZE; g++) {
      const gg = (g * 255) / (SIZE - 1);
      for (let b = 0; b < SIZE; b++) {
        const bb = (b * 255) / (SIZE - 1);
        let best = 1;
        let bestD = Infinity;
        // Bắt đầu từ index 1: index 0 dành riêng cho pixel trong suốt, không
        // được phép "thắng" ở bước tìm màu gần nhất (nếu không cạnh mờ sẽ bị
        // nhốt vào index trong suốt và bị cắt thành lỗ thủng).
        for (let i = 1; i < 256; i++) {
          const dr = rr - prArr[i];
          const dg = gg - pgArr[i];
          const db = bb - pbArr[i];
          const d = dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114;
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        }
        lut[(r * SIZE + g) * SIZE + b] = best;
      }
    }
  }
  return lut;
}

const prArr = new Int16Array(256);
const pgArr = new Int16Array(256);
const pbArr = new Int16Array(256);

/**
 * Dither Bayer 8×8 rồi ép palette qua bảng tra → chỉ số 1 byte/pixel.
 * Pixel trong suốt (alpha < ALPHA_CUTOFF) luôn ra index 0.
 */
function ditherToIndex(rgba, lut, out) {
  for (let y = 0; y < OUT; y++) {
    const brow = BAYER8[y & 7];
    for (let x = 0; x < OUT; x++) {
      const p = (y * OUT + x) * 4;
      if (rgba[p + 3] < ALPHA_CUTOFF) {
        out[y * OUT + x] = 0; // trong suốt
        continue;
      }
      const d = brow[x & 7] * DITHER_SPREAD;
      const r = rgba[p] + d;
      const g = rgba[p + 1] + d;
      const b = rgba[p + 2] + d;
      const ri = r < 0 ? 0 : r > 255 ? 31 : (r * 31) / 255;
      const gi = g < 0 ? 0 : g > 255 ? 31 : (g * 31) / 255;
      const bi = b < 0 ? 0 : b > 255 ? 31 : (b * 31) / 255;
      out[y * OUT + x] = lut[(ri * 32 + gi) * 32 + bi];
    }
  }
}

async function encodeGif(shots, delay, dest) {
  const frames = [];
  for (const shot of shots) frames.push(await toRgba(shot));
  const palette = buildGlobalPalette(frames);
  const lut = buildLookup(palette);

  const gif = GIFEncoder();
  for (const rgba of frames) {
    const index = Buffer.allocUnsafe(OUT * OUT);
    ditherToIndex(rgba, lut, index);
    // `transparent: true` bật cờ trong suốt 1 bit cho từng khung, dùng
    // `transparentIndex: 0` làm chỉ số trong suốt. BẮT BUỘC: bản trước thiếu
    // cờ này và nền bị đóng thành trắng đục → client dark mode đảo thành nền
    // đen, GIF biến mất trong email.
    gif.writeFrame(index, OUT, OUT, {
      palette,
      delay,
      repeat: 0,
      transparent: true,
      transparentIndex: 0,
    });
  }
  gif.finish();
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const bytes = gif.bytes();
  fs.writeFileSync(dest, bytes);
  return { bytes: bytes.length, frames: frames.length };
}

async function main() {
  const browser = await chromium.launch();
  try {
    for (const job of jobs) {
      if (!fs.existsSync(job.src)) {
        console.error(`✖ Thiếu file nguồn: ${job.src}`);
        continue;
      }
      const animationData = readLottie(job.src);
      const srcFrames = animationData.op - animationData.ip;
      console.log(`\n== ${job.label}`);
      console.log(
        `   nguồn: ${path.basename(job.src)} · ${animationData.w}×${animationData.h} @${animationData.fr}fps · ${srcFrames} khung`
      );

      const { shots, delay } = await renderFrames(browser, animationData);
      const res = await encodeGif(shots, delay, job.dest);
      console.log(
        `   ✔ ${path.relative(ROOT, job.dest)} — ${res.frames} khung, ${delay}ms/khung ` +
          `(${(res.delayTotal ?? delay * res.frames) / 1000}s, ${OUT}×${OUT}), ` +
          `${(res.bytes / 1024).toFixed(0)} KB, dither Bayer8`
      );
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
