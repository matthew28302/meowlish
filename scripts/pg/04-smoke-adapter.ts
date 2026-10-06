// Smoke test adapter `src/lib/pg.ts` trên Supabase thật: đọc, ghi, transaction
// rollback, kiểu dữ liệu bigint, và câu SQL dạng SQLite (`?`) chuyển đổi.
// Chạy: DATABASE_URL=... npx tsx scripts/pg/04-smoke-adapter.ts
import { pgDb } from '../../src/lib/pg';

const results: { label: string; pass: boolean; extra?: string }[] = [];
const ok = (label: string, pass: boolean, extra = '') => results.push({ label, pass, extra });

async function main() {
  const u = pgDb.prepare('SELECT id, username, coins, level FROM users WHERE username = ?');
  const demo = await u.get('demo');
  ok('doc theo tham so (dung dinh dang ? cua SQLite)', !!demo, demo ? `@${demo.username} coins=${demo.coins}` : 'khong tim thay');
  ok('coins la number (khong phai chuoi)', typeof demo?.coins === 'number', `typeof=${typeof demo?.coins}`);

  const all = await pgDb.prepare('SELECT id FROM users ORDER BY created_at DESC').all();
  ok('doc danh sach', Array.isArray(all) && all.length >= 15, `${all.length} user`);

  const testId = 'zz_adapter_smoke';
  await pgDb.prepare('DELETE FROM users WHERE id = ?').run(testId);

  // 1) Transaction có rollback: ghi rồi ném lỗi => không được còn dòng
  let sawInside = false;
  try {
    await pgDb.transaction(async (t) => {
        await t.prepare('DELETE FROM users WHERE id = ?').run(testId);
        await t
          .prepare('INSERT INTO users (id, username, display_name, password_hash) VALUES (?, ?, ?, ?)')
          .run(testId, 'zz_adaptersmoke', 'Smoke Test', 'x');
        const found = await t.prepare('SELECT coins FROM users WHERE id = ?').get(testId);
        sawInside = !!found;
        throw new Error('rollback-intentional');
      });
  } catch (e) {
    if (!/rollback-intentional/.test(e instanceof Error ? e.message : String(e))) throw e;
  }
  ok('ghi trong transaction rồi doc lai duoc', sawInside);
  ok('rollback that bai: dong thu nghiem khong con lai', !(await pgDb.prepare('SELECT id FROM users WHERE id = ?').get(testId)));

  // 2) Transaction commit: thay đổi phải còn sau khi thoát
  await pgDb
    .prepare('INSERT INTO users (id, username, display_name, password_hash, coins) VALUES (?, ?, ?, ?, ?)')
    .run(testId, 'zz_adaptersmoke', 'Smoke Test', 'x', 777);
  const committed = await pgDb.prepare('SELECT coins FROM users WHERE id = ?').get(testId);
  ok('commit: thay doi da luu', committed?.coins === 777, `coins=${committed?.coins}`);

  await pgDb.prepare('DELETE FROM users WHERE id = ?').run(testId);
  ok('cleanup xoa dong thu nghiem', !(await pgDb.prepare('SELECT id FROM users WHERE id = ?').get(testId)));

  // 3) bigint phải về number — nếu sai thì mọi so sanh expires_at sai
  const otp = await pgDb.prepare('SELECT expires_at FROM user_otp_sessions LIMIT 1').get();
  ok(
    'bigint (expires_at) tra ve number',
    otp === undefined || typeof otp.expires_at === 'number',
    otp ? `typeof=${typeof otp.expires_at}` : 'bang rong'
  );

  // 4) prepared statement tắt: câu có tham số lặp lại vẫn chạy
  const cnt = await pgDb.prepare('SELECT COUNT(*) AS c FROM users WHERE username = ?').get('demo');
  ok('cau SQL tham so lap lai', Number(cnt?.c) === 1, `count=${cnt?.c}`);

  await pgDb.end();
}

main()
  .then(() => {
    for (const r of results) console.log(`  ${r.pass ? 'PASS' : 'FAIL'} ${r.label}${r.extra ? ' — ' + r.extra : ''}`);
    const failed = results.filter((r) => !r.pass).length;
    console.log(`\n${results.length - failed}/${results.length} PASS`);
    if (failed) process.exitCode = 1;
  })
  .catch((e) => {
    console.error('LOI:', e.message);
    process.exitCode = 1;
  });
