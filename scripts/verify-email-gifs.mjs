// Kiểm tra GIF email: cấu trúc nhị phân + nền trong suốt.
//
// Bài học từ lỗi thật: bản GIF flatten nền trắng đục đã làm ảnh biến mất trong
// email — client ở chế độ tối tự đảo màu ảnh nền sáng thành nền tối. Công cụ này
// chạy trước mỗi lần deploy ảnh để chặn đúng lỗi đó.
//
// Chạy: node scripts/verify-email-gifs.mjs [thư-mục chứa .gif]
import fs from 'node:fs';
import path from 'node:path';

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

let failed = false;
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.gif')).sort()) {
  const info = parse(fs.readFileSync(path.join(dir, file)));
  const transparent = info.transparentFrames === info.frames && info.frames > 0;
  const ok = info.trailer && transparent;
  if (!ok) failed = true;
  console.log(`${ok ? '✔' : '✘'} ${file}`);
  console.log(`    ${info.W}x${info.H} · ${(info.bytes / 1024).toFixed(0)} KB · ${info.frames} khung · palette ${info.gctSize}`);
  console.log(
    transparent
      ? `    nền trong suốt: ${info.transparentFrames}/${info.frames} khung (index ${info.transparentIndex}) — an toàn với dark mode`
      : `    nền trong suốt: ${info.transparentFrames}/${info.frames} — THIẾU! client dark mode có thể đảo thành nền đen`
  );
  if (!info.trailer) console.log('    thiếu block kết 0x3B — file có thể hỏng');
}

if (failed) {
  console.error('\n✘ CÓ GIF KHÔNG ĐẠT — không được deploy ảnh này lên production.');
  process.exit(1);
}
console.log('\n✔ Tất cả GIF đạt yêu cầu nền trong suốt.');
