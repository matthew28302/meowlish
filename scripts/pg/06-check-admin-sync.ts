// Kiểm tra mật khẩu admin đã đồng bộ giữa Filebase (SQLite, nguồn đang chạy) và
// Postgres (bản sao sẽ dùng sau khi chuyển code) hay chưa.
// TUYỆT ĐỐI không in giá trị hash hay mật khẩu — chỉ in so khớp/không khớp.
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const envFile = path.join(process.cwd(), '.env.local');
for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const i = line.indexOf('=');
  if (i <= 0 || line.trim().startsWith('#')) continue;
  const k = line.slice(0, i).trim();
  if (process.env[k] === undefined) process.env[k] = line.slice(i + 1).trim();
}

async function main() {
  const s3 = new S3Client({
    endpoint: process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io',
    region: (process.env.FILEBASE_REGION && process.env.FILEBASE_REGION !== 'auto') ? process.env.FILEBASE_REGION : 'us-east-1',
    credentials: { accessKeyId: process.env.FILEBASE_ACCESS_KEY || '', secretAccessKey: process.env.FILEBASE_SECRET_KEY || '' },
    forcePathStyle: true,
  });
  const bucket = process.env.FILEBASE_BUCKET_NAME || 'meowlish-db';

  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: 'english_learning.db' }));
  if (!res.Body) throw new Error('S3 tra ve Body rong');
  const buf = Buffer.from(await res.Body.transformToByteArray());
  const tmp = path.join(os.tmpdir(), 'meowlish-pg', 'check-admin.db');
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, buf);

  type AdminRow = { id: string; role: string | null; status: string | null; password_hash: string };
  const lite = new Database(tmp, { readonly: true });
  const row = lite
    .prepare("SELECT id, role, status, password_hash FROM users WHERE username = 'admin'")
    .get() as AdminRow | undefined;
  const count = (lite.prepare('SELECT COUNT(*) c FROM users').get() as { c: number }).c;
  lite.close();

  const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 12);
  console.log('Filebase/SQLite : user=' + count + ' | admin role=' + row?.role + ' status=' + row?.status);
  console.log('  hash scheme    : ' + (String(row?.password_hash).startsWith('scrypt$') ? 'scrypt (hien dai)' : 'SHA-256 (cu)'));
  console.log('  hash fingerprint: ' + sha(String(row?.password_hash)));

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('Thieu DATABASE_URL trong .env.local');

  const postgres = (await import('postgres')).default;
  const sql = postgres(databaseUrl, {
    max: 1, prepare: false, ssl: 'require', connect_timeout: 20,
    types: {
      BigInt: {
        to: 20,
        from: [20],
        serialize: (x: bigint) => String(x),
        parse: (x: string) => Number(x),
      },
    },
  });
  const pg = await sql.unsafe("SELECT id, role, status, password_hash FROM users WHERE username = 'admin'");
  const pRow = pg[0];
  const pgCount = await sql.unsafe('SELECT COUNT(*)::int c FROM users');
  console.log('Postgres        : user=' + pgCount[0].c + ' | admin role=' + pRow?.role + ' status=' + pRow?.status);
  console.log('  hash scheme    : ' + (String(pRow?.password_hash).startsWith('scrypt$') ? 'scrypt (hien dai)' : 'SHA-256 (cu)'));
  console.log('  hash fingerprint: ' + sha(String(pRow?.password_hash)));

  const same = Boolean(row && pRow && row.password_hash === pRow.password_hash);
  console.log('');
  console.log(same ? '=> HASH ADMIN KHOP giua hai noi (da dong bo)' : '=> HASH ADMIN KHAC NHAU — can mirror sang Postgres');
  await sql.end({ timeout: 5 });
}

main().catch((e) => {
  console.error('LOI:', e.message);
  process.exitCode = 1;
});

