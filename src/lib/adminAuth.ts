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
 * Email nhận OTP quản trị — lấy từ biến môi trường, KHÔNG ghi trong source.
 *
 * Repo này public. Email trước đây nằm trong mã nguồn công khai, tức bất kỳ ai
 * cũng biết chính xác mã OTP 2FA của cổng quản trị sẽ được gửi tới đâu. Đưa sang
 * biến môi trường và fail-closed khi thiếu.
 */
export function getAdminEmail(): string {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (email) return email;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ADMIN_EMAIL bat buoc khi chay production — noi OTP quan tri duoc gui. ' +
        'Thieu bien nay thi khong the xac thuc 2FA cho cong /duahau.'
    );
  }
  return 'admin@localhost';
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
const ENCRYPTION_KEY = (() => {
  const fromEnv = process.env.AUTH_SALT;
  if (fromEnv && fromEnv.trim().length >= 16) {
    return crypto.createHash('sha256').update(fromEnv).digest();
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SALT bat buoc va phai du 16 ky tu khi chay production.');
  }
  return crypto.createHash('sha256').update('meowlish_admin_super_secret_salt_2026_DEV_ONLY').digest();
})();
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
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 2. Hash OTP using SHA-256 + salt to ensure OTP is NEVER stored in plain text
export function hashOTP(otp: string): string {
  const salt = 'meowlish_admin_otp_salt_2026';
  return crypto.createHash('sha256').update(otp + salt).digest('hex');
}

// 3. Encrypt admin session token using AES-256-GCM (Tamper-proof & encrypted in-transit)
export function createEncryptedAdminToken(username: string = 'admin'): string {
  const payload = JSON.stringify({
    username,
    role: 'admin',
    email: getAdminEmail(),
    nonce: crypto.randomBytes(8).toString('hex'),
    exp: Date.now() + TOKEN_TTL_MS,
  });

  const iv = crypto.randomBytes(12); // 12 bytes IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
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

    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const payload = JSON.parse(decrypted);

    // Verify expiration and role
    if (!payload || payload.role !== 'admin' || payload.exp < Date.now()) {
      return false;
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

    const transporter = nodemailer.createTransport({
      host: resolvedHost,
      port: smtpPort,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
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
