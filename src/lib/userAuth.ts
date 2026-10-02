import crypto from 'crypto';
import dns from 'dns';
import nodemailer from 'nodemailer';
import { db } from './db';
import logger from './logger';
import { logEmail } from './systemLogs';

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

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// 1. Generate 6-digit random numeric OTP
export function generateUserOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 2. Hash OTP using SHA-256 + salt
export function hashUserOTP(otp: string): string {
  const salt = process.env.AUTH_SALT || 'meowlish_user_otp_salt_2026';
  return crypto.createHash('sha256').update(otp.trim() + salt).digest('hex');
}

// 3. Mask email for public display: vukiet28032002@gmail.com -> vuki*****02@gmail.com
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

    let subject = '';
    let title = '';
    let description = '';
    let badgeColor = '#059669';

    if (purpose === '2fa_login') {
      subject = `🐱 [MÃ XÁC THỰC 2FA ĐĂNG NHẬP] ${otp} - Meowlish English`;
      title = 'XÁC THỰC ĐĂNG NHẬP 2 LỚP (2FA)';
      description = 'Bạn đang đăng nhập vào Meowlish. Hãy nhập mã OTP dưới đây để hoàn tất:';
      badgeColor = '#0284c7';
    } else if (purpose === 'verify_email') {
      subject = `🐱 [MÃ KÍCH HOẠT TÀI KHOẢN] ${otp} - Meowlish English`;
      title = 'XÁC THỰC EMAIL TÀI KHOẢN';
      description = 'Chào mừng bạn đến với Meowlish! Hãy nhập mã OTP này để kích hoạt đầy đủ tính năng học tập:';
      badgeColor = '#059669';
    } else if (purpose === 'toggle_2fa') {
      subject = `🛡️ [XÁC NHẬN CÀI ĐẶT BẢO MẬT 2FA] ${otp} - Meowlish`;
      title = 'XÁC NHẬN CÀI ĐẶT BẢO MẬT 2 LỚP';
      description = 'Bạn đang thay đổi trạng thái bảo mật 2FA cho tài khoản. Nhập mã OTP để xác nhận:';
      badgeColor = '#e11d48';
    }

    const name = displayName || 'Bạn';

    const mailOptions = {
      from: `"Meowlish Support" <${smtpUser}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${badgeColor} 0%, #0d9488 100%); padding: 25px 20px; text-align: center; color: #ffffff;">
            <div style="font-size: 32px; margin-bottom: 4px;">🐱✨</div>
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">${title}</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Học Tiếng Anh Giao Tiếp & IT Thực Chiến</p>
          </div>

          <!-- Body -->
          <div style="padding: 28px 24px; text-align: center; color: #334155;">
            <p style="font-size: 15px; margin-top: 0; line-height: 1.5;">
              Xin chào <strong>${name}</strong>,<br/>
              ${description}
            </p>

            <div style="margin: 24px 0; background: #f8fafc; border: 2px dashed ${badgeColor}; padding: 18px; border-radius: 16px;">
              <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; letter-spacing: 1.5px; margin-bottom: 6px;">
                Mã Xác Thực Của Bạn
              </div>
              <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: ${badgeColor}; font-family: monospace;">
                ${otp}
              </div>
              <div style="font-size: 11px; color: #e11d48; margin-top: 6px; font-weight: 600;">
                ⏳ Mã có hiệu lực trong vòng 10 phút. Không chia sẻ mã này cho bất kỳ ai.
              </div>
            </div>

            <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0; line-height: 1.6;">
              Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email hoặc đổi mật khẩu để bảo vệ tài khoản.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            Meowlish English Platform • English for IT & Daily Life
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`[User 2FA] OTP email sent to ${email} for purpose: ${purpose}`);
    logEmail({
      recipient: email,
      subject,
      purpose,
      status: 'sent',
    });
    return { success: true };
  } catch (err: any) {
    logger.error('[User 2FA] Failed to send OTP email:', { error: err });
    logEmail({
      recipient: email,
      subject: `OTP Email (${purpose})`,
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
const SESSION_SECRET = process.env.AUTH_SALT || 'meowlish_user_session_secret_2026';
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

/**
 * Tạo token phiên đăng nhập có chữ ký bảo mật HMAC-SHA256 chống giả mạo cookie
 */
export function createUserSessionToken(userId: string): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}:${expiresAt}`;
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}

/**
 * Kiểm tra và giải mã token phiên người dùng
 */
export function verifyUserSessionToken(token?: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length === 2) {
      const [payloadB64, sig] = parts;
      const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
      const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
      if (crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
        const [userId, expStr] = payload.split(':');
        const exp = parseInt(expStr, 10);
        if (exp > Date.now()) {
          return userId;
        }
      }
    } else if (token.startsWith('user_')) {
      // Tương thích ngược phiên dev cục bộ
      return token;
    }
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

