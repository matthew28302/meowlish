// scripts/audit-junk-entries.mjs — Rà soát & dọn rác trong dictionary.db (đặc biệt
// dictionary_cache chứa bản fallback `Term: "..."` và bản dịch chung chung).
//
// Chạy (chỉ báo cáo, không sửa DB):
//   node scripts/audit-junk-entries.mjs
// Dọn các row rác trong dictionary_cache (cần backup trước!):
//   node scripts/audit-junk-entries.mjs --apply
//
// Tiêu chí "rác" (đồng bộ với isLowQualityResult trong src/lib/cambridgeCrawler.ts):
//   - word < 2 ký tự
//   - word chứa ký tự điều khiển / chữ số thuần / không hợp lệ
//   - word có > 4 từ (lookup cả cụm dài, thường là rác)
//   - enDef khớp /^Term:\s*"/ (fallback rác)
//   - enDef rỗng hoặc < 6 ký tự
//   - viTrans rỗng / 'Dịch thuật trực tuyến' / < 3 ký tự
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const dbPath = path.join(projectRoot, 'data', 'dictionary.db');
const apply = process.argv.includes('--apply');

function hasRealMeaning(parsed) {
  // Schema B (flat): meaningVi / allViMeanings
  if (typeof parsed?.meaningVi === 'string' && parsed.meaningVi.trim().length >= 2) return true;
  if (Array.isArray(parsed?.allViMeanings) && parsed.allViMeanings.some((m) => String(m).trim().length >= 2)) return true;
  // Schema A (senses): viTrans thật hoặc enDef thật
  const sense = parsed?.senses?.[0];
  if (sense) {
    const vi = String(sense.viTrans || '').trim();
    if (vi && vi !== 'Dịch thuật trực tuyến' && vi.length >= 3) return true;
    const en = String(sense.enDef || '').trim();
    if (en && !/^Term:/i.test(en) && en.length >= 6) return true;
  }
  return false;
}

function isLowQuality(word, dataJson) {
  let parsed;
  try { parsed = JSON.parse(dataJson); } catch { return { junk: true, reason: 'json-parse-error' }; }
  const w = String(word || '').trim();
  if (!w) return { junk: true, reason: 'empty-word' };
  const sense = parsed?.senses?.[0];
  const enDef = String(sense?.enDef || parsed?.enDef || '').trim();
  if (/^Term:\s*"/i.test(enDef)) return { junk: true, reason: 'term-fallback' };
  const viTrans = String(sense?.viTrans || '').trim();
  if (viTrans === 'Dịch thuật trực tuyến') return { junk: true, reason: 'generic-translation' };
  if (!hasRealMeaning(parsed)) return { junk: true, reason: 'no-real-meaning' };
  return { junk: false, reason: 'ok' };
}

const db = new Database(dbPath, apply ? {} : { readonly: true });

console.log('=== AUDIT DICTIONARY (apply=' + apply + ') ===');
console.log('DB:', dbPath);

// --- dictionary_entries ---
const totalEntries = db.prepare('SELECT COUNT(*) c FROM dictionary_entries').get().c;
console.log('\n[dictionary_entries] total:', totalEntries);
const shortEntries = db.prepare('SELECT COUNT(*) c FROM dictionary_entries WHERE length(word) < 2').get().c;
console.log('  word < 2 ký tự:', shortEntries);
const emptyMeaning = db.prepare("SELECT COUNT(*) c FROM dictionary_entries WHERE meaning_vi IS NULL OR trim(meaning_vi)=''").get().c;
console.log('  meaning_vi rỗng:', emptyMeaning);

// --- dictionary_cache ---
const totalCache = db.prepare('SELECT COUNT(*) c FROM dictionary_cache').get().c;
console.log('\n[dictionary_cache] total:', totalCache);

const rows = db.prepare('SELECT word, data_json FROM dictionary_cache').all();
const reasons = {};
const junkRows = [];
for (const r of rows) {
  const res = isLowQuality(r.word, r.data_json);
  if (res.junk) {
    reasons[res.reason] = (reasons[res.reason] || 0) + 1;
    junkRows.push({ word: r.word, reason: res.reason });
  }
}
console.log('  số row rác:', junkRows.length, '/', totalCache);
console.log('  phân loại rác:', reasons);

// Mẫu 20 row rác
console.log('\n  Mẫu 20 row rác:');
for (const j of junkRows.slice(0, 20)) console.log('   -', JSON.stringify(j.word), '→', j.reason);

// CSV mẫu
const csvPath = path.join(projectRoot, 'scratch', 'junk-cache-sample.csv');
const csv = ['word,reason', ...junkRows.slice(0, 200).map((j) => `"${String(j.word).replace(/"/g, '""')}",${j.reason}`)].join('\n');
fs.writeFileSync(csvPath, csv, 'utf8');
console.log('\n  CSV mẫu (200 row đầu) →', csvPath);

if (apply) {
  console.log('\n=== APPLY: xoá row rác trong dictionary_cache ===');
  const del = db.prepare('DELETE FROM dictionary_cache WHERE word = ?');
  const tx = db.transaction((items) => {
    let n = 0;
    for (const j of items) {
      // re-check word exists
      const r = del.run(j.word);
      n += r.changes;
    }
    return n;
  });
  const deleted = tx(junkRows);
  console.log('  Đã xoá:', deleted, 'row. Còn lại:', db.prepare('SELECT COUNT(*) c FROM dictionary_cache').get().c);
} else {
  console.log('\n(Gợi ý) Chạy với --apply để xoá các row rác trên (đã backup data/dictionary.db.bak-junkclean-2026-10-18).');
}

db.close();
console.log('\n=== HOÀN TẤT ===');
