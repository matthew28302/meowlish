// scripts/pg/01-create-schema.mjs
// Tạo schema Postgres cho các bảng DỮ LIỆU NGƯỜI DÙNG, sinh từ schema SQLite hiện có.
//
// VÌ SAO CHỈ MỘT PHẦN:
//   63.9MB trong DB là nội dung tĩnh (dictionary) — chỉ đọc, giữ nguyên SQLite.
//   0.1MB là dữ liệu người dùng — chuyển sang Postgres để có transaction thật.
//   Script này chỉ tạo bảng có cột `user_id` (cộng bảng `users`), tức là mọi
//   bảng mà ứng dụng thực sự GHI vào.
//
// ÁNH XẠ KIỂU (giữ nguyên tên cột để không phải sửa câu SQL):
//   INTEGER -> integer   (CỐ TÌNH không dùng bigint: driver trả bigint về dạng
//                         chuỗi, làm `user.coins` thành chuỗi → vỡ logic coins)
//   TEXT    -> text
//   REAL    -> double precision
//   NUMERIC -> numeric
//   BLOB    -> bytea
//   CURRENT_TIMESTAMP -> now()
//
// CÁCH DÙNG
//   node scripts/pg/01-create-schema.mjs           # in DDL ra, KHÔNG ghi
//   node scripts/pg/01-create-schema.mjs --apply   # tạo bảng trong Postgres
//   node scripts/pg/01-create-schema.mjs --apply --drop  # xoá rồi tạo lại
//
// Biến môi trường: DATABASE_URL (chuỗi kết nối transaction pooler của Supabase).
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const APPLY = process.argv.includes('--apply');
const DROP = process.argv.includes('--drop');

// Nạp .env.local để chạy tiện tay (biến môi trường thật vẫn được ưu tiên).
const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i <= 0 || line.trim().startsWith('#')) continue;
    const k = line.slice(0, i).trim();
    if (process.env[k] === undefined) process.env[k] = line.slice(i + 1).trim();
  }
}

const SQLITE_PATH = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'english_learning.db');
const sqlite = new Database(SQLITE_PATH, { readonly: true });

