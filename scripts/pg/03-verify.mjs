// scripts/pg/03-verify.mjs
// So SÁCH TỪNG GIÁ TRỊ giữa SQLite và Postgres — không chỉ đếm số dòng.
//
// Cách làm: với mỗi bảng, đọc toàn bộ dòng ở cả hai engine, chuẩn hoá về cùng
// một dạng JSON (thứ tự cột cố định, null thành null, bigint thành Number), sắp
// xếp theo khoá chính rồi băm SHA-256. Hai chữ ký khác nhau => có dữ liệu lệch,
// script in ra dòng đầu tiên lệch để tìm nguyên nhân.
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import Database from 'better-sqlite3';

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
const sqlite = new Database(SQLITE_PATH, { readonly: true });

const EXTRA = new Set([
  'admin_otp_sessions', 'user_couples', 'pet_battle_rooms',
  'system_email_logs', 'system_error_logs', 'support_messages',
]);
const skip = new Set(['sync_meta']);
const colsOf = (t) => sqlite.prepare(`PRAGMA table_info("${t}")`).all().map((c) => c.name);
const tables = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .all()
  .map((r) => r.name)
  .filter((t) => !skip.has(t) && (t === 'users' || colsOf(t).includes('user_id') || EXTRA.has(t)));

const norm = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'bigint') return Number(v);
  if (Buffer.isBuffer(v)) return 'base64:' + v.toString('base64');
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
};

function shape(rows, cols, pkCols) {
  return rows.map((r) => {
    const o = {};
    for (const c of cols) o[c] = norm(r[c]);
    return o;
  }).sort((a, b) => {
    for (const k of pkCols) {
      const av = a[k], bv = b[k];
      if (av === bv) continue;
      if (av === null) return -1;
      if (bv === null) return 1;
      return av < bv ? -1 : 1;
    }
    return 0;
  });
}
const digest = (arr) => crypto.createHash('sha256').update(JSON.stringify(arr)).digest('hex').slice(0, 16);

const url = process.env.DATABASE_URL;
if (!url) { console.error('Thiếu DATABASE_URL.'); process.exit(1); }
const postgres = (await import('postgres')).default;
const sql = postgres(url, {
  max: 1,
  prepare: false,
  ssl: 'require',
  connect_timeout: 20,
  // BẮT BUỘC: tên type là `BigInt` (hoa ký tự đầu, OID 20 = int8). Mặc định
  // postgres.js trả int8 thành CHUỖI ⇒ mọi so sánh kiểu số sai, ví dụ
  // `session.expires_at > Date.now()` với chuỗi. Ghi `bigint` (chữ thường) thì
  // KHÔNG báo lỗi mà bị bỏ qua âm thầm — đã dính lỗi này một lần.
  types: { BigInt: { from: [20], parse: (x) => Number(x) } },
});

let bad = 0;
try {
  console.log('bang                     dong  chu ky SQLite   chu ky Postgres   ket qua');
  console.log('-'.repeat(78));
  for (const t of tables) {
    const info = sqlite.prepare(`PRAGMA table_info("${t}")`).all();
    const cols = info.map((c) => c.name);
    const pkCols = info.filter((c) => c.pk).map((c) => c.name);
    const order = (pkCols.length ? pkCols : ['id']).filter((c) => cols.includes(c));

    const srcRows = shape(sqlite.prepare(`SELECT * FROM "${t}"`).all(), cols, order);
    // Phải lọc table_schema: Supabase có sẵn `auth.users` — không lọc thì lấy
    // cột của cả hai bảng cùng tên và tưởng là lệch schema.
    const pgColsRes = await sql.unsafe(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = '${t}' ORDER BY ordinal_position`
    );
    const pgCols = pgColsRes.map((r) => r.column_name);
    const pgRowsRaw = await sql.unsafe(`SELECT * FROM "${t}"`);
    const pgRows = shape(pgRowsRaw, cols, order);

    const sameCols = JSON.stringify(pgCols) === JSON.stringify(cols);
    const ds = digest(srcRows);
    const dp = digest(pgRows);
    const ok = ds === dp && sameCols;
    if (!ok) bad++;

    console.log(
      t.padEnd(24) +
      String(srcRows.length).padStart(4) +
      '   ' + ds.padEnd(15) +
      '   ' + dp.padEnd(15) +
      '   ' + (ok ? 'OK' : 'LECH')
    );

    if (!ok) {
      if (!sameCols) console.log(`   ! cot khac nhau: PG=${pgCols.length} SQLite=${cols.length}`);
      // So TỪNG TRƯỜNG (kèm typeof) chứ không so JSON cả dòng: khác kiểu
      // number/string sẽ chỉ ra đúng trường thay vì báo "dòng lệch" mơ hồ.
      let reported = 0;
      for (let i = 0; i < Math.max(srcRows.length, pgRows.length); i++) {
        const a = srcRows[i] || {};
        const b = pgRows[i] || {};
        for (const c of cols) {
          if (JSON.stringify(a[c]) === JSON.stringify(b[c])) continue;
          if (reported++ < 3) {
            console.log(
              `   ! dong ${i} truong "${c}": SQLite=${JSON.stringify(a[c])} (${typeof a[c]}) | Postgres=${JSON.stringify(b[c])} (${typeof b[c]})`
            );
          }
        }
      }
      if (!reported) console.log('   ! tung truong deu bang nhau — khac o thu tu sap xep');
    }
  }
  console.log('-'.repeat(78));
  console.log(bad === 0 ? 'GIA TRI KHOP HOAN TOAN tren tat ca bang.' : `${bad} bang co gia tri lech.`);
  if (bad) process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
  sqlite.close();
}
