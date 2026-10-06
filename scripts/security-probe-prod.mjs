// Probe CHỈ ĐỌC trên production, dùng đúng các mẫu tấn công đã thành công
// trước khi vá. Không in hash/mật khẩu, không ghi dữ liệu của người dùng thật.
const B = 'https://www.meowlish.io.vn';
const VICTIM = 'user_1791298260433_rh7b'; // tài khoản thật, chỉ dùng id công khai
const out = [];
const ck = (label, pass, extra = '') => out.push(`${pass ? 'PASS' : 'FAIL'} ${label}${extra ? ' — ' + extra : ''}`);

// 1. Bypass chữ ký phiên: token rác và userId trần
const leaks = [];
for (const [name, cookie] of [
  ['token rác', 'meowlish_user_session=forged-token-not-a-real-signature'],
  ['userId trần', `meowlish_user_session=${VICTIM}`],
]) {
  for (const path of ['/api/progress', '/api/pet', '/api/bookmarks']) {
    const r = await fetch(`${B}${path}?userId=${VICTIM}`, { headers: { cookie } });
    const body = await r.text();
    const leaked = /kangyoungha|강영하/.test(body);
    if (leaked) leaks.push(`${name} ${path}`);
    ck(`${name} → GET ${path} không lộ dữ liệu người khác`, !leaked, `HTTP ${r.status}`);
  }
}

// 2. Ghi dữ liệu bằng cookie giả phải bị chặn
for (const path of ['/api/progress', '/api/pet', '/api/bookmarks']) {
  const r = await fetch(`${B}${path}`, {
    method: 'POST',
    headers: { cookie: `meowlish_user_session=${VICTIM}`, 'content-type': 'application/json' },
    body: JSON.stringify({ userId: VICTIM, moduleType: 'vocab', itemId: 'probe', score: 100 }),
  });
  ck(`POST ${path} với cookie giả mạo → bị chặn`, r.status === 401 || r.status === 403, `HTTP ${r.status}`);
}

// 3. /api/support
const sup1 = await fetch(`${B}/api/support?userId=${VICTIM}`);
ck('GET /api/support?userId người khác → 401', sup1.status === 401, `HTTP ${sup1.status}`);

const sup2 = await fetch(`${B}/api/support?email=kangyoungha%40gmail.com`);
const sup2Body = await sup2.json().catch(() => ({}));
const leakedTicket = JSON.stringify(sup2Body).match(/"message"|"admin_reply"|"name"|"subject"/);
ck('GET /api/support?email người khác → không lộ nội dung', !leakedTicket,
  sup2Body.redacted ? 'đã rút gọn (redacted)' : `HTTP ${sup2.status}`);

// 4. Tài khoản demo vẫn đăng nhập được (không hỏng luồng chính)
const login = await fetch(`${B}/api/auth`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ action: 'login', username: 'demo', password: '123456' }),
});
ck('demo vẫn đăng nhập được sau khi vá', login.ok, `HTTP ${login.status}`);

// 5. Endpoint nhạy cảm vẫn chặn
for (const [path, method] of [['/api/sync', 'GET'], ['/api/sync', 'POST']]) {
  const r = await fetch(B + path, { method });
  ck(`${method} ${path} chặn không auth`, r.status === 401 || r.status === 403, `HTTP ${r.status}`);
}

console.log(out.join('\n'));
console.log(`\n${out.filter((l) => l.startsWith('PASS')).length} PASS / ${out.filter((l) => l.startsWith('FAIL')).length} FAIL`);
console.log(leaks.length ? `\nCANH BAO: ${leaks.length} endpoint van lo du lieu.` : '\nKhong con endpoint nao lo du lieu nguoi khac.');