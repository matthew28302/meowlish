// Probe xác minh lần 3 (đợt audit 2026-10-18): chạy lại đúng các đòn tấn công đã
// xác nhận trong đợt audit thứ 3, trên dev server CỤC BỘ.
//
// Nguyên tắc:
//  - Chỉ ĐỌC dữ liệu thật; mọi dữ liệu tạo ra đều mang tiền tố probe_sec_/TK-SEC
//    và được DỌN SẠCH trước khi script kết thúc (kể cả khi có lỗi giữa chừng).
//  - KHÔNG in mật khẩu/hash/token. Không đụng tài khoản thật (trừ tài khoản demo
//    dùng chung để lấy phiên).
const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const out = [];
const ck = (label, pass, extra = '') => out.push(`${pass ? 'PASS' : 'FAIL'} ${label}${extra ? ' — ' + extra : ''}`);

// Mỗi request dùng một IP riêng để không đụng bucket rate limit của người thật
// (và cũng để không tự khoá lẫn nhau giữa các probe). Octet thứ 2 đổi NGẪU NHIÊN
// mỗi lần chạy: dãy IP cố định sẽ bị hạn mức 6 lượt/10 phút của auth_resend tích
// luỹ qua nhiều lần chạy và làm probe tự báo 429 oan.
const runTag = Math.floor(Math.random() * 200) + 20;
let ipCounter = 0;
const withIp = (headers = {}) => ({ ...headers, 'x-forwarded-for': `10.${runTag}.0.${(ipCounter += 1)}` });

// Mẫu bí mật đặt trong phiếu test: nếu lọt ra khỏi API nghĩa là rò rỉ PII.
const LEAK_MARKER = 'PROBE_LEAK_MARKER_9c1f';

// ---- Chuẩn bị DB cục bộ: dữ liệu TEST + hàm dọn dẹp ----
const Database = (await import('better-sqlite3')).default;
const db = new Database('data/english_learning.db');
const cleanups = [];
const cleanupAll = () => {
  for (const fn of cleanups.splice(0).reverse()) {
    try {
      fn();
    } catch {
      /* dọn dẹp là best-effort */
    }
  }
};

// Tài khoản demo: nguồn phiên hợp lệ dùng chung (mật khẩu công khai 123456).
const DEMO_ID = 'user_demo_default';
const demoRow = db.prepare('SELECT * FROM users WHERE id = ?').get(DEMO_ID);

/** better-sqlite3 không bind boolean → ép về 0/1. */
const bind = (v) => (typeof v === 'boolean' ? (v ? 1 : 0) : v);

