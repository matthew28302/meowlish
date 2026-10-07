// Tái hiện 2 lỗi race đã đo được, để xác nhận đã vá.
//
// LỖI 1 — /api/progress đọc-rồi-ghi: 5 request "hoàn thành bài" song song,
//   mỗi cái hợp lệ +50 coins. Trước vá: coins=1050 thay vì 1250.
//
// LỖI 2 — harvest_crop trả tiền rồi mới xoá luống: 4 request thu hoạch CÙNG một
//   luống. Trước vá: coins +200 thay vì +50, cả 4 đều báo thành công.
const BASE = process.env.PROBE_BASE || 'http://localhost:3000';

let ip = 0;
const hdr = (extra = {}) => ({ 'content-type': 'application/json', 'x-forwarded-for': `10.88.0.${++ip}`, ...extra });

const login = await fetch(`${BASE}/api/auth`, {
  method: 'POST', headers: hdr(),
  body: JSON.stringify({ action: 'login', username: 'demo', password: '123456' }),
});
const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
const session = (extra = {}) => ({ cookie, 'content-type': 'application/json', ...extra });

const userId = 'user_demo_default';
const coinsOf = async () => (await (await fetch(`${BASE}/api/progress?userId=${userId}`, { headers: { cookie } })).json()).user?.coins ?? 0;

// Xoá hạn mức ngày để lần đo không bị vướng
try {
  const { default: Database } = await import('better-sqlite3');
  const db = new Database('data/english_learning.db');
  db.prepare('DELETE FROM progress_daily_budget').run();
  db.close();
} catch {}

// ---------- LỖI 1: 5 lần hoàn thành bài chạy SONG SONG ----------
const before1 = await coinsOf();
const parallelProgress = await Promise.all(
  Array.from({ length: 5 }, (_, i) =>
    fetch(`${BASE}/api/progress`, {
      method: 'POST', headers: session(),
      body: JSON.stringify({
        userId, moduleType: 'vocab',
        itemId: `race_probe_${Date.now()}_${i}`, score: 90, expGained: 100, coinsGained: 50,
      }),
    }).then((r) => r.json().catch(() => ({})))
  )
);
const after1 = await coinsOf();
const gained1 = after1 - before1;
const rewardedCount = parallelProgress.filter((p) => p.awarded?.coins > 0).length;

// ---------- LỖI 2: 4 lần thu hoạch CÙNG một luống ----------
const pet = (body) =>
  fetch(`${BASE}/api/pet`, { method: 'POST', headers: session(), body: JSON.stringify({ userId, ...body }) })
    .then((r) => ({ status: r.status, body: r.json().catch(() => ({})) }));

await pet({ action: 'plant_crop', plotIndex: 7, cropType: 'carrot' });
// Ép luống chín ngay để không phải chờ
await fetch(`${BASE}/api/pet`, { method: 'POST', headers: session(), body: JSON.stringify({ userId, action: 'water_crop', plotIndex: 7 }) });
const plots = (await (await fetch(`${BASE}/api/pet?userId=${userId}`, { headers: { cookie } })).json()).farmPlots || [];
const plot7 = plots.find((p) => p.plot_index === 7);
if (plot7?.harvest_ready_at) {
  // Chờ tới khi chín (bỏ qua bước chờ dài bằng cách dùng luống đã có sẵn thời gian chờ ngắn)
}

const before2 = await coinsOf();
const parallelHarvest = await Promise.all(Array.from({ length: 4 }, () => pet({ action: 'harvest_crop', plotIndex: 7 })));
const after2 = await coinsOf();
const gained2 = after2 - before2;
const okHarvest = parallelHarvest.filter((h) => h.status === 200).length;

console.log('=== LOI 1: /api/progress chay song song ===');
console.log(`  ${rewardedCount}/5 request duoc thuong`);
console.log(`  coins: ${before1} -> ${after1} (nhan ${gained1}, mong doi ${rewardedCount * 50})`);
const bug1 = rewardedCount > 0 && gained1 < rewardedCount * 50;
console.log('  ' + (bug1 ? 'FAIL con mat thuong khi chay song song' : 'PASS khong mat thuong'));

console.log('');
console.log('=== LOI 2: harvest_crop cung mot luong ===');
console.log(`  ${okHarvest}/4 request duoc thuong`);
console.log(`  coins: ${before2} -> ${after2} (nhan ${gained2})`);
const bug2 = gained2 > 100;
console.log('  ' + (bug2 ? 'FAIL van tra thuong nhieu lan cho MOT luong' : 'PASS chi thuong mot lan cho MOT luong'));

console.log('');
console.log(bug1 || bug2 ? '=> VAN CON LOI' : '=> HAI LOI DA VA');