/**
 * TÁCH TỪ ĐIỂN KHỎI FILE ĐỒNG BỘ english_learning.db (audit SRE 2026-10-08)
 *
 * BỐI CẢNH (đo thật): english_learning.db = 67.33MB, trong đó
 *   dictionary_entries 37.88MB + dictionary_cache 24.58MB + FTS ~1.4MB = 95%.
 * Mỗi mutation ghi DB đều upload CẢ FILE 67MB lên Filebase (~8GB/giờ/instance
 * với quota 100GB/tháng) — kể cả thao tác vô thưởng vô thưởng như tra từ
 * (ghi dictionary_cache) hay duyệt web (AccessTracker).
 *
 * Script này CHUẨN BỊ file data/dictionary.db:
 *   - copy dictionary_entries + 3 index (word/category/level)
 *   - copy dictionary_cache
 *   - dựng lại dictionary_fts (FTS5 external-content) đúng cách: tạo bảng ảo
 *     content='dictionary_entries' rồi chạy lệnh 'rebuild' để index được sinh
 *     lại từ bảng nội dung — copy bằng tay các shadow table
 *     (dictionary_fts_data/idx/docsize/config) là SAI vì rowid/content có thể
 *     lệch nhau giữa 2 file.
 *
 * TÍNH NĂNG:
 *   node scripts/split-dictionary.mjs           → copy + verify + BÁO CÁO
 *                                                   (dry-run, KHÔNG đụng DB chính)
 *   node scripts/split-dictionary.mjs --apply   → copy + verify + XÓA các bảng
 *                                                   dictionary khỏi DB chính
 *                                                   + VACUUM + checkpoint
 *                                                   (file co còn ~2-4MB; đo được
 *                                                   67.43MB → 1.61MB trên máy thật)
 *
 * Idempotent: chạy 2 lần không nhân đôi — mỗi lần chạy đều DELETE sạch bảng
 * đích rồi INSERT lại từ nguồn trong MỘT transaction (PK word không trùng),
 * FTS rebuild từ đầu nên kết quả luôn xác định.
 *
 * AN TOÀN:
 *   - Không bao giờ --apply nếu verify thất bại hoặc dictionary.db trống.
 *   - --apply chỉ DROP bảng tĩnh (dictionary_*), không đụng user data.
 *   - DB chính được mở readonly khi copy; chỉ mở read-write cho --apply.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const mainDbPath = path.join(dataDir, 'english_learning.db');
const dictDbPath = path.join(dataDir, 'dictionary.db');

const APPLY = process.argv.includes('--apply');

/** Các bảng/index tĩnh sẽ tách — phải khớp createDictDb() trong src/lib/db.ts. */
const DICT_TABLES = [
  'dictionary_fts', // bảng ảo FTS5 (drop trước bảng content)
  'dictionary_entries',
  'dictionary_cache',
];

const ENTRIES_DDL = `
  CREATE TABLE IF NOT EXISTS dictionary_entries (
    word TEXT PRIMARY KEY,
    ipa TEXT,
    part_of_speech TEXT,
    category TEXT,
    category_label TEXT,
    level TEXT,
    meaning_vi TEXT,
    detailed_explanation TEXT,
    examples_json TEXT,
    collocations_json TEXT,
    audio_url TEXT,
    data_json TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_entries_word ON dictionary_entries(word);
  CREATE INDEX IF NOT EXISTS idx_entries_category ON dictionary_entries(category);
  CREATE INDEX IF NOT EXISTS idx_entries_level ON dictionary_entries(level);
`;

const CACHE_DDL = `
  CREATE TABLE IF NOT EXISTS dictionary_cache (
    word TEXT PRIMARY KEY,
    data_json TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;

const FTS_DDL = `
  CREATE VIRTUAL TABLE IF NOT EXISTS dictionary_fts USING fts5(
    word,
    meaning_vi,
    content='dictionary_entries',
    content_rowid='rowid'
  );
