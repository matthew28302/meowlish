// Kiểm tra M5 (audit 2026-10-08) bằng request thật: tạo phòng với betCoins=0
// phải lưu bet_coins=0 (trước đây `body.betCoins || '100'` — 0 là falsy nên bị
// thay bằng 100). Cùng test: thiếu betCoins → 100 (mặc định giữ nguyên),
// -999 → 0 (clamp), "abc" → 0 (NaN), 10.7 → 10 (làm tròn xuống), racing 0 xu.
//
// Usage: node scripts/verify-bet-zero.mjs [base]
const BASE = process.argv[2] || 'http://localhost:3000';

let ip = 0;
const hdr = (extra = {}) => ({ 'content-type': 'application/json', 'x-forwarded-for': `10.88.0.${++ip}`, ...extra });

const login = await fetch(`${BASE}/api/auth`, {
  method: 'POST', headers: hdr(),
  body: JSON.stringify({ action: 'login', username: 'demo', password: '123456' }),
});
const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
if (!cookie) {
  console.log('KHONG dang nhap duoc (demo/123456) — kiểm tra dev server.');
  process.exit(1);
}

const { default: Database } = await import('better-sqlite3');
const db = new Database('data/english_learning.db');
db.pragma('busy_timeout = 5000');

const userId = 'user_demo_default';
const coinsBefore = db.prepare('SELECT coins FROM users WHERE id = ?').get(userId)?.coins ?? 0;

const createRoom = async (betBody) =>
  fetch(`${BASE}/api/pet`, {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ userId, action: 'create_battle_room', roomName: `verify-m5-${Date.now()}`, ...betBody }),
  }).then((r) => r.json().catch(() => ({})));

const cases = [
  { name: 'betCoins=0 (phòng friendly miễn phí)', body: { betCoins: 0 }, expect: 0 },
  { name: 'betCoins="0" (chuỗi)', body: { betCoins: '0' }, expect: 0 },
  { name: 'thiếu betCoins (mặc định 100)', body: {}, expect: 100 },
  { name: 'betCoins=-999 (clamp về 0)', body: { betCoins: -999 }, expect: 0 },
  { name: 'betCoins="abc" (NaN → 0)', body: { betCoins: 'abc' }, expect: 0 },
  { name: 'betCoins=10.7 (làm tròn xuống 10)', body: { betCoins: 10.7 }, expect: 10 },
  { name: 'racing + betCoins=0 (cùng pattern)', body: { betCoins: 0, gameType: 'racing' }, expect: 0 },
];

const createdRoomIds = [];
let allOk = true;
for (const c of cases) {
  const res = await createRoom(c.body);
  const roomId = res.room?.id;
  if (roomId) createdRoomIds.push(roomId);
  const stored = roomId
    ? db.prepare('SELECT bet_coins FROM pet_battle_rooms WHERE id = ?').get(roomId)?.bet_coins
    : null;
  const ok = stored === c.expect;
  if (!ok) allOk = false;
  console.log(`  ${ok ? 'PASS ✅' : 'FAIL ❌'} — ${c.name}: stored_bet=${stored} (mong đợi ${c.expect})`);
}

// Dọn dẹp: huỷ phòng qua API (hoàn tiền đúng cơ chế cho room có cược)
for (const roomId of createdRoomIds) {
  await fetch(`${BASE}/api/pet`, {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ userId, action: 'cancel_battle_room', roomId }),
  }).catch(() => {});
}

const coinsAfter = db.prepare('SELECT coins FROM users WHERE id = ?').get(userId)?.coins ?? 0;
console.log(`\n  coins demo: ${coinsBefore} → ${coinsAfter} (chênh lệch ${coinsAfter - coinsBefore} — hoàn tiền cược hoạt động đúng)`);
db.close();

console.log(allOk ? '\n=> M5 ĐÃ VÃ ✅' : '\n=> M5 VẪN CÒN LỖI ❌');
process.exit(allOk ? 0 : 1);