/** Tạo tài khoản test bằng cách sao chép dòng demo (cùng hash mật khẩu 123456). */
function createProbeUser(suffix, overrides = {}) {
  const id = `probe_sec_${suffix}`;
  const row = {
    ...demoRow,
    id,
    username: `probe_sec_${suffix}`,
    email: null,
    display_name: `Probe Security ${suffix}`,
    status: 'active',
    role: 'user',
    two_factor_enabled: 0,
    email_verified: 1,
    ...overrides,
  };
  const cols = Object.keys(row);
  db.prepare(`INSERT INTO users (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).run(
    ...cols.map((c) => bind(row[c]))
  );
  cleanups.push(() => db.prepare('DELETE FROM users WHERE id = ?').run(id));
  return id;
}

const login = async (username, password) => {
  const r = await fetch(BASE + '/api/auth', {
    method: 'POST',
    headers: withIp({ 'content-type': 'application/json' }),
    body: JSON.stringify({ action: 'login', username, password }),
  });
  const setCookie = r.headers.get('set-cookie') || '';
  return { status: r.status, cookie: setCookie.split(';')[0] };
};

try {
  if (!demoRow) {
    console.log('FAIL Không tìm thấy tài khoản demo trong DB cục bộ — không chạy được probe.');
    process.exitCode = 1;
  } else {
    const demoLogin = await login('demo', '123456');
    const demoSession = withIp({ cookie: demoLogin.cookie });
    ck(
      'demo đăng nhập được',
      demoLogin.status === 200 && demoLogin.cookie.startsWith('meowlish_user_session='),
      `HTTP ${demoLogin.status}`
    );

    // =======================================================================
    // 1. Rò rỉ PII phiếu hỗ trợ của KHÁCH do enum mã phiếu (đo 2026-10-18)
    //
    // Trước khi vá: bất kỳ tài khoản nào tra ?ticketId=<mã đoán được> của phiếu
    // do khách (user_id NULL) tạo đều nhận đầy đủ tên/email/nội dung/trả lời admin.
    // =======================================================================
    const ticketTag = String(Date.now()).slice(-4);
    const guestTicketId = `TK-SEC${ticketTag}A`;
    db.prepare(`
      INSERT INTO support_messages (id, name, email, user_id, category, priority, subject, message, rating, status, admin_reply)
      VALUES (?, ?, ?, NULL, 'bug', 'high', ?, ?, 5, 'new', ?)
    `).run(
      guestTicketId,
      `Khach ${LEAK_MARKER}`,
      'probe_sec_guest@example.com',
      `Su co ${LEAK_MARKER}`,
      `Noi dung khieu nai ${LEAK_MARKER}`,
      `Tra loi admin ${LEAK_MARKER}`
    );
    cleanups.push(() => db.prepare('DELETE FROM support_messages WHERE id = ?').run(guestTicketId));

    const guestLeak = await fetch(`${BASE}/api/support?ticketId=${encodeURIComponent(guestTicketId)}`, {
      headers: demoSession,
    });
    const guestBody = await guestLeak.text();
    ck(
      'tài khoản đăng nhập KHÔNG đọc được nội dung phiếu của khách (chỉ metadata)',
      guestLeak.status === 200 && !guestBody.includes(LEAK_MARKER) && guestBody.includes('"redacted":true'),
      `HTTP ${guestLeak.status}`
    );
    ck(
      'phiếu của khách không trả email/nội dung cho tài khoản khác',
      !/"email"\s*:/.test(guestBody) && !/"message"\s*:/.test(guestBody) && !/"admin_reply"\s*:/.test(guestBody)
    );

    // Đối chứng (positive control): phiếu gắn ĐÚNG tài khoản demo vẫn xem được đầy đủ.
    const ownTicketId = `TK-SEC${ticketTag}B`;
    db.prepare(`
      INSERT INTO support_messages (id, name, email, user_id, category, priority, subject, message, rating, status)
      VALUES (?, 'Chu phieu', 'probe_sec_owner@example.com', ?, 'bug', 'high', ?, ?, 5, 'new')
    `).run(ownTicketId, DEMO_ID, 'Phieu cua chinh minh', `Noi dung cua chinh minh ${LEAK_MARKER}`);
    cleanups.push(() => db.prepare('DELETE FROM support_messages WHERE id = ?').run(ownTicketId));

    const ownLookup = await fetch(`${BASE}/api/support?ticketId=${encodeURIComponent(ownTicketId)}`, {
      headers: demoSession,
    });
    const ownBody = await ownLookup.text();
    ck(
      'chủ phiếu vẫn tra cứu được đầy đủ phiếu của mình',
      ownLookup.status === 200 && ownBody.includes(LEAK_MARKER) && !ownBody.includes('"redacted":true'),
      `HTTP ${ownLookup.status}`
    );

    // Khách không phiên: vẫn chỉ metadata (giữ nguyên hành vi cũ).
    const guestAnon = await fetch(`${BASE}/api/support?ticketId=${encodeURIComponent(guestTicketId)}`);
    const guestAnonBody = await guestAnon.text();
    ck('khách không phiên tra mã phiếu cũng chỉ nhận metadata', !guestAnonBody.includes(LEAK_MARKER), `HTTP ${guestAnon.status}`);

    // =======================================================================
    // 2. Account enumeration qua /api/auth/forgot-password (đo 2026-10-18)
    //
    // Trước khi vá: tài khoản bị vô hiệu hóa trả 403 kèm thông báo riêng, lộ việc
    // tài khoản CÓ TỒN TẠI; tài khoản không tồn tại trả 200 với thông báo chung.
    // =======================================================================
    const disabledSuffix = `dis_${Date.now().toString(36)}`;
    const disabledUser = createProbeUser(disabledSuffix, {
      email: 'probe_sec_disabled@example.com',
      status: 'disabled',
    });
    const disabledName = `probe_sec_${disabledSuffix}`;

    const forgot = async (email) => {
      const r = await fetch(BASE + '/api/auth/forgot-password', {
        method: 'POST',
        headers: withIp({ 'content-type': 'application/json' }),
        body: JSON.stringify({ email }),
      });
      return { status: r.status, body: await r.json().catch(() => ({})) };
    };

    const forgotDisabled = await forgot(disabledName);
    const forgotGhost = await forgot(`probe_sec_khong_ton_tai_${Date.now()}@example.com`);
    ck(
      'forgot-password tài khoản bị vô hiệu hóa KHÔNG lộ trạng thái (không 403 "vô hiệu hóa")',
      forgotDisabled.status === 200 &&
        forgotDisabled.body?.success === true &&
        !/vô hiệu hóa/i.test(JSON.stringify(forgotDisabled.body)),
      `HTTP ${forgotDisabled.status}`
    );
    ck(
      'phản hồi giống hệt tài khoản không tồn tại (không enumeration)',
      forgotDisabled.status === forgotGhost.status && forgotDisabled.body?.message === forgotGhost.body?.message,
      `${forgotDisabled.status}/${forgotGhost.status}`
    );
    void disabledUser;

    // =======================================================================
    // 3. Ghi email lộn xộn qua request_email_verification (đo 2026-10-18)
    //
    // Trước khi vá: chỉ cần `includes('@') && includes('.')` ⇒ nhận cả danh sách
    // nhiều địa chỉ (dấu phẩy) / khoảng trắng ⇒ app gửi OTP tới địa chỉ bất kỳ.
    // =======================================================================
    const mailSuffix = `mail_${Date.now().toString(36)}`;
    const noEmailUser = createProbeUser(mailSuffix);
    const noEmailLogin = await login(`probe_sec_${mailSuffix}`, '123456');

    if (noEmailLogin.cookie.startsWith('meowlish_user_session=')) {
      const invalidEmails = [
        ['danh sách 2 địa chỉ', 'probe_sec_a@example.com,probe_sec_b@example.com'],
        ['có khoảng trắng', 'probe sec@example.com'],
        ['thiếu @', 'probe_sec_khong_hop_le'],
      ];
      for (const [label, bad] of invalidEmails) {
        const r = await fetch(BASE + '/api/auth', {
          method: 'POST',
          // IP riêng cho từng lượt: hạn mức auth_resend chỉ 6 lượt/10 phút/IP.
          headers: withIp({ cookie: noEmailLogin.cookie, 'content-type': 'application/json' }),
          body: JSON.stringify({ action: 'request_email_verification', userId: noEmailUser, email: bad }),
        });
        const b = await r.json().catch(() => ({}));
        ck(
          `request_email_verification từ chối email ${label}`,
          r.status === 400,
          `HTTP ${r.status} — ${String(b?.error || '').slice(0, 50)}`
        );
      }
      const stored = db.prepare('SELECT email FROM users WHERE id = ?').get(noEmailUser);
      ck('email lộn xộn KHÔNG được ghi vào DB', stored?.email == null, `email=${stored?.email ? '(đã ghi)' : 'NULL'}`);
    } else {
      console.log('SKIP  request_email_verification — không đăng nhập được tài khoản probe');
    }

    // =======================================================================
    // 4. GET /api/pet không có hạn mức (đo 2026-10-18)
    //
    // Endpoint đọc nặng (~15 truy vấn) cho cả khách chưa đăng nhập → trước đây
    // một vòng lặp vô hạn là đủ để đốt CPU/DB.
    // =======================================================================
    const floodIp = { 'x-forwarded-for': '10.55.250.250' };
    let petReadLimited = false;
    for (let i = 0; i < 125; i++) {
      const r = await fetch(`${BASE}/api/pet?userId=${DEMO_ID}`, { headers: floodIp });
      if (r.status === 429) {
        petReadLimited = true;
        break;
      }
    }
    ck(
      'GET /api/pet bị chặn khi gọi dồn dập (hạn mức đọc)',
      petReadLimited,
      petReadLimited ? 'bị chặn 429' : 'KHÔNG bị chặn sau 125 lượt'
    );

    // =======================================================================
    // 5. Không còn lộ chi tiết lỗi nội bộ qua các route đã vá
    // =======================================================================
    for (const path of ['/api/sync', '/api/sync?x=1']) {
      const r = await fetch(BASE + path, { headers: withIp() });
      const b = await r.json().catch(() => ({}));
      ck(
        `${path.split('?')[0]} không lộ chi tiết lỗi nội bộ (không phiên)`,
        !/SQLITE|better-sqlite3|ENOENT|NoSuchBucket|AccessDenied.*S3|at Object\./i.test(JSON.stringify(b)),
        `HTTP ${r.status}`
      );
    }

    // Body JSON hỏng: phải là 400 kèm thông điệp chung, KHÔNG phải 500 kèm lỗi
    // JSON.parse thô của V8 (đo trên production 2026-10-18:
    // {"error":"Expected property name or '}' in JSON at position 1 ..."}).
    for (const path of ['/api/auth/forgot-password', '/api/auth/reset-password']) {
      const r = await fetch(BASE + path, {
        method: 'POST',
        headers: withIp({ 'content-type': 'application/json' }),
        body: '{"email":',
      });
      const b = await r.json().catch(() => ({}));
      ck(
        `${path} body JSON hỏng trả 400 (không lộ lỗi parse)`,
        r.status === 400 && !/position|line \d+|JSON at|add double|Unexpected/i.test(String(b?.error || '')),
        `HTTP ${r.status} — ${String(b?.error || '').slice(0, 40)}`
      );
    }
  }
} finally {
  cleanupAll();
  db.close();
  console.log(out.join('\n'));
  const fails = out.filter((l) => l.startsWith('FAIL'));
  console.log(`\n${out.length - fails.length} PASS / ${fails.length} FAIL`);
  if (fails.length > 0) process.exitCode = 1;
}
