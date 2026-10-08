// Đo TRƯỚC/SAU cho M8 (audit 2026-10-08): search từ điển LIKE full-scan vs
// FTS5 MATCH prefix trên data/dictionary.db, kèm việc bỏ cột json gộp ~20MB
// khỏi SELECT.
//
// KHÔNG import src/lib/db.ts (tránh mở DB chính/kích S3 sync) — script mở file
// dictionary.db trực tiếp, readonly.
//
// Usage: node scripts/bench-dict-search.mjs
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'dictionary.db');
let db;
try {
  db = new Database(dbPath, { readonly: true });
} catch {
  db = new Database(dbPath); // WAL cần shm ghi — mở thường thay thế
}
db.pragma('busy_timeout = 5000');

const entries = db.prepare('SELECT COUNT(*) c FROM dictionary_entries').get().c;
let ftsRows = 0;
try {
  ftsRows = db.prepare('SELECT COUNT(*) c FROM dictionary_fts').get().c;
} catch {}

// ---- Câu truy vấn CŨ (nhánh LIKE full-scan + cột json gộp trong route) ----
const oldSql = `
SELECT word, ipa, part_of_speech as partOfSpeech, category, category_label as categoryLabel,
       level, meaning_vi as meaningVi, detailed_explanation as detailedExplanation,
       examples_json, collocations_json, audio_url as audioUrl, data_json
FROM dictionary_entries
WHERE (word LIKE ? OR word LIKE ? OR meaning_vi LIKE ?)
ORDER BY
  CASE WHEN word = ? THEN 1 WHEN word LIKE ? THEN 2 ELSE 3 END,
  length(word) ASC, word ASC
LIMIT ? OFFSET ?`;
const oldParams = (q) => [`${q}%`, `%${q}%`, `%${q}%`, q, `${q}%`, 24, 0];
const oldCountSql = 'SELECT COUNT(*) as total FROM dictionary_entries WHERE (word LIKE ? OR word LIKE ? OR meaning_vi LIKE ?)';
const oldCountParams = (q) => [`${q}%`, `%${q}%`, `%${q}%`];

// ---- Câu truy vấn MỚI (FTS5 prefix + bỏ cột json gộp) ----
const newSql = `
SELECT word, ipa, part_of_speech as partOfSpeech, category, category_label as categoryLabel,
       level, meaning_vi as meaningVi, detailed_explanation as detailedExplanation,
       examples_json, collocations_json, audio_url as audioUrl
FROM dictionary_entries
WHERE rowid IN (SELECT rowid FROM dictionary_fts WHERE dictionary_fts MATCH ?)
ORDER BY
  CASE WHEN word = ? THEN 1 WHEN word LIKE ? ESCAPE '\\' THEN 2 ELSE 3 END,
  length(word) ASC, word ASC
LIMIT ? OFFSET ?`;
const newCountSql = 'SELECT COUNT(*) as total FROM dictionary_entries WHERE rowid IN (SELECT rowid FROM dictionary_fts WHERE dictionary_fts MATCH ?)';

// Bản sao buildFtsMatchPhrase trong src/app/api/dictionary/search/route.ts
const toPhrase = (q) => {
  const cleaned = q.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;
  return `"${cleaned}"*`;
};

const bench = (label, fn, times = 25) => {
  fn(); // warm-up (JIT + page cache)
  let best = Infinity;
  let sum = 0;
  let lastRows = 0;
  for (let i = 0; i < times; i++) {
    const t0 = performance.now();
    lastRows = fn();
    const dt = performance.now() - t0;
    best = Math.min(best, dt);
    sum += dt;
  }
  console.log(`  ${label}  → trung bình ${(sum / times).toFixed(2)}ms | nhanh nhất ${best.toFixed(2)}ms | ${lastRows} kết quả`);
};

const queries = ['blocker', 'refactor', 'hel', 'communication', 'get up', 'lievable', '100%', 'zzzzqqq'];

console.log(`dictionary.db: ${entries.toLocaleString('vi-VN')} mục từ | FTS index: ${ftsRows.toLocaleString('vi-VN')} dòng`);

console.log('\n=== TRƯỚC — LIKE full-scan (câu cũ trong route, kèm cột json gộp ~20MB) ===');
for (const q of queries) {
  bench(`LIKE  q="${q}"`, () => {
    db.prepare(oldCountSql).get(...oldCountParams(q));
    return db.prepare(oldSql).all(...oldParams(q)).length;
  });
}

console.log('\n=== SAU — FTS5 MATCH prefix, bỏ cột json gộp (nhánh mới) ===');
for (const q of queries) {
  const phrase = toPhrase(q);
  if (!phrase) continue;
  bench(`FTS   q="${q}"`, () => {
    db.prepare(newCountSql).get(phrase);
    return db.prepare(newSql).all(phrase, q, `${q}%`, 24, 0).length;
  });
}

// Ghi chú: truy vấn substring ('lievable') và wildcard ('100%') mà FTS không bắt
// được sẽ chạy nhánh LIKE fallback — thời gian giống cột TRƯỚC, kết quả vẫn đúng.

console.log('\n=== SO KHỚP KẾT QUẢ (5 từ đầu, q="blocker") ===');
const oldWords = db.prepare(oldSql).all(...oldParams('blocker')).slice(0, 5).map((r) => r.word);
const newWords = db.prepare(newSql).all(toPhrase('blocker'), 'blocker', 'blocker%', 24, 0).slice(0, 5).map((r) => r.word);
console.log('  LIKE cũ :', oldWords.join(', '));
console.log('  FTS mới :', newWords.join(', '));
console.log('  ' + (JSON.stringify(oldWords) === JSON.stringify(newWords) ? 'GIỐNG NHAU ✅' : 'KHÁC — FTS prefix chặt hơn LIKE substring (fallback LIKE vẫn phủ trường hợp substring)'));

db.close();
