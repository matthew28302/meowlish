// Probe xác minh lần 2: chạy lại đúng các đòn tấn công đã thành công ở đợt
// audit trước, trên dev server CỤC BỘ. Chỉ đọc, không in bí mật.
const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
// userId nạn nhân, username và mẫu PII lấy từ môi trường — KHÔNG hardcode
// tên/email người dùng thật vào repo. Chưa cấu hình thì dùng sentinel bất khả
// trùng + regex rỗng ⇒ các phép so khớp trả false (probe báo "không lọt").
const VICTIM = process.env.PROBE_VICTIM_USER_ID || '__no_victim_configured__';
const VICTIM_USERNAME = process.env.PROBE_VICTIM_USERNAME || '__no_victim_configured__';
const LEAK_RE = new RegExp(process.env.PROBE_LEAK_PATTERN || '(?!x)x');
const out = [];
const ck = (label, pass, extra = '') => out.push(`${pass ? 'PASS' : 'FAIL'} ${label}${extra ? ' — ' + extra : ''}`);

let ipCounter = 0;
const withIp = (headers = {}) => ({ ...headers, 'x-forwarded-for': `10.77.0.${(ipCounter += 1)}` });

// Dọn hạn mức/claim cũ trong DB cục bộ để probe chạy lại được nhiều lần.
try {
  const { default: Database } = await import('better-sqlite3');
  const db = new Database('data/english_learning.db');
  db.prepare('DELETE FROM reward_claims').run();
  db.prepare('DELETE FROM progress_daily_budget').run();
  db.close();
} catch {}

// ---- Đăng nhập demo (luồng chính, được phép) ----
const login = await fetch(BASE + '/api/auth', {
  method: 'POST',
  headers: withIp({ 'content-type': 'application/json' }),
  body: JSON.stringify({ action: 'login', username: 'demo', password: '123456' }),
});
const setCookie = login.headers.get('set-cookie') || '';
const session = withIp({ cookie: setCookie.split(';')[0] });
ck('demo đăng nhập được', login.ok && session.cookie.startsWith('meowlish_user_session='), `HTTP ${login.status}`);

const noAuth = { cookie: 'meowlish_user_session=forged-token-not-a-real-signature' };

// ---- 1. Chiếm tài khoản qua xác thực email ----
const takeover = await fetch(BASE + '/api/auth', {
  method: 'POST',
  headers: { ...noAuth, 'content-type': 'application/json' },
  body: JSON.stringify({
    action: 'request_email_verification',
    userId: VICTIM,
    email: 'attacker@evil.example',
  }),
});
ck('ghi đè email tài khoản nạn nhân (không phiên) bị chặn',
  takeover.status === 401 || takeover.status === 403, `HTTP ${takeover.status}`);

const takeover2 = await fetch(BASE + '/api/auth', {
  method: 'POST',
  headers: { ...session, 'content-type': 'application/json' },
  body: JSON.stringify({
    action: 'request_email_verification',
    userId: VICTIM,
    email: 'attacker@evil.example',
  }),
});
ck('ghi đè email tài khoản KHÁC bằng phiên hợp lệ bị chặn',
  takeover2.status === 403 || takeover2.status === 401, `HTTP ${takeover2.status}`);

// ---- 2. Enumeration qua GET /api/auth ----
for (const [label, qs] of [['theo username', `username=${VICTIM_USERNAME}`], ['theo userId', `userId=${VICTIM}`]]) {
  const r = await fetch(`${BASE}/api/auth?${qs}`);
  ck(`GET /api/auth ${label} không phiên → chặn`, r.status === 401 || r.status === 400, `HTTP ${r.status}`);
}
const otherAcct = await fetch(`${BASE}/api/auth?userId=${VICTIM}`, { headers: session });
const otherBody = await otherAcct.text();
const leakProfile = LEAK_RE.test(otherBody);
ck('GET /api/auth xem tài khoản khác không lộ email/coins',
  !leakProfile, otherBody.includes('"limited":true') ? 'chỉ trả tối thiểu' : `HTTP ${otherAcct.status}`);
const ownAcct = await fetch(`${BASE}/api/auth?userId=user_demo_default`, { headers: session });
ck('GET /api/auth xem chính mình vẫn hoạt động', ownAcct.ok, `HTTP ${ownAcct.status}`);

// ---- 3. Cross-account verify_email ----
const crossVerify = await fetch(BASE + '/api/auth', {
  method: 'POST',
  headers: { ...session, 'content-type': 'application/json' },
  body: JSON.stringify({ action: 'verify_email', sessionId: 'khong-ton-tai', otp: '000000', userId: VICTIM }),
});
ck('verify_email nhắm tài khoản khác bị chặn',
  crossVerify.status === 403 || crossVerify.status === 400, `HTTP ${crossVerify.status}`);

