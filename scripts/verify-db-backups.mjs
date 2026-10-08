// Kiểm chứng cron sao lưu: 4 bước, đo thật trên bucket thật.
//
//  1. Không có header Authorization  -> phải 401 (endpoint KHÔNG công khai)
//  2. Token sai                      -> phải 401
//  3. Token đúng                      -> phải 200 và tạo backup
//  4. Tải backup về, MỞ BẰNG SQLite  -> phải đọc được số dòng thật
//     (bước 4 là quan trọng nhất: CopyObject trả 200 KHÔNG đảm bảo file dùng được)
//
// KHÔNG in bí mật nào: CRON_SECRET chỉ đọc từ .env.local, dùng trong RAM.
import fs from 'fs';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split(/\r?\n/)) {
  const i = line.indexOf('=');
  if (i <= 0 || line.trim().startsWith('#')) continue;
  const k = line.slice(0, i).trim();
  if (process.env[k] === undefined) process.env[k] = line.slice(i + 1).trim();
}

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const secret = process.env.CRON_SECRET;
if (!secret) throw new Error('Thieu CRON_SECRET trong .env.local');

const bucket = process.env.FILEBASE_BUCKET_NAME || 'meowlish-db';
const s3 = new S3Client({
  endpoint: process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io',
  region:
    process.env.FILEBASE_REGION && process.env.FILEBASE_REGION !== 'auto'
      ? process.env.FILEBASE_REGION
      : 'us-east-1',
  credentials: {
    accessKeyId: process.env.FILEBASE_ACCESS_KEY || '',
    secretAccessKey: process.env.FILEBASE_SECRET_KEY || '',
  },
  forcePathStyle: true,
});

let fail = 0;
const row = (label, expected, actual) => {
  const ok = expected === actual;
  if (!ok) fail++;
  console.log(`| ${label} | ${expected} | ${actual} | ${ok ? 'PASS' : 'FAIL'} |`);
};
console.log('| Kiem tra | Mong doi | Thuc te | Ket qua |');
console.log('|---|---|---|---|');

// --- 1 & 2: chặn truy cap khong duoc phep ---
const noAuth = await fetch(`${BASE}/api/cron/backup-db`);
row('Khong co Authorization', 401, noAuth.status);

const badAuth = await fetch(`${BASE}/api/cron/backup-db`, {
  headers: { authorization: 'Bearer ' + '0'.repeat(secret.length) },
});
row('Token sai do dai dung', 401, badAuth.status);

const shortAuth = await fetch(`${BASE}/api/cron/backup-db`, {
  headers: { authorization: 'Bearer short' },
});
row('Token sai do dai ngan', 401, shortAuth.status);

// --- 3: chay that ---
const run1 = await fetch(`${BASE}/api/cron/backup-db`, {
  headers: { authorization: 'Bearer ' + secret },
});
const body1 = await run1.json().catch(() => ({}));
row('Token dung — lan 1', 200, run1.status);

const backupKey = body1.backupKey;
console.log(`| Ban backup tao ra | co | ${backupKey || 'KHONG'} | ${backupKey ? 'PASS' : 'FAIL'} |`);
if (!backupKey) {
  console.log('  => khong tao duoc backup, dung lai.');
  process.exit(1);
}

// Chay lai lan 2: cung noi dung nen phai BO QUA (khong tao ban trung).
const run2 = await fetch(`${BASE}/api/cron/backup-db`, {
  headers: { authorization: 'Bearer ' + secret },
});
const body2 = await run2.json().catch(() => ({}));
row('Lan 2 cung noi dung — bo qua', true, Boolean(body2.skipped));
row('Lan 2 khong doi key nguon', true, (body2.backupKey || null) === backupKey);

// --- 4: tai ban backup ve va MO THUAT BANG SQLITE ---
let users = -1;
let dict = -1;
let integrity = 'khong doc duoc';
try {
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: backupKey }));
  const buf = Buffer.from(await res.Body.transformToByteArray());
  const header = buf.subarray(0, 16).toString('utf8');
  row('Header la SQLite that', true, header.startsWith('SQLite format 3'));

  const tmp = path.join(os.tmpdir(), 'meowlish-backup-check', 'bk.db');
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, buf);

  const db = new Database(tmp, { readonly: true });
  users = Number(db.prepare('SELECT COUNT(*) c FROM users').get().c);
  // Sau khi tách từ điển (scripts/split-dictionary.mjs --apply), DB CHÍNH không
  // còn bảng dictionary_entries — từ điển sống ở file riêng dictionary.db.
  // Backup tạo trước khi tách vẫn có bảng này; backup sau khi tách thì không —
  // không coi "thiếu bảng từ điển" là lỗi.
  try {
    dict = Number(db.prepare('SELECT COUNT(*) c FROM dictionary_entries').get().c);
  } catch {
    dict = -2; // -2 = DB chính đã tách từ điển (hợp lệ sau 2026-10)
  }
  integrity = String(db.pragma('integrity_check', { simple: true }));
  db.close();
  fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
} catch (e) {
  console.log('| Mo ban backup that | ok | loi | FAIL |');
  console.log('  ' + (e instanceof Error ? e.message : String(e)));
  fail++;
}
row('integrity_check = ok', 'ok', integrity);
row('Co duoc so tai khoan > 0', true, users > 0);
row('Co duoc so tu dien > 0', true, dict > 0 || dict === -2);
console.log(`  (ban backup co ${users} tai khoan, ${dict === -2 ? 'tu dien da tach ra file rieng' : dict + ' tu dien'})`);

// --- 5: key nguon khong bi dong vao ---
const src = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: 'english_learning.db' }));
console.log(`| Key nguon van con tren bucket | co | ${Number(src.ContentLength) > 0 ? 'co' : 'KHONG'} | ${Number(src.ContentLength) > 0 ? 'PASS' : 'FAIL'} |`);

console.log('');
console.log(fail === 0
  ? `PASS  cron sao luu chay dung. Ban backup: ${backupKey}`
  : `FAIL  ${fail} truong hop sai.`);
if (fail > 0) process.exitCode = 1;