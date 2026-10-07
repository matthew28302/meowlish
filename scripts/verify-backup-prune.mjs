// Kiểm chứng phần DỌN BẢN SAO CŨ của cron sao lưu.
//
// Đây là chỗ NGUY HIỂM NHẤT: nó XOÁ file trên bucket thật. Bản đầu tiên của tôi
// sắp xếp bằng TÊN KEY, dẫn tới đo được bản backup THẬT bị xoá khi có key lạ
// nằm cùng thư mục. Script này khóa lại cả hai vế, theo thứ tự thời gian thật:
//
//   Pha 1 — key LẠ (không do cron tạo) không bị đụng, kể cả khi tên sắp xếp
//           TRƯỚC bản thật (đúng cái đã làm bản đầu hỏng).
//   Pha 2 — key ĐÚNG ĐỊNH DẠNG cron thì bị dọn khi vượt quá 14 bản.
//
// TẤT ĐỊNH: lúc bắt đầu, dọn về đúng 1 bản backup thật. Nếu không, các con số
// kỳ vọng phụ thuộc vào việc trước đó còn sót bao nhiêu bản, và test từng FAIL
// chỉ vì lý do đó chứ không phải vì route sai.
//
// Cuối script luôn chạy lại cron, nên bucket luôn còn bản backup thật khi kết thúc.
import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';

for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split(/\r?\n/)) {
  const i = line.indexOf('=');
  if (i <= 0 || line.trim().startsWith('#')) continue;
  const k = line.slice(0, i).trim();
  if (process.env[k] === undefined) process.env[k] = line.slice(i + 1).trim();
}

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const secret = process.env.CRON_SECRET;
if (!secret) throw new Error('Thieu CRON_SECRET');
const bucket = process.env.FILEBASE_BUCKET_NAME || 'meowlish-db';

/** Đúng định dạng key cron tự tạo. */
const OWN_RE = /^backups\/db-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.db$/;
const KEEP = 14;

// Key rác 2 loại:
//   A) tên KHÔNG khớp định dạng cron, cố tình sắp xếp TRƯỚC bản thật
//      ('a' < 'd') — tái hiện đúng cái làm bản đầu xoá nhầm bản backup thật.
//   B) tên ĐÚNG định dạng cron, dùng năm 2020 để là "bản cũ".
const FOREIGN_KEYS = Array.from({ length: 8 }, (_, i) => `backups/aaa-testprune-${i}.db`);
const OWN_DUMMIES = Array.from({ length: 12 }, (_, i) =>
  `backups/db-2020-01-01T00-00-${String(i).padStart(2, '0')}-000Z.db`
);
const EXTRA_DUMMIES = Array.from({ length: 5 }, (_, i) =>
  `backups/db-2020-02-02T00-00-${String(i).padStart(2, '0')}-000Z.db`
);
const ALL_DUMMY = [...FOREIGN_KEYS, ...OWN_DUMMIES, ...EXTRA_DUMMIES];

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

async function listBackupKeys() {
  const list = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: 'backups/' }));
  return (list.Contents || []).map((o) => o.Key).filter(Boolean).sort();
}
const countOwn = async () => (await listBackupKeys()).filter((k) => OWN_RE.test(k)).length;

async function runCron() {
  const res = await fetch(`${BASE}/api/cron/backup-db`, {
    headers: { authorization: 'Bearer ' + secret },
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function put(key) {
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: 'du lieu gia lap de kiem chung' }));
}
async function del(key) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch {}
}

/** Đưa bucket về đúng 1 bản backup thật. Mỗi bản đều tạo lại được từ key nguồn. */
async function resetToSingleBackup() {
  for (const k of ALL_DUMMY) await del(k);
  const keys = await listBackupKeys();
  const own = keys.filter((k) => OWN_RE.test(k));
  for (const k of own.slice(0, -1)) await del(k);
  if (own.length === 0) await runCron();
  return countOwn();
}

try {
  console.log('| Kiem tra | Mong doi | Thuc te | Ket qua |');
  console.log('|---|---|---|---|');

  row('Chuan bi: dung 1 ban backup that', 1, await resetToSingleBackup());

  // Pha 1 chỉ tạo key lạ + 12 key cron ⇒ 1 + 12 = 13, CHƯA vượt 14.
for (const key of [...FOREIGN_KEYS, ...OWN_DUMMIES]) await put(key);
row('Pha 1: 13 key cron', 13, await countOwn());

  // ---------- PHA 1: key lạ phải được giữ nguyên ----------
  console.log('| Pha 1: key LA khong duoc chua vao | | | |');
  const run1 = await runCron();
  row('Cron tra 200', 200, run1.status);
  row('Chi dem key cron tu tao (bo qua 8 key la)', 13, run1.body.totalBackups);
  row('Chua vuot ngan → khong xoa', 0, run1.body.pruned);

  const after1 = await listBackupKeys();
  row('Tat ca 8 key la con nguyen', 8, after1.filter((k) => FOREIGN_KEYS.includes(k)).length);
  row('Ban backup that con nguyen', true, after1.some((k) => OWN_RE.test(k)));

  // ---------- PHA 2: key đúng định dạng thì phải bị dọn ----------
  console.log('| Pha 2: 18 key cron → phai don con 14 | | | |');
  // Thêm 5 key cron nữa: 13 + 5 = 18 > 14 ⇒ phải dọn 4 bản cũ nhất.
  for (const key of EXTRA_DUMMIES) await put(key);
  row('Pha 2: 18 key cron', 18, await countOwn());
  const run2 = await runCron();
  row('Cron tra 200', 200, run2.status);
  row('Xoa dung 4 ban cuoi hon', 4, run2.body.pruned);
  row('Giu lai dung 14 ban', 14, run2.body.keptBackups);
  row('Bucket con dung 14 key cron', 14, await countOwn());

  const after2 = await listBackupKeys();
  row('8 key la van con nguyen', 8, after2.filter((k) => FOREIGN_KEYS.includes(k)).length);

  const src = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: 'english_learning.db' }));
  row('Key nguon con nguyen', true, Number(src.ContentLength) > 0);
} finally {
  for (const k of ALL_DUMMY) await del(k);
  await runCron();
  console.log('');
  console.log(`Da don key rac. Con ${await countOwn()} ban sao luu that tren bucket.`);
}

console.log('');
console.log(
  fail === 0
    ? 'PASS  cron chi don key do no tu tao, giu nguyen key la va key nguon.'
    : `FAIL  ${fail} truong hop sai.`
);
if (fail > 0) process.exitCode = 1;