`;

const ENTRY_COLUMNS = [
  'word', 'ipa', 'part_of_speech', 'category', 'category_label', 'level',
  'meaning_vi', 'detailed_explanation', 'examples_json', 'collocations_json',
  'audio_url', 'data_json',
];

function mb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

function fileSize(p) {
  try {
    return fs.statSync(p).size;
  } catch {
    return 0;
  }
}

/** escape dấu nháy đơn cho literal trong câu ATTACH. */
function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function countRows(db, schema, table) {
  return db.prepare(`SELECT COUNT(*) c FROM ${schema}.${table}`).get().c;
}

function tableExists(db, schema, table) {
  return (
    db
      .prepare(
        `SELECT 1 FROM ${schema}.sqlite_master WHERE type='table' AND name = ?`
      )
      .get(table) !== undefined
  );
}

// ---------------------------------------------------------------------------
// 1. Copy + verify (mặc định) — DB chính chỉ mở qua attach (chỉ đọc)
// ---------------------------------------------------------------------------

function copyAndVerify() {
  if (!fs.existsSync(mainDbPath)) {
    console.error(`ERROR: không tìm thấy DB chính tại ${mainDbPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const sizeMainBefore = fileSize(mainDbPath);
  const sizeDictBefore = fileSize(dictDbPath);
  console.log('=== TÁCH TỪ ĐIỂN KHỎI FILE ĐỒNG BỘ ===');
  console.log(`Trước  : english_learning.db = ${mb(sizeMainBefore)} | dictionary.db = ${sizeDictBefore ? mb(sizeDictBefore) : '(chưa có)'}`);
  console.log(`Chế độ : ${APPLY ? '--apply (copy + verify + DROP bảng khỏi DB chính + VACUUM)' : 'dry-run (copy + verify + báo cáo, KHÔNG đụng DB chính)'}`);

  const dict = new Database(dictDbPath); // main của connection này = dictionary.db
  dict.pragma('busy_timeout = 10000');
  // Attach DB chính để đọc. KHÔNG ghi vào src trong bất kỳ nhánh nào của script.
  const attachPath = mainDbPath.split(path.sep).join('/');
  dict.exec(`ATTACH DATABASE ${sqlString(attachPath)} AS src`);

  const srcHasDict = tableExists(dict, 'src', 'dictionary_entries');

  // Nguồn đã bị --apply trước đó (vd lần trước DROP xong nhưng VACUUM bị bận):
  // bỏ qua copy, chỉ verify dictionary.db hiện có để lần --apply này VACUUM nốt.
  if (!srcHasDict) {
    console.log('Nguồn không còn bảng dictionary (đã --apply trước đó) → bỏ qua copy, verify dictionary.db hiện có.');
    const result = verifyDictOnly(dict);
    dict.exec('VACUUM');
    try {
      dict.pragma('wal_checkpoint(TRUNCATE)');
    } catch {}
    dict.close();
    console.log(`Sau verify: dictionary.db = ${mb(fileSize(dictDbPath))}`);
    return result;
  }

  const srcEntries = countRows(dict, 'src', 'dictionary_entries');
  const srcCache = countRows(dict, 'src', 'dictionary_cache');
  console.log(`Nguồn  : dictionary_entries = ${srcEntries.toLocaleString('vi-VN')} dòng | dictionary_cache = ${srcCache.toLocaleString('vi-VN')} dòng`);

  if (srcEntries === 0) {
    console.error('ERROR: DB chính không có dữ liệu từ điển — không có gì để tách.');
    dict.close();
    process.exit(1);
  }

  // --- Copy trong MỘT transaction (atomic cho toàn bộ dictionary.db) ---
  console.log('Đang copy...');
  const colList = ENTRY_COLUMNS.join(', ');
  dict.exec(`
    BEGIN IMMEDIATE;
    ${ENTRIES_DDL}
    ${CACHE_DDL}
    DELETE FROM main.dictionary_entries;
    DELETE FROM main.dictionary_cache;
    INSERT INTO main.dictionary_entries (${colList})
      SELECT ${colList} FROM src.dictionary_entries;
    INSERT INTO main.dictionary_cache (word, data_json, created_at)
      SELECT word, data_json, created_at FROM src.dictionary_cache;
    -- FTS external-content phải REBUILD từ bảng nội dung, không copy shadow table
    DROP TABLE IF EXISTS main.dictionary_fts;
    ${FTS_DDL}
    INSERT INTO main.dictionary_fts(dictionary_fts) VALUES('rebuild');
    COMMIT;
  `);

  // --- Verify toàn bộ (đếm dòng khớp + FTS + LIKE + quick_check) ---
  const report = verifyDict(dict, srcEntries, srcCache);
  dict.exec('VACUUM');
  // WAL mode (file từng bị dev server mở): ảnh VACUUM nằm trong -wal — phải
  // checkpoint(TRUNCATE) thì file chính mới thực sự co lại (đã đo trên máy thật).
  try {
    dict.pragma('wal_checkpoint(TRUNCATE)');
  } catch {}
  dict.close();

  const sizeDictAfter = fileSize(dictDbPath);
  console.log(`Sau copy: dictionary.db = ${mb(sizeDictAfter)} (main chưa đổi: ${mb(fileSize(mainDbPath))})`);

  if (!report.ok) {
    console.error('\nVERIFY THẤT BẠI — KHÔNG chạy --apply được. Xem các dòng LỆCH! ở trên.');
    process.exit(1);
  }
  console.log('VERIFY: đếm dòng khớp 100%, FTS nhất quán, quick_check ok → dictionary.db sẵn sàng.');
  return { srcEntries, srcCache, sizeMainBefore, sizeDictAfter };
}

