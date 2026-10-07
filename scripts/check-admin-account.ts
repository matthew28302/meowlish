// Kiểm tra trạng thái tài khoản admin trong DB production — CHỈ in trạng thái,
// TUYỆT ĐỐI không in giá trị email, hash hay mật khẩu.
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split(/\r?\n/)) {
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

  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: 'english_learning.db' }));
  if (!res.Body) throw new Error('S3 tra ve Body rong');
  const buf = Buffer.from(await res.Body.transformToByteArray());
  const tmp = path.join(os.tmpdir(), 'meowlish-admin-check', 'db.sqlite');
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, buf);

  type AdminRow = {
    id: string; username: string; email: string | null; role: string | null;
    status: string | null; password_hash: string; email_verified: number;
    two_factor_enabled: number;
  };
  const db = new Database(tmp, { readonly: true });
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get('admin') as AdminRow | undefined;
  db.close();

  if (!row) {
    console.log('KHONG CO dong tai khoan "admin" trong DB production.');
    console.log('=> Day la nguyen nhan khong dang nhap duoc (khong phai van de OTP).');
    return;
  }

  const hash = String(row.password_hash || '');
  const isScrypt = hash.startsWith('scrypt$');
  const fp = crypto.createHash('sha256').update(hash).digest('hex').slice(0, 12);

  console.log('Tai khoan admin trong DB production:');
  console.log('  ton tai            : CO');
  console.log('  role / status      : ' + row.role + ' / ' + row.status);
  console.log('  co email           : ' + (row.email && row.email.trim() ? 'CO' : 'KHONG'));
  console.log('  email_verified     : ' + Boolean(row.email_verified));
  console.log('  two_factor_enabled : ' + Boolean(row.two_factor_enabled));
  console.log('  scheme mat khau    : ' + (isScrypt ? 'scrypt (hien dai)' : 'SHA-256 (cu)'));
  console.log('  do dai hash        : ' + hash.length + ' ky tu');
  console.log('  fingerprint hash   : ' + fp + '  (chi de doi chieu, khong lo giá tri)');
  console.log('');
  console.log(row.email && row.email.trim()
    ? '=> Co email trong DB: buoc gui OTP se chay du khong co bien moi truong ADMIN_EMAIL.'
    : '=> KHONG co email trong DB. Can dat bien moi truong ADMIN_EMAIL tren Vercel ' +
      '(va deploy lai) truoc khi co the gui OTP.');
}

main().catch((e) => {
  console.error('LOI:', e.message);
  process.exitCode = 1;
});