import crypto from 'crypto';
import dns from 'dns';
import nodemailer from 'nodemailer';
import { db, hashPassword } from './db';
import logger from './logger';
import { logEmail } from './systemLogs';
import { adminOtpTemplate, mailFrom, EMAIL_BRAND } from './emailTemplates';

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
 *   (ESOCKET "certificate has expired") ⇒ bật verify làm MỌI email OTP admin
 *   chết hoàn toàn, quản trị viên không đăng nhập được.
 *
 * Giữ `false` CHO TỚI KHI chủ repo gia hạn chứng chỉ SMTP server ở nhà cung cấp
 * (maychuemail), chạy lại script test ra PASS, rồi flip thành `true` ở các chỗ
 * gửi email. Rủi ro MITM trong lúc verify tắt được LOG WARN mỗi lần gửi email
 * qua warnTlsVerifyOff() bên dưới.
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

/**
 * Email nhận OTP quản trị.
 *
 * Thứ tự ưu tiên:
 *   1. `ADMIN_EMAIL` từ biến môi trường.
 *   2. Email của chính tài khoản `admin` trong bảng `users`.
 *   3. Không có ⇒ ném lỗi rõ ràng.
 *
 * Vì sao không chỉ dựa vào biến môi trường: bản đầu tiên chỉ đọc `ADMIN_EMAIL`
 * và fail-closed, nên nếu Vercel chưa có biến đó thì bước gửi OTP ném lỗi và
 * **quản trị viên không đăng nhập được dù mật khẩu đúng** — đúng triệu chứng
 * đang gặp. Đọc thêm từ DB để hệ thống tự chạy được mà không cần cấu hình thủ
 * công, đồng thời email vẫn không nằm trong mã nguồn công khai.
 */
export function getAdminEmail(): string {
  const fromEnv = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (fromEnv) return fromEnv;

  try {
    const row = db.prepare("SELECT email FROM users WHERE username = 'admin'").get() as
      | { email?: string | null }
      | undefined;
    const fromDb = (row?.email || '').trim().toLowerCase();
    if (fromDb) return fromDb;
  } catch (err) {
    logger.warn('[Admin Auth] Khong doc duoc email admin tu DB:', { error: err });
  }

  throw new Error(
    'Chua cau hinh email nhan OTP quan tri: thieu bien moi truong ADMIN_EMAIL ' +
      'va tai khoan admin chua co email trong CSDL.'
  );
}

/**
 * Bản email đã che, chỉ dùng để hiển thị trong giao diện quản trị.
 * Lấy từ biến môi trường; KHÔNG để literal trong source vì dù đã che thì
 * địa chỉ dạng `a***b@gmail.com` vẫn là dữ liệu định danh trong repo public.
 */
export const ADMIN_MASKED_EMAIL = process.env.ADMIN_MASKED_EMAIL || 'a*********@***.com';

/**
 * Khoá mã hoá token admin (AES-256-GCM).
 * Fail-closed ở production: nếu thiếu `AUTH_SALT`, kẻ tấn công đọc mã nguồn
 * công khai sẽ tự mã hoá được token `role: 'admin'` ⇒ toàn quyền quản trị.
 */
/**
 * Khóa mã hóa token admin — LAZY, tính ở LẦN DÙNG ĐẦU chứ không phải lúc
 * module-load.
 *
 * Tại sao lazy: `vercel build` cũng chạy với NODE_ENV=production và có thể
 * đánh giá module mà chưa có env ⇒ throw ở module-load làm gãy build (đã
 * từng xảy ra, commit 0fb7901 phải gỡ). Lazy thì build không bao giờ chạm,
 * còn request thật trên Vercel mà thiếu AUTH_SALT thì PHẢI chết — chạy
 * tiếp nghĩa là ký token bằng secret công khai trong repo, ai cũng giả được
 * admin (đã tái hiện được trong pentest 2026-10-08).
 */
