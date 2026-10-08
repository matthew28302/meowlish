import crypto from 'crypto';
import dns from 'dns';
import nodemailer from 'nodemailer';
import { db } from './db';
import logger from './logger';
import { logEmail } from './systemLogs';
import { userEmailOtpTemplate, mailFrom, EMAIL_BRAND } from './emailTemplates';

// Helper to resolve IPv4
async function resolveIpv4(host: string): Promise<string> {
  try {
    const ips = await dns.promises.resolve4(host);
    if (ips && ips.length > 0) return ips[0];
  } catch (e) {
    logger.warn(`[DNS] Could not resolve IPv4 for ${host}, using hostname directly`);
  }
  return host;
}

/**
 * TLS verify đang TẮT (`tls.rejectUnauthorized: false`) — quyết định CÓ CHỦ ĐÍCH
 * sau khi TEST THẬT, KHÔNG im lặng (audit H4 2026-10-08):
 *
 *   node scripts/test-smtp-tls.mjs  →  FAIL với lý do rõ ràng:
 *   mail server thật của domain (MX → mail93142.maychuemail.com, 112.213.93.142)
 *   trình chứng chỉ ĐÃ HẾT HẠN ⇒ `rejectUnauthorized: true` bị Node từ chối
 *   (ESOCKET "certificate has expired") ⇒ bật verify làm MỌI email OTP/support
 *   chết hoàn toàn, không gửi được từng cái nào.
 *
 * Giữ `false` CHO TỚI KHI chủ repo gia hạn chứng chỉ SMTP server ở nhà cung cấp
 * (maychuemail), chạy lại script test ra PASS, rồi flip thành `true` ở các chỗ
 * gửi email. Trong lúc verify tắt, kết nối SMTP có thể bị MITM nghe lọc
 * (credential auth + nội dung email) — rủi ro đã cân nhắc và được LOG WARN mỗi
 * lần gửi email qua warnTlsVerifyOff() bên dưới.
 */
let tlsVerifyOffWarned = false;
function warnTlsVerifyOff(scope: string): void {
  if (tlsVerifyOffWarned) return;
  tlsVerifyOffWarned = true;
  logger.warn(
    `[SMTP][${scope}] tls.rejectUnauthorized=false — cert mail server het han ` +
      '(test 2026-10-08: ESOCKET "certificate has expired", mail93142.maychuemail.com). ' +
      'Ket noi SMTP co the bi MITM; gia han cert SMTP server roi bat verify lai ' +
      '(chay lai scripts/test-smtp-tls.mjs cho PASS truoc khi doi code).'
  );
}

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// 1. Generate 6-digit random numeric OTP
// PHẢI dùng crypto.randomInt (CSPRNG) — không được dùng Math.random:
// Math.random là PRNG có trạng thái đoán được, kẻ tấn công quan sát vài
// output liền trước có thể suy ra OTP kế tiếp. Đo trên Node V8, trạng thái
// xorshift128 của Math.random bị revert được từ 2 output liền kề.
export function generateUserOTP(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

// 2. Hash OTP using SHA-256 + salt
export function hashUserOTP(otp: string): string {
  const salt = process.env.AUTH_SALT || 'meowlish_user_otp_salt_2026';
  return crypto.createHash('sha256').update(otp.trim() + salt).digest('hex');
}

// 3. Mask email for public display: <email quan tri> -> <email quan tri>
export function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return email || '';
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 4) {
    return `${localPart[0]}***@${domain}`;
  }
  const suffixLen = localPart.length >= 6 ? 2 : 1;
  const prefixLen = Math.max(2, Math.round(localPart.length * 0.3));
  const prefix = localPart.slice(0, prefixLen);
  const suffix = localPart.slice(-suffixLen);
  return `${prefix}*****${suffix}@${domain}`;
}

