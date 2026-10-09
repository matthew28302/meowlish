#!/usr/bin/env node
/**
 * build-pet-art-2d.mjs — Asset pipeline cho tính năng "2D art pets" (meowlish).
 *
 * GIAI ĐOẠN 1 (Python, chạy RIÊNG, ~52s/ảnh, model ~1GB tải lần đầu):
 *   python art-2d-pet/_cut_batch.py
 *     — dùng rembg (isnet/u2net) xóa NỀN poster: nguồn là ảnh đặc nền gradient
 *     tối, chroma-key sẽ ăn mất nhân vật mặc đồ đen trên nền đen (đo
 *     2026-10-09: 34/34 nguồn alpha=0%). Kết quả RGBA cắt nền nằm ở
 *     art-2d-pet/_cut/<franchise>__<name>.png. Cài đặt: pip install "rembg[cpu]".
 *
 * GIAI ĐOẠN 2 (script này, nhanh): _cut/*.png → sprite WebP tối ưu:
 *   1. Trim sát alpha-bbox của NHÂN VẬT (bỏ viền trong suốt còn xót).
 *   2. Resize về cao 420px giữ tỉ lệ — KHÔNG crop, KHÔNG stretch, KHÔNG mask:
 *      nền đã trong suốt nên không cần "standee" bo góc feather nữa.
 *   3. WebP quality 80 / alphaQuality 90.
 *
 * Output (idempotent — chạy lại overwrite tại chỗ):
 *   public/pet-art-2d/art2d_<franchise>__<name>.webp
 *   public/pet-art-2d/manifest.json
 *
 * Chạy:  node scripts/build-pet-art-2d.mjs
 */

import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const PROJECT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const CUT_DIR = join(PROJECT_ROOT, 'art-2d-pet', '_cut');
const OUT_DIR = join(PROJECT_ROOT, 'public', 'pet-art-2d');

// --- Cấu hình pipeline ---
const TARGET_HEIGHT = 420; // chiều cao chuẩn của sprite nhân vật
const ALPHA_KEEP = 20; // pixel alpha >= 20 được tính là "thuộc nhân vật" khi đo bbox
const ALPHA_QUALITY = 90;
const BASE_QUALITY = 80;
const FALLBACK_QUALITY = 75; // dùng nếu tổng dung lượng vượt hard budget
const SOFT_BUDGET_KB = 2500; // mục tiêu ≤ 2.5MB / 34 file
const HARD_BUDGET_KB = 3072; // vượt mức này → rebuild ở quality thấp hơn

/** Tìm mọi ảnh đã cắt nền trong _cut, thứ tự ổn định theo tên file A→Z. */
function discoverSources() {
  if (!existsSync(CUT_DIR)) {
    console.error(`Không tìm thấy thư mục ${CUT_DIR}.
→ Chạy GIAI ĐOẠN 1 trước (cắt nền bằng rembg):
    pip install "rembg[cpu]"
    python art-2d-pet/_cut_batch.py   # ~52s/ảnh, lần đầu tải model ~1GB`);
    process.exit(1);
  }
  return readdirSync(CUT_DIR)
    .filter((f) => f.toLowerCase().endsWith('.png'))
    .sort()
    .map((file) => {
      const baseName = file.replace(/\.png$/i, '');
      return {
        id: `art2d_${baseName}`,
        baseName,
        srcPath: join(CUT_DIR, file),
      };
    });
}

/**
 * Tính bounding-box của phần KHÔNG trong suốt (nhân vật) từ buffer raw RGBA.
 * Trả về null nếu ảnh gần như trống (rembg fail toàn bộ).
 */
function alphaBbox(data, width, height) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      if (data[row + x * 4 + 3] >= ALPHA_KEEP) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/**
 * Xử lý 1 ảnh đã cắt nền → sprite WebP.
 * Manifest width/height = kích thước SAU trim+resize (sprite sát nhân vật).
 */
async function buildOne(source, quality) {
  // Bước 1: đọc raw RGBA để tìm bbox nhân vật.
  const raw = await sharp(source.srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bbox = alphaBbox(raw.data, raw.info.width, raw.info.height);
  if (!bbox) {
    throw new Error(`${source.id}: ảnh cắt nền gần như trống (không còn pixel đặc nào)`);
  }

  // Bước 2: trim theo bbox rồi resize về cao 420 giữ tỉ lệ.
  const trimmed = await sharp(source.srcPath)
    .extract({ left: bbox.left, top: bbox.top, width: bbox.width, height: bbox.height })
    .resize({ height: TARGET_HEIGHT })
    .png()
    .toBuffer({ resolveWithObject: true });

  // Bước 3: WebP — KHÔNG mask; alpha của cutout đã là viền mềm tự nhiên.
  const outPath = join(OUT_DIR, `${source.id}.webp`);
  const info = await sharp(trimmed.data)
    .webp({ quality, alphaQuality: ALPHA_QUALITY })
    .toFile(outPath);

  return {
    ...source,
    file: `${source.id}.webp`,
    outPath,
    width: info.width,
    height: info.height,
    bytes: info.size,
  };
}

async function buildAll(sources, quality) {
  const items = [];
  for (const source of sources) {
    items.push(await buildOne(source, quality));
  }
  return items;
}

/**
 * Kiểm định 1 sprite đầu ra — sprite cắt nền phải thoả:
 *  1. Có kênh alpha, đúng kích thước manifest.
 *  2. Phần đặc chiếm 5–75% khung (nhân vật, không phải ảnh đặc nguyên).
 *
 * KHÔNG kiểm "góc" lẫn "dải sàn" ở đây:
 *  - Góc: sprite đã TRIM SÁT bbox nên chân nhân vật hoàn toàn có thể chạm góc.
 *  - Sàn: vệt sàn đã được xói TẠI NGUỒN trong _cut_batch.py (erode_floor_band);
 *    kiểm lại trên bản 420px sẽ FALSE-POSITIVE vì chân + bóng mềm bị average
 *    lên >=128 khi downscale (bắt gặp shizuka/sanji — đo 2026-10-09).
 */
async function verifyItem(item) {
  const problems = [];
  const meta = await sharp(item.outPath).metadata();
  if (!meta.hasAlpha) problems.push('thiếu kênh alpha');
  if (meta.width !== item.width || meta.height !== item.height) {
    problems.push(`kích thước ${meta.width}x${meta.height} ≠ manifest ${item.width}x${item.height}`);
  }

  const { data, info } = await sharp(item.outPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  let opaque = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 200) opaque++;
  }
  const opaquePct = (100 * opaque) / (w * h);
  if (opaquePct < 5 || opaquePct > 75) {
    problems.push(`phần đặc ${opaquePct.toFixed(1)}% ngoài khoảng 5–75% (cutout hỏng?)`);
  }

  return { id: item.id, opaquePct, ok: problems.length === 0, problems };
}

