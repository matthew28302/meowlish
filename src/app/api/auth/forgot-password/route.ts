import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db, hashPassword, verifyPassword } from '@/lib/db';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import { logAccess, logEmail, logError } from '@/lib/systemLogs';
import { persistCriticalWrite } from '@/lib/s3Sync';
import logger from '@/lib/logger';
import { passwordResetTemplate, mailFrom, EMAIL_BRAND } from '@/lib/emailTemplates';
import dns from 'dns';
import crypto from 'crypto';

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || '';
  try {
    // Rate Limiting: Chống spam email & brute-force reset password
    const rateCheck = checkRateLimit({
      key: `forgot_pwd:${clientIp}`,
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 5 requests / 15 phút
    });

    if (!rateCheck.allowed) {
      logger.warn(`Forgot password rate limit reached for IP: ${clientIp}`);
      logAccess({
        action: 'forgot_password_rate_limited',
        ip: clientIp,
        user_agent: userAgent,
        status: 'rate_limited',
        details: 'Vượt quá số lần yêu cầu đặt lại mật khẩu (5 lần/15 phút)',
      });
      return rateLimitExceededResponse('Bạn đã yêu cầu đặt lại mật khẩu quá số lần cho phép. Vui lòng thử lại sau ít phút để bảo vệ an toàn!', rateCheck.resetInSeconds);
    }

    const body = await request.json();
    const { email } = body;

    const query = (email || '').trim().toLowerCase().slice(0, 100);

    if (!query) {
      logger.warn('Forgot password attempt failed: missing input');
      return NextResponse.json(
        { error: 'Vui lòng nhập địa chỉ email hoặc tên đăng nhập của bạn' },
        { status: 400 }
      );
    }

    // Find the user by email or username
    let user = db.prepare('SELECT id, username, display_name, email, role, status FROM users WHERE email = ?').get(query) as { id: string; username: string; display_name: string; email?: string; role?: string; status?: string } | undefined;

    if (!user) {
      user = db.prepare('SELECT id, username, display_name, email, role, status FROM users WHERE username = ?').get(query) as any;
    }

    // Chặn tuyệt đối đặt lại mật khẩu Admin từ cổng công khai
    if (user && (user.username === 'admin' || user.role === 'admin')) {
      logger.warn(`Blocked public password reset attempt for admin account from IP: ${clientIp}`);
      logAccess({
        username: user.username,
        action: 'forgot_password_blocked_admin',
        ip: clientIp,
        user_agent: userAgent,
        status: 'blocked',
        details: 'Chặn yêu cầu đặt lại mật khẩu Admin từ cổng công khai',
      });
      return NextResponse.json(
        { error: 'Tài khoản Quản trị viên chỉ có thể quản lý tại cổng bảo mật /duahau.' },
        { status: 403 }
      );
    }

    if (user && user.status === 'disabled') {
      logAccess({
        user_id: user.id,
        username: user.username,
        action: 'forgot_password_blocked_disabled',
        ip: clientIp,
        user_agent: userAgent,
        status: 'blocked',
        details: 'Tài khoản đã bị vô hiệu hóa yêu cầu đặt lại mật khẩu',
      });
      return NextResponse.json(
        { error: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên.' },
        { status: 403 }
      );
    }

    // Chống Account Enumeration: Luôn trả về phản hồi chung nếu tài khoản không tồn tại hoặc không có email
    if (!user || !user.email) {
      logger.info(`Forgot password request for non-existent or no-email account: ${query}`);
      return NextResponse.json({
        success: true,
        message: 'Nếu thông tin hợp lệ và có email đã đăng ký, hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.',
      });
    }

    const recipientEmail = user.email;

    // Generate a new cryptographically secure random password
    const newPassword = crypto.randomBytes(4).toString('hex') + Math.floor(1000 + Math.random() * 9000);
    const pwdHash = hashPassword(newPassword);

    // KHÔNG có giá trị dự phòng hardcode cho thông tin SMTP: repo này là PUBLIC,
    // nên một `|| 'mat-khau-that'` là lộ mật khẩu email cho cả internet. Thiếu
    // biến môi trường thì báo lỗi rõ ràng thay vì im lặng dùng khoá cũ.
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST;
    if (!smtpUser || !smtpPass || !smtpHost) {
      logger.error('[ForgotPassword] Thiếu cấu hình SMTP (SMTP_USER/SMTP_PASS/SMTP_HOST).');
      return NextResponse.json(
        { error: 'Dịch vụ email đang tạm thời không hoạt động. Vui lòng thử lại sau ít phút!' },
        { status: 503 }
      );
    }
    let resolvedIp = smtpHost;
    try {
      const ips = await dns.promises.resolve4(smtpHost);
      if (ips && ips.length > 0) {
        resolvedIp = ips[0];
      }
    } catch (dnsErr) {
      logger.warn(`Failed to resolve IPv4 for ${smtpHost}, falling back to original hostname`, { error: dnsErr });
    }

    const transporter = nodemailer.createTransport({
      host: resolvedIp,
      port: Number(process.env.SMTP_PORT) || 465,
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

    // Nội dung email (presentation only — không đổi logic sinh mật khẩu/lưu DB)
    const resetEmail = passwordResetTemplate({
      displayName: user.display_name,
      username: user.username,
      newPassword,
    });

    const mailOptions = {
      from: mailFrom(smtpUser),
      to: recipientEmail,
      replyTo: EMAIL_BRAND.contactEmail,
      subject: resetEmail.subject,
      html: resetEmail.html,
      text: resetEmail.text,
    };

    try {
      await transporter.sendMail(mailOptions);
      // CHỈ cập nhật mật khẩu trong CSDL KHI email đã được gửi thành công đến người dùng!
      // Ghi rồi kiểm tra lại: nếu bản ghi bị instance khác ghi đè mất thì người dùng
      // sẽ nhận mật khẩu mà không dùng được (báo sai pass) — phải báo lỗi rõ ràng.
      const applyReset = () => {
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(pwdHash, user.id);
      };
      const resetPersisted = () => {
        const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id) as
          | { password_hash: string }
          | undefined;
        return !!row && verifyPassword(newPassword, row.password_hash).ok;
      };
      const persistReset = await persistCriticalWrite(
        `đặt lại mật khẩu @${user.username}`,
        applyReset,
        resetPersisted
      );

      if (!persistReset.persisted) {
        logger.error(`Đặt lại mật khẩu @${user.username} không lưu được lên Filebase sau ${persistReset.attempts} lần thử.`);
        return NextResponse.json(
          { error: 'Chưa lưu được mật khẩu mới lên máy chủ. Vui lòng yêu cầu lại sau ít phút!' },
          { status: 503 }
        );
      }

      logger.info(`Successfully sent password reset email to: ${recipientEmail}`);

      logEmail({
        recipient: recipientEmail,
        subject: resetEmail.subject,
        purpose: 'forgot_password',
        status: 'sent',
      });

      logAccess({
        user_id: user.id,
        username: user.username,
        action: 'forgot_password_success',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: `Đã gửi mật khẩu khôi phục qua email ${recipientEmail}`,
      });

      return NextResponse.json({
        success: true,
        message: 'Mật khẩu mới đã được gửi đến email đăng ký của bạn. Vui lòng kiểm tra hộp thư!',
      });
    } catch (mailErr) {
      logger.error('Failed to send SMTP password reset email', { error: mailErr });
      logEmail({
        recipient: recipientEmail,
        subject: resetEmail.subject,
        purpose: 'forgot_password',
        status: 'failed',
        error_message: mailErr instanceof Error ? mailErr.message : String(mailErr),
      });

      logError({
        endpoint: 'POST /api/auth/forgot-password',
        error_message: mailErr instanceof Error ? mailErr.message : String(mailErr),
        stack_trace: mailErr instanceof Error ? mailErr.stack : null,
        ip: clientIp,
        user_id: user.id,
        severity: 'error',
      });

      // BẢO MẬT: Tuyệt đối không để lộ mật khẩu trong response kể cả khi SMTP lỗi!
      return NextResponse.json({
        error: 'Không thể gửi email lúc này. Vui lòng thử lại sau giây lát hoặc liên hệ hỗ trợ.',
      }, { status: 500 });
    }
  } catch (err: unknown) {
    logger.error('Unexpected error in POST /api/auth/forgot-password', { error: err });
    logError({
      endpoint: 'POST /api/auth/forgot-password',
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : null,
      ip: clientIp,
      severity: 'error',
    });
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
