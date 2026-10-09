// Đo thời gian thật của request đăng ký trên production + ghi lại lỗi server.
// KHÔNG tạo tài khoản thật — chỉ đo response time và header.
const BASE = process.env.PROBE_BASE || 'https://meowlish.io.vn';

const url = `${BASE}/api/auth`;
const payload = {
  action: 'register',
  username: `probe_email_test_${Date.now().toString(36)}`,
  password: 'Aa123456!x',
  displayName: 'Probe Email',
  email: `probe.${Date.now().toString(36)}@example.invalid`,
};

// Bỏ comment: đo thời gian từ client -> response đầu tiên -> body xong.
for (let i = 1; i <= 2; i++) {
  const t0 = Date.now();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 90_000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...payload, username: `${payload.username}_${i}` }),
      signal: ac.signal,
    });
    const firstByte = Date.now() - t0;
    const text = await res.text();
    const total = Date.now() - t0;
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {}
    console.log(`\n--- lan ${i} ---`);
    console.log(`HTTP            : ${res.status} ${res.statusText}`);
    console.log(`Time first byte : ${firstByte} ms`);
    console.log(`Time total      : ${total} ms`);
    console.log(`x-vercel-id     : ${res.headers.get('x-vercel-id')}`);
    console.log(`x-matched-path  : ${res.headers.get('x-matched-path')}`);
    console.log(`age (cache)     : ${res.headers.get('age')}`);
    console.log(`body            : ${JSON.stringify(parsed)?.slice(0, 400) ?? text.slice(0, 300)}`);
    if (parsed?.verifySessionId) console.log('=> co verifySessionId (da gui OTP)');
    if (parsed?.requires_email_verification) console.log('=> requires_email_verification = true');
  } catch (e) {
    const ms = Date.now() - t0;
    console.log(`\n--- lan ${i} ---`);
    console.log(`LOI sau ${ms} ms: ${e.name}: ${e.message}`);
    if (e.name === 'AbortError') console.log('=> ABORT (timeout) — client bo qua');
  } finally {
    clearTimeout(timer);
  }
}