import { NextResponse } from 'next/server';
import { db, verifyPassword } from '@/lib/db';
import {
  generateOTP,
  createOtpSession,
  verifyOtpInput,
  sendAdminOtpEmail,
  createEncryptedAdminToken,
  verifyAdminToken,
  getAdminMaskedEmail,
} from '@/lib/adminAuth';
import {
  getClientIp,
  checkRateLimit,
  checkRateLimitPersistent,
  clearRateLimitPersistent,
  rateLimitExceededResponse,
} from '@/lib/rateLimit';
import { logAccess, logError } from '@/lib/systemLogs';
import logger from '@/lib/logger';

/**
 * Khoá đăng nhập admin BỀN VỮNG (checkRateLimitPersistent).
 *
 * Vì sao cần: `checkRateLimit` chỉ đếm trong RAM của TỪNG instance Vercel —
 * mỗi instance một `Map` riêng, reset theo process. Dàn request qua nhiều
 * instance ⇒ bộ đếm bị chia nhỏ và kẻ tấn công dò mật khẩu root admin vô hạn
 * lần. `checkRateLimitPersistent` đếm chung qua Upstash Redis khi có env,
 * fallback về chính Map đó khi thiếu — cùng cơ chế đã dùng để khoá đăng nhập
 * người dùng theo username (src/app/api/auth/route.ts).
 *
 * Khoá theo IP + hằng số 'admin' chứ KHÔNG theo `username` từ body: username
 * ở luồng này luôn phải là 'admin' nên khoá theo nó là khoá toàn cục — chính
 * quản trị viên cũng bị chặn nếu kẻ tấn công dồn lượt.
 */
const ADMIN_FAIL_LIMIT = 5;
const ADMIN_FAIL_WINDOW_MS = 15 * 60 * 1000;

/**
 * 60s thay vì mặc định 10s của Vercel.
 *
 * Luồng admin login sinh OTP → ghi DB → có thể kích hoạt sync S3 đẩy
 * file 67MB (đo ~5.4s @100Mbit/s, ~26.8s @20Mbit/s). Trần 10s bị cắt.
 */
