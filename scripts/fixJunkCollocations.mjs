/**
 * TEMP->KEEP: dọn collocations rác do template sinh ra trong DB.
 *
 * Bối cảnh: scripts/importFullDictionary.mjs từng sinh
 *   [`common <w>`, `<w> in context`, `use <w>`]
 * cho 100% (26.416/26.416) mục từ trong `dictionary_entries`. Đây là placeholder
 * vô nghĩa — UI render thành chip dính liền ("common aa in contextuse a").
 *
 * Script này:
 *  1. backup DB trước (file .bak) để hoàn tác được
 *  2. chỉ xoá các item collocation ĐÚNG bằng template rác
 *  3. giữ nguyên mọi collocation thật (nếu có)
 *  4. rebuild FTS index + báo cáo
 *
 * Chạy:  node scripts/fixJunkCollocations.mjs [--dry]
 */
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = path.join(process.cwd(), 'data', 'english_learning.db');
const DRY = process.argv.includes('--dry');

const isJunk = (w, c) =>
  typeof c === 'string' &&
  (c === `common ${w}` || c === `${w} in context` || c === `use ${w}` || c === `in ${w}`);

if (!DRY) {
  const bak = `${DB_PATH}.bak-collocations`;
  fs.copyFileSync(DB_PATH, bak);
  console.log(`✔ Backup: ${bak}`);
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const rows = db.prepare('SELECT rowid, word, collocations_json FROM dictionary_entries').all();

let touched = 0, itemsRemoved = 0, keptReal = 0, alreadyEmpty = 0, malformed = 0;
const updates = [];

for (const r of rows) {
  let arr;
  try {
    arr = JSON.parse(r.collocations_json || '[]');
  } catch {
    malformed++;
    continue;
  }
  if (!Array.isArray(arr)) { malformed++; continue; }
  if (arr.length === 0) { alreadyEmpty++; continue; }

  const w = String(r.word ?? '');
  const cleaned = arr.filter((c) => !isJunk(w, c));
  const real = arr.filter((c) => isJunk(w, c) === false);
  keptReal += real.length;
  if (cleaned.length === arr.length) continue; // không có gì rác

  touched++;
  itemsRemoved += arr.length - cleaned.length;
  updates.push([JSON.stringify(cleaned), r.rowid]);
}

console.log(`Tổng mục         : ${rows.length}`);
console.log(`Cần sửa          : ${touched}`);
console.log(`Item rác đã xoá  : ${itemsRemoved}`);
console.log(`Item thật giữ lại: ${keptReal}`);
console.log(`Đã rỗng sẵn      : ${alreadyEmpty}`);
console.log(`JSON hỏng        : ${malformed}`);

if (DRY) {
  console.log('\n(--dry) Không ghi gì.');
  db.close();
  process.exit(0);
}

const upd = db.prepare('UPDATE dictionary_entries SET collocations_json = ? WHERE rowid = ?');
const tx = db.transaction((list) => { for (const [j, id] of list) upd.run(j, id); });
tx(updates);
console.log(`\n✔ Đã cập nhật ${updates.length} dòng.`);

// Kiểm tra lại
const after = db.prepare('SELECT word, collocations_json FROM dictionary_entries LIMIT 5').all();
after.forEach((r) => console.log(`  ${r.word} => ${r.collocations_json}`));

const stillJunk = db.prepare("SELECT COUNT(*) c FROM dictionary_entries WHERE collocations_json LIKE '%in context%' OR collocations_json LIKE '%\"use %'").get();
console.log(`\nCòn sót template rác: ${stillJunk.c}`);

db.close();