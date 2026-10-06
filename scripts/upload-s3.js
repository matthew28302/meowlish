// scripts/upload-s3.js
// Manual or scripted upload of english_learning.db to Filebase S3
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const isVercel = process.env.VERCEL === '1';
const dbDir = isVercel ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const dbPath = path.join(dbDir, 'english_learning.db');

const S3_ENDPOINT = process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io';
// KHÔNG hardcode khoá (bản cũ chứa khoá thật trong git — ai đọc repo là nắm
// được toàn bộ database production). Thiếu biến môi trường thì dừng ngay.
const S3_ACCESS_KEY = process.env.FILEBASE_ACCESS_KEY || '';
const S3_SECRET_KEY = process.env.FILEBASE_SECRET_KEY || '';
if (!S3_ACCESS_KEY || !S3_SECRET_KEY) {
  console.error('[S3 Upload] Thiếu FILEBASE_ACCESS_KEY/FILEBASE_SECRET_KEY trong môi trường.');
  process.exit(1);
}
const S3_REGION = (process.env.FILEBASE_REGION && process.env.FILEBASE_REGION !== 'auto') ? process.env.FILEBASE_REGION : 'us-east-1';
const S3_BUCKET = process.env.FILEBASE_BUCKET_NAME || 'meowlish-db';
const DB_FILENAME = 'english_learning.db';

async function upload() {
  try {
    if (!fs.existsSync(dbPath)) {
      console.error(`[S3 Upload] Local database file not found at ${dbPath}`);
      process.exit(1);
    }

    // Flushes WAL into main file
    try {
      const db = new Database(dbPath);
      db.pragma('wal_checkpoint(TRUNCATE)');
      const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get();
      console.log(`[S3 Upload] Checkpoint complete. Total users in DB: ${userCount.c}`);
      db.close();
    } catch (dbErr) {
      console.warn('[S3 Upload] Warning during WAL checkpoint:', dbErr.message);
    }

    const fileBuffer = fs.readFileSync(dbPath);
    const sizeInMb = (fileBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`[S3 Upload] Uploading ${dbPath} (${sizeInMb} MB) to s3://${S3_BUCKET}/${DB_FILENAME}...`);

    const header = fileBuffer.subarray(0, 16).toString('utf8');
    if (!header.startsWith('SQLite format 3')) {
      throw new Error('Local file is not a valid SQLite database header');
    }

    const s3 = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
      },
      forcePathStyle: true,
    });

    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: DB_FILENAME,
        Body: fileBuffer,
        ContentType: 'application/x-sqlite3',
      })
    );

    console.log(`[S3 Upload] Successfully uploaded ${DB_FILENAME} (${sizeInMb} MB) to Filebase S3!`);
  } catch (err) {
    console.error('[S3 Upload] Error uploading to Filebase S3:', err);
    process.exit(1);
  }
}

upload();
