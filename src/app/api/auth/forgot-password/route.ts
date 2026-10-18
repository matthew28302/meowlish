import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/lib/db';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import { logAccess, logEmail, logError } from '@/lib/systemLogs';
import { maskEmail } from '@/lib/userAuth';
import { persistCriticalWrite } from '@/lib/s3Sync';
import logger from '@/lib/logger';
import { passwordResetLinkTemplate, mailFrom, EMAIL_BRAND, APP_URL } from '@/lib/emailTemplates';
import dns from 'dns';
import crypto from 'crypto';

/**
 * 60s thay vì mặc định 10s của Vercel.
 *
 * Các route này có thể phải đẩy file SQLite ~67MB lên Filebase S3. Đo được:
 * ~5.4s ở 100Mbit/s nhưng ~26.8s ở 20Mbit/s. Trượt mặc định 10s ⇒ upload bị
 * cắt giữa chừng ⇒ dữ liệu mất. 60s là trần của gói Vercel Hobby.
 */
export const maxDuration = 60;

/**
 * TLS verify đang TẮT (`tls.rejectUnauthorized: false`) — quyết định CÓ CHỦ ĐÍCH
 * sau khi TEST THẬT, KHÔNG im lặng (audit H4 2026-10-08):
 *
 *   node scripts/test-smtp-tls.mjs  →  FAIL với lý do rõ ràng:
 *   mail server thật của domain (MX → mail93142.maychuemail.com, 112.213.93.142)
 *   trình chứng chỉ ĐÃ HẾT HẠN ⇒ `rejectUnauthorized: true` bị Node từ chối
 *   (ESOCKET "certificate has expired") ⇒ bật verify làm email reset password
 *   không gửi được.
 *
 * Giữ `false` CHO TỚI KHI chủ repo gia hạn chứng chỉ SMTP server ở nhà cung cấp
 * (maychuemail), chạy lại script test ra PASS, rồi flip thành `true` ở các chỗ
 * gửi email. Rủi ro MITM trong lúc verify tắt được LOG WARN qua
 * warnTlsVerifyOff() bên dưới (một lần mỗi instance/cold start).
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
 * Phản hồi DUY NHẤT cho mọi yêu cầu không thể xử lý (không tồn tại, không có
 * email, tài khoản bị vô hiệu hóa). Nếu thông điệp hoặc mã trạng thái khác nhau,
 * endpoint này trở thành "máy dò tài khoản": gửi email/username bất kỳ rồi đọc
 * phản hồi để biết tài khoản có thật và có đang bị khóa hay không.
 */