function printTable(items, totalKb) {
  const idWidth = Math.max(...items.map((i) => i.id.length));
  console.log(`\n| ${'id'.padEnd(idWidth)} | ${'kích thước'.padEnd(11)} | ${'dung lượng'.padEnd(10)} |`);
  console.log(`| ${'-'.repeat(idWidth)} | ${'-'.repeat(11)} | ${'-'.repeat(10)} |`);
  for (const item of items) {
    console.log(
      `| ${item.id.padEnd(idWidth)} | ${`${item.width}x${item.height}`.padEnd(11)} | ${`${(item.bytes / 1024).toFixed(1)} KB`.padEnd(10)} |`,
    );
  }
  console.log(`| ${'-'.repeat(idWidth)} | ${'-'.repeat(11)} | ${'-'.repeat(10)} |`);
  console.log(
    `TỔNG: ${items.length} file WebP, ${totalKb.toFixed(1)} KB` +
      (totalKb <= SOFT_BUDGET_KB
        ? ` (✓ trong ngân sách ≤ ${SOFT_BUDGET_KB} KB)`
        : totalKb <= HARD_BUDGET_KB
          ? ` (⚠ vượt mục tiêu ${SOFT_BUDGET_KB} KB nhưng ≤ ngưỡng cứng ${HARD_BUDGET_KB} KB)`
          : ` (✕ VƯỢT ngưỡng cứng ${HARD_BUDGET_KB} KB)`),
  );
}

async function main() {
  const sources = discoverSources();
  if (sources.length === 0) {
    console.error(`Không tìm thấy ảnh đã cắt nền nào trong ${CUT_DIR}`);
    process.exit(1);
  }
  console.log(`Tìm thấy ${sources.length} ảnh đã cắt nền trong ${CUT_DIR}`);
  mkdirSync(OUT_DIR, { recursive: true });

  // Pass 1: build ở quality chuẩn.
  let quality = BASE_QUALITY;
  let items = await buildAll(sources, quality);
  let totalKb = items.reduce((sum, i) => sum + i.bytes, 0) / 1024;

  // Nếu vượt hard budget → rebuild toàn bộ ở quality thấp hơn (overwrite tại chỗ).
  if (totalKb > HARD_BUDGET_KB) {
    console.warn(`\n⚠ Tổng ${totalKb.toFixed(1)} KB > ${HARD_BUDGET_KB} KB → rebuild ở quality ${FALLBACK_QUALITY}...`);
    quality = FALLBACK_QUALITY;
    items = await buildAll(sources, quality);
    totalKb = items.reduce((sum, i) => sum + i.bytes, 0) / 1024;
  }

  // Dọn webp cũ không còn ứng với nguồn nào (giữ output dir khớp 1-1 với nguồn).
  const expected = new Set(items.map((i) => i.file));
  for (const f of readdirSync(OUT_DIR)) {
    if (f.toLowerCase().endsWith('.webp') && !expected.has(f)) {
      unlinkSync(join(OUT_DIR, f));
      console.log(`Đã dọn file rác cũ: ${f}`);
    }
  }

  // Kiểm định từng sprite.
  console.log('\nKiểm định cutout (alpha + góc trong suốt + tỉ lệ đặc)...');
  let bad = 0;
  for (const item of items) {
    const v = await verifyItem(item);
    if (!v.ok) {
      bad++;
      console.log(`  ✕ ${v.id}: ${v.problems.join('; ')}`);
    }
  }
  if (bad === 0) console.log('  ✓ 34/34 sprite đạt: góc trong suốt, tỉ lệ đặc hợp lệ.');

  // Manifest.
  const manifest = {
    builtAt: new Date().toISOString(),
    items: items.map(({ id, baseName, file, width, height }) => ({
      id,
      franchise: baseName.split('__')[0],
      file,
      width,
      height,
    })),
  };
  writeFileSync(join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  printTable(items, totalKb);
  process.exit(bad === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
