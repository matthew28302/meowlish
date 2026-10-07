// Kiểm chứng `changes` của adapter Postgres với câu lệnh THẬT trên Supabase.
// Dùng bảng tạm rồi xoá — không đụng dữ liệu người dùng.
import fs from 'fs';
import path from 'path';

for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split(/\r?\n/)) {
  const i = line.indexOf('=');
  if (i <= 0 || line.trim().startsWith('#')) continue;
  const k = line.slice(0, i).trim();
  if (process.env[k] === undefined) process.env[k] = line.slice(i + 1).trim();
}

const TMP = 'pg_changes_probe';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('Thieu DATABASE_URL');

  const { pgDb } = await import('../../src/lib/pg');

  await pgDb.exec(`DROP TABLE IF EXISTS ${TMP}`);
  await pgDb.exec(`CREATE TABLE ${TMP} (id TEXT PRIMARY KEY, v INTEGER NOT NULL)`);

  const insert = await pgDb.prepare(`INSERT INTO ${TMP} (id, v) VALUES (?, ?)`).run('a', 1);

  // Insert trùng khoá chính: Postgres NÉM LỖI (khác SQLite vốn `INSERT OR IGNORE`).
  // Bắt lại để probe tiếp tục — dùng để xác nhận ràng buộc UNIQUE thật sự hoạt động.
  let duplicateInsertThrows = false;
  let insertAgain = { changes: -1 };
  try {
    insertAgain = await pgDb.prepare(`INSERT INTO ${TMP} (id, v) VALUES (?, ?)`).run('a', 2);
  } catch {
    duplicateInsertThrows = true;
  }

  // UPDATE không có RETURNING — đây là chỗ bản cũ trả sai.
  const updateHit = await pgDb.prepare(`UPDATE ${TMP} SET v = ? WHERE id = ?`).run(99, 'a');
  const updateMiss = await pgDb.prepare(`UPDATE ${TMP} SET v = ? WHERE id = ?`).run(5, 'khong-co');

  // UPDATE có RETURNING — rows.length chỉ bằng số dòng trả về, không phải số dòng sửa.
  const updateReturning = await pgDb.prepare(`UPDATE ${TMP} SET v = v + 1 WHERE id = ? RETURNING v`).run('a');

  const deleteHit = await pgDb.prepare(`DELETE FROM ${TMP} WHERE id = ?`).run('a');
  const deleteMiss = await pgDb.prepare(`DELETE FROM ${TMP} WHERE id = ?`).run('khong-co');

  const rows: [string, number, number][] = [
    ['INSERT (dong moi)', 1, insert.changes],
    ['UPDATE khop 1 dong', 1, updateHit.changes],
    ['UPDATE khong khop dong nao', 0, updateMiss.changes],
    ['UPDATE co RETURNING (1 dong bi sua)', 1, updateReturning.changes],
    ['DELETE khop 1 dong', 1, deleteHit.changes],
    ['DELETE khong khop dong nao', 0, deleteMiss.changes],
  ];

  let fail = 0;
  console.log('| Cau lenh | Mong doi | Thuc te | Ket qua |');
  console.log('|---|---|---|---|');
  for (const [label, expected, actual] of rows) {
    const ok = expected === actual;
    if (!ok) fail++;
    console.log(`| ${label} | ${expected} | ${actual} | ${ok ? 'PASS' : 'FAIL'} |`);
  }

  // Khác biệt hành vi cần biết trước khi chuyển: SQLite bỏ qua, Postgres ném lỗi.
  console.log('');
  console.log('| INSERT trung khoa | bo qua (changes=0) | ' +
    (duplicateInsertThrows ? 'nem loi (constraint)' : 'bo qua') + ' | ' +
    (duplicateInsertThrows ? 'KHAC BIET CAN LUU Y' : 'giong SQLite') + ' |');
  console.log('  => can chuyen moi `INSERT OR IGNORE` sang `ON CONFLICT DO NOTHING`');

  await pgDb.exec(`DROP TABLE IF EXISTS ${TMP}`);

  console.log('');
  console.log(fail === 0
    ? 'PASS  adapter Postgres bao changes dung nhu better-sqlite3.'
    : `FAIL  ${fail} truong hop sai — chua an toan de chuyen sang Postgres.`);

  if (fail > 0) process.exitCode = 1;
}

main().catch((e: unknown) => {
  console.error('LOI:', e instanceof Error ? e.message : String(e));
  process.exitCode = 1;
});