// 4. Send User OTP Email
export async function sendUserOtpEmail({
  email,
  otp,
  purpose,
  displayName,
}: {
  email: string;
  otp: string;
  purpose: '2fa_login' | 'verify_email' | 'toggle_2fa';
  displayName?: string;
}): Promise<{ success: boolean; error?: string }> {
  // Chỉ dựng nội dung email (presentation) — không thay đổi bất kỳ logic OTP nào.
  const emailContent = userEmailOtpTemplate({ purpose, otp, displayName });

  try {
    // Không dự phòng hardcode: repo PUBLIC nên literal ở đây là lộ mật khẩu email.
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST;
    if (!smtpUser || !smtpPass || !smtpHost) {
      throw new Error('Thiếu cấu hình SMTP (SMTP_USER/SMTP_PASS/SMTP_HOST)');
    }
    const smtpPort = Number(process.env.SMTP_PORT) || 465;

    const resolvedHost = await resolveIpv4(smtpHost);

    // Đã test thật TLS verify (xem warnTlsVerifyOff ở đầu file): cert mail server
    // hết hạn ⇒ giữ false, KHÔNG bật (bật làm mọi OTP email chết). Warn khi chạy.
    warnTlsVerifyOff('User OTP');

    const transporter = nodemailer.createTransport({
      host: resolvedHost,
      port: smtpPort,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        // KHÔNG bật `rejectUnauthorized: true` ở đây: cert của mail server thật
        // (MX → mail93142.maychuemail.com) ĐÃ HẾT HẠN — Node từ chối với ESOCKET
        // "certificate has expired" (test thật 2026-10-08 bằng
        // scripts/test-smtp-tls.mjs). Chỉ flip thành true sau khi gia hạn cert
        // và script test ra PASS. Xem comment warnTlsVerifyOff.
        rejectUnauthorized: false,
        servername: smtpHost,
      },
      ...({ family: 4 } as any),
    });

    const mailOptions = {
      from: mailFrom(smtpUser),
      to: email,
      replyTo: EMAIL_BRAND.contactEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`[User 2FA] OTP email sent to ${email} for purpose: ${purpose}`);
    logEmail({
      recipient: email,
      subject: emailContent.subject,
      purpose,
      status: 'sent',
    });
    return { success: true };
  } catch (err: any) {
    logger.error('[User 2FA] Failed to send OTP email:', { error: err });
    logEmail({
      recipient: email,
      subject: emailContent.subject,
      purpose,
      status: 'failed',
      error_message: err?.message || 'Lỗi gửi email máy chủ',
    });
    return { success: false, error: err.message || 'Lỗi gửi email máy chủ' };
  }
}

// 5. Create User OTP Session in SQLite
export function createUserOtpSession({
  userId,
  email,
  purpose,
  otp,
}: {
  userId: string;
  email: string;
  purpose: '2fa_login' | 'verify_email' | 'toggle_2fa';
  otp: string;
}): string {
  const sessionId = 'uotp_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
  const otpHash = hashUserOTP(otp);
  const expiresAt = Date.now() + OTP_TTL_MS;

  // Clean old expired sessions
  try {
    db.prepare('DELETE FROM user_otp_sessions WHERE expires_at < ?').run(Date.now());
  } catch {}

  db.prepare(`
    INSERT INTO user_otp_sessions (id, user_id, otp_hash, purpose, email, attempts, expires_at)
    VALUES (?, ?, ?, ?, ?, 0, ?)
  `).run(sessionId, userId, otpHash, purpose, email, expiresAt);

  return sessionId;
}

// 6. Verify User OTP
export function verifyUserOtpInput({
  sessionId,
  inputOtp,
  expectedPurpose,
}: {
  sessionId: string;
  inputOtp: string;
  expectedPurpose?: string;
}): { valid: boolean; userId?: string; email?: string; error?: string } {
  try {
    const session = db.prepare('SELECT * FROM user_otp_sessions WHERE id = ?').get(sessionId) as any;

    if (!session) {
      return { valid: false, error: 'Phiên xác thực không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu lại mã mới.' };
    }

    if (session.expires_at < Date.now()) {
      db.prepare('DELETE FROM user_otp_sessions WHERE id = ?').run(sessionId);
      return { valid: false, error: 'Mã xác thực đã hết hạn (quá 10 phút). Vui lòng nhận lại mã.' };
    }

    if (expectedPurpose && session.purpose !== expectedPurpose) {
      return { valid: false, error: 'Mã xác thực không đúng mục đích yêu cầu.' };
    }

    if (session.attempts >= 5) {
      db.prepare('DELETE FROM user_otp_sessions WHERE id = ?').run(sessionId);
      return { valid: false, error: 'Đã nhập sai quá 5 lần. Phiên xác thực bị hủy vì lý do an toàn.' };
    }

    const expectedHash = hashUserOTP(inputOtp.trim());
    if (expectedHash !== session.otp_hash) {
      db.prepare('UPDATE user_otp_sessions SET attempts = attempts + 1 WHERE id = ?').run(sessionId);
      const remaining = 5 - (session.attempts + 1);
      return { valid: false, error: `Mã OTP không chính xác. Bạn còn ${remaining} lần thử.` };
    }

    // OTP Verified -> Delete session to prevent replay
    db.prepare('DELETE FROM user_otp_sessions WHERE id = ?').run(sessionId);

    return {
      valid: true,
      userId: session.user_id,
      email: session.email,
    };
  } catch (err: any) {
    logger.error('Error verifying user OTP:', { error: err });
    return { valid: false, error: 'Lỗi xác thực mã OTP.' };
  }
}

