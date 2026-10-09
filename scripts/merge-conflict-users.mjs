// scripts/merge-conflict-users.mjs
// Gộp lại tài khoản bị MẤT do cơ chế đồng bộ ghi đè cả tệp SQLite.
//
// BỐI CẢNH
// DB là MỘT tệp SQLite ~66MB trên Filebase S3. Mỗi instance Vercel giữ bản riêng
// trong /tmp và đẩy NGUYÊN TỆP lên. Khi hai instance ghi cùng lúc, bản thua được
// `forkRejoin` lưu vào key english_learning.conflict.db rồi bản remote thắng —
// ghi cục bộ bị vứt, KHÔNG gộp lại. Hậu quả: tài khoản vừa đăng ký biến mất
// khỏi hệ thống dù người dùng đã thấy "đăng ký thành công".
// Đã xảy ra thật: một tài khoản người dùng (14:51:00) chỉ còn trong conflict key.
// (Không ghi tên/email vào repo — xem git history nếu cần tra.)
//
// NGUYÊN TẮC AN TOÀN
// 1. CHỈ THÊM, KHÔNG XOÁ: tài khoản có trong conflict mà thiếu trong bản chính
//    được chép sang. Tài khoản đã tồn tại ở bản chính thì GIỮ NGUYÊN bản chính
//    (bản chính là bản đang được phục vụ).
// 2. Sao lưu bản chính vào key có timestamp TRƯỚC khi ghi đè.
// 3. Ghi có điều kiện If-Match theo ETag đã đọc; nếu 412 (instance khác vừa ghi)
//    thì tải lại và gộp lại từ đầu (không bao giờ ghi đè mù).
// 4. Xác minh sau khi ghi: tải lại bản chính và kiểm tra các tài khoản vừa thêm.
//
// CÁCH DÙNG
//   node scripts/merge-conflict-users.mjs            # chỉ báo cáo, không ghi
//   node scripts/merge-conflict-users.mjs --apply    # thực sự gộp
import fs from 'fs';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import { S3Client, HeadObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const DB_KEY = 'english_learning.db';
const CONFLICT_KEY = 'english_learning.conflict.db';
const WORK_DIR = path.join(os.tmpdir(), 'meowlish-merge');
const APPLY = process.argv.includes('--apply');

// --- nạp biến môi trường từ .env.local (script chạy ngoài Next.js) ---
function loadEnvFile(file = '.env.local') {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i <= 0 || line.trim().startsWith('#')) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    if (process.env[k] === undefined) process.env[k] = v;
  }
}
loadEnvFile();

const S3 = new S3Client({
  endpoint: process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io',
  region: (process.env.FILEBASE_REGION && process.env.FILEBASE_REGION !== 'auto') ? process.env.FILEBASE_REGION : 'us-east-1',
  credentials: {
    accessKeyId: process.env.FILEBASE_ACCESS_KEY || '',
    secretAccessKey: process.env.FILEBASE_SECRET_KEY || '',
  },
  forcePathStyle: true,
});
const BUCKET = process.env.FILEBASE_BUCKET_NAME || 'meowlish-db';

function log(...a) { console.log(...a); }

async function download(key, dest) {
  const res = await S3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  if (!res.Body) throw new Error(`S3 GetObject rỗng: ${key}`);
  const buf = Buffer.from(await res.Body.transformToByteArray());
  if (!buf.subarray(0, 16).toString('utf8').startsWith('SQLite format 3')) {
    throw new Error(`${key} không phải tệp SQLite hợp lệ`);
  }
  fs.writeFileSync(dest, buf);
  return { bytes: buf.length, etag: res.ETag || null };
}

/** Các bảng có cột user_id → mọi dòng thuộc về người dùng đều nằm trong đây. */
function tablesWithUserColumn(db) {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map((r) => r.name);
  return tables.filter((t) => {
    try {
      return db.prepare(`PRAGMA table_info("${t}")`).all().some((c) => c.name === 'user_id');
    } catch {
      return false;
    }
  });
}

