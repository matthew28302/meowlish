// Đồng bộ bảng `reward_claims` (mới thêm trong bản vá bảo mật) sang Postgres.
// TUYỆT ĐỐI không in bất kỳ giá trị bí mật nào.
import fs from 'fs';
import path from 'path';

for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split(/\r?\n/)) {
  const i = line.indexOf('=');
  if (i <= 0 || line.trim().startsWith('#')) continue;
  const k = line.slice(0, i).trim();
  if (process.env[k] === undefined) process.env[k] = line.slice(i + 1).trim();
}

async function main() {
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

  const exists = await sql.unsafe(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reward_claims'`
  );
  if (exists.length === 0) {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS reward_claims (
        user_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        claimed_at BIGINT NOT NULL,
        PRIMARY KEY (user_id, kind)
      )
    `);
    console.log('Da tao bang reward_claims.');
  } else {
    console.log('Bang reward_claims da ton tai.');
  }

  const cols = await sql.unsafe(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'reward_claims' ORDER BY ordinal_position`
  );
  console.log('Cot: ' + cols.map((c) => String(c.column_name)).join(', '));
  await sql.end({ timeout: 5 });
}

main().catch((e) => {
  console.error('LOI:', e.message);
  process.exitCode = 1;
});