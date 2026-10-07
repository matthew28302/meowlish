// Ghi ADMIN_EMAIL vào .env.local lấy từ DB production (tài khoản admin).
// TUYỆT ĐỐI không in giá trị email ra console — mục tiêu là không lộ thông tin.
import fs from 'fs';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const envPath = path.join(process.cwd(), '.env.local');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const i = line.indexOf('=');
  if (i <= 0 || line.trim().startsWith('#')) continue;
  const k = line.slice(0, i).trim();
  if (process.env[k] === undefined) process.env[k] = line.slice(i + 1).trim();
}

async function main() {
  const s3 = new S3Client({
    endpoint: process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io',
    region: (process.env.FILEBASE_REGION && process.env.FILEBASE_REGION !== 'auto')
      ? process.env.FILEBASE_REGION : 'us-east-1',
    credentials: {
      accessKeyId: process.env.FILEBASE_ACCESS_KEY || '',
      secretAccessKey: process.env.FILEBASE_SECRET_KEY || '',
    },
    forcePathStyle: true,
  });
  const bucket = process.env.FILEBASE_BUCKET_NAME || 'meowlish-db';

  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: process.env.PG_SOURCE_KEY || 'english_learning.db' }));
  if (!res.Body) throw new Error('S3 tra ve Body rong');
  const tmp = path.join(os.tmpdir(), 'meowlish-admin-email', 'db.sqlite');
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, Buffer.from(await res.Body.transformToByteArray()));

  const db = new Database(tmp, { readonly: true });
  const row = db.prepare("SELECT email FROM users WHERE username = 'admin'").get() as
    | { email?: string | null }
    | undefined;
  db.close();

  const email = (row?.email || '').trim().toLowerCase();
  if (!email) throw new Error('Tai khoan admin khong co email trong DB — khong the tu suy ra.');

  // Cập nhật .env.local mà không in giá trị.
  const existing = fs.readFileSync(envPath, 'utf8');
  const line = `ADMIN_EMAIL=${email}`;
  const updated = /^ADMIN_EMAIL=/m.test(existing)
    ? existing.replace(/^ADMIN_EMAIL=.*$/m, line)
    : existing.replace(/\s*$/, '\n' + line + '\n');
  fs.writeFileSync(envPath, updated);

  console.log('Da ghi ADMIN_EMAIL vao .env.local (gia tri khong in ra man hinh).');
  console.log('Kiem tra: ' + (/^ADMIN_EMAIL=/m.test(fs.readFileSync(envPath, 'utf8')) ? 'CO' : 'KHONG'));
  console.log('Do dai gia tri: ' + email.length + ' ky tu, co dau @: ' + email.includes('@'));
  console.log('');
  console.log('Buoc con lai (can lam tren Vercel, khong lam duoc tu may nay):');
  console.log('  Vercel > Project meowlish > Settings > Environment Variables');
  console.log('  Key: ADMIN_EMAIL      Value: <cung gia tri vua ghi o .env.local>');
  console.log('  Environment: Production');
  console.log('  Sau do phai deploy lai (doi bien moi truong can mot deployment moi).');
}

main().catch((e: unknown) => {
  console.error('LOI:', e instanceof Error ? e.message : String(e));
  process.exitCode = 1;
});