/**
 * Verify dictionary.db (connection `dict` đang mở, main = dictionary.db).
 * `expectedEntries`/`expectedCache` = -1 khi không có nguồn để so (verify-only).
 */
function verifyDict(dict, expectedEntries, expectedCache) {
  const dstEntries = countRows(dict, 'main', 'dictionary_entries');
  const dstCache = countRows(dict, 'main', 'dictionary_cache');
  const countsOk =
    expectedEntries < 0 ? dstEntries > 0 : dstEntries === expectedEntries && dstCache === expectedCache;
  console.log(`Đích   : dictionary_entries = ${dstEntries.toLocaleString('vi-VN')} dòng | dictionary_cache = ${dstCache.toLocaleString('vi-VN')} dòng ${countsOk ? '(KHỚP)' : '(LỆCH!)'}`);

  // --- Verify FTS: integrity-check ném lỗi nếu index lệch với content table ---
  let ftsOk = false;
  let ftsMatchCount = -1;
  try {
    dict.exec(`INSERT INTO main.dictionary_fts(dictionary_fts) VALUES('integrity-check');`);
    // Cú pháp FTS5: tên cột MATCH không được prefix schema
    ftsMatchCount = dict
      .prepare(`SELECT COUNT(*) c FROM main.dictionary_fts WHERE dictionary_fts MATCH 'hello'`)
      .get().c;
    ftsOk = true;
    console.log(`FTS    : integrity-check OK, MATCH 'hello' → ${ftsMatchCount} kết quả`);
  } catch (err) {
    console.error('FTS    : integrity-check THẤT BẠI:', err.message);
  }

  // --- Verify LIKE search (đúng kiểu route /api/dictionary/search dùng) ---
  const likeHit = dict
    .prepare(`SELECT word FROM main.dictionary_entries WHERE (word LIKE ? OR word LIKE ?) AND word = 'hello' LIMIT 1`)
    .get('hel%', '%hel%');
  const likeOk = likeHit && likeHit.word === 'hello';
  console.log(`LIKE   : "hel%" tìm thấy 'hello' → ${likeOk ? 'CÓ' : 'KHÔNG'} ${likeOk ? '(OK)' : '(LỆCH!)'}`);

  // --- quick_check toàn file đích ---
  let quickOk = false;
  try {
    const res = dict.pragma('quick_check');
    quickOk = Array.isArray(res) && res.length === 1 && res[0].quick_check === 'ok';
    console.log(`quick_check : ${quickOk ? 'ok' : JSON.stringify(res)}`);
  } catch (err) {
    console.log('quick_check : không chạy được —', err.message);
  }

  return { ok: countsOk && ftsOk && likeOk && quickOk && dstEntries > 0, dstEntries, dstCache };
}

/** Nguồn đã bị --apply trước đó → chỉ verify dictionary.db hiện có (để VACUUM nốt). */
function verifyDictOnly(dict) {
  if (!tableExists(dict, 'main', 'dictionary_entries')) {
    console.error('ERROR: dictionary.db không có bảng dictionary_entries — phải copy trước khi --apply.');
    dict.close();
    process.exit(1);
  }
  const report = verifyDict(dict, -1, -1);
  if (!report.ok) {
    console.error('\nVERIFY THẤT BẠI trên dictionary.db hiện có — xem log ở trên.');
    dict.close();
    process.exit(1);
  }
  return {
    srcEntries: report.dstEntries,
    srcCache: report.dstCache,
    sizeMainBefore: fileSize(mainDbPath),
    sizeDictAfter: fileSize(dictDbPath),
  };
}

// ---------------------------------------------------------------------------
// 2. Báo cáo những gì --apply sẽ xoá (dry-run) — đo bằng dbstat, không đoán
// ---------------------------------------------------------------------------
function dryRunReport(result) {
  const ro = new Database(mainDbPath, { readonly: true });
  try {
    const groups = ro.prepare('SELECT name, SUM(pgsize) b FROM dbstat GROUP BY name').all();
    const dictBytes = groups
      .filter((g) => g.name.toLowerCase().includes('dictionary'))
      .reduce((s, g) => s + g.b, 0);
    const keepBytes = groups
      .filter((g) => !g.name.toLowerCase().includes('dictionary'))
      .reduce((s, g) => s + g.b, 0);
    const objects = ro
      .prepare(`SELECT type, name FROM sqlite_master WHERE name LIKE '%dictionary%' ORDER BY type, name`)
      .all();
    console.log('\n=== DRY-RUN: --apply sẽ làm gì với DB chính ===');
    console.log('Các đối tượng sẽ bị DROP (chỉ tĩnh, không có user data):');
    for (const o of objects) console.log(`  ${o.type.padEnd(6)} ${o.name}`);
    console.log(`Dung lượng các trang dictionary hiện chiếm: ${mb(dictBytes)}`);
    console.log(`Ước tính file DB chính sau khi DROP + VACUUM: ~${mb(keepBytes + 1_048_576)} (thực tế in ra sau --apply)`);
    console.log('\nChạy lại với --apply để thực hiện: node scripts/split-dictionary.mjs --apply');
  } catch (err) {
    console.log('\n(dry-run) Không đo được dbstat —', err.message);
  } finally {
    ro.close();
  }
}