export const maxDuration = 60;

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || '';
  try {
    const body = await request.json();
    const { action, username, password, sessionId, otp, token } = body;

    // Rate Limiting: Chống Brute Force mật khẩu & Spam OTP Admin
    if (action === 'request_otp') {
      const rateCheck = checkRateLimit({
        key: `admin_otp_req:${clientIp}`,
        maxAttempts: 5,
        windowMs: 10 * 60 * 1000, // 5 requests / 10 phút
      });

      if (!rateCheck.allowed) {
        logger.warn(`Admin login rate limit reached for IP: ${clientIp}`);
        logAccess({
          username: (username || '').trim().toLowerCase() || 'unknown',
          action: 'admin_otp_rate_limited',
          ip: clientIp,
          user_agent: userAgent,
          status: 'rate_limited',
          details: 'Vượt quá số lần yêu cầu mã OTP Quản trị (5 lần/10 phút)',
        });
        return rateLimitExceededResponse('Bạn đã yêu cầu mã OTP Quản trị quá số lần cho phép. Vui lòng thử lại sau 10 phút vì lý do an toàn!', rateCheck.resetInSeconds);
      }
    }

    if (action === 'verify_otp') {
      const rateCheck = checkRateLimit({
        key: `admin_otp_ver:${clientIp}`,
        maxAttempts: 10,
        windowMs: 10 * 60 * 1000,
      });

      if (!rateCheck.allowed) {
        logger.warn(`Admin OTP verification rate limit reached for IP: ${clientIp}`);
        logAccess({
          username: 'admin',
          action: 'admin_otp_verify_rate_limited',
          ip: clientIp,
          user_agent: userAgent,
          status: 'rate_limited',
          details: 'Đã nhập sai OTP quá nhiều lần',
        });
        return rateLimitExceededResponse('Đã nhập sai OTP quá nhiều lần. Vui lòng chờ 10 phút trước khi thử lại!', rateCheck.resetInSeconds);
      }
    }

    // 1. ACTION: REQUEST OTP (STEP 1 OF 2FA)
    if (action === 'request_otp') {
      const cleanUser = (username || '').trim().toLowerCase();
      const cleanPass = (password || '').trim();

      if (cleanUser !== 'admin') {
        logger.warn(`Admin 2FA login failed: invalid username '${cleanUser}'`);
        logAccess({
          username: cleanUser || 'unknown',
          action: 'admin_login_failed',
          ip: clientIp,
          user_agent: userAgent,
          status: 'failed',
          details: `Tên đăng nhập quản trị không đúng: "${cleanUser}"`,
        });
        return NextResponse.json({ error: 'Tài khoản không có quyền truy cập trang quản trị.' }, { status: 401 });
      }

      // Check root password against database hash
      const admin = db.prepare('SELECT password_hash FROM users WHERE username = ?').get('admin') as any;
      if (!admin) {
        logger.warn('Admin 2FA login failed: admin user not found');
        logAccess({
          username: 'admin',
          action: 'admin_login_failed',
          ip: clientIp,
          user_agent: userAgent,
          status: 'failed',
          details: 'Tài khoản quản trị không tồn tại trong CSDL',
        });
        return NextResponse.json({ error: 'Tài khoản quản trị không tồn tại.' }, { status: 401 });
      }

      // verifyPassword chấp nhận cả hash cũ (SHA-256 + salt) lẫn hash mới
      // (scrypt) → admin không bị khoá ngoài khi salt đổi giữa các môi trường.
      //
      // Bộ đếm bền vững đặt TRƯỚC khi tra mật khẩu, y hệt hàng người dùng:
      // lần thứ 6 bị chặn ngay kể cả khi nhập đúng. Khoá theo IP + hằng số
      // 'admin_pwd_fail' ⇒ chỉ khi có Upstash (bộ đếm dùng chung) mới đổi IP
      // không thoát được; không có env thì rơi về hành vi cũ theo instance.
      const adminPwdFailKey = `admin_pwd_fail:${clientIp}`;
      const adminPwdLock = await checkRateLimitPersistent(adminPwdFailKey, ADMIN_FAIL_LIMIT, ADMIN_FAIL_WINDOW_MS);
      if (!adminPwdLock.allowed) {
        logger.warn(`Admin password lockout triggered for IP: ${clientIp}`);
        logAccess({
          username: 'admin',
          action: 'admin_login_pwd_locked',
          ip: clientIp,
          user_agent: userAgent,
          status: 'rate_limited',
          details: `Khoá đăng nhập quản trị: quá ${ADMIN_FAIL_LIMIT} lần trong 15 phút`,
        });
        return rateLimitExceededResponse(
          'Bạn đã nhập sai mật khẩu quản trị quá nhiều lần. Tài khoản tạm thời bị khoá, vui lòng thử lại sau ít phút!',
          adminPwdLock.resetInSeconds
        );
      }

      const adminPwdCheck = verifyPassword(cleanPass, admin.password_hash);
      if (!adminPwdCheck.ok) {
        logger.warn('Admin 2FA login failed: incorrect password');
        logAccess({
          username: 'admin',
          action: 'admin_login_failed',
          ip: clientIp,
          user_agent: userAgent,
          status: 'failed',
          details: 'Mật khẩu quản trị không chính xác',
        });
        return NextResponse.json({ error: 'Mật khẩu quản trị không chính xác.' }, { status: 401 });
      }

      // Mật khẩu ĐÚNG: xoá bộ đếm thất bại của IP này để quản trị viên thật
      // không bị kẹt khoá cũ chỉ vì một lần gõ nhầm. Chạy nền, lỗi Upstash đã
      // được handle + warn bên trong helper.
      clearRateLimitPersistent(adminPwdFailKey).catch(() => {});

      // Generate 6-digit OTP
      const otpCode = generateOTP();
      const newSessionId = createOtpSession(otpCode);

      // Send OTP to email <email quan tri>
      const sendResult = await sendAdminOtpEmail(otpCode);

      if (!sendResult.success) {
        // Chi tiết lỗi SMTP chỉ nằm trong log nội bộ. `sendAdminOtpEmail` bọc
        // nguyên lý nodemailer, message của nó chứa host/port SMTP và đôi khi
        // cả lý do xác thực thất bại — trả về client là lộ hạ tầng mail.
        logger.error('[Admin Auth] Error sending OTP email:', { error: sendResult.error });
        logAccess({
          username: 'admin',
          action: 'admin_otp_send_failed',
          ip: clientIp,
          user_agent: userAgent,
          status: 'failed',
          details: 'Không gửi được email OTP quản trị từ máy chủ',
        });
        return NextResponse.json(
          { error: 'Không thể gửi mã xác thực tới email lúc này. Vui lòng thử lại sau giây lát hoặc liên hệ quản trị viên.' },
          { status: 500 }
        );
      }

      // Masked email DERIVE từ chính email sẽ nhận OTP (getAdminEmail) —
      // một nguồn duy nhất, không bao giờ lệch với destination thật.
      const maskedEmail = getAdminMaskedEmail();

      logger.info(`Admin 2FA OTP generated and sent to ${maskedEmail}`);
      logAccess({
        username: 'admin',
        action: 'admin_otp_requested',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: `Gửi mã OTP 2FA bảo mật tới email ${maskedEmail}`,
      });

      return NextResponse.json({
        success: true,
        sessionId: newSessionId,
        maskedEmail,
        message: `Mã xác thực bảo mật 6 số đã được gửi đến email ${maskedEmail}. Vui lòng kiểm tra hộp thư!`,
      });
    }

    // 2. ACTION: VERIFY OTP (STEP 2 OF 2FA)
    if (action === 'verify_otp') {
      if (!sessionId || !otp) {
        logAccess({
          username: 'admin',
          action: 'admin_otp_failed',
          ip: clientIp,
          user_agent: userAgent,
          status: 'failed',
          details: 'Thiếu mã xác thực OTP hoặc Session ID',
        });
        return NextResponse.json({ error: 'Vui lòng nhập đầy đủ mã xác thực OTP.' }, { status: 400 });
      }

      // Bộ đếm bền vững cho bước dò OTP: `admin_otp_sessions.attempts` chỉ giữ
      // 3 lần trên MỘT phiên, còn kẻ tấn công cứ xin session mới (chỉ cần đúng
      // mật khẩu root — mà rate limit phía trên đã chặn dồn cục bộ) thì bộ đếm
      // đó luôn về 0. Khoá IP + hằng số 'admin_otp_fail' để 6 số OTP không thể
      // bị dò kiểu bất tận trên nhiều instance.
      const adminOtpFailKey = `admin_otp_fail:${clientIp}`;
      const adminOtpLock = await checkRateLimitPersistent(adminOtpFailKey, ADMIN_FAIL_LIMIT, ADMIN_FAIL_WINDOW_MS);
      if (!adminOtpLock.allowed) {
        logger.warn(`Admin OTP lockout triggered for IP: ${clientIp}`);
        logAccess({
          username: 'admin',
          action: 'admin_otp_verify_locked',
          ip: clientIp,
          user_agent: userAgent,
          status: 'rate_limited',
          details: `Khoá xác thực OTP quản trị: quá ${ADMIN_FAIL_LIMIT} lần trong 15 phút`,
        });
        return rateLimitExceededResponse(
          'Bạn đã nhập sai mã xác thực quá nhiều lần. Vui lòng chờ trước khi thử lại!',
          adminOtpLock.resetInSeconds
        );
      }

      const verifyRes = verifyOtpInput(String(sessionId), String(otp));
      if (!verifyRes.valid) {
        logAccess({
          username: 'admin',
          action: 'admin_otp_failed',
          ip: clientIp,
          user_agent: userAgent,
          status: 'failed',
          details: verifyRes.error || 'Mã xác thực OTP không hợp lệ hoặc đã hết hạn',
        });
        return NextResponse.json({ error: verifyRes.error || 'Mã xác thực không hợp lệ.' }, { status: 400 });
      }

      // OTP đúng: xoá bộ đếm dò sai của IP này (giống hàng người dùng xoá bộ
      // đếm sau khi mật khẩu đúng) để quản trị viên thật không bị kẹt khoá.
      clearRateLimitPersistent(adminOtpFailKey).catch(() => {});

      // Generate encrypted AES-256-GCM session token
      const sessionToken = createEncryptedAdminToken('admin');

      logger.info('Admin 2FA authentication verified successfully for admin');
      logAccess({
        username: 'admin',
        action: 'admin_login_success',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: 'Xác thực 2 lớp thành công - Cấp quyền truy cập Quản trị viên',
      });

      const response = NextResponse.json({
        success: true,
        token: sessionToken,
        message: 'Xác thực 2 lớp thành công! Cấp quyền truy cập Quản trị viên.',
      });

      // Bảo mật Cookie HttpOnly + SameSite Strict chống XSS & CSRF
      response.cookies.set('duahau_admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 2 * 60 * 60, // 2 hours
        path: '/',
      });

      return response;
    }

    // 3. ACTION: VERIFY ACTIVE SESSION TOKEN
    if (action === 'verify_session') {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/duahau_admin_session=([^;]+)/);
      const cookieToken = match ? decodeURIComponent(match[1]) : null;
      const isValid = verifyAdminToken(token || cookieToken);
      if (isValid) {
        logAccess({
          username: 'admin',
          action: 'admin_session_verified',
          ip: clientIp,
          user_agent: userAgent,
          status: 'success',
          details: 'Xác thực phiên làm việc Quản trị viên',
        });
      }
      return NextResponse.json({ valid: isValid });
    }

    // 4. ACTION: ADMIN LOGOUT (HỦY PHIÊN BẢO MẬT & XÓA COOKIE)
    if (action === 'logout') {
      logAccess({
        username: 'admin',
        action: 'admin_logout',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: 'Đã đăng xuất phiên Quản trị viên',
      });
      const response = NextResponse.json({ success: true, message: 'Đã đăng xuất phiên Quản trị viên.' });
      response.cookies.delete('duahau_admin_session');
      return response;
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ.' }, { status: 400 });
  } catch (err: unknown) {
    logger.error('Error in POST /api/admin/auth:', { error: err });
    logError({
      endpoint: 'POST /api/admin/auth',
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : null,
      ip: clientIp,
      severity: 'error',
    });
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
