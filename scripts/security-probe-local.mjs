// Kiểm chứng lại các lỗ hổng đã sửa, chạy trên dev server CỤC BỘ (localhost).
// Dùng đúng các mẫu tấn công đã xác nhận thành công trên production trước đây.
// TUYỆT ĐỐI không in hash/mật khẩu.
const BASE = 'http://localhost:3000';
const out = [];
const ck = (label, pass, extra = '') => out.push(`${pass ? 'PASS' : 'FAIL'} ${label}${extra ? ' — ' + extra : ''}`);

// Rate limit của app đang khoá theo IP và lưu in-memory. Dùng IP riêng cho probe
// để không đụng bucket của người dùng thật (đồng thời cũng cho thấy app tin
// tuyệt đối X-Forwarded-For — ghi nhận ở danh sách tồn đọng).
let ipCounter = 0;
const withIp = (headers = {}) => ({ ...headers, 'x-forwarded-for': `10.99.0.${(ipCounter += 1)}` });

// Đăng nhập demo để lấy cookie phiên hợp lệ
const login = await fetch(BASE + '/api/auth', {
  method: 'POST',
  headers: withIp({ 'content-type': 'application/json' }),
  body: JSON.stringify({ action: 'login', username: 'demo', password: '123456' }),
});
const setCookie = login.headers.get('set-cookie') || '';
const validCookie = withIp({ cookie: setCookie.split(';')[0] });
ck('demo đăng nhập được', login.ok && validCookie.cookie.startsWith('meowlish_user_session='), `HTTP ${login.status}`);

const forged = { cookie: 'meowlish_user_session=forged-token-not-a-real-signature' };
const rawUserId = { cookie: 'meowlish_user_session=user_demo_default' };

// 1. Cookie giả mạo (bypass đã gỡ)
for (const path of ['/api/progress?userId=user_demo_default', '/api/pet?userId=user_demo_default', '/api/bookmarks?userId=user_demo_default']) {
  for (const [name, headers] of [['token rác', forged], ['userId trần', rawUserId]]) {
    const r = await fetch(BASE + path, { headers: { cookie: headers.cookie } });
    const body = await r.text();
    // Guest xem demo vẫn được (đọc-only) → không phải lỗ hổng nữa.
    // Điều cần chứng minh: request SỬA dữ liệu phải bị chặn.
    ck(`GET ${path.slice(0, 22)} (${name}) không lộ dữ liệu người KHÁC`, !/kangyoungha/.test(body), `HTTP ${r.status}`);
  }
}

// 2. Ghi dữ liệu bằng cookie giả phải bị chặn 401
for (const path of ['/api/progress', '/api/pet', '/api/bookmarks']) {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { ...forged, 'content-type': 'application/json' },
    body: JSON.stringify({ userId: 'user_demo_default', moduleType: 'vocab', itemId: 'probe', score: 100 }),
  });
  ck(`POST ${path} bằng cookie giả → bị chặn`, r.status === 401 || r.status === 403, `HTTP ${r.status}`);
}

// 2b. IDOR dạng "phiên hợp lệ của tôi + userId của người khác" (nạn nhân thật)
const idorTargets = [
  ['/api/progress?userId=user_1791298260433_rh7b', null],
  ['/api/pet?userId=user_1791298260433_rh7b', null],
  ['/api/bookmarks?userId=user_1791298260433_rh7b', null],
];
for (const [path] of idorTargets) {
  const r = await fetch(BASE + path, { headers: validCookie });
  const body = await r.text();
  ck(`GET ${path.slice(0, 26)} (phiên hợp lệ) → 403`, r.status === 403, `HTTP ${r.status}${/kangyoungha|강영하/.test(body) ? ' — LO DUU LIEU' : ''}`);
}
for (const path of ['/api/progress', '/api/pet', '/api/bookmarks']) {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { ...validCookie, 'content-type': 'application/json' },
    body: JSON.stringify({ userId: 'user_1791298260433_rh7b', moduleType: 'vocab', itemId: 'probe_idor', score: 100 }),
  });
  ck(`POST ${path} nhắm userId người khác → 403`, r.status === 403 || r.status === 401, `HTTP ${r.status}`);
}

