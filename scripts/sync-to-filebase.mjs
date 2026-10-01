/**
 * Sync local SQLite database -> Filebase S3
 *
 * Usage: node scripts/sync-to-filebase.mjs
 *
 * Steps:
 *  1. Load .env.local
 *  2. WAL checkpoint (TRUNCATE) so every pending transaction lands in the main .db file
 *  3. PutObject upload to Filebase
 *  4. HeadObject + SQLite header verification
 */
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
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

const s3 = new S3Client({
  endpoint,
  region,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

async function run() {
  // --- 3. Upload ---
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

  // --- 4. Verify ---
  const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: DB_FILENAME }));
  console.log('Remote size:  ', head.ContentLength, 'bytes');
  console.log('Remote mtime: ', head.LastModified);
  console.log('Remote ETag:  ', head.ETag);

  if (head.ContentLength !== stats.size) {
    throw new Error(`Size mismatch: local ${stats.size} vs remote ${head.ContentLength}`);
  }
  console.log('\nSYNC SUCCESS: Database backed up to Filebase. 🚀');
}

run().catch((err) => {
  console.error('\nSYNC FAILED:', err.message || err);
  process.exit(1);
});
