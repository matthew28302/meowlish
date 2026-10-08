// Kiểm chứng: app đang đọc/ghi ở đâu, và Supabase đang chứa gì.
// TUYỆT ĐỐI không in giá trị bí mật/email/hash — chỉ số lượng và fingerprint.
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

const fp = (s: unknown) => crypto.createHash('sha256').update(String(s ?? '')).digest('hex').slice(0, 12);

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('Thieu DATABASE_URL');

  // ---------- 1. Filebase / SQLite (nguon ghi that cua app) ----------
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
  if (!res.Body) throw new Error('S3 Body rong');
  const tmp = path.join(os.tmpdir(), 'meowlish-verify-arch', 'db.sqlite');
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, Buffer.from(await res.Body.transformToByteArray()));

  const lite = new Database(tmp, { readonly: true });
  type U = { id: string; username: string; coins: number; exp: number; password_hash: string; updated: number };
  const liteUsers = lite.prepare('SELECT id, username, coins, exp, password_hash FROM users').all() as U[];
  const liteDict = lite.prepare('SELECT COUNT(*) c FROM dictionary_entries').get() as { c: number };
  const liteProgress = lite.prepare('SELECT COUNT(*) c FROM progress').get() as { c: number };
  lite.close();

  // ---------- 2. Supabase Postgres ----------
  const postgres = (await import('postgres')).default;
  const sql = postgres(databaseUrl, {
    max: 1, prepare: false, ssl: 'require', connect_timeout: 20,
    types: { BigInt: { to: 20, from: [20], serialize: (x: bigint) => String(x), parse: (x: string) => Number(x) } },
  });

  const tables = (await sql.unsafe(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='public' ORDER BY table_name`
  )) as unknown as { table_name: string }[];
  console.log('=== Supabase Postgres ===');
  console.log('So bang trong schema public: ' + tables.length);

  const pgUsers = (await sql.unsafe(
    'SELECT id, username, coins, exp, password_hash FROM users ORDER BY username'
  )) as unknown as U[];
  const pgDict = (await sql.unsafe('SELECT COUNT(*)::int c FROM dictionary_entries')) as unknown as { c: number }[];
  const pgProgress = (await sql.unsafe('SELECT COUNT(*)::int c FROM progress')) as unknown as { c: number }[];
  const rls = (await sql.unsafe(
    `SELECT count(*)::int c FROM pg_tables WHERE schemaname='public' AND rowsecurity = true`
  )) as unknown as { c: number }[];
  const policies = (await sql.unsafe(
    `SELECT count(*)::int c FROM pg_policies WHERE schemaname='public'`
  )) as unknown as { c: number }[];

  console.log('  users           : ' + pgUsers.length);
  console.log('  dictionary      : ' + (pgDict[0]?.c ?? 0));
  console.log('  progress        : ' + (pgProgress[0]?.c ?? 0));
  console.log('  RLS bat         : ' + (rls[0]?.c ?? 0) + '/' + tables.length + ' bang');
  console.log('  policy ton tai  : ' + (policies[0]?.c ?? 0));

  console.log('');
  console.log('=== So sanh Filebase (SQLite) vs Supabase ===');
  console.log('  users           : ' + liteUsers.length + ' vs ' + pgUsers.length);
  console.log('  dictionary      : ' + liteDict.c + ' vs ' + (pgDict[0]?.c ?? 0) +
    (liteDict.c === 0 ? '' : (liteDict.c === (pgDict[0]?.c ?? 0) ? '  (GIONG)' : '  (KHAC)')));
  console.log('  progress        : ' + liteProgress.c + ' vs ' + (pgProgress[0]?.c ?? 0));

  // So từng tài khoản: coins/exp/hash có khớp không?
  const pgByUsername = new Map(pgUsers.map((u) => [u.username, u]));
  let diff = 0;
  const diffs: string[] = [];
  for (const lu of liteUsers) {
    const pu = pgByUsername.get(lu.username);
    if (!pu) { diff++; diffs.push(`${lu.username}: khong co trong Postgres`); continue; }
    if (pu.password_hash !== lu.password_hash || pu.coins !== lu.coins || pu.exp !== lu.exp) {
      diff++;
      diffs.push(
        `${lu.username}: hash ${fp(lu.password_hash)} vs ${fp(pu.password_hash)}, ` +
        `coins ${lu.coins} vs ${pu.coins}, exp ${lu.exp} vs ${pu.exp}`
      );
    }
  }
  console.log('');
  console.log('  Tai khoan KHAC NHAU giua hai noi: ' + diff);
  for (const d of diffs) console.log('    - ' + d);

  const adminLite = liteUsers.find((u) => u.username === 'admin');
  const adminPg = pgUsers.find((u) => u.username === 'admin');
  console.log('');
  console.log('  hash admin  Filebase: ' + fp(adminLite?.password_hash) +
    '   Postgres: ' + fp(adminPg?.password_hash));
  console.log('  => ' + (adminLite?.password_hash === adminPg?.password_hash
    ? 'HAI NOI DANG CHUA CUNG MOT MAT KHAU (bang sao chep luc nhap du lieu)'
    : 'Mat khau da phan bi'));

  await sql.end({ timeout: 5 });
}

main().catch((e: unknown) => {
  console.error('LOI:', e instanceof Error ? e.message : String(e));
  process.exitCode = 1;
});