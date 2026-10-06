// scripts/pg/00-download-prod-db.mjs
// Tải bản DB chuẩn từ Filebase về đĩa để làm nguồn cho việc sinh schema + nạp dữ liệu.
//
// BẮT BUỘC dùng bản production, KHÔNG dùng data/english_learning.db của máy dev:
// schema máy dev đã cũ hơn (ví dụ `coins INTEGER DEFAULT 150` trong khi code và
// production dùng 1000) và chỉ có 6 user so với 15 user trên production.
//
// Biến môi trường: (đọc thêm từ .env.local) FILEBASE_* ; đầu ra: PG_SOURCE_DB
import fs from 'fs';
import path from 'path';
import os from 'os';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i <= 0 || line.trim().startsWith('#')) continue;
    const k = line.slice(0, i).trim();
    if (process.env[k] === undefined) process.env[k] = line.slice(i + 1).trim();
  }
}

const KEY = process.env.PG_SOURCE_KEY || 'english_learning.db';
const OUT = process.env.PG_SOURCE_DB || path.join(os.tmpdir(), 'meowlish-pg', 'prod.db');

const s3 = new S3Client({
  endpoint: process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io',
  region: (process.env.FILEBASE_REGION && process.env.FILEBASE_REGION !== 'auto') ? process.env.FILEBASE_REGION : 'us-east-1',
  credentials: {
    accessKeyId: process.env.FILEBASE_ACCESS_KEY || '',
    secretAccessKey: process.env.FILEBASE_SECRET_KEY || '',
  },
  forcePathStyle: true,
});
const bucket = process.env.FILEBASE_BUCKET_NAME || 'meowlish-db';

const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: KEY }));
const buf = Buffer.from(await res.Body.transformToByteArray());
if (!buf.subarray(0, 16).toString('utf8').startsWith('SQLite format 3')) {
  throw new Error('Tệp tải về không phải SQLite hợp lệ');
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, buf);
// SQLite đi kèm file -wal/-shm cũ sẽ gây lẫn dữ liệu -> xoá nếu có.
for (const suffix of ['-wal', '-shm']) {
  try { fs.unlinkSync(OUT + suffix); } catch {}
}
console.log(`Đã tải ${KEY}: ${(buf.length / 1048576).toFixed(1)} MB`);
console.log(`Lưu tại: ${OUT}`);