const GENERIC_RESET_MESSAGE =
  'Nếu thông tin hợp lệ và có email đã đăng ký, hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.';

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

    // Body hỏng là lỗi CLIENT (400), không phải 500 — và không được để lỗi
    // JSON.parse thô của V8 lọt ra ngoài. ĐO TRÊN PRODUCTION 2026-10-18:
    // POST body không hợp lệ → 500 {"error":"Expected property name or '}' in
    // JSON at position 1 (line 1 column 2)"} (lộ chi tiết nội bộ + sai mã lỗi).
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
    }

    // `email` là dữ liệu KHÔNG tin cậy (number/object sẽ ném TypeError ở
    // `.trim()`) ⇒ ép String tại biên trước khi xử lý.
    const query = String(body?.email ?? '').trim().toLowerCase().slice(0, 100);

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
      // Trả về ĐÚNG phản hồi chung như tài khoản không tồn tại: thông báo riêng
      // "tài khoản bị vô hiệu hóa" xác nhận với người ngoài rằng tài khoản này
      // CÓ THẬT (account enumeration). Chủ tài khoản vẫn thấy lý do khi đăng nhập.
      return NextResponse.json({ success: true, message: GENERIC_RESET_MESSAGE });
    }

    // Chống Account Enumeration: Luôn trả về phản hồi chung nếu tài khoản không tồn tại hoặc không có email
    if (!user || !user.email) {
      logger.info(`Forgot password request for non-existent or no-email account: ${query}`);
      return NextResponse.json({
        success: true,
        message: GENERIC_RESET_MESSAGE,
      });
    }

    const recipientEmail = user.email;

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

    // Đã test thật TLS verify (xem warnTlsVerifyOff ở đầu file): cert mail server
    // hết hạn ⇒ giữ false, KHÔNG bật (bật làm reset link không gửi được). Warn khi chạy.
    warnTlsVerifyOff('ForgotPassword');

    const transporter = nodemailer.createTransport({
      host: resolvedIp,
      port: Number(process.env.SMTP_PORT) || 465,
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

    // Tạo one-time reset token (raw gửi qua email, hash lưu DB)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 60 phút

    // Lưu token hash vào DB — BẮT BUỘC qua persistCriticalWrite:
    // nếu chỉ `db.prepare(...).run()` thì token chỉ nằm trong SQLite cục bộ của
    // instance này (Vercel mỗi instance 1 bản /tmp riêng). Người dùng bấm link
    // email vài chục giây sau thường rơi vào instance KHÁC, DB của instance đó
    // được khôi phục từ Filebase mà KHÔNG có token ⇒ POST /reset-password trả
    // "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn" dù link vừa gửi.
    // (Báo cáo user 2026-10-17: reset xong báo link không hợp lệ.)
    const persistToken = await persistCriticalWrite(
      `tạo token đặt lại mật khẩu cho user ${user.id}`,
      () => {
        db.prepare(`
          INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
          VALUES (?, ?, ?)
        `).run(tokenHash, user.id, expiresAt);
      },
      () => {
        const row = db.prepare(
          'SELECT token_hash FROM password_reset_tokens WHERE token_hash = ?'
        ).get(tokenHash);
        return Boolean(row);
      }
    );

    if (!persistToken.persisted) {
      logger.error(`[ForgotPassword] Token cho user ${user.id} không persist được lên Filebase sau ${persistToken.attempts} lần.`);
      return NextResponse.json(
        { error: 'Hệ thống bận, chưa tạo được link đặt lại mật khẩu. Vui lòng thử lại sau ít phút!' },
        { status: 503 }
      );
    }

    // Tạo reset link — dùng CHUNG APP_URL với emailTemplates (đã chống cấu hình
    // APP_URL=localhost trên Vercel; xem chú thích ở src/lib/emailTemplates.ts).
    const resetLink = `${APP_URL}/reset-password?token=${rawToken}`;

    // Nội dung email với link đặt lại mật khẩu
    const resetEmail = passwordResetLinkTemplate({
      displayName: user.display_name,
      username: user.username,
      resetLink,
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
      // Che email ở log: `logger` ghi ra log aggregator, ai có quyền đọc log
      // cũng đọc được hộp thư của người dùng. Mọi call site khác trong nhóm
      // file này đều đã mask.
      logger.info(`Successfully sent password reset link email to: ${maskEmail(recipientEmail)}`);

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
        // Che email: `details` được ghi vào system_access_logs mà /duahau đọc.
        details: `Đã gửi link đặt lại mật khẩu qua email ${maskEmail(recipientEmail)}`,
      });

      return NextResponse.json({
        success: true,
        message: 'Link đặt lại mật khẩu đã được gửi đến email đăng ký của bạn. Vui lòng kiểm tra hộp thư!',
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
    logger.warn(`Chi tiết lỗi forgot-password (không trả cho client): ${message}`);
    // KHÔNG trả err.message thô: lỗi better-sqlite3/nodemailer lộ tên bảng, cột,
    // host SMTP... Chi tiết đã nằm trong log nội bộ phía trên.
    return NextResponse.json({ error: 'Không thể xử lý yêu cầu lúc này. Vui lòng thử lại sau ít phút!' }, { status: 500 });
  }
}