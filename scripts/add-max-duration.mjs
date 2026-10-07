// Thêm `maxDuration` cho các route đụng CSDL.
//
// LÝ DO: mặc định của Vercel chỉ 10s, nhưng các route này có thể phải đẩy
// file SQLite ~67MB lên Filebase (đo được: ~5.4s ở 100Mbit, ~26.8s ở 20Mbit).
// Trượt 10s ⇒ upload bị cắt ⇒ mất dữ liệu. Đặt 60s là trần của gói Hobby.
import fs from 'fs';

const TARGETS = [
  'src/app/api/auth/route.ts',
  'src/app/api/auth/forgot-password/route.ts',
  'src/app/api/admin/users/route.ts',
  'src/app/api/admin/support/route.ts',
  'src/app/api/admin/logs/route.ts',
  'src/app/api/progress/route.ts',
  'src/app/api/pet/route.ts',
  'src/app/api/pet/shop/route.ts',
  'src/app/api/support/route.ts',
  'src/app/api/bookmarks/route.ts',
  'src/app/api/exam/route.ts',
  'src/app/api/user/target/route.ts',
  'src/app/api/log/access/route.ts',
];

const BLOCK = [
  '/**',
  ' * 60s thay vì mặc định 10s của Vercel.',
  ' *',
  ' * Các route này có thể phải đẩy file SQLite ~67MB lên Filebase S3. Đo được:',
  ' * ~5.4s ở 100Mbit/s nhưng ~26.8s ở 20Mbit/s. Trượt mặc định 10s ⇒ upload bị',
  ' * cắt giữa chừng ⇒ dữ liệu mất. 60s là trần của gói Vercel Hobby.',
  ' */',
  'export const maxDuration = 60;',
  '',
].join('\n');

let changed = 0;
let skipped = 0;
for (const rel of TARGETS) {
  const src = fs.readFileSync(rel, 'utf8');
  if (/export const maxDuration/.test(src)) {
    console.log(`  skip  ${rel} (da co maxDuration)`);
    skipped++;
    continue;
  }
  const lines = src.split('\n');
  // Chèn ngay TRƯỚC route handler đầu tiên — đó là vị trí an toàn, không phụ
  // thuộc import có nhiều dòng hay không.
  const at = lines.findIndex((l) => /^export async function (GET|POST|PUT|PATCH|DELETE)/.test(l));
  if (at < 0) {
    console.log(`  WARN  ${rel} — khong tim thay route handler`);
    continue;
  }
  lines.splice(at, 0, ...BLOCK.split('\n'));
  fs.writeFileSync(rel, lines.join('\n'), 'utf8');
  console.log(`  ok    ${rel} (dong ${at + 1})`);
  changed++;
}
console.log(`\n${changed} file duoc them maxDuration, ${skipped} da co san.`);