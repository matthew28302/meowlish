import dns from 'dns';
import nodemailer from 'nodemailer';
import logger from './logger';
import { logEmail } from './systemLogs';
import { ADMIN_EMAIL } from './adminAuth';

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
  rating,
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

    const categoryMap: Record<string, { label: string; color: string; emoji: string }> = {
      feedback: { label: 'Góp Ý Tính Năng', color: '#7c3aed', emoji: '💡' },
      bug: { label: 'Báo Lỗi Kỹ Thuật', color: '#e11d48', emoji: '🐞' },
      guide: { label: 'Thắc Mắc Học Tập', color: '#0284c7', emoji: '📖' },
      account: { label: 'Tài Khoản & Bảo Mật', color: '#059669', emoji: '🔒' },
      other: { label: 'Ý Kiến Khác', color: '#64748b', emoji: '💬' },
    };

    const priorityMap: Record<string, { label: string; color: string; emoji: string }> = {
      low: { label: 'Ưu tiên Thấp', color: '#10b981', emoji: '🟢' },
      medium: { label: 'Ưu tiên Trung Bình', color: '#f59e0b', emoji: '🟡' },
      high: { label: 'Ưu tiên Cao', color: '#f97316', emoji: '🟠' },
      urgent: { label: 'Khẩn Cấp', color: '#ef4444', emoji: '🔴' },
    };

    const catInfo = categoryMap[category] || categoryMap.other;
    const prioInfo = priorityMap[priority] || priorityMap.medium;
    const formattedTicketCode = ticketId ? (ticketId.startsWith('#') ? ticketId : `#${ticketId}`) : '#TK-MEOW';
    const starString = rating ? '⭐'.repeat(Math.max(1, Math.min(5, rating))) : '⭐⭐⭐⭐⭐';
    const mailSubject = `${catInfo.emoji} [Ticket ${formattedTicketCode}] ${subject} - từ ${name}`;

    // 1. Gửi thông báo đến Admin
    const adminMailOptions = {
      from: `"Meowlish Support System" <${smtpUser}>`,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: mailSubject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px; text-align: center; color: #ffffff;">
            <div style="font-size: 32px; margin-bottom: 6px;">🍉</div>
            <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">TICKET HỖ TRỢ & GÓP Ý MỚI</h2>
            <div style="display: inline-block; margin-top: 8px; padding: 4px 12px; background: rgba(255,255,255,0.15); border-radius: 999px; font-family: monospace; font-size: 14px; font-weight: bold; color: #38bdf8;">
              ${formattedTicketCode}
            </div>
          </div>

          <!-- Body -->
          <div style="padding: 24px; color: #1e293b;">
            <!-- Badges -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; gap: 8px;">
                <span style="display: inline-block; padding: 4px 10px; background: ${catInfo.color}; color: #ffffff; border-radius: 999px; font-size: 11px; font-weight: 700;">
                  ${catInfo.emoji} ${catInfo.label}
                </span>
                <span style="display: inline-block; padding: 4px 10px; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 999px; font-size: 11px; font-weight: 700;">
                  ${prioInfo.emoji} ${prioInfo.label}
                </span>
              </div>
              <span style="font-size: 14px; color: #f59e0b;">${starString}</span>
            </div>

            <!-- Subject -->
            <h3 style="margin: 0 0 16px 0; font-size: 17px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">
              ${subject}
            </h3>

            <!-- Sender Info Card -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 14px; margin-bottom: 16px; border: 1px solid #e2e8f0; font-size: 13px;">
              <div style="margin-bottom: 6px;"><strong>👤 Người gửi:</strong> ${name}</div>
              <div style="margin-bottom: 6px;"><strong>✉️ Email:</strong> <a href="mailto:${email}" style="color: #0284c7; text-decoration: none;">${email}</a></div>
              <div><strong>⏱️ Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</div>
            </div>

            <!-- Message content -->
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-left: 4px solid #059669; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap;">
${message}
            </div>

            <!-- Admin Link Button -->
            <div style="margin-top: 24px; text-align: center;">
              <a href="https://meowlish.imfishball.id.vn/duahau" style="display: inline-block; background: #059669; color: #ffffff; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 13px; text-decoration: none;">
                Truy Cập Trang Quản Trị /duahau Để Phản Hồi
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            Meowlish English Platform • Ban Quản Trị Dưa Hấu
          </div>
        </div>
      `,
    };

    await transporter.sendMail(adminMailOptions);
    logger.info(`[Support] Notification email sent to admin for ticket ${formattedTicketCode}: ${subject}`);
    logEmail({
      recipient: ADMIN_EMAIL,
      subject: mailSubject,
      purpose: 'support_admin_alert',
      status: 'sent',
    });

    // 2. Gửi email xác nhận đến người dùng (Acknowledgement)
    try {
      const userAckOptions = {
        from: `"Meowlish Support" <${smtpUser}>`,
        to: email,
        subject: `🐱 [Meowlish] Đã tiếp nhận yêu cầu hỗ trợ ${formattedTicketCode}: "${subject}"`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 8px 20px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 24px; text-align: center; color: #ffffff;">
              <div style="font-size: 32px; margin-bottom: 6px;">💌</div>
              <h2 style="margin: 0; font-size: 18px; font-weight: 800;">ĐÃ TIẾP NHẬN PHIẾU HỖ TRỢ CỦA BẠN</h2>
              <div style="display: inline-block; margin-top: 8px; padding: 4px 14px; background: rgba(255,255,255,0.2); border-radius: 999px; font-family: monospace; font-size: 13px; font-weight: 800; color: #fef08a;">
                MÃ TICKET: ${formattedTicketCode}
              </div>
            </div>
            <div style="padding: 24px; color: #334155; font-size: 14px; line-height: 1.6;">
              <p>Chào <strong>${name}</strong>,</p>
              <p>Ban Quản Trị Meowlish đã nhận được thông tin yêu cầu của bạn. Đội ngũ kỹ thuật và hỗ trợ sẽ kiểm tra và phản hồi lại bạn trong thời gian sớm nhất có thể.</p>
              
              <div style="background: #f8fafc; border-radius: 12px; padding: 14px; margin: 16px 0; border: 1px solid #e2e8f0;">
                <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">📋 Chi tiết phiếu hỗ trợ:</div>
                <div style="font-size: 13px; color: #475569; margin-bottom: 4px;">• <strong>Tiêu đề:</strong> ${subject}</div>
                <div style="font-size: 13px; color: #475569; margin-bottom: 4px;">• <strong>Chuyên mục:</strong> ${catInfo.label}</div>
                <div style="font-size: 13px; color: #475569;">• <strong>Độ ưu tiên:</strong> ${prioInfo.label}</div>
              </div>

              <p style="font-size: 13px; color: #64748b;">
                🔍 <strong>Theo dõi tiến độ:</strong> Bạn có thể truy cập mục <strong>Hỗ Trợ & Góp Ý (/support)</strong> trên website Meowlish để tra cứu lịch sử và xem phản hồi từ Quản trị viên theo mã <code>${formattedTicketCode}</code>.
              </p>

              <div style="background: #fef3c7; border-radius: 12px; padding: 12px; border: 1px dashed #f59e0b; font-size: 12px; color: #92400e; margin-top: 18px;">
                🐱 <em>Mẹo học tập: Trong lúc chờ phản hồi, bạn có thể ghé thăm bé cưng tại mục Thú Cưng để nhận +500 Coins miễn phí hoặc lật 5 thẻ Flashcard giữ chuỗi Streak nhé!</em>
              </div>
            </div>
            <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
              Thân ái, Đội ngũ Ban Quản Trị Meowlish English
            </div>
          </div>
        `,
      };
      await transporter.sendMail(userAckOptions);
      logEmail({
        recipient: email,
        subject: `[Meowlish] Đã tiếp nhận yêu cầu hỗ trợ ${formattedTicketCode}: "${subject}"`,
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
      subject: `[Lỗi gửi góp ý] ${subject}`,
      purpose: 'support_admin_alert',
      status: 'failed',
      error_message: err?.message || 'Lỗi gửi email máy chủ',
    });
    return { success: false, error: err.message || 'Lỗi gửi email máy chủ' };
  }
}
