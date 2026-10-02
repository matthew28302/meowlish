// scripts/restore-s3.js
// Synchronous cold-start restore script for Vercel Serverless and local environments
const { S3Client, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const isVercel = process.env.VERCEL === '1';
const dbDir = isVercel ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const dbPath = path.join(dbDir, 'english_learning.db');
const markerPath = path.join(dbDir, '.s3_restored');

const S3_ENDPOINT = process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io';
const S3_ACCESS_KEY = process.env.FILEBASE_ACCESS_KEY || 'C4BA6129BC024529E82F';
const S3_SECRET_KEY = process.env.FILEBASE_SECRET_KEY || 'jdnwJ3jTFVCQQr4pnnc5HfZg4foktCgpImDiPtmW';
const S3_REGION = (process.env.FILEBASE_REGION && process.env.FILEBASE_REGION !== 'auto') ? process.env.FILEBASE_REGION : 'us-east-1';
const S3_BUCKET = process.env.FILEBASE_BUCKET_NAME || 'meowlish-db';
const DB_FILENAME = 'english_learning.db';

async function restore() {
  try {
    let localSize = 0;
    if (fs.existsSync(dbPath)) {
      try {
        localSize = fs.statSync(dbPath).size;
      } catch {}
    }

    // Nếu đã có file database hợp lệ (> 1MB) và không phải Vercel cold-start thiếu marker thì không cần tải lại
    if (localSize > 1_000_000 && (!isVercel || fs.existsSync(markerPath))) {
      console.log(`[S3 Restore] Local DB already healthy (${(localSize / 1024 / 1024).toFixed(2)} MB). Skipping restore.`);
      process.exit(0);
    }

    console.log(`[S3 Restore] Starting restore from Filebase S3 (${S3_BUCKET}/${DB_FILENAME}) to ${dbPath}...`);

    const s3 = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
      },
      forcePathStyle: true,
    });

    const head = await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: DB_FILENAME }));
    const remoteSize = head.ContentLength || 0;
    console.log(`[S3 Restore] Remote database size: ${(remoteSize / 1024 / 1024).toFixed(2)} MB`);

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

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    fs.writeFileSync(dbPath, buffer);
    fs.writeFileSync(markerPath, new Date().toISOString());

    console.log(`[S3 Restore] Successfully restored database (${(buffer.length / 1024 / 1024).toFixed(2)} MB) to ${dbPath}`);
    process.exit(0);
  } catch (err) {
    console.error(`[S3 Restore] Failed to restore from Filebase: ${err.message || String(err)}`);
    // Exit with 0 so server boot is not crashed if S3 is momentarily unreachable
    process.exit(0);
  }
}

restore();