let cachedEncryptionKey: Buffer | null = null;
function getEncryptionKey(): Buffer {
  if (cachedEncryptionKey) return cachedEncryptionKey;

  const fromEnv = process.env.AUTH_SALT;
  if (fromEnv && fromEnv.trim().length >= 16) {
    cachedEncryptionKey = crypto.createHash('sha256').update(fromEnv).digest();
    return cachedEncryptionKey;
  }

  // Fail-closed THẬT: runtime trên Vercel mà thiếu AUTH_SALT là lỗi cấu hình,
  // không được rơi về secret công khai.
  if (process.env.VERCEL === '1') {
    throw new Error(
      '[Admin Security] THIEU AUTH_SALT tren Vercel — tu choi thay vi dung secret cong khai. ' +
        'Set AUTH_SALT >= 16 ky tu trong Settings → Environment Variables.'
    );
  }

  // Chỉ còn dev local mới được dùng fallback.
  cachedEncryptionKey = crypto.createHash('sha256').update('meowlish_admin_super_secret_salt_2026_DEV_ONLY').digest();
  return cachedEncryptionKey;
}
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Ensure admin_otp_sessions table exists in SQLite
export function ensureAdminTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_otp_sessions (
      id TEXT PRIMARY KEY,
      otp_hash TEXT NOT NULL,
      email TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      expires_at INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// 1. Generate 6-digit random OTP
// crypto.randomInt = CSPRNG; Math.random bị đoán được (xem ghi chú generateUserOTP).
export function generateOTP(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

// 2. Hash OTP using SHA-256 + salt to ensure OTP is NEVER stored in plain text
export function hashOTP(otp: string): string {
  const salt = 'meowlish_admin_otp_salt_2026';
  return crypto.createHash('sha256').update(otp + salt).digest('hex');
}

// 3. Encrypt admin session token using AES-256-GCM (Tamper-proof & encrypted in-transit)
export function createEncryptedAdminToken(username: string = 'admin'): string {
  // pwdAt = password_changed_at của admin user LÚC TẠO TOKEN (audit M4 2026-10-08).
  // Khi verify, nếu giá trị này nhỏ hơn password_changed_at hiện tại trong DB
  // (admin đã đổi mật khẩu SAU khi token được cấp) ⇒ token cũ bị từ chối dù chưa
  // hết hạn TTL 2h. Query lỗi (DB cũ chưa có cột) ⇒ pwdAt=0, check revoke bỏ qua.
  let pwdAt = 0;
  try {
    const pwdRow = db
      .prepare('SELECT password_changed_at FROM users WHERE username = ?')
      .get(username) as { password_changed_at?: number | null } | undefined;
    if (pwdRow && typeof pwdRow.password_changed_at === 'number') {
      pwdAt = pwdRow.password_changed_at;
    }
  } catch {
    // Cột password_changed_at chưa tồn tại (DB cũ) — pwdAt=0, verify bỏ qua revoke.
  }

  const payload = JSON.stringify({
    username,
    role: 'admin',
    email: getAdminEmail(),
    nonce: crypto.randomBytes(8).toString('hex'),
    exp: Date.now() + TOKEN_TTL_MS,
    pwdAt, // thêm field vào payload JSON là OK: AES-GCM giải mã được; token cũ không có pwdAt ⇒ coi 0
  });

  const iv = crypto.randomBytes(12); // 12 bytes IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

// 4. Decrypt and verify admin session token
export function verifyAdminToken(token: string | null | undefined): boolean {
  if (!token) return false;

  try {
    const parts = token.split(':');
    if (parts.length !== 3) return false;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const payload = JSON.parse(decrypted);

    // Verify expiration and role
    if (!payload || payload.role !== 'admin' || payload.exp < Date.now()) {
      return false;
    }

    // Revoke khi admin đổi mật khẩu (audit M4 2026-10-08): pwdAt trong payload
    // (token cũ không có field này ⇒ coi 0) phải >= password_changed_at hiện tại
    // của admin user trong DB. Nếu admin đã đổi MK sau khi token được cấp ⇒ token
    // cũ bị từ chối dù chưa hết hạn TTL 2h. Nếu user chưa từng đổi MK
    // (password_changed_at = 0) hoặc DB cũ chưa có cột ⇒ bỏ qua check.
    try {
      const pwdRow = db
        .prepare('SELECT password_changed_at FROM users WHERE username = ?')
        .get(String(payload.username ?? '')) as
        | { password_changed_at?: number | null }
        | undefined;
      const currentPwdAt =
        pwdRow && typeof pwdRow.password_changed_at === 'number' ? pwdRow.password_changed_at : 0;
      if (currentPwdAt > 0) {
        const tokenPwdAt = typeof payload.pwdAt === 'number' ? payload.pwdAt : 0;
        if (tokenPwdAt < currentPwdAt) {
          logger.warn('[Admin Security] Token rejected: password changed after token was issued');
          return false;
        }
      }
    } catch {
      // Cột password_changed_at chưa tồn tại (DB cũ) — bỏ qua check revoke.
    }

    return true;
  } catch (err) {
    logger.warn('[Admin Security] Invalid or tampered token:', { error: err });
    return false;
  }
}

// 5. Send secure 2FA OTP Email to <email quan tri>
export async function sendAdminOtpEmail(otp: string): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  // Chỉ dựng nội dung email (presentation) — không thay đổi logic OTP.
  const emailContent = adminOtpTemplate({
    otp,
    expiresInMinutes: Math.round(OTP_TTL_MS / 60000),
    maxAttempts: 3,
    sentAt: now,
  });

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
    // hết hạn ⇒ giữ false, KHÔNG bật (bật làm OTP admin không gửi được). Warn khi chạy.
    warnTlsVerifyOff('Admin OTP');

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
      to: getAdminEmail(),
      replyTo: EMAIL_BRAND.contactEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`[Admin 2FA] OTP email successfully sent to admin inbox`);
    logEmail({
      recipient: getAdminEmail(),
      subject: emailContent.subject,
      purpose: 'admin_2fa',
      status: 'sent',
    });
    return { success: true };
  } catch (err: any) {
    logger.error('[Admin 2FA] Failed to send OTP email:', { error: err });
    logEmail({
      recipient: getAdminEmail(),
      subject: emailContent.subject,
      purpose: 'admin_2fa',
      status: 'failed',
      error_message: err?.message || 'Lỗi gửi email máy chủ',
    });
    return { success: false, error: err.message || 'Lỗi gửi email máy chủ' };
  }
}

