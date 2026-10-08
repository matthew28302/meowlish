// scripts/pg/02-import-user-data.mjs
// Nạp dữ liệu từ SQLite (bản production) vào Postgres, rồi ĐỐI CHIẾU số dòng.
//
// Nguyên tắc:
// - Nạp trong transaction từng bảng: thất bại thì rollback bảng đó, không để lại
//   dữ liệu dở dang.
// - `ON CONFLICT DO NOTHING` để chạy lại được nhiều lần mà không nhân bản.
// - Bảng nào lệch số dòng thì báo FAIL rõ ràng và thoát mã 1 — không "nghiệm thu" suông.
//
// Biến môi trường: DATABASE_URL, SQLITE_DB_PATH
import fs from 'fs';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';

const APPLY = process.argv.includes('--apply');
const BATCH = 400;

const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i <= 0 || line.trim().startsWith('#')) continue;
    const k = line.slice(0, i).trim();
    if (process.env[k] === undefined) process.env[k] = line.slice(i + 1).trim();
  }
}

const SQLITE_PATH = process.env.SQLITE_DB_PATH || path.join(os.tmpdir(), 'meowlish-pg', 'prod.db');
if (!fs.existsSync(SQLITE_PATH)) {
  console.error(`Không thấy SQLite nguồn: ${SQLITE_PATH}\nChạy trước: node scripts/pg/00-download-prod-db.mjs`);
  process.exit(1);
}
const sqlite = new Database(SQLITE_PATH, { readonly: true });

// CHỈ nạp các bảng đã tạo ở bước 01 — cùng quy tắc lọc, không nạp bảng nội dung
// (dictionary_*) vì chúng ở lại SQLite và cũng không tồn tại trong Postgres.
const EXTRA = new Set([
  'admin_otp_sessions', 'user_couples', 'pet_battle_rooms',
  'system_email_logs', 'system_error_logs', 'support_messages',
]);
const skip = new Set(['sync_meta']);

function columnsOf(t) {
  return sqlite.prepare(`PRAGMA table_info("${t}")`).all().map((c) => c.name);
}

const allTables = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .all()
  .map((r) => r.name);

const tables = allTables.filter(
  (t) => !skip.has(t) && (t === 'users' || columnsOf(t).includes('user_id') || EXTRA.has(t))
);

/** Chuẩn hoá giá trị: SQLite có thể trả Buffer/số lớn, Postgres cần kiểu sạch. */
function normalise(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (Buffer.isBuffer(v)) return v;
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'number' && !Number.isFinite(v)) return null;
  return v;
}

const counts = new Map();
for (const t of tables) counts.set(t, sqlite.prepare(`SELECT COUNT(*) c FROM "${t}"`).get().c);
const totalRows = [...counts.values()].reduce((a, b) => a + b, 0);
console.log(`Nguồn: ${SQLITE_PATH}`);
console.log(`Sẽ nạp ${tables.length} bảng / ${totalRows} dòng (bỏ qua: ${[...skip].join(', ')})`);
if (!APPLY) {
  console.log('\nChưa ghi gì. Thêm --apply để nạp.');
  sqlite.close();
  process.exit(0);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Thiếu DATABASE_URL.');
  process.exit(1);
}
const postgres = (await import('postgres')).default;
const sql = postgres(url, { max: 1, prepare: false, ssl: 'require', connect_timeout: 20 });

let failed = 0;
try {
  await sql`select 1`;

  for (const t of tables) {
    const cols = columnsOf(t);
    const rows = sqlite.prepare(`SELECT * FROM "${t}"`).all();
    if (!rows.length) {
      console.log(`  ${t.padEnd(26)} 0 dong — bo qua`);
      continue;
    }
    const payload = rows.map((r) => {
      const o = {};
      for (const c of cols) o[c] = normalise(r[c] ?? null);
      return o;
    });

    try {
      // postgres.js: helper bulk insert là chính hàm `tx(rows, ...cols)`.
      await sql.begin(async (tx) => {
        for (let i = 0; i < payload.length; i += BATCH) {
          const slice = payload.slice(i, i + BATCH);
          await tx`insert into ${tx(t)} ${tx(slice, ...cols)} on conflict do nothing`;
        }
      });
      const got = await sql.unsafe(`SELECT COUNT(*)::int c FROM "${t}"`);
      const ok = got[0].c >= rows.length;
      if (!ok) failed++;
      console.log(`  ${t.padEnd(26)} ${String(rows.length).padStart(5)} -> ${String(got[0].c).padStart(5)} ${ok ? 'OK' : 'FAIL'}`);
    } catch (err) {
      failed++;
      console.log(`  ${t.padEnd(26)} ${String(rows.length).padStart(5)} -> LOI: ${err.message.split('\n')[0]}`);
    }
  }

  console.log('\n=== DOI CHIEU ===');
  let allOk = true;
  for (const t of tables) {
    const want = counts.get(t);
    const got = await sql.unsafe(`SELECT COUNT(*)::int c FROM "${t}"`);
    if (got[0].c !== want) allOk = false;
    console.log(`  ${t.padEnd(26)} ${String(want).padStart(5)} / ${String(got[0].c).padStart(5)} ${got[0].c === want ? 'OK' : 'LECH'}`);
  }
  console.log(allOk && failed === 0 ? '\nTAT CA BANG DA KHOP.' : '\nCO BANG KHONG KHOP — xem dong LECH/LOI o tren.');
  if (!allOk || failed) process.exitCode = 1;
} catch (err) {
  console.error('LỖI:', err.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
  sqlite.close();
}