function copyUserRows(mainDb, conflictDb, user) {
  // 1) dòng users
  const cols = conflictDb.prepare(`PRAGMA table_info("users")`).all().map((c) => c.name);
  const vals = cols.map((c) => user[c]);
  mainDb
    .prepare(`INSERT OR IGNORE INTO users (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`)
    .run(...vals);

  // 2) các bảng con theo user_id
  const copied = { users: 1 };
  for (const t of tablesWithUserColumn(conflictDb)) {
    if (t === 'users') continue;
    const tcols = conflictDb.prepare(`PRAGMA table_info("${t}")`).all().map((c) => c.name);
    const existsInMain = mainDb
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(t);
    if (!existsInMain) continue;
    const rows = conflictDb.prepare(`SELECT * FROM "${t}" WHERE user_id = ?`).all(user.id);
    if (!rows.length) continue;
    const sql = `INSERT OR IGNORE INTO "${t}" (${tcols.map((c) => `"${c}"`).join(', ')}) VALUES ${rows
      .map(() => `(${tcols.map(() => '?').join(', ')})`)
      .join(', ')}`;
    try {
      mainDb.prepare(sql).run(...rows.flatMap((r) => tcols.map((c) => r[c])));
    } catch (err) {
      throw new Error(`Chép bảng "${t}" thất bại: ${err.message} | SQL: ${sql.slice(0, 300)}`);
    }
    copied[t] = rows.length;
  }
  return copied;
}

function analyse(mainDb, conflictDb) {
  const mainUsers = mainDb.prepare('SELECT id, username, coins, created_at FROM users').all();
  const mainByUsername = new Map(mainUsers.map((u) => [String(u.username).toLowerCase(), u]));
  const mainById = new Set(mainUsers.map((u) => u.id));
  const conflictUsers = conflictDb.prepare('SELECT * FROM users').all();

  const missing = [];
  for (const u of conflictUsers) {
    if (mainById.has(u.id) || mainByUsername.has(String(u.username).toLowerCase())) continue;
    missing.push(u);
  }

  // Chênh lệch ở tài khoản tồn tại ở cả hai bản (chỉ báo cáo, KHÔNG tự gộp)
  const shared = [];
  for (const u of conflictUsers) {
    const m = mainByUsername.get(String(u.username).toLowerCase());
    if (!m || m.id === u.id) continue;
    const diffs = [];
    if (m.coins !== u.coins) diffs.push(`coins ${m.coins} -> ${u.coins}`);
    const bMain = mainDb.prepare('SELECT COUNT(*) c FROM bookmarks WHERE user_id = ?').get(m.id).c;
    const bConf = conflictDb.prepare('SELECT COUNT(*) c FROM bookmarks WHERE user_id = ?').get(u.id).c;
    if (bMain !== bConf) diffs.push(`bookmarks ${bMain} -> ${bConf}`);
    const pMain = mainDb.prepare('SELECT COUNT(*) c FROM progress WHERE user_id = ?').get(m.id).c;
    const pConf = conflictDb.prepare('SELECT COUNT(*) c FROM progress WHERE user_id = ?').get(u.id).c;
    if (pMain !== pConf) diffs.push(`progress ${pMain} -> ${pConf}`);
    if (diffs.length) shared.push({ username: u.username, diffs });
  }

  return { missing, shared, mainCount: mainUsers.length, conflictCount: conflictUsers.length };
}

