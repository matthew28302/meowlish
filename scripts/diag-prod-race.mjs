// Giả lập đúng kịch bản người dùng gặp:
// AuthModal đăng ký (200) -> ngay lập tức EmailVerifyModal gọi
// request_email_verification, CÙNG LÚC với request đăng ký.
// Đo xem có race khiến request thứ 2 fail / chậm.
const BASE = process.env.PROBE_BASE || 'https://meowlish.io.vn';

// Mật khẩu tài khoản probe phải đến từ biến môi trường, KHÔNG ghi literal vào
// repo (mật khẩu nằm trong git là rò rỉ thật; guard
// tests/unit/no-hardcoded-secrets.test.ts chặn đúng mẫu này).
// Chạy: PROBE_PASSWORD='...' node scripts/diag-prod-race.mjs
const password = process.env.PROBE_PASSWORD;
if (!password) {
  console.error('Thieu PROBE_PASSWORD — canh bien khong chay. Khong ghi mat khau fallback vao repo.');
  process.exit(1);
}

const stamp = Date.now().toString(36);
const username = `probe3_${stamp}`;
const email = `probe3.${stamp}@example.invalid`;

// Gửi register và (giả lập) request thứ 2 CÙNG LẬP — không chờ register xong.
const regPromise = fetch(`${BASE}/api/auth`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ action: 'register', username, password, displayName: 'P3', email }),
});

await new Promise((r) => setTimeout(r, 50));

const t2 = Date.now();
const early = await fetch(`${BASE}/api/auth`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ action: 'request_email_verification', userId: 'khong-ton-tai', email }),
}).catch((e) => ({ status: 0, text: async () => `NETWORK: ${e.name} ${e.message}` }));

const reg = await regPromise;
const regMs = Date.now() - t2;
const regBody = await reg.text();
const earlyBody = await early.text();
const earlyMs = Date.now() - t2;

console.log('=== request 2 chay SONG SONG voi register (truong hop user gap) ===');
console.log(`register: HTTP ${reg.status} | ${regMs} ms`);
console.log(`verify  : HTTP ${early.status} | ${earlyMs} ms (bat dau chi +50ms)`);
console.log(`body    : ${earlyBody.slice(0, 240)}`);

// Do lai nhieu lan de tim bien so chay bien
console.log('\n=== Do bien do chay 6 lan ===');
const times = [];
for (let i = 0; i < 6; i++) {
  const s = Date.now();
  const r = await fetch(`${BASE}/api/health`).then((x) => x.text()).catch(() => 'ERR');
  times.push(Date.now() - s);
  process.stdout.write(`${Date.now() - s}ms  `);
}
console.log('\n(ket qua tren /api/health — phan bo thoi gian server)');
console.log(`min=${Math.min(...times)} max=${Math.max(...times)} avg=${Math.round(times.reduce((a, b) => a + b, 0) / times.length)}`);