// ---- 4. Cướp coins qua finish_battle_room ----
const petGet = await fetch(`${BASE}/api/pet?userId=user_demo_default`, { headers: session });
const petData = await petGet.json().catch(() => ({}));
const rooms = petData.activeRooms || [];
ck('GET /api/pet vẫn trả dữ liệu bình thường', petGet.ok && Array.isArray(rooms), `HTTP ${petGet.status}, ${rooms.length} phòng`);
if (rooms.length > 0) {
  const steal = await fetch(BASE + '/api/pet', {
    method: 'POST',
    headers: { ...session, 'content-type': 'application/json' },
    body: JSON.stringify({ userId: 'user_demo_default', action: 'finish_battle_room', roomId: rooms[0].id, winnerId: 'user_demo_default' }),
  });
  ck('finish_battle_room trên phòng không thuộc mình → chặn', steal.status === 403 || steal.status === 404, `HTTP ${steal.status}`);
}

// ---- 5. Farm coins qua /api/progress ----
// itemId duy nhất mỗi lần chạy, nếu không lần chạy sau sẽ gặp "đã hoàn thành"
// từ dữ liệu còn lại của lần trước và báo nhầm là lỗi.
const ITEM = `probe_item_${Date.now()}`;
const progressOnce = await fetch(BASE + '/api/progress', {
  method: 'POST',
  headers: { ...session, 'content-type': 'application/json' },
  body: JSON.stringify({ userId: 'user_demo_default', moduleType: 'vocab', itemId: ITEM, score: 90, expGained: 100, coinsGained: 50 }),
});
const p1 = await progressOnce.json().catch(() => ({}));
ck('POST /api/progress lần đầu được thưởng', progressOnce.ok && p1.alreadyCompleted !== true, `HTTP ${progressOnce.status}`);

let duplicates = 0;
for (let i = 0; i < 5; i++) {
  const r = await fetch(BASE + '/api/progress', {
    method: 'POST',
    headers: { ...session, 'content-type': 'application/json' },
    body: JSON.stringify({ userId: 'user_demo_default', moduleType: 'vocab', itemId: ITEM, score: 90, expGained: 100, coinsGained: 50 }),
  });
  const b = await r.json().catch(() => ({}));
  if (b.alreadyCompleted === true) duplicates++;
}
ck('gọi lại cùng item KHÔNG được thưởng lần nữa', duplicates === 5, `${duplicates}/5 bị chặn replay`);

// itemId mới liên tục: hạn mức ngày phải chặn việc cộng thưởng vô hạn.
// Kiểm tra THUỘC TÍNH (budgetReached && không cộng thưởng), KHÔNG kiểm mã HTTP:
// server cố ý trả 200 để không làm mất tiến độ học tập của người dùng.
let budgetBlocked = false;
let rewardedAfterCap = 0;
for (let i = 0; i < 40; i++) {
  const r = await fetch(BASE + '/api/progress', {
    method: 'POST',
    headers: { ...session, 'content-type': 'application/json' },
    body: JSON.stringify({ userId: 'user_demo_default', moduleType: 'vocab', itemId: `probe_bi_a_${i}_${Date.now()}`, score: 90, expGained: 100, coinsGained: 50 }),
  });
  const b = await r.json().catch(() => ({}));
  if (b.budgetReached) {
    budgetBlocked = true;
    if (b.rewarded === true || (b.awarded?.coins ?? 0) > 0) rewardedAfterCap++;
  }
}
ck('hạn mức thưởng ngày có hiệu lực (báo budgetReached)', budgetBlocked, budgetBlocked ? 'đã chạm trần' : 'KHÔNG chạm trần');
ck('sau khi chạm trần KHÔNG còn cộng thưởng', rewardedAfterCap === 0, `${rewardedAfterCap} lần bị cộng nhầm`);

// ---- 6. Mã phiếu hỗ trợ của người khác ----
const tk = await fetch(`${BASE}/api/support?ticketId=TK-XXXX`, { headers: noAuth });
const tkBody = await tk.text();
ck('tra cứu phiếu không phiên không lộ nội dung',
  !/"message"|"admin_reply"|"name"|"email"/.test(tkBody), `HTTP ${tk.status}`);

// ---- 7. Header bảo mật ----
const home = await fetch(BASE + '/');
const csp = home.headers.get('content-security-policy');
ck('có Content-Security-Policy', Boolean(csp), csp ? csp.slice(0, 46) + '…' : 'thiếu');
ck('CSP có frame-ancestors none', Boolean(csp && /frame-ancestors 'none'/.test(csp)));
ck('CSP có object-src none', Boolean(csp && /object-src 'none'/.test(csp)));
ck('có Cross-Origin-Opener-Policy', home.headers.get('cross-origin-opener-policy') === 'same-origin');
const apiRes = await fetch(`${BASE}/api/progress?userId=user_demo_default`, { headers: session });
const cc = apiRes.headers.get('cache-control') || '';
ck('API dữ liệu cá nhân không bị cache công khai',
  /private/.test(cc) && /no-store/.test(cc), cc);

// ---- 8. Token admin không còn nhận qua query string ----
for (const p of ['/api/admin/users?token=abc', '/api/admin/logs?adminSecret=abc']) {
  const r = await fetch(BASE + p);
  ck(`GET ${p.split('?')[0]} token qua query string bị từ chối`, r.status === 401, `HTTP ${r.status}`);
}

console.log(out.join('\n'));
const fails = out.filter((l) => l.startsWith('FAIL'));
console.log(`\n${out.length - fails.length} PASS / ${fails.length} FAIL`);