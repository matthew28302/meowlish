#!/usr/bin/env node
/**
 * build-pet-art-2d.mjs — Asset pipeline cho tính năng "2D art pets" (meowlish).
 *
 * Biến đổi poster nhân vật 2D (`art-2d-pet/<franchise>/<name>.png`) thành
 * "character standee" WebP: thu nhỏ về cao 420px, giữ nguyên tỉ lệ (không crop,
 * không stretch), rồi phủ mask bo góc feather (rounded-rect inset 10px, rx 22,
 * blur σ 9) qua `composite({ blend: 'dest-in' })` để viền tan mềm vào nền.
 *
 * CHÚ Ý: ảnh nguồn là poster nền tối kín (không transparent) — chủ ý của design
 * là GIỮ NGUYÊN nền, tuyệt đối không xóa background.
 *
 * Output (idempotent — chạy lại sẽ overwrite tại chỗ):
 *   public/pet-art-2d/art2d_<franchise>__<name>.webp
 *   public/pet-art-2d/manifest.json
 *
 * Chạy:  node scripts/build-pet-art-2d.mjs
 */

import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const PROJECT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const SRC_DIR = join(PROJECT_ROOT, 'art-2d-pet');
const OUT_DIR = join(PROJECT_ROOT, 'public', 'pet-art-2d');

// --- Cấu hình pipeline ---
const TARGET_HEIGHT = 420; // chiều cao chuẩn của standee
const MASK_INSET = 10; // rounded-rect lùi vào 10px từ mép ảnh
const MASK_RADIUS = 22; // bán kính bo góc
const MASK_BLUR = 9; // σ gaussian → feather rộng ~18px
const ALPHA_QUALITY = 90;
const BASE_QUALITY = 80;
const FALLBACK_QUALITY = 75; // dùng nếu tổng dung lượng vượt hard budget
const SOFT_BUDGET_KB = 2500; // mục tiêu ≤ 2.5MB / 34 file
const HARD_BUDGET_KB = 3072; // vượt mức này → rebuild ở quality thấp hơn

/** Tìm mọi ảnh nguồn, trả về danh sách có thứ tự ổn định (franchise + tên A→Z). */
function discoverSources() {
  const franchises = readdirSync(SRC_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const sources = [];
  for (const franchise of franchises) {
    const files = readdirSync(join(SRC_DIR, franchise), { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.png'))
      .map((e) => e.name)
      .sort();
    for (const file of files) {
      // iron_man_v3.png → iron_man ; lowercase để id luôn ổn định
      const baseName = basename(file, extname(file)).toLowerCase().replace(/_v\d+$/, '');
      sources.push({
        franchise,
        baseName,
        id: `art2d_${franchise}__${baseName}`,
        srcPath: join(SRC_DIR, franchise, file),
      });
    }
  }
  return sources;
}

/**
 * SVG mask trắng cùng kích thước ảnh: rounded-rect bo mờ bằng feGaussianBlur.
 * Vùng filter giãn 140% để blur không bị cắt ở mép, color-interpolation sRGB
 * cho dải feather tuyến tính, dễ đoán.
 */
function maskSvg(w, h) {
  const x = MASK_INSET;
  const y = MASK_INSET;
  const rw = w - MASK_INSET * 2;
  const rh = h - MASK_INSET * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <filter id="feather" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="${MASK_BLUR}"/>
    </filter>
  </defs>
  <rect x="${x}" y="${y}" width="${rw}" height="${rh}" rx="${MASK_RADIUS}" ry="${MASK_RADIUS}" fill="#ffffff" filter="url(#feather)"/>
</svg>`;
}

/**
 * Xử lý 1 ảnh nguồn → standee WebP.
 * Trả về metadata cho manifest (width/height = kích thước SAU resize, trước mask).
 */
async function buildOne(source, quality) {
  // Bước 1: resize về cao 420, GIỮ TỈ LỆ (chỉ truyền height cho sharp).
  const resized = await sharp(source.srcPath)
    .resize({ height: TARGET_HEIGHT })
    .png()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = resized.info;

  // Bước 2: ghép mask dest-in — alpha cuối = alpha của mask (feathered corners).
  const outPath = join(OUT_DIR, `${source.id}.webp`);
  const info = await sharp(resized.data)
    .ensureAlpha()
    .composite([{ input: Buffer.from(maskSvg(width, height)), blend: 'dest-in' }])
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
 * Kiểm định 1 file đầu ra: WebP phải có kênh alpha, đúng kích thước manifest,
 * và ≥ 1% pixel bán trong suốt (chứng tỏ feather đã hoạt động thật).
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
  let semi = 0;
  const total = info.width * info.height;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 3 && data[i] < 252) semi++;
  }
  const semiPct = (100 * semi) / total;
  if (semiPct < 1) problems.push(`chỉ ${semiPct.toFixed(2)}% pixel bán trong suốt (feather hỏng?)`);

  return { id: item.id, semiPct, ok: problems.length === 0, problems };
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
    console.error(`Không tìm thấy ảnh nguồn nào trong ${SRC_DIR}`);
    process.exit(1);
  }
  console.log(`Tìm thấy ${sources.length} ảnh nguồn trong ${SRC_DIR}`);
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

  // Manifest.
  const manifest = {
    builtAt: new Date().toISOString(),
    items: items.map(({ id, franchise, file, width, height }) => ({
      id,
      franchise,
      file,
      width,
      height,
    })),
  };
  const manifestPath = join(OUT_DIR, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  printTable(items, totalKb);
  console.log(`\nManifest: ${manifestPath} (quality=${quality}, builtAt=${manifest.builtAt})`);

  // Kiểm định đầu ra.
  console.log('\n=== KIỂM ĐỊNH ĐẦU RA ===');
  const results = [];
  for (const item of items) {
    const result = await verifyItem(item);
    results.push(result);
    if (!result.ok) console.log(`✕ ${result.id}: ${result.problems.join('; ')}`);
  }
  const failures = results.filter((r) => !r.ok).length;
  const avgSemi = results.reduce((s, r) => s + r.semiPct, 0) / results.length;

  if (failures > 0) {
    console.error(`\nKẾT QUẢ: ${failures}/${items.length} file LỖI — pipeline cần sửa.`);
    process.exit(1);
  }
  console.log(
    `✓ Đủ ${items.length}/${items.length} file WebP có kênh alpha, đúng kích thước manifest, feather trung bình ${avgSemi.toFixed(2)}% pixel bán trong suốt.`,
  );
  console.log('\nHoàn tất! ✅');
}

main().catch((err) => {
  console.error('Build thất bại:', err);
  process.exit(1);
});
