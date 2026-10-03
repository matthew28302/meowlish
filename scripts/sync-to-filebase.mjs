/**
 * Sync local SQLite database -> Filebase S3  (PUSH CHỦ ĐỘNG từ máy dev/cá nhân)
 *
 * Usage: node scripts/sync-to-filebase.mjs
 *
 * Steps:
 *  1. Load .env.local
 *  2. WAL checkpoint (TRUNCATE) so every pending transaction lands in the main .db file
 *  3. Nếu remote đã tồn tại → LƯU LẠI bản remote cũ vào data/english_learning.db.superseded
 *     trước khi ghi đè (không bao giờ mất bên nào khi push)
 *  4. PutObject upload to Filebase
 *  5. HeadObject + SQLite header verification
 *  6. Ghi data/sync_state.json (baseVersion = ETag vừa upload) để server dev/prod
 *     biết DB là hậu duệ của bản nào — các lần auto-sync sau dùng conditional
 *     write (If-Match), không còn ghi đè mù quáng.
 *
 * LƯU Ý: auto-sync TỰ ĐỘNG ngoài Vercel đã bị TẮT (xem src/lib/s3Sync.ts) —
 * script này là cách đẩy local -> Filebase được khuyến nghị.
 */
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// --- 1. Load .env.local ---
const envPath = path.join(rootDir, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const endpoint = process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io';
const region = process.env.FILEBASE_REGION || 'auto';
const bucket = process.env.FILEBASE_BUCKET_NAME || 'meowlish-db';
const accessKeyId = process.env.FILEBASE_ACCESS_KEY || '';
const secretAccessKey = process.env.FILEBASE_SECRET_KEY || '';
const DB_FILENAME = 'english_learning.db';
const dbPath = path.join(rootDir, 'data', DB_FILENAME);
const syncStatePath = path.join(rootDir, 'data', 'sync_state.json');
const supersededPath = path.join(rootDir, 'data', 'english_learning.db.superseded');

console.log('=== FILEBASE DB SYNC ===');
console.log('Endpoint:', endpoint);
console.log('Bucket:  ', bucket);
console.log('Access:  ', accessKeyId ? `${accessKeyId.slice(0, 4)}...${accessKeyId.slice(-4)}` : 'MISSING');

if (!accessKeyId || !secretAccessKey) {
  console.error('ERROR: Missing FILEBASE_ACCESS_KEY / FILEBASE_SECRET_KEY in .env.local');
  process.exit(1);
}
if (!fs.existsSync(dbPath)) {
  console.error('ERROR: Local database not found at', dbPath);
  process.exit(1);
}

// --- 2. WAL checkpoint ---
try {
  const db = new Database(dbPath);
  const res = db.pragma('wal_checkpoint(TRUNCATE)');
  console.log('WAL checkpoint:', JSON.stringify(res));
  db.close();
} catch (e) {
  console.warn('WAL checkpoint failed (continuing):', e.message);
}

const stats = fs.statSync(dbPath);
console.log(`Local DB: ${(stats.size / 1024 / 1024).toFixed(2)} MB (mtime ${stats.mtime.toISOString()})`);

/** Fingerprint local — PHẢI GIỐNG getDbFingerprint() trong src/lib/s3Sync.ts */
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

const s3 = new S3Client({
  endpoint,
  region,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

async function run() {
  // --- 3. Lưu bản remote cũ trước khi ghi đè (không bao giờ mất bên nào) ---
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: DB_FILENAME }));
    if (head.ContentLength && head.ContentLength > 0) {
      console.log(`Remote hiện có: ${head.ContentLength} bytes, LastModified=${head.LastModified}`);
      const g = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: DB_FILENAME }));
      const buffer = Buffer.from(await g.Body.transformToByteArray());
      const header = buffer.subarray(0, 16).toString('utf8');
      if (!header.startsWith('SQLite format 3')) {
        throw new Error('Bản remote không phải SQLite hợp lệ — không xác nhận được nội dung cũ');
      }
      fs.writeFileSync(supersededPath, buffer);
      console.log(`Đã lưu bản remote cũ vào: ${supersededPath}`);
    }
  } catch (e) {
    if (e.name === 'NotFound' || (e.$metadata && e.$metadata.httpStatusCode === 404)) {
      console.log('Remote chưa tồn tại → sẽ tạo bản đầu tiên.');
    } else {
      // Không lưu được bản cũ → HỦUS push để không bao giờ ghi đè mất dữ liệu
      console.error('ERROR: Không lưu được bản remote cũ, HỦUS push:', e.message || e);
      process.exit(1);
    }
  }

  // --- 4. Upload ---
  const started = Date.now();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: DB_FILENAME,
      Body: fs.createReadStream(dbPath),
      ContentType: 'application/octet-stream',
    })
  );
  console.log(`Upload OK in ${((Date.now() - started) / 1000).toFixed(2)}s`);

  // --- 5. Verify ---
  const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: DB_FILENAME }));
  console.log('Remote size:  ', head.ContentLength, 'bytes');
  console.log('Remote mtime: ', head.LastModified);
  console.log('Remote ETag:  ', head.ETag);

  if (head.ContentLength !== stats.size) {
    throw new Error(`Size mismatch: local ${stats.size} vs remote ${head.ContentLength}`);
  }

  // --- 6. Ghi sync_state.json: coi bản vừa push là "gốc" (base) cho các lần sync sau ---
  try {
    const state = {
      v: 1,
      baseVersion: head.ETag ? `etag:${head.ETag}` : `lm:${head.LastModified ? head.LastModified.getTime() : 0}`,
      baseTime: head.LastModified ? head.LastModified.getTime() : Date.now(),
      fingerprint: localFingerprint(),
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(syncStatePath, JSON.stringify(state, null, 2));
    console.log('Đã ghi sync_state.json (baseVersion) tại:', syncStatePath);
  } catch (e) {
    console.warn('Không ghi được sync_state.json (chỉ là dữ liệu phụ):', e.message);
  }

  console.log('\nSYNC SUCCESS: Database backed up to Filebase. 🚀');
}

run().catch((err) => {
  console.error('\nSYNC FAILED:', err.message || err);
  process.exit(1);
});
