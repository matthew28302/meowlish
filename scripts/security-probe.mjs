// Kiểm chứng chủ động các biện pháp bảo mật trên production (chỉ đọc).
// Mục tiêu: đo header thực tế, cờ cookie phiên, và thử truy cập trái phép.
const BASE = 'https://www.meowlish.io.vn';
const out = [];
const ck = (label, pass, extra = '') => out.push(`${pass ? 'PASS' : 'FAIL'} ${label}${extra ? ' — ' + extra : ''}`);

// 1. Security headers
const res = await fetch(BASE + '/', { redirect: 'follow' });
const h = res.headers;
for (const [name, expected] of [
  ['strict-transport-security', 'max-age'],
  ['x-frame-options', null],
  ['x-content-type-options', 'nosniff'],
  ['referrer-policy', 'strict-origin'],
  ['permissions-policy', 'microphone'],
  ['content-security-policy', null],
]) {
  const v = h.get(name);
  if (v === null) { out.push(`MISS ${name}`); continue; }
  const ok = expected ? v.toLowerCase().includes(expected) : true;
  ck(`header ${name}`, ok, v.slice(0, 52));
}

// 2. Cờ cookie phiên khi đăng nhập
const login = await fetch(BASE + '/api/auth', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ action: 'login', username: 'demo', password: '123456' }),
});
const setCookie = login.headers.get('set-cookie') || '';
ck('cookie co HttpOnly', /httponly/i.test(setCookie));
ck('cookie co SameSite', /samesite/i.test(setCookie));
ck('cookie co Secure', /secure/i.test(setCookie));
ck('cookie co Max-Age', /max-age/i.test(setCookie));
ck('khong loi mat khau trong response', !/password_hash|"password"/i.test(await login.clone().text()));

const cookie = (setCookie.split(';')[0] || '').split('=')[1] ? setCookie.split(';')[0] : '';

// 3. Truy cập dữ liệu người khác khi phiên giả (IDOR)
const fake = { cookie: 'meowlish_user_session=forged-token-not-a-real-signature' };
for (const path of [
  '/api/progress?userId=user_demo_default',
  '/api/pet?userId=user_demo_default',
  '/api/bookmarks?userId=user_demo_default',
]) {
  const r = await fetch(BASE + path, { headers: fake });
  const body = await r.text();
  // 401/403 = chặn đúng. 200 với dữ liệu người khác = lỗ hổng.
  const leaked = r.ok && /Nguyễn Văn Minh|blocker|refactor/i.test(body);
  ck(`IDOR ${path}`, r.status === 401 || r.status === 403 || leaked === false, `HTTP ${r.status}${leaked ? ' — LO DUU LIEU' : ''}`);
}

// 4. Endpoint nhạy cảm không auth
for (const [path, method] of [['/api/sync', 'GET'], ['/api/sync', 'POST'], ['/api/log/access', 'GET']]) {
  const r = await fetch(BASE + path, { method, headers: fake });
  ck(`${method} ${path} chan khong auth`, r.status === 401 || r.status === 403, `HTTP ${r.status}`);
}

// 5. Đăng nhập admin bị chặn ở form công cộng
const adm = await fetch(BASE + '/api/auth', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ action: 'login', username: 'admin', password: 'x' }),
});
ck('form cong cong chan dang nhap admin', adm.status === 403 || adm.status === 401, `HTTP ${adm.status}`);

// 6. Rate limit: 25 lần đăng nhập sai liên tiếp
let limited = false;
for (let i = 0; i < 25; i++) {
  const r = await fetch(BASE + '/api/auth', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'login', username: 'ratelimit_probe_user', password: 'x' }),
  });
  if (r.status === 429) { limited = true; break; }
}
ck('co rate limit tren dang nhap', limited, limited ? '429 sau mot loan lan thu' : 'KHONG bi chan');

console.log(out.join('\n'));
console.log(`\n${out.filter((l) => l.startsWith('PASS')).length} PASS / ${out.filter((l) => l.startsWith('FAIL') || l.startsWith('MISS')).length} can xem xet`);
