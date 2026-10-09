// Đo request thứ 2 trong luồng đăng ký: request_email_verification.
// Đây chính là request báo "Lỗi kết nối máy chủ" trong ảnh.
const BASE = process.env.PROBE_BASE || 'https://meowlish.io.vn';

// Mật khẩu tài khoản probe đến từ biến môi trường — không ghi literal vào repo.
// Chạy: PROBE_PASSWORD='...' node scripts/diag-prod-verify-email.mjs
const password = process.env.PROBE_PASSWORD;
if (!password) {
  console.error('Thieu PROBE_PASSWORD — canh bien khong chay. Khong ghi mat khau fallback vao repo.');
  process.exit(1);
}

const stamp = Date.now().toString(36);
const username = `probe2_${stamp}`;
const email = `probe2.${stamp}@example.invalid`;

// 1) Đăng ký (đo thời gian)
const t0 = Date.now();
const reg = await fetch(`${BASE}/api/auth`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ action: 'register', username, password, displayName: 'Probe2', email }),
});
const regText = await reg.text();
const regMs = Date.now() - t0;
let regData = null;
try { regData = JSON.parse(regText); } catch {}
console.log('=== BUOC 1: register ===');
console.log(`HTTP ${reg.status} | ${regMs} ms`);
console.log(`verifySessionId: ${regData?.verifySessionId ? 'CO' : 'KHONG'}`);
console.log(`requires_email_verification: ${regData?.requires_email_verification}`);

const cookie = reg.headers.get('set-cookie') || '';
console.log(`set-cookie: ${cookie ? 'CO (session da tao)' : 'KHONG'}`);

if (!regData?.user?.id) {
  console.log('Khong lay duoc user id — dung lai.');
  process.exit(1);
}
const userId = regData.user.id;

// 2) request_email_verification — đo 3 lần
for (let i = 1; i <= 3; i++) {
  const t = Date.now();
  try {
    const r = await fetch(`${BASE}/api/auth`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ action: 'request_email_verification', userId, email }),
    });
    const body = await r.text();
    const ms = Date.now() - t;
    let d = null;
    try { d = JSON.parse(body); } catch {}
    console.log(`\n=== BUOC 2 lan ${i}: request_email_verification ===`);
    console.log(`HTTP ${r.status} | ${ms} ms`);
    console.log(`x-vercel-id: ${r.headers.get('x-vercel-id')}`);
    console.log(`body: ${(d ? JSON.stringify(d) : body).slice(0, 300)}`);
    if (ms > 9000) console.log('=> SAT TRAN 10s: Vercel co the cat => client thay "Lỗi kết nối máy chủ"');
  } catch (e) {
    console.log(`\n=== BUOC 2 lan ${i} ===`);
    console.log(`LOI ${e.name} sau ${Date.now() - t} ms: ${e.message}`);
  }
}