const allTables = sqlite
  .prepare("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .all();

function columnsOf(table) {
  return sqlite.prepare(`PRAGMA table_info("${table}")`).all();
}

// Bảng cần chuyển: có cột user_id, hoặc chính là bảng users.
const targets = allTables.filter((t) => t.name === 'users' || columnsOf(t.name).some((c) => c.name === 'user_id'));

// Một số bảng không có `user_id` nhưng vẫn là trạng thái của app (không phải nội
// dung tĩnh) — bỏ sót thì tính năng tương ứng sẽ hỏng ngay khi cắt sang Postgres.
const EXTRA = new Set([
  'admin_otp_sessions', 'user_couples', 'pet_battle_rooms',
  'system_email_logs', 'system_error_logs', 'support_messages',
]);

// KHÔNG chuyển: metadata của lớp đồng bộ SQLite (chỉ dùng cho S3 sync, sẽ xoá hẳn).
const SKIP = new Set(['sync_meta']);
const migrate = allTables.filter((t) => !SKIP.has(t.name) && (targets.includes(t) || EXTRA.has(t.name)));

function mapType(sqliteType) {
  const t = String(sqliteType || '').toUpperCase();
  if (t.includes('INT')) return 'integer';
  if (t.includes('REAL') || t.includes('FLOA') || t.includes('DOUB')) return 'double precision';
  if (t.includes('BLOB')) return 'bytea';
  if (t.includes('NUM') || t.includes('DEC')) return 'numeric';
  return 'text';
}

/**
 * SQLite kiểu động: cột khai báo INTEGER vẫn có thể chứa số vượt int4 — ví dụ
 * `expires_at` lưu epoch-millis ~1.79e12 > 2 147 483 647, Postgres thì từ chối.
 * Chọn bigint cho đúng cột đó; adapter phải ép bigint về Number (mặc định
 * postgres.js trả int8 thành CHUỖI, làm hỏng mọi so sánh kiểu số).
 */
function needsBigInt(table, column) {
  try {
    const row = sqlite.prepare(`SELECT MAX(ABS(CAST("${column}" AS INTEGER))) AS m FROM "${table}"`).get();
    return Number(row?.m ?? 0) > 2147483647;
  } catch {
    return false;
  }
}

function mapDefault(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (/^CURRENT_TIMESTAMP$/i.test(s)) return 'now()';
  return s;
}

const uniqueIndexes = new Map(); // table -> [columns]
for (const t of migrate) {
  const list = sqlite.prepare(`PRAGMA index_list("${t.name}")`).all();
  for (const idx of list) {
    if (idx.origin !== 'u') continue;
    const cols = sqlite.prepare(`PRAGMA index_info("${idx.name}")`).all().map((c) => c.name);
    if (!uniqueIndexes.has(t.name)) uniqueIndexes.set(t.name, []);
    uniqueIndexes.get(t.name).push(cols);
  }
}

const ddl = [];
for (const t of migrate) {
  const cols = columnsOf(t.name);
  const pk = cols.filter((c) => c.pk);
  const parts = [];

  for (const c of cols) {
    let type = mapType(c.type);
    if (type === 'integer' && needsBigInt(t.name, c.name)) type = 'bigint';
    let line = `  "${c.name}" ${type}`;
    if (c.notnull) line += ' NOT NULL';
    const def = mapDefault(c.dflt_value);
    if (def) line += ` DEFAULT ${def}`;
    parts.push(line);
  }
  if (pk.length === 1) parts.push(`  PRIMARY KEY ("${pk[0].name}")`);
  else if (pk.length > 1) parts.push(`  PRIMARY KEY (${pk.map((c) => `"${c.name}"`).join(', ')})`);

  for (const ucols of uniqueIndexes.get(t.name) || []) {
    if (ucols.length === 1 && pk.length === 1 && ucols[0] === pk[0].name) continue; // trùng PK
    parts.push(`  UNIQUE (${ucols.map((c) => `"${c}"`).join(', ')})`);
  }

  ddl.push(`CREATE TABLE IF NOT EXISTS "${t.name}" (\n${parts.join(',\n')}\n);`);

  // Index cho cột user_id (truy vấn nhiều nhất) và các cột hay lọc/sắp xếp.
  const idxCols = new Set();
  for (const c of cols) if (c.name === 'user_id') idxCols.add('user_id');
  for (const c of cols) if (['username', 'created_at', 'updated_at', 'word'].includes(c.name)) idxCols.add(c.name);
  for (const ic of idxCols) {
    ddl.push(`CREATE INDEX IF NOT EXISTS "${t.name}_${ic}_idx" ON "${t.name}" ("${ic}");`);
  }
}

// Bảo mật: bật RLS nhưng KHÔNG tạo policy => anon/authenticated bị từ chối mọi thao tác
// qua Data API của Supabase. Ứng dụng kết nối bằng role `postgres` (chủ sỗi bảng)
// nên vẫn dùng bình thường.
const rls = migrate.map((t) => `ALTER TABLE "${t.name}" ENABLE ROW LEVEL SECURITY;`);

console.log(`Nguồn: ${SQLITE_PATH}`);
console.log(`Bảng sẽ chuyển (${migrate.length}): ${migrate.map((t) => t.name).join(', ')}`);
console.log(`Bảng GIỮ SQLite: ${allTables.filter((t) => !migrate.includes(t)).map((t) => t.name).join(', ')}`);
console.log('');
console.log('-- ' + ddl.length + ' câu DDL + ' + rls.length + ' câu RLS');
console.log('');

if (!APPLY) {
  console.log('=== DDL (chưa ghi) ===');
  console.log(ddl.join('\n') + '\n' + rls.join('\n'));
  console.log('\nThêm --apply để tạo bảng trong Postgres.');
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

try {
  const v = await sql`select version()`;
  console.log('Kết nối OK:', v[0].version.split(',')[0]);

  if (DROP) {
    console.log('Đang xoá bảng cũ (--drop)...');
    for (const t of migrate) await sql.unsafe(`DROP TABLE IF EXISTS "${t.name}" CASCADE;`);
  }

  for (const stmt of ddl) await sql.unsafe(stmt);
  for (const stmt of rls) await sql.unsafe(stmt);

  const existing = await sql`select tablename from pg_tables where schemaname = 'public' order by tablename`;
  console.log('');
  console.log('Bảng trong Postgres sau khi tạo:', existing.map((r) => r.tablename).join(', '));

  const src = {};
  for (const t of migrate) src[t.name] = sqlite.prepare(`SELECT COUNT(*) c FROM "${t.name}"`).get().c;
  console.log('');
  console.log('So dong nguon (SQLite) -> dich (Postgres):');
  for (const t of migrate) {
    const r = await sql.unsafe(`SELECT COUNT(*)::int AS c FROM "${t.name}"`);
    const mark = r[0].c === 0 ? '  (chua nap du lieu)' : '';
    console.log(`  ${t.name.padEnd(26)} ${String(src[t.name]).padStart(5)} -> ${String(r[0].c).padStart(5)}${mark}`);
  }
} catch (err) {
  console.error('LỖI:', err.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
  sqlite.close();
}
