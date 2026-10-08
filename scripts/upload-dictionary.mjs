/**
 * Đẩy data/dictionary.db lên Filebase S3 key `english_learning_dictionary.db`
 * — chạy MỘT LẦN, do người chủ động thực hiện (không nằm trong auto-sync).
 *
 * Usage:  node scripts/upload-dictionary.mjs [--force]
 *
 * Vai trò của bản remote này: cold start Vercel tải nó về /tmp/data/dictionary.db
 * qua `scripts/restore-s3.js --dictionary` (timeout riêng 30s, MISS thì app vẫn
 * chạy với từ điển rỗng — search graceful). Bản remote CHÍNH LÀ chân lý: từ điển
 * là nội dung tĩnh, không có cơ chế last-write-wins ở đây.
 *
 * An toàn:
 *   - Từ chối nếu dictionary.db < 1MB / quick_check lỗi / < 20.000 mục từ /
 *     FTS integrity-check lỗi — không đẩy bản rách làm hỏng search production.
 *   - Từ chối nếu key remote ĐÃ TỒN TẠI, trừ khi --force (mô phỏng "một lần";
 *     --force in rõ cảnh báo trước khi ghi đè).
 *   - KHÔNG đụng đến english_learning.db hay sync_state.json.
 */
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const FORCE = process.argv.includes('--force');

// --- 1. Load .env.local (giống scripts/sync-to-filebase.mjs) ---
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
const dictPath = path.join(rootDir, 'data', 'dictionary.db');
const REMOTE_DICT_OBJECT = 'english_learning_dictionary.db';

console.log('=== UPLOAD DICTIONARY -> FILEBASE (một lần, chủ động) ===');
console.log('Endpoint:', endpoint);
console.log('Bucket:  ', bucket);
console.log('Access:  ', accessKeyId ? `${accessKeyId.slice(0, 4)}...${accessKeyId.slice(-4)}` : 'MISSING');

if (!accessKeyId || !secretAccessKey) {
  console.error('ERROR: Thiếu FILEBASE_ACCESS_KEY / FILEBASE_SECRET_KEY trong môi trường / .env.local');
  process.exit(1);
}
if (!fs.existsSync(dictPath)) {
  console.error(`ERROR: Không tìm thấy ${dictPath} — chạy "node scripts/split-dictionary.mjs" trước.`);
  process.exit(1);
}

// --- 2. Checkpoint WAL: mọi ghi cache phải nằm trong file chính trước khi stream ---
try {
  const db = new Database(dictPath);
  const res = db.pragma('wal_checkpoint(TRUNCATE)');
  console.log('WAL checkpoint:', JSON.stringify(res));
  db.close();
} catch (e) {
  console.warn('WAL checkpoint thất bại (tiếp tục):', e.message);
}

const stats = fs.statSync(dictPath);
console.log(`Local: ${dictPath} = ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

// --- 3. Verify SQL-level TRƯỚC KHI đẩy (không đẩy bản rách) ---
let entries = 0;
try {
  const db = new Database(dictPath, { readonly: true });
  try {
    const check = db.pragma('quick_check');
    if (!Array.isArray(check) || check.length !== 1 || check[0].quick_check !== 'ok') {
      throw new Error(`quick_check không ok: ${JSON.stringify(check)}`);
    }
    entries = db.prepare('SELECT COUNT(*) c FROM dictionary_entries').get().c;
    if (entries < 20000) {
      throw new Error(`dictionary_entries chỉ có ${entries} dòng — chạy lại scripts/split-dictionary.mjs`);
    }
    db.exec(`INSERT INTO dictionary_fts(dictionary_fts) VALUES('integrity-check');`);
    console.log(`Verify: quick_check ok, ${entries} mục từ, FTS integrity-check ok.`);
  } finally {
    db.close();
  }
} catch (e) {
  console.error('ERROR: dictionary.db chưa hợp lệ —', e.message);
  process.exit(1);
}

const s3 = new S3Client({
  endpoint,
  region,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

async function run() {
  // --- 4. Từ chối ghi đè trừ khi --force (bản remote là chân lý của production) ---
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: REMOTE_DICT_OBJECT }));
    if (!FORCE) {
      console.error(
        `ERROR: Key ${REMOTE_DICT_OBJECT} ĐÃ TỒN TẠI (${head.ContentLength} bytes, ` +
          `${head.LastModified}). Đây là bản từ điển mà production đang dùng — ` +
          'chỉ ghi đè khi chắc chắn, bằng: node scripts/upload-dictionary.mjs --force'
      );
      process.exit(1);
    }
    console.warn(
      `--FORCE: sẽ ghi đè bản remote hiện có (${head.ContentLength} bytes). ` +
        'Đảm bảo bản local mới hơn (chạy split trước).'
    );
  } catch (e) {
    const notFound = e && (e.name === 'NotFound' || (e.$metadata && e.$metadata.httpStatusCode === 404));
    if (!notFound) throw e;
    console.log('Remote chưa có key — sẽ tạo bản đầu tiên.');
  }

  // --- 5. Upload ---
  const started = Date.now();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: REMOTE_DICT_OBJECT,
      Body: fs.createReadStream(dictPath),
      ContentType: 'application/octet-stream',
      Metadata: { entries: String(entries), 'uploaded-at': new Date().toISOString() },
    })
  );
  console.log(`Upload OK sau ${((Date.now() - started) / 1000).toFixed(2)}s`);

  // --- 6. Verify lại bản remote ---
  const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: REMOTE_DICT_OBJECT }));
  console.log('Remote size:  ', head.ContentLength, 'bytes');
  console.log('Remote ETag:  ', head.ETag);
  if (head.ContentLength !== stats.size) {
    throw new Error(`Size lệch: local ${stats.size} vs remote ${head.ContentLength}`);
  }
  console.log(
    `\nUPLOAD THÀNH CÔNG: data/dictionary.db → s3://${bucket}/${REMOTE_DICT_OBJECT} 🚀` +
      '\nCold start Vercel giờ tự tải từ điển (restore-s3.js --dictionary, timeout 30s, MISS vẫn chạy graceful).'
  );
}

run().catch((err) => {
  console.error('\nUPLOAD THẤT BẠI:', err.message || err);
  process.exit(1);
});