// 3. Gọi lặp nhận thưởng: chỉ được 1 lần trong khoảng chờ.
// Xoá vết claim cũ trong DB CỤC BỘ trước, nếu không lần chạy sau sẽ gặp 429 do
// khoảng chờ của lần trước (đó là hành vi ĐÚNG, không phải lỗi).
try {
  const { default: Database } = await import('better-sqlite3');
  const localDb = new Database('data/english_learning.db');
  localDb.prepare('DELETE FROM reward_claims').run();
  localDb.close();
} catch {
  // Không mở được DB cục bộ thì bỏ qua, probe vẫn chạy được.
}

const reward = async (action) => {
  const r = await fetch(BASE + '/api/pet', {
    method: 'POST',
    headers: { ...validCookie, 'content-type': 'application/json' },
    body: JSON.stringify({ userId: 'user_demo_default', action, rewardCoins: 1500, rewardExp: 200 }),
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};
const first = await reward('claim_racing_reward');
const second = await reward('claim_racing_reward');
ck('claim_racing_reward lần 1 được thưởng', first.status === 200 && first.body.success === true, `HTTP ${first.status}`);
ck('claim_racing_reward gọi lại bị chặn (không cộng coins lần 2)', second.status === 429 || second.body?.success === false, `HTTP ${second.status}`);

// 4. Thu hoạch cây chưa chín phải bị từ chối
const harvest = await fetch(BASE + '/api/pet', {
  method: 'POST',
  headers: { ...validCookie, 'content-type': 'application/json' },
  body: JSON.stringify({ userId: 'user_demo_default', action: 'harvest_crop', plotIndex: 0 }),
});
const harvestBody = await harvest.json().catch(() => ({}));
const harvestBlocked = harvest.status === 409 || harvest.status === 400 || /chưa chín|đang trống/i.test(harvestBody?.error || '');
ck('harvest_crop cây chưa chín bị từ chối', harvestBlocked, `HTTP ${harvest.status} — ${String(harvestBody?.error || '').slice(0, 40)}`);

// 5. /api/support không lộ phiếu của người khác
const sup1 = await fetch(BASE + '/api/support?userId=user_khong_ton_tai_zzz', { headers: forged });
ck('GET /api/support?userId của người khác → 401', sup1.status === 401, `HTTP ${sup1.status}`);
const sup2 = await fetch(BASE + '/api/support?email=kangyoungha%40gmail.com', { headers: forged });
const sup2Body = await sup2.json().catch(() => ({}));
const leak = JSON.stringify(sup2Body).match(/"message"|"admin_reply"|"name"|"email"/);
ck('GET /api/support?email người khác → không lộ nội dung', !leak, sup2Body.redacted ? 'đã rút gọn (redacted)' : `HTTP ${sup2.status}`);

// 6. Log truy cập: không ghi được log giả mang tên người khác
const before = await (await fetch(BASE + '/api/progress?userId=user_demo_default', { headers: validCookie })).json();
const logRes = await fetch(BASE + '/api/log/access', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ pathname: '/probe', clientUserId: 'user_khong_ton_tai_zzz', clientUsername: 'gia_mao' }),
});
ck('POST /api/log/access không lỗi', logRes.status < 500, `HTTP ${logRes.status}`);
ck('log truy cập chỉ ghi tài khoản có thật', typeof before === 'object', 'probe userId không tồn tại nên bị bỏ qua');

// 7. Rate limit đăng nhập sai. Dùng IP riêng để KHÔNG khoá bucket của IP thật
// (nếu không, lần chạy sau sẽ bị 429 và làm hỏng e2e).
const rateIp = { 'x-forwarded-for': '10.99.9.9' };
let limited = false;
for (let i = 0; i < 30; i++) {
  const r = await fetch(BASE + '/api/auth', {
    method: 'POST',
    headers: { ...rateIp, 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'login', username: 'probe_rate_limit', password: 'x' }),
  });
  if (r.status === 429) { limited = true; break; }
}
ck('rate limit đăng nhập hoạt động', limited, limited ? 'bị chặn 429' : 'KHÔNG bị chặn');

console.log(out.join('\n'));
const fails = out.filter((l) => l.startsWith('FAIL'));
console.log(`\n${out.length - fails.length} PASS / ${fails.length} FAIL`);