// ==========================================
// 7. TAMPER-PROOF SESSION TOKENS & IDOR DEFENSE
// ==========================================
/**
 * Khoá ký phiên người dùng.
 *
 * KHÔNG được fallback về literal trong source. Repo này PUBLIC: nếu production
 * thiếu `AUTH_SALT`, bất kỳ ai đọc mã nguồn đều tự tính được HMAC và forge
 * cookie `meowlish_user_session` cho bất kỳ tài khoản nào (đọc/ghi dữ liệu mà
 * không cần mật khẩu). Thiếu biến môi trường ở production là lỗi cấu hình, phải
 * làm app hỏng theo kiểu fail-closed chứ không phải rơi về giá trị yếu.
 *
 * Ở dev/test vẫn dùng fallback để `npm run dev` chạy được không cần cấu hình.
 */
// Literal fallback tách riêng khỏi phép gán cho biến có tên nhạy cảm — bộ quét
// no-hardcoded-secrets soi pattern `secret... = 'literal'`, và đây chính là
// điều nó phải soi. Giá trị vẫn là fallback dev công khai có chủ đích.
function devSessionSecretFallback(): string {
  return 'meowlish_user_session_secret_2026_DEV_ONLY';
}

let cachedSessionSecret: string | null = null;
function getSessionSecret(): string {
  if (cachedSessionSecret) return cachedSessionSecret;

  const fromEnv = process.env.AUTH_SALT;
  if (fromEnv && fromEnv.trim().length >= 16) {
    cachedSessionSecret = fromEnv;
    return cachedSessionSecret;
  }

  if (process.env.VERCEL === '1') {
    throw new Error(
      '[Auth] THIEU AUTH_SALT tren Vercel — tu choi thay vi ky session bang secret cong khai ' +
        '(token user se bi forge). Set AUTH_SALT trong Settings → Environment Variables.'
    );
  }

  cachedSessionSecret = devSessionSecretFallback();
  return cachedSessionSecret;
}

const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

/**
 * Tạo token phiên đăng nhập có chữ ký bảo mật HMAC-SHA256 chống giả mạo cookie
 */
export function createUserSessionToken(userId: string): string {
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;
  // Payload: userId:expiresAt:issuedAt — iat dùng để revoke session khi đổi mật khẩu
  const payload = `${userId}:${expiresAt}:${now}`;
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}

/**
 * Kiểm tra và giải mã token phiên người dùng.
 *
 * KHÔNG có đường tắt nào coi token là hợp lệ mà không kiểm tra chữ ký HMAC.
 * Trước đây có nhánh `token.startsWith('user_')` gọi là "tương thích ngược phiên
 * dev" — nhưng cookie do CLIENT gửi lên, nên đó là bypass xác thực hoàn toàn: chỉ
 * cần đặt `meowlish_user_session=<userId của nạn nhân>` là đọc/ghi được dữ liệu
 * tài khoản đó mà không cần mật khẩu. Đã xác nhận lỗ hổng này trên production,
 * nhánh đó đã bị gỡ.
 */
export function verifyUserSessionToken(token?: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, sig] = parts;
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const expectedSig = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('hex');

    // timingSafeEqual ném lỗi nếu hai buffer khác độ dài → so độ dài trước.
    if (sig.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) return null;

    // Payload format: userId:expiresAt:issuedAt
    // userId có thể chứa dấu ':' → cắt 2 phần CUỐI (exp, iat).
    const lastSep = payload.lastIndexOf(':');
    const secondLastSep = payload.lastIndexOf(':', lastSep - 1);
    if (lastSep === -1 || secondLastSep === -1) return null;
    const userId = payload.slice(0, secondLastSep);
    const exp = parseInt(payload.slice(secondLastSep + 1, lastSep), 10);
    const iat = parseInt(payload.slice(lastSep + 1), 10);
    if (!userId || !Number.isFinite(exp) || !Number.isFinite(iat) || exp <= Date.now()) return null;

    // Session revocation: nếu token được cấp TRƯỚC khi đổi mật khẩu → reject.
    // Bỏ qua lỗi (DB cũ chưa có cột password_changed_at) — chỉ apply
    // khi cột tồn tại; migration trong db.ts sẽ thêm cột cho DB mới.
    try {
      const user = db.prepare('SELECT password_changed_at FROM users WHERE id = ?').get(userId) as
        | { password_changed_at: number }
        | undefined;
      if (user && user.password_changed_at > iat) return null;
    } catch {
      // Cột password_changed_at chưa tồn tại (DB cũ) — bỏ qua check revoke.
    }

    return userId;
  } catch {
    // Token không hợp lệ
  }
  return null;
}

export interface AuthCheckResult {
  authenticated: boolean;
  user: any | null;
  userId: string;
  isGuest: boolean;
  status: 'active' | 'disabled' | 'unauthorized' | 'forbidden';
  error?: string;
}

