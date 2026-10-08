import dns from 'dns';
import nodemailer from 'nodemailer';
import logger from './logger';
import { logEmail } from './systemLogs';
import { getAdminEmail } from './adminAuth';
import {
  supportAckTemplate,
  supportAdminAlertTemplate,
  mailFrom,
  EMAIL_BRAND,
} from './emailTemplates';

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
 *   (ESOCKET "certificate has expired") ⇒ bật verify làm MỌI email hỗ trợ chết.
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

export async function sendSupportNotificationEmail({
  ticketId,
  name,
  email,
  category,
  priority = 'medium',
  subject,
  message,
}: {
  ticketId?: string;
  name: string;
  email: string;
  category: string;
  priority?: string;
  subject: string;
  message: string;
  rating?: number;
}): Promise<{ success: boolean; error?: string }> {
  const formattedTicketCode = ticketId
    ? (ticketId.startsWith('#') ? ticketId : `#${ticketId}`)
    : '#TK-MEOW';

  // Chỉ dựng nội dung email (presentation) — không thay đổi logic hỗ trợ.
  const adminContent = supportAdminAlertTemplate({
    name,
    email,
    ticketId,
    subject,
    category,
    priority,
    message,
  });
  const ackContent = supportAckTemplate({
    name,
    ticketId,
    subject,
    category,
    priority,
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
    // hết hạn ⇒ giữ false, KHÔNG bật (bật làm email support không gửi được). Warn khi chạy.
    warnTlsVerifyOff('Support');

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

    // 1. Gửi thông báo đến Admin (replyTo = người gửi để admin trả lời trực tiếp)
    const adminMailOptions = {
      from: mailFrom(smtpUser),
      to: getAdminEmail(),
      replyTo: email,
      subject: adminContent.subject,
      html: adminContent.html,
      text: adminContent.text,
    };

    await transporter.sendMail(adminMailOptions);
    logger.info(`[Support] Notification email sent to admin for ticket ${formattedTicketCode}: ${subject}`);
    logEmail({
      recipient: getAdminEmail(),
      subject: adminContent.subject,
      purpose: 'support_admin_alert',
      status: 'sent',
    });

    // 2. Gửi email xác nhận đến người dùng (Acknowledgement)
    try {
      const userAckOptions = {
        from: mailFrom(smtpUser),
        to: email,
        replyTo: EMAIL_BRAND.contactEmail,
        subject: ackContent.subject,
        html: ackContent.html,
        text: ackContent.text,
      };
      await transporter.sendMail(userAckOptions);
      logEmail({
        recipient: email,
        subject: ackContent.subject,
        purpose: 'support_user_ack',
        status: 'sent',
      });
    } catch (ackErr) {
      logger.warn('[Support] Could not send user acknowledgement email:', { error: ackErr });
    }

    return { success: true };
  } catch (err: any) {
    logger.error('[Support] Failed to send support email:', { error: err });
    logEmail({
      recipient: getAdminEmail(),
      subject: adminContent.subject,
      purpose: 'support_admin_alert',
      status: 'failed',
      error_message: err?.message || 'Lỗi gửi email máy chủ',
    });
    return { success: false, error: err.message || 'Lỗi gửi email máy chủ' };
  }
}
