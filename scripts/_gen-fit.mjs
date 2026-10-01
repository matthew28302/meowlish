/**
 * Tạo src/components/pet/petFit.ts từ scripts/_fit-data.json (do scripts/_measure2.mjs tạo ra).
 *
 * Ý nghĩa: mọi outfit trong PixelPetSprite được vẽ trong khung canonical
 *   x 20..44 (tâm 32, rộng 24), y 38.5..53 (đáy 53, cao 14.5)
 * Đo hình dáng thân từng loài rồi tính transform map khung canonical -> khung vừa thân.
 *
 * Usage: node scripts/_gen-fit.mjs
 */
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/_fit-data.json', 'utf8'));

const CANON_W = 24;        // 44 - 20
const CANON_BOTTOM = 53;
const CANON_CX = 32;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;

const rows = [];
const summary = [];

for (const [sp, d] of Object.entries(data)) {
  if (d.error || typeof d.torsoWidth !== 'number') {
    summary.push(`${sp}: SKIP (${d.error || 'no-data'})`);
    continue;
  }
  // Đáy áo: cách đáy cơ thể một khoảng ~7% chiều cao (phần bàn chân/chân)
  const bodyH = d.bodyBottom - d.bodyTop;
  const targetBottom = d.bodyBottom - 0.07 * bodyH;
  const dy = clamp(targetBottom - CANON_BOTTOM, -9, 2);

  // Rộng: bám theo thân, chặn vềometry hỏng / tránh thay đổi quá nhiều
  const sx = clamp(d.torsoWidth / CANON_W, 0.8, 1.15);

  // Tâm ngang: coi body luôn vẽ tâm ở x=32, chỉ cho lệch tối đa 2 đơn vị
  const effCx = CANON_CX + clamp(d.torsoCenterX - CANON_CX, -2, 2);
  const dx = effCx - CANON_CX * sx;

  const skip = Math.abs(sx - 1) < 0.03 && Math.abs(dy) < 0.5 && Math.abs(dx) < 0.5;
  if (skip) {
    summary.push(`${sp}: identity`);
    continue;
  }
  rows.push(`  '${sp}': 'translate(${r2(dx)} ${r2(dy)}) scale(${r3(sx)} 1)',`);
  summary.push(
    `${sp}: sx=${r3(sx)} dy=${r2(dy)} dx=${r2(dx)} (torsoW=${d.torsoWidth} bot=${d.bodyBottom})`
  );
}

const out = `// TẠO TỰ ĐỘNG bởi scripts/_gen-fit.mjs — KHÔNG sửa tay.
// Nguồn: scripts/_fit-data.json (đo bằng scripts/_measure2.mjs)
//
// Mọi outfit trong PixelPetSprite được vẽ trong khung canonical:
//   x 20..44 (tâm 32, rộng 24) — y 38.5..53 (đáy 53)
// Bảng dưới map khung đó vừa với hình dáng thân thật của từng loài:
//   translate(dx dy) rồi scale(sx theo chiều ngang).
// Chỉ scale X (không scale Y) để không biến dạng SVG; các loài dùng body
// template chuẩn sẽ cho giá trị gần identity nên được bỏ qua.

const OUTFIT_TRANSFORM: Record<string, string> = {
${rows.join('\n')}
};

/** Lấy transform cho lớp outfit của loài này ('' = giữ nguyên toạ độ gốc). */
export function getOutfitTransform(species: string): string {
  return OUTFIT_TRANSFORM[species] ?? '';
}
`;

fs.writeFileSync('src/components/pet/petFit.ts', out);
console.log(summary.join('\n'));
console.log(`\nwrote src/components/pet/petFit.ts (${rows.length} entries, ${Object.keys(data).length - rows.length} identity/skip)`);