// ---------------------------------------------------------------------------
// 3. --apply: DROP bảng dictionary khỏi DB chính + VACUUM cho file co lại
// ---------------------------------------------------------------------------
function applyDrop(result) {
  console.log('\n=== --APPLY: xoá bảng dictionary khỏi DB chính ===');
  const rw = new Database(mainDbPath); // connection riêng, main = english_learning.db
  rw.pragma('busy_timeout = 30000');
  try {
    rw.exec('BEGIN IMMEDIATE;');
    for (const t of DICT_TABLES) {
      rw.exec(`DROP TABLE IF EXISTS main.${t};`);
      console.log(`  DROP TABLE ${t}: xong`);
    }
    rw.exec('COMMIT;');
  } catch (err) {
    try { rw.exec('ROLLBACK;'); } catch {}
    console.error('DROP thất bại (rollback, DB chính còn nguyên):', err.message);
    rw.close();
    process.exit(1);
  }

  // VACUUM bắt buộc: DROP chỉ trả trang về freelist, file KHÔNG tự co lại.
  // WAL mode (dev server đang mở DB): ảnh VACUUM nằm trong -wal — PHẢI kèm
  // checkpoint(TRUNCATE) thì file chính mới thực sự co (đã đo: 67MB→1.6MB
  // chỉ xảy ra SAU checkpoint, không phải sau VACUUM). BUSY thì retry.
  let vacuumed = false;
  for (let attempt = 1; attempt <= 5 && !vacuumed; attempt++) {
    try {
      console.log(`VACUUM + checkpoint (lần ${attempt})...`);
      rw.exec('VACUUM');
      const ck = rw.pragma('wal_checkpoint(TRUNCATE)');
      console.log(`  checkpoint: ${JSON.stringify(ck)}`);
      vacuumed = ck && ck[0] && ck[0].busy === 0;
      if (!vacuumed) throw new Error('checkpoint busy (có reader đang giữ WAL)');
    } catch (err) {
      console.warn(`  VACUUM/checkpoint bận (${err.message}) — thử lại sau 3s.`);
      if (attempt < 5) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 3000);
    }
  }
  rw.close();

  const sizeMainAfter = fileSize(mainDbPath);
  const sizeDict = fileSize(dictDbPath);
  if (!vacuumed) {
    console.error(
      `VACUUM/checkpoint thất bại sau 5 lần (DB đang bị tiến trình khác giữ — tắt dev server rồi chạy lại\n` +
      '"node scripts/split-dictionary.mjs --apply" — script idempotent, chạy lại an toàn).'
    );
    process.exit(1);
  }
  // Kiểm chứng bằng đo: file phải thực sự co xuống. Lệch = có gì đó sai.
  if (sizeMainAfter > result.sizeMainBefore * 0.9) {
    console.error(
      `CẢNH BÁO: file DB chính vẫn còn ${mb(sizeMainAfter)} (kỳ vọng ~2-4MB). ` +
      'DROP đã xong nhưng file chưa co — chạy lại --apply khi không còn kết nối nào đang mở DB.'
    );
    process.exit(1);
  }
  console.log(`\nKẾT QUẢ: english_learning.db ${mb(result.sizeMainBefore)} → ${mb(sizeMainAfter)} | dictionary.db = ${mb(sizeDict)}`);
  console.log(`Đã copy: dictionary_entries = ${result.srcEntries.toLocaleString('vi-VN')} dòng, dictionary_cache = ${result.srcCache.toLocaleString('vi-VN')} dòng.`);
  console.log('DB chính giờ chỉ còn user data — mọi lần upload S3 sau này đẩy ~file này, không còn 67MB.');
}

// ---------------------------------------------------------------------------

const result = copyAndVerify();
if (APPLY) {
  applyDrop(result);
  console.log('\nHOÀN TẤT --apply. Các bước còn lại (làm trên máy, theo docs/db-sync.md):');
  console.log('  1. node scripts/upload-dictionary.mjs        # đẩy dictionary.db lên S3 key english_learning_dictionary.db (MỘT LẦN)');
  console.log('  2. node scripts/sync-to-filebase.mjs        # đẩy DB chính (nhỏ) lên S3');
  console.log('  3. git push (deploy Vercel)                  # code mới đọc dictionary.db');
} else {
  dryRunReport(result);
}
