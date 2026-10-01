import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db, hashPassword } from '@/lib/db';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import logger from '@/lib/logger';
import dns from 'dns';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate Limiting: Chống spam email & brute-force reset password
    const rateCheck = checkRateLimit({
      key: `forgot_pwd:${clientIp}`,
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 5 requests / 15 phút
    });

    if (!rateCheck.allowed) {
      logger.warn(`Forgot password rate limit reached for IP: ${clientIp}`);
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
      return NextResponse.json(
        { error: 'Tài khoản Quản trị viên chỉ có thể quản lý tại cổng bảo mật /duahau.' },
        { status: 403 }
      );
    }

    if (user && user.status === 'disabled') {
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

    // Create a Nodemailer transporter using SMTP details from the environment or fallback
    const smtpHost = process.env.SMTP_HOST || 'mail93142.maychuemail.com';
    let resolvedIp = smtpHost;
    try {
      const ips = await dns.promises.resolve4(smtpHost);
      if (ips && ips.length > 0) {
        resolvedIp = ips[0];
      }
    } catch (dnsErr) {
      logger.warn(`Failed to resolve IPv4 for ${smtpHost}, falling back to original hostname`, { error: dnsErr });
    }

    const smtpUser = process.env.SMTP_USER || 'admin@imfishball.id.vn';
    const smtpPass = process.env.SMTP_PASS || '28032002Aa@';

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

    const mailOptions = {
      from: `"Meowlish Support" <${smtpUser}>`,
      to: recipientEmail,
      subject: 'Yêu cầu đặt lại mật khẩu - Meowlish English',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #059669; text-align: center;">🐱 Meowlish English</h2>
          <p>Xin chào <strong>${user.display_name}</strong>,</p>
          <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${user.username}</strong>.</p>
          <p>Mật khẩu mới tạm thời của bạn là: <strong style="font-size: 18px; color: #d97706; letter-spacing: 1px;">${newPassword}</strong></p>
          <p>Vui lòng đăng nhập bằng mật khẩu mới này và đổi lại mật khẩu cá nhân trong phần cài đặt.</p>
          <br/>
          <p style="font-size: 12px; color: #64748b; text-align: center;">Nếu bạn không yêu cầu đặt lại mật khẩu, xin vui lòng bỏ qua email này hoặc liên hệ hỗ trợ.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      // CHỈ cập nhật mật khẩu trong CSDL KHI email đã được gửi thành công đến người dùng!
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(pwdHash, user.id);
      logger.info(`Successfully sent password reset email to: ${recipientEmail}`);

      return NextResponse.json({
        success: true,
        message: 'Mật khẩu mới đã được gửi đến email đăng ký của bạn. Vui lòng kiểm tra hộp thư!',
      });
    } catch (mailErr) {
      logger.error('Failed to send SMTP password reset email', { error: mailErr });
      // BẢO MẬT: Tuyệt đối không để lộ mật khẩu trong response kể cả khi SMTP lỗi!
      return NextResponse.json({
        error: 'Không thể gửi email lúc này. Vui lòng thử lại sau giây lát hoặc liên hệ hỗ trợ.',
      }, { status: 500 });
    }
  } catch (err: unknown) {
    logger.error('Unexpected error in POST /api/auth/forgot-password', { error: err });
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