async function main() {
  fs.mkdirSync(WORK_DIR, { recursive: true });
  const mainFile = path.join(WORK_DIR, 'main.db');
  const conflictFile = path.join(WORK_DIR, 'conflict.db');

  for (let attempt = 1; attempt <= 3; attempt++) {
    log(`\n=== Lần thử ${attempt} ===`);

    const head = await S3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: DB_KEY }));
    const remoteEtag = head.ETag;
    log(`Bản chính trên Filebase: ${(head.ContentLength / 1048576).toFixed(1)} MB, ETag=${remoteEtag}`);

    const m = await download(DB_KEY, mainFile);
    let hasConflict = true;
    try {
      const c = await download(CONFLICT_KEY, conflictFile);
      log(`Bản conflict: ${(c.bytes / 1048576).toFixed(1)} MB`);
    } catch (err) {
      hasConflict = false;
      log('Không tải được bản conflict:', err.message);
    }

    const mainDb = new Database(mainFile);
    const conflictDb = hasConflict ? new Database(conflictFile, { readonly: true }) : null;

    if (!conflictDb) {
      mainDb.close();
      log('Không có bản conflict để gộp. Dừng.');
      return;
    }

    const report = analyse(mainDb, conflictDb);
    log(`Tài khoản — bản chính: ${report.mainCount}, bản conflict: ${report.conflictCount}`);
    log(`THIẾU trong bản chính (sẽ khôi phục): ${report.missing.length}`);
    for (const u of report.missing) {
      log(`  + @${u.username} (${u.display_name || ''}) coins=${u.coins} created=${u.created_at}`);
    }
    if (report.shared.length) {
      log('Khác biệt ở tài khoản có ở cả hai bản (GIỮ BẢN CHÍNH, chỉ báo cáo):');
      for (const s of report.shared) log(`  ~ @${s.username}: ${s.diffs.join(' | ')}`);
    }

    if (!report.missing.length) {
      mainDb.close();
      conflictDb.close();
      log('\nKhông có tài khoản nào bị mất. Không cần gộp.');
      return;
    }

    if (!APPLY) {
      mainDb.close();
      conflictDb.close();
      log('\nChỉ báo cáo. Thêm --apply để ghi vào Filebase.');
      return;
    }

    // Sao lưu bản chính hiện tại trước khi ghi đè.
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupKey = `english_learning.premerge-${stamp}.db`;
    await S3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: backupKey,
        Body: fs.createReadStream(mainFile),
        ContentType: 'application/octet-stream',
        Metadata: { reason: 'pre-merge-backup', 'saved-at': new Date().toISOString() },
      })
    );
    log(`Đã sao lưu bản chính vào '${backupKey}' (${m.bytes} bytes)`);

    // Gộp vào bản chính
    const summary = [];
    mainDb.pragma('journal_mode = DELETE');
    for (const u of report.missing) {
      const copied = copyUserRows(mainDb, conflictDb, u);
      summary.push({ username: u.username, copied });
    }
    mainDb.pragma('wal_checkpoint(TRUNCATE)');
    mainDb.close();
    conflictDb.close();
    log('Đã gộp vào bản cục bộ:');
    for (const s of summary) log(`  + @${s.username}: ${JSON.stringify(s.copied)}`);

    // Ghi có điều kiện theo ETag đã đọc ở đầu lượt thử này.
    try {
      await S3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: DB_KEY,
          Body: fs.createReadStream(mainFile),
          ContentType: 'application/octet-stream',
          IfMatch: remoteEtag,
          Metadata: { 'merged-at': new Date().toISOString(), 'merged-users': String(report.missing.length) },
        })
      );
    } catch (err) {
      const code = err?.$metadata?.httpStatusCode;
      log(`Ghi thất bại (HTTP ${code}). ${code === 412 ? 'Instance khác vừa ghi -> tải lại và gộp lại.' : ''}`);
      if (code === 412 || code === 409) continue;
      throw err;
    }

    // Xác minh: tải lại bản chính và kiểm tra các tài khoản vừa thêm.
    const checkFile = path.join(WORK_DIR, 'verify.db');
    await download(DB_KEY, checkFile);
    const checkDb = new Database(checkFile, { readonly: true });
    let ok = true;
    for (const u of report.missing) {
      const found = checkDb.prepare('SELECT username FROM users WHERE username = ?').get(u.username);
      log(`  xác minh @${u.username}: ${found ? 'ĐÃ CÓ trong bản chính' : 'VẪN THIẾU'}`);
      if (!found) ok = false;
    }
    checkDb.close();

    if (ok) {
      log('\nGỘP THÀNH CÔNG — mọi tài khoản bị mất đã có lại trong bản chính.');
      log('Những hash mật khẩu cũ vẫn đăng nhập được (verifyPassword chấp nhận cả hash SHA-256 cũ).');
      return;
    }
    log('Xác minh thất bại, thử lại từ đầu...');
  }

  log('\nKHÔNG gộp được sau 3 lần thử. Bản chính vẫn nguyên vẹn (mỗi lần ghi đều có backup).');
}

main().catch((err) => {
  console.error('LỖI:', err?.message || String(err));
  process.exit(1);
});
