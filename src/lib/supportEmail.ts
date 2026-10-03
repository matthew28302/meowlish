import dns from 'dns';
import nodemailer from 'nodemailer';
import logger from './logger';
import { logEmail } from './systemLogs';
import { ADMIN_EMAIL } from './adminAuth';
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

    // 1. Gửi thông báo đến Admin (replyTo = người gửi để admin trả lời trực tiếp)
    const adminMailOptions = {
      from: mailFrom(smtpUser),
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: adminContent.subject,
      html: adminContent.html,
      text: adminContent.text,
    };

    await transporter.sendMail(adminMailOptions);
    logger.info(`[Support] Notification email sent to admin for ticket ${formattedTicketCode}: ${subject}`);
    logEmail({
      recipient: ADMIN_EMAIL,
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
      recipient: ADMIN_EMAIL,
      subject: adminContent.subject,
      purpose: 'support_admin_alert',
      status: 'failed',
      error_message: err?.message || 'Lỗi gửi email máy chủ',
    });
    return { success: false, error: err.message || 'Lỗi gửi email máy chủ' };
  }
}