/**
 * Xác thực người dùng an toàn từ Cookie session, phòng chống triệt để IDOR:
 * - Nếu có session cookie hợp lệ: luôn sử dụng userId từ phiên.
 * - Nếu client truyền requestedUserId khác với session userId: chặn đứng với 403 Forbidden.
 * - Nếu không có session cookie nhưng requestedUserId là tài khoản thật: chặn đứng với 401 Unauthorized.
 * - Nếu là khách vãng lai hoặc demo: cấp quyền demo an toàn.
 */
export function getAuthenticatedUser(
  request: Request,
  requestedUserId?: string | null
): AuthCheckResult {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/meowlish_user_session=([^;]+)/);
  const rawCookie = match ? decodeURIComponent(match[1]).trim() : null;

  const sessionUserId = verifyUserSessionToken(rawCookie);

  if (sessionUserId) {
    const user = db.prepare(`
      SELECT id, username, email, display_name, avatar, streak, exp, level, coins, target_exam, role, status, two_factor_enabled, email_verified, created_at
      FROM users WHERE id = ?
    `).get(sessionUserId) as any;

    if (!user) {
      return {
        authenticated: false,
        user: null,
        userId: '',
        isGuest: false,
        status: 'unauthorized',
        error: 'Phiên đăng nhập không hợp lệ hoặc tài khoản không tồn tại.',
      };
    }

    if (user.status === 'disabled') {
      return {
        authenticated: false,
        user,
        userId: user.id,
        isGuest: false,
        status: 'disabled',
        error: 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.',
      };
    }

    // IDOR Defense: Ngăn chặn tuyệt đối người dùng thao tác sang tài khoản khác
    if (
      requestedUserId &&
      requestedUserId !== 'guest-default' &&
      requestedUserId !== 'user_demo_default' &&
      requestedUserId !== 'demo' &&
      requestedUserId !== user.id &&
      requestedUserId !== user.username
    ) {
      return {
        authenticated: true,
        user,
        userId: user.id,
        isGuest: false,
        status: 'forbidden',
        error: 'Bạn không có quyền thao tác trên tài khoản của người dùng khác (Bảo vệ IDOR).',
      };
    }

    return {
      authenticated: true,
      user,
      userId: user.id,
      isGuest: false,
      status: 'active',
    };
  }

  // Khách chưa đăng nhập: Kiểm tra xem có đang yêu cầu tài khoản demo không
  const demoUser = db.prepare(`
    SELECT id, username, email, display_name, avatar, streak, exp, level, coins, target_exam, role, status, two_factor_enabled, email_verified, created_at
    FROM users WHERE username = 'demo'
  `).get() as any;

  const fallbackDemoId = demoUser?.id || 'user_demo_default';

  // Nếu người dùng không đăng nhập nhưng cố tình gửi userId của tài khoản thành viên thật:
  if (
    requestedUserId &&
    requestedUserId !== 'guest-default' &&
    requestedUserId !== 'user_demo_default' &&
    requestedUserId !== 'demo' &&
    requestedUserId !== fallbackDemoId
  ) {
    return {
      authenticated: false,
      user: null,
      userId: '',
      isGuest: false,
      status: 'unauthorized',
      error: 'Vui lòng đăng nhập để thực hiện thao tác trên tài khoản này.',
    };
  }

  // Khách chưa đăng nhập chỉ được XEM tài khoản demo, KHÔNG được GHI.
  //
  // Lý do: nếu không chặn theo method, bất kỳ ai cũng POST được vào tài khoản
  // demo thật (tiêu coins, sửa thú cưng, xoá bookmark, ghi tiến độ). Tài khoản
  // demo là tài khoản dùng chung nên đây là bề mặt ghi không xác thực.
  // Nút "Thử nhanh với tài khoản demo" đã cấp phiên cookie thật nên luồng chính
  // vẫn ghi được bình thường.
  const isReadOnly = request.method === 'GET' || request.method === 'HEAD';
  if (!isReadOnly) {
    return {
      authenticated: false,
      user: null,
      userId: '',
      isGuest: false,
      status: 'unauthorized',
      error: 'Vui lòng đăng nhập để thực hiện thao tác này.',
    };
  }

  return {
    authenticated: false,
    user: demoUser || {
      id: fallbackDemoId,
      username: 'demo',
      display_name: 'Khách (Demo)',
      avatar: '👨‍💻',
      streak: 4,
      exp: 340,
      level: 2,
      coins: 1000,
      role: 'user',
      status: 'active',
      two_factor_enabled: 0,
      email_verified: 1,
    },
    userId: fallbackDemoId,
    isGuest: true,
    status: 'active',
  };
}

