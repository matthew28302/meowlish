import crypto from 'crypto';
import dns from 'dns';
import nodemailer from 'nodemailer';
import { db, hashPassword } from './db';
import logger from './logger';

async function resolveIpv4(host: string): Promise<string> {
  try {
    const ips = await dns.promises.resolve4(host);
    if (ips && ips.length > 0) return ips[0];
  } catch (e) {
    logger.warn(`[DNS] Could not resolve IPv4 for ${host}, using hostname directly`);
  }
  return host;
}

export const ADMIN_EMAIL = 'vukiet28032002@gmail.com';
export const ADMIN_MASKED_EMAIL = 'vuki*****02@gmail.com';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(process.env.AUTH_SALT || 'meowlish_admin_super_secret_salt_2026').digest(); // 32 bytes for AES-256
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
    email: ADMIN_EMAIL,
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

// 5. Send secure 2FA OTP Email to vukiet28032002@gmail.com
export async function sendAdminOtpEmail(otp: string): Promise<{ success: boolean; error?: string }> {
  try {
    const smtpUser = process.env.SMTP_USER || 'admin@imfishball.id.vn';
    const smtpPass = process.env.SMTP_PASS || '28032002Aa@';
    const smtpHost = process.env.SMTP_HOST || 'mail93142.maychuemail.com';
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

    const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    const mailOptions = {
      from: `"Meowlish Dưa Hấu Security" <${smtpUser}>`,
      to: ADMIN_EMAIL,
      subject: `🍉 [MÃ XÁC THỰC 2FA ADMIN] ${otp} - Quản trị Meowlish Dưa Hấu`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 20px; overflow: hidden; border: 2px solid #e11d48; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #e11d48 0%, #059669 100%); padding: 25px 20px; text-align: center;">
            <div style="font-size: 38px; margin-bottom: 5px;">🍉🛡️</div>
            <h1 style="margin: 0; font-size: 22px; color: #ffffff; letter-spacing: 0.5px;">XÁC THỰC 2 LỚP ADMIN DƯA HẤU</h1>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.85); font-weight: bold;">Hệ Thống Quản Trị Tối Cao Meowlish</p>
          </div>

          <!-- Body Content -->
          <div style="padding: 30px 25px; text-align: center;">
            <p style="font-size: 14px; color: #94a3b8; margin-top: 0;">
              Xin chào Quản trị viên, bạn đang yêu cầu đăng nhập vào cổng điều khiển <strong style="color: #fda4af;">/duahau</strong>.
            </p>

            <div style="margin: 25px 0; background: #1e293b; padding: 20px; border-radius: 16px; border: 1px dashed #e11d48;">
              <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: bold; letter-spacing: 1.5px; margin-bottom: 8px;">
                Mã Xác Thực Bảo Mật (OTP)
              </div>
              <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #38bdf8; font-family: monospace; text-shadow: 0 0 20px rgba(56,189,248,0.4);">
                ${otp}
              </div>
              <div style="font-size: 11px; color: #f43f5e; margin-top: 8px; font-weight: bold;">
                ⏳ Mã có hiệu lực trong 5 phút. Tối đa 3 lần thử.
              </div>
            </div>

            <!-- Details Table -->
            <div style="background: #020617; border-radius: 12px; padding: 12px 16px; text-align: left; font-size: 11px; color: #64748b; line-height: 1.8;">
              <div>• <strong>Thời gian:</strong> <span style="color: #cbd5e1;">${now}</span></div>
              <div>• <strong>Tài khoản đích:</strong> <span style="color: #cbd5e1;">admin</span></div>
              <div>• <strong>Email nhận mã:</strong> <span style="color: #38bdf8;">${ADMIN_EMAIL}</span></div>
              <div>• <strong>Mã hóa phiên:</strong> <span style="color: #10b981;">AES-256-GCM End-to-End</span></div>
            </div>

            <p style="font-size: 11px; color: #64748b; margin-top: 25px; margin-bottom: 0;">
              ⚠️ Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và kiểm tra lại mật khẩu quản trị ngay lập tức.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #020617; padding: 15px; text-align: center; border-top: 1px solid #1e293b; font-size: 10px; color: #475569;">
            Meowlish Security Protocol • Dưa Hấu Admin Console • Confidential
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`[Admin 2FA] OTP email successfully sent to ${ADMIN_EMAIL}`);
    return { success: true };
  } catch (err: any) {
    logger.error('[Admin 2FA] Failed to send OTP email:', { error: err });
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
  `).run(sessionId, otpHash, ADMIN_EMAIL, expiresAt);

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
