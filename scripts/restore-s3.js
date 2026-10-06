// scripts/restore-s3.js
// Synchronous cold-start restore script for Vercel Serverless and local environments
//
// QUY TẮC THỨ TỰ ĐỒNG BỘ — PHẢI KHỚP VỚI src/lib/s3Sync.ts (đổi bên này phải
// đổi cả bên kia, vì cùng đọc/ghi sync_state.json):
//   1. CHỈ thay DB cục bộ khi: DB trống/không hợp lệ, HOẶC bản remote MỚI HƠN
//      (LastModified > thời điểm ghi cuối của DB cục bộ). Không bao giờ ghi đè
//      bản cục bộ đang mới hơn → chống rollback mật khẩu/dữ liệu.
//   2. Ghi file .tmp rồi rename (atomic) — bị kill giữa chừng cũng không để lại
//      file dở dang.
//   3. Xóa -wal/-shm cũ TRƯỚC khi thay — nếu giữ, SQLite sẽ replay WAL của bản
//      cũ lên file mới (dữ liệu hỗn tạp / "tự nhiên bị khôi phục ngược").
//   4. Sau khi khôi phục ghi sync_state.json (baseVersion = ETag + fingerprint)
//      để các lần upload sau biết DB này là hậu duệ của bản remote nào.
//   5. Thất bại → exit 1 (db.ts có try/catch riêng, server vẫn boot được nhưng
//      sẽ log CRITICAL để không phục vụ DB trống trong im lặng).
const { S3Client, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const isVercel = process.env.VERCEL === '1';
const dbDir = isVercel ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const dbPath = path.join(dbDir, 'english_learning.db');
const markerPath = path.join(dbDir, '.s3_restored');
const syncStatePath = path.join(dbDir, 'sync_state.json');

const S3_ENDPOINT = process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io';
// KHÔNG hardcode khoá (bản cũ chứa khoá thật trong git). Thiếu biến môi
// trường thì thoát ngay để không âm thầm dùng khoá sai.
const S3_ACCESS_KEY = process.env.FILEBASE_ACCESS_KEY || '';
const S3_SECRET_KEY = process.env.FILEBASE_SECRET_KEY || '';
if (!S3_ACCESS_KEY || !S3_SECRET_KEY) {
  console.error('[S3 Restore] Thiếu FILEBASE_ACCESS_KEY/FILEBASE_SECRET_KEY trong môi trường.');
  process.exit(1);
}
const S3_REGION = (process.env.FILEBASE_REGION && process.env.FILEBASE_REGION !== 'auto') ? process.env.FILEBASE_REGION : 'us-east-1';
const S3_BUCKET = process.env.FILEBASE_BUCKET_NAME || 'meowlish-db';
const DB_FILENAME = 'english_learning.db';
const REMOTE_REAL_DB_BYTES = 1_000_000; // remote >= mức này = "có dữ liệu thật"

// --- Helpers phải GIỐNG HỆT s3Sync.ts (cùng định dạng để so sánh được) ---

/** `etag:"..."` hoặc `lm:<ms>` */
function versionFromParts(etag, lastModifiedMs) {
  return etag ? `etag:${etag}` : `lm:${lastModifiedMs}`;
}

/** Fingerprint local: `${dbSize}:${dbMtime}|wal:${walPart}` — xem getDbFingerprint() ở s3Sync.ts */
function localFingerprint() {
  let main = 'missing';
  try {
    const st = fs.statSync(dbPath);
    main = `${st.size}:${st.mtimeMs}`;
  } catch {}
  let wal = '0';
  try {
    const st = fs.statSync(`${dbPath}-wal`);
    if (st.size > 0) wal = `${st.size}:${st.mtimeMs}`;
  } catch {}
  return `${main}|wal:${wal}`;
}

function localInfo() {
  const info = { exists: false, size: 0, dataTimeMs: 0, headerOk: false };
  try {
    const st = fs.statSync(dbPath);
    info.exists = true;
    info.size = st.size;
    info.dataTimeMs = st.mtimeMs;
  } catch {}
  try {
    const st = fs.statSync(`${dbPath}-wal`);
    if (st.mtimeMs > info.dataTimeMs) info.dataTimeMs = st.mtimeMs;
  } catch {}
  if (info.exists && info.size >= 16) {
    try {
      const fd = fs.openSync(dbPath, 'r');
      const buf = Buffer.alloc(16);
      fs.readSync(fd, buf, 0, 16, 0);
      fs.closeSync(fd);
      info.headerOk = buf.toString('utf8', 0, 15).startsWith('SQLite format 3');
    } catch {}
  }
  return info;
}

function readSyncState() {
  try {
    return JSON.parse(fs.readFileSync(syncStatePath, 'utf8'));
  } catch {
    return { v: 1, baseVersion: null, baseTime: 0, fingerprint: null, updatedAt: null };
  }
}

function writeSyncState(patch) {
  try {
    const next = { v: 1, baseVersion: null, baseTime: 0, fingerprint: null, updatedAt: null, ...readSyncState(), ...patch };
    next.updatedAt = new Date().toISOString();
    const tmp = `${syncStatePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(next, null, 2));
    fs.renameSync(tmp, syncStatePath);
  } catch (err) {
    console.warn(`[S3 Restore] Không ghi được sync_state.json: ${err.message}`);
  }
}

async function restore() {
  const local = localInfo();
  const st = readSyncState();

  const s3 = new S3Client({
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY,
      secretAccessKey: S3_SECRET_KEY,
    },
    forcePathStyle: true,
  });

  // --- HEAD: tìm bản remote hiện tại ---
  let head;
  try {
    const h = await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: DB_FILENAME }));
    head = {
      version: versionFromParts(h.ETag, h.LastModified ? h.LastModified.getTime() : 0),
      etag: h.ETag || null,
      lastModifiedMs: h.LastModified ? h.LastModified.getTime() : 0,
      size: h.ContentLength || 0,
    };
    console.log(`[S3 Restore] Remote: ${(head.size / 1024 / 1024).toFixed(2)} MB, LastModified=${new Date(head.lastModifiedMs).toISOString()}`);
  } catch (err) {
    const notFound = err && (err.name === 'NotFound' || (err.$metadata && err.$metadata.httpStatusCode === 404));
    if (!notFound) {
      console.error(`[S3 Restore] Không đọc được metadata Filebase: ${err.message || String(err)}`);
      process.exit(1);
    }
    head = null;
  }

  if (!head) {
    // Chưa có bản nào trên S3
    if (local.headerOk && local.size >= 100_000) {
      console.log('[S3 Restore] Chưa có bản remote trên Filebase và DB cục bộ hợp lệ → giữ nguyên.');
      process.exit(0);
    }
    console.error('[S3 Restore] Không có bản remote và DB cục bộ cũng trống/không hợp lệ.');
    process.exit(1);
  }

  // --- QUY TẮC: chỉ tải khi DB trống hoặc remote MỚI HƠN cục bộ ---
  const localValid = local.headerOk && local.size >= 100_000;

  if (localValid) {
    if (st.baseVersion && st.baseVersion === head.version) {
      console.log('[S3 Restore] DB cục bộ chính là bản remote hiện tại → giữ nguyên.');
      if (!fs.existsSync(markerPath)) {
        try { fs.writeFileSync(markerPath, new Date().toISOString()); } catch {}
      }
      process.exit(0);
    }

    if (head.lastModifiedMs <= local.dataTimeMs) {
      // Remote KHÔNG mới hơn → không bao giờ ghi đè bản cục bộ đang mới hơn
      console.log(
        `[S3 Restore] Remote không mới hơn DB cục bộ (remote=${new Date(head.lastModifiedMs).toISOString()}, ` +
          `local=${new Date(local.dataTimeMs).toISOString()}) → GIỮ DB cục bộ.`
      );
      if (!fs.existsSync(markerPath)) {
        try { fs.writeFileSync(markerPath, new Date().toISOString()); } catch {}
      }
      process.exit(0);
    }

    if (local.size >= REMOTE_REAL_DB_BYTES) {
      // Remote mới hơn nhưng DB cục bộ cũng có dữ liệu thật (không rõ có thay đổi
      // riêng không) → KHÔNG tự thay ở đây; để s3Sync xử lý theo quy tắc đầy đủ
      // (so sánh baseVersion + lưu CONFLICT_KEY trước khi thay).
      console.log(
        '[S3 Restore] Remote mới hơn nhưng DB cục bộ ≥1MB → để s3Sync tự đối chiếu/có backup. Bỏ qua restore lần này.'
      );
      process.exit(0);
    }

    // DB cục bộ nhỏ (rỗng/thuần seed) + remote mới hơn → tải về, nhưng lưu bản cũ vào .bak trước
    try {
      fs.copyFileSync(dbPath, `${dbPath}.bak`);
      console.log(`[S3 Restore] Đã lưu DB cục bộ cũ vào ${dbPath}.bak`);
    } catch (err) {
      console.warn(`[S3 Restore] Không lưu được .bak (bỏ qua): ${err.message}`);
    }
  } else if (local.exists && !local.headerOk && local.size > 0) {
    console.warn(`[S3 Restore] DB cục bộ hỏng (không phải SQLite hợp lệ, ${local.size} bytes) → sẽ thay bằng bản remote.`);
  }

  // --- Tải về ---
  console.log(`[S3 Restore] Starting restore from Filebase S3 (${S3_BUCKET}/${DB_FILENAME}) to ${dbPath}...`);
  try {
    const response = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: DB_FILENAME }));
    if (!response.Body) {
      throw new Error('S3 GetObject returned empty body');
    }

    const byteArray = await response.Body.transformToByteArray();
    const buffer = Buffer.from(byteArray);

    const header = buffer.subarray(0, 16).toString('utf8');
    if (!header.startsWith('SQLite format 3')) {
      throw new Error('Downloaded file is not a valid SQLite database header');
    }

    // ETag của CHÍNH file vừa tải (phòng khi có instance khác upload giữa HEAD và GET)
    const baseVersion = response.ETag ? versionFromParts(response.ETag, head.lastModifiedMs) : head.version;

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Xóa WAL/SHM cũ trước khi thay (chống replay WAL của bản cũ) — file cũ có
    // thể vẫn còn do tiến trình trước bị kill giữa chừng.
    try {
      if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
      if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
    } catch {}

    // Ghi tạm rồi rename: atomic, không bao giờ để lại file dở dang
    const tmpPath = `${dbPath}.restore.tmp`;
    fs.writeFileSync(tmpPath, buffer);
    fs.renameSync(tmpPath, dbPath);

    fs.writeFileSync(markerPath, new Date().toISOString());
    writeSyncState({
      baseVersion,
      baseTime: head.lastModifiedMs,
      fingerprint: localFingerprint(), // TÍNH SAU RENAME để khớp s3Sync.ts
    });

    console.log(`[S3 Restore] Successfully restored database (${(buffer.length / 1024 / 1024).toFixed(2)} MB) to ${dbPath}`);
    process.exit(0);
  } catch (err) {
    console.error(`[S3 Restore] Failed to restore from Filebase: ${err.message || String(err)}`);
    // exit 1 để db.ts log CRITICAL (server vẫn boot nhờ try/catch, nhưng không im lặng)
    process.exit(1);
  }
}

restore();
