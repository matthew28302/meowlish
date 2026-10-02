import { NextResponse } from 'next/server';
import { db, hashPassword } from '@/lib/db';
import {
  generateOTP,
  createOtpSession,
  verifyOtpInput,
  sendAdminOtpEmail,
  createEncryptedAdminToken,
  verifyAdminToken,
  ADMIN_MASKED_EMAIL,
} from '@/lib/adminAuth';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import { logAccess, logError } from '@/lib/systemLogs';
import logger from '@/lib/logger';

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

      const inputHash = hashPassword(cleanPass);
      if (admin.password_hash !== inputHash) {
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

      // Generate 6-digit OTP
      const otpCode = generateOTP();
      const newSessionId = createOtpSession(otpCode);

      // Send OTP to email vukiet28032002@gmail.com
      const sendResult = await sendAdminOtpEmail(otpCode);

      if (!sendResult.success) {
        logger.error('[Admin Auth] Error sending OTP email:', { error: sendResult.error });
        logAccess({
          username: 'admin',
          action: 'admin_otp_send_failed',
          ip: clientIp,
          user_agent: userAgent,
          status: 'failed',
          details: sendResult.error || 'Lỗi gửi email OTP máy chủ',
        });
        return NextResponse.json(
          { error: `Không thể gửi mã xác thực tới email. Chi tiết: ${sendResult.error || 'Lỗi SMTP'}` },
          { status: 500 }
        );
      }

      logger.info(`Admin 2FA OTP generated and sent to ${ADMIN_MASKED_EMAIL}`);
      logAccess({
        username: 'admin',
        action: 'admin_otp_requested',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: `Gửi mã OTP 2FA bảo mật tới email ${ADMIN_MASKED_EMAIL}`,
      });

      return NextResponse.json({
        success: true,
        sessionId: newSessionId,
        maskedEmail: ADMIN_MASKED_EMAIL,
        message: `Mã xác thực bảo mật 6 số đã được gửi đến email ${ADMIN_MASKED_EMAIL}. Vui lòng kiểm tra hộp thư!`,
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

      const verifyRes = verifyOtpInput(sessionId, otp);
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
