// Quét + hoàn nguyên file bị double-encoding (mojibake) do PowerShell.
//
// Nguyên nhân: `Get-Content -Raw` (cp1252) + `Set-Content -Encoding utf8`.
// `ệ` (e1 bb 87) -> `á»‡` -> `á»‡`. `đ` -> `Đ‘`.
//
// Cách hoàn nguyên KHÔNG dựa vào literal tiếng Việt: thử biến đổi ngược
// (cp1252 -> UTF-8) và chỉ giữ kết quả nếu điểm mojibake giảm.
import fs from 'fs';
import path from 'path';
import { undoDoubleEncoding, mojibakeScore } from './lib/cp1252.mjs';

const ROOTS = ['src', 'scripts', 'tests', 'docs'];
const EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.css', '.md', '.json', '.txt']);
const APPLY = process.argv.includes('--apply');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next' || e.name === '.git') continue;
      walk(p, out);
    } else if (EXT.has(path.extname(e.name))) {
      out.push(p);
    }
  }
  return out;
}

const files = ROOTS.filter((r) => fs.existsSync(r)).flatMap((r) => walk(r));
const changed = [];

for (const f of files) {
  const original = fs.readFileSync(f, 'utf8');
  let text = original;
  const before = mojibakeScore(text);
  if (before === 0) continue;

  // Bỏ từng tầng cho tới khi điểm không giảm nữa (file sạch thì dừng ngay).
  let rounds = 0;
  for (let i = 0; i < 6; i++) {
    const next = undoDoubleEncoding(text);
    if (mojibakeScore(next) >= mojibakeScore(text)) break;
    text = next;
    rounds++;
  }

  const after = mojibakeScore(text);
  if (rounds > 0 && after < before) {
    changed.push({ file: f, before, after, rounds });
    if (APPLY) fs.writeFileSync(f, text, 'utf8');
  }
}

changed.sort((a, b) => b.before - a.before);
console.log(APPLY ? 'Da sua:\n' : 'File bi double-encoding (them --apply de sua):\n');
for (const { file, before, after, rounds } of changed) {
  console.log(
    `  ${String(before).padStart(5)} -> ${String(after).padStart(4)}  (${rounds} vong)  ${file}`
  );
}
const totalAfter = changed.reduce((s, c) => s + c.after, 0);
console.log(
  `\nTong: ${changed.length} file / ${files.length} quet. Con lai ${totalAfter} diem mojibake.`
);
if (APPLY && totalAfter === 0) console.log('SACH — khong con mojibake.');