// 6. Create OTP record in database with expiry & hash
export function createOtpSession(otp: string): string {
  ensureAdminTables();
  const sessionId = 'otp_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
  const otpHash = hashOTP(otp);
  const expiresAt = Date.now() + OTP_TTL_MS;

  // Clean old expired sessions
  db.prepare('DELETE FROM admin_otp_sessions WHERE expires_at < ?').run(Date.now());

  db.prepare(`
    INSERT INTO admin_otp_sessions (id, otp_hash, email, attempts, expires_at)
    VALUES (?, ?, ?, 0, ?)
  `).run(sessionId, otpHash, getAdminEmail(), expiresAt);

  return sessionId;
}

// 7. Verify OTP from user input
export function verifyOtpInput(sessionId: string, inputOtp: string): { valid: boolean; error?: string } {
  ensureAdminTables();
  const session = db.prepare('SELECT * FROM admin_otp_sessions WHERE id = ?').get(sessionId) as any;

  if (!session) {
    return { valid: false, error: 'Phiên xác thực không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu lại mã.' };
  }

  if (session.expires_at < Date.now()) {
    db.prepare('DELETE FROM admin_otp_sessions WHERE id = ?').run(sessionId);
    return { valid: false, error: 'Mã xác thực đã hết hạn (quá 5 phút). Vui lòng nhận mã mới.' };
  }

  if (session.attempts >= 3) {
    db.prepare('DELETE FROM admin_otp_sessions WHERE id = ?').run(sessionId);
    return { valid: false, error: 'Đã nhập sai quá 3 lần. Phiên xác thực bị hủy vì lý do an toàn.' };
  }

  const expectedHash = hashOTP(inputOtp.trim());
  if (expectedHash !== session.otp_hash) {
    // Increment attempts
    db.prepare('UPDATE admin_otp_sessions SET attempts = attempts + 1 WHERE id = ?').run(sessionId);
    const remaining = 3 - (session.attempts + 1);
    return { valid: false, error: `Mã OTP không chính xác. Bạn còn ${remaining} lần thử.` };
  }

  // OTP verified successfully -> Delete session to prevent replay attacks
  db.prepare('DELETE FROM admin_otp_sessions WHERE id = ?').run(sessionId);
  return { valid: true };
}
