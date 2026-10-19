// Kiểm tra GIF email: cấu trúc nhị phân + nền trong suốt.
//
// Bài học từ lỗi thật: bản GIF flatten nền trắng đục đã làm ảnh biến mất trong
// email — client ở chế độ tối tự đảo màu ảnh nền sáng thành nền tối. Công cụ này
// chạy trước mỗi lần deploy ảnh để chặn đúng lỗi đó.
//
// Chạy: node scripts/verify-email-gifs.mjs [thư-mục chứa .gif]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const dir = path.resolve(process.argv[2] || 'public');

function parse(buf) {
  const W = buf.readUInt16LE(6);
  const H = buf.readUInt16LE(8);
  const packed = buf[10];
  const hasGCT = (packed & 0x80) !== 0;
  const gctSize = hasGCT ? 2 ** ((packed & 0x07) + 1) : 0;

  let p = 13 + gctSize * 3;
  let frames = 0;
  let transparentFrames = 0;
  let transparentIndex = -1;
  let trailer = false;

  while (p < buf.length) {
    const marker = buf[p];
    if (marker === 0x3b) { trailer = true; break; }
    if (marker === 0x00) { p++; continue; }
    if (marker === 0x21) {
      if (buf[p + 1] === 0xf9) {
        frames++;
        if (buf[p + 3] & 0x01) {
          transparentFrames++;
          transparentIndex = buf[p + 7];
        }
      }
      let q = p + 2;
      while (q < buf.length) {
        const n = buf[q];
        q += 1 + n;
        if (n === 0) break;
      }
      p = q;
      continue;
    }
    if (marker === 0x2c) {
      const ipacked = buf[p + 9];
      p += 10;
      if (ipacked & 0x80) p += 3 * (2 ** ((ipacked & 0x07) + 1));
      p++;
      while (p < buf.length) {
        const n = buf[p];
        p += 1 + n;
        if (n === 0) break;
      }
      continue;
    }
    p++;
  }
  return { W, H, gctSize, frames, transparentFrames, transparentIndex, trailer, bytes: buf.length };
}

/**
 * Kiểm tra MÀU của GIF — chốt chặn cho lỗi thật đã xảy ra: script render cũ
 * tra palette bằng số thực nên mọi pixel màu bị ghi thành index 0 (trong suốt),
 * kết quả chỉ còn 1 màu đen/trắng. Script verify cũ chỉ xem kích thước + cờ
 * trong suốt nên vẫn báo "đạt", trong khi email hiển thị con mèo xám mất màu.
 * Lấy mẫu đầu/giữa/cuối (bỏ qua khung fade trắng) và yêu cầu có đủ màu.
 */
async function colorStats(file) {
  const meta = await sharp(file, { animated: true }).metadata();
  const pages = meta.pages || 1;
  const picks = [...new Set([0, Math.floor(pages / 2), Math.max(0, pages - 1)])];
  let best = { unique: 0, saturationRatio: 0, frame: 0 };
  for (const page of picks) {
    const { data } = await sharp(file, { page }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let opaque = 0;
    let saturated = 0;
    const colors = new Set();
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 10) continue; // bỏ pixel trong suốt
      opaque++;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      if (mx > 0 && (mx - mn) / mx > 0.15) saturated++;
      if (colors.size < 4096) colors.add(`${r},${g},${b}`);
    }
    const saturationRatio = opaque ? saturated / opaque : 0;
    if (colors.size > best.unique || saturationRatio > best.saturationRatio) {
      best = { unique: colors.size, saturationRatio, frame: page };
    }
  }
  const ok = best.unique >= 8 && best.saturationRatio >= 0.05;
  return { ...best, ok };
}

let failed = false;
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.gif')).sort()) {
  const full = path.join(dir, file);
  const info = parse(fs.readFileSync(full));
  const transparent = info.transparentFrames === info.frames && info.frames > 0;
  const color = await colorStats(full);
  const ok = info.trailer && transparent && color.ok;
  if (!ok) failed = true;
  console.log(`${ok ? '✔' : '✘'} ${file}`);
  console.log(`    ${info.W}x${info.H} · ${(info.bytes / 1024).toFixed(0)} KB · ${info.frames} khung · palette ${info.gctSize}`);
  console.log(
    transparent
      ? `    nền trong suốt: ${info.transparentFrames}/${info.frames} khung (index ${info.transparentIndex}) — an toàn với dark mode`
      : `    nền trong suốt: ${info.transparentFrames}/${info.frames} — THIẾU! client dark mode có thể đảo thành nền đen`
  );
  console.log(
    color.ok
      ? `    màu: ${color.unique} màu (khung ${color.frame}) · ${(color.saturationRatio * 100).toFixed(0)}% pixel có màu — đạt`
      : `    màu: CHỈ ${color.unique} màu · ${(color.saturationRatio * 100).toFixed(0)}% pixel có màu — GIF bị mất màu!`
  );
  if (!info.trailer) console.log('    thiếu block kết 0x3B — file có thể hỏng');
}

if (failed) {
  console.error('\n✘ CÓ GIF KHÔNG ĐẠT — không được deploy ảnh này lên production.');
  process.exit(1);
}
console.log('\n✔ Tất cả GIF đạt yêu cầu nền trong suốt.');
