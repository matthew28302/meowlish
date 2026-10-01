// One-off probe: write a row to DB, then verify it arrives on Filebase.
// Usage: node scripts/autosync-probe.mjs [write|check]
import Database from 'better-sqlite3';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const dbPath = path.join(root, 'data', 'english_learning.db');
const PROBE_KEY = 'autosync_probe:latest';

// load .env.local
const envPath = path.join(root, '.env.local');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const mode = process.argv[2] || 'write';

if (mode === 'write') {
  const db = new Database(dbPath);
  db.pragma('busy_timeout = 5000');
  const marker = `probe_${Date.now()}`;
  db.prepare(
    'INSERT OR REPLACE INTO ai_translation_cache (query_key, query_type, result_json, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
  ).run(PROBE_KEY, 'word', JSON.stringify({ marker }));
  const row = db.prepare('SELECT result_json FROM ai_translation_cache WHERE query_key = ?').get(PROBE_KEY);
  console.log('LOCAL WRITE OK ->', row.result_json);
  db.close();
} else {
  const s3 = new S3Client({
    endpoint: process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io',
    region: process.env.FILEBASE_REGION || 'auto',
    credentials: {
      accessKeyId: process.env.FILEBASE_ACCESS_KEY,
      secretAccessKey: process.env.FILEBASE_SECRET_KEY,
    },
    forcePathStyle: true,
  });

  // Pull remote DB into memory and look for the probe row
  const res = await s3.send(
    new GetObjectCommand({ Bucket: process.env.FILEBASE_BUCKET_NAME, Key: 'english_learning.db' })
  );
  const bytes = Buffer.from(await res.Body.transformToByteArray());
  const tmp = path.join(root, 'data', '_remote_check.db');
  fs.writeFileSync(tmp, bytes);

  const rdb = new Database(tmp, { readonly: true });
  const row = rdb.prepare('SELECT result_json, created_at FROM ai_translation_cache WHERE query_key = ?').get(PROBE_KEY);
  rdb.close();
  fs.unlinkSync(tmp);

  if (row) {
    console.log('REMOTE HAS PROBE ->', row.result_json, '@', row.created_at);
    console.log('AUTOSYNC VERIFIED: local write reached Filebase. OK');
  } else {
    console.log('REMOTE MISSING PROBE -> not synced yet');
    process.exitCode = 2;
  }
}
