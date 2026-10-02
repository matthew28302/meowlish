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
  name,
  email,
  category,
  subject,
  message,
  rating,
}: {
  name: string;
  email: string;
  category: string;
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
      feedback: { label: 'Góp Ý Tính Năng', color: '#059669', emoji: '💡' },
      bug: { label: 'Báo Lỗi Kỹ Thuật', color: '#e11d48', emoji: '🐞' },
      guide: { label: 'Hỏi Hướng Dẫn', color: '#0284c7', emoji: '❓' },
      other: { label: 'Ý Kiến Khác', color: '#7c3aed', emoji: '💬' },
    };

    const catInfo = categoryMap[category] || categoryMap.other;
    const starString = rating ? '⭐'.repeat(Math.max(1, Math.min(5, rating))) : '⭐⭐⭐⭐⭐';
    const mailSubject = `${catInfo.emoji} [Góp Ý Website] ${subject} - từ ${name}`;

    // 1. Gửi thông báo đến Admin
    const adminMailOptions = {
      from: `"Meowlish Support System" <${smtpUser}>`,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: mailSubject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 24px; text-align: center; color: #ffffff;">
            <div style="font-size: 32px; margin-bottom: 6px;">🍉</div>
            <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">THÔNG BÁO GÓP Ý & HỖ TRỢ MỚI</h2>
            <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Nhận từ giao diện /support của người dùng</p>
          </div>

          <!-- Body -->
          <div style="padding: 24px; color: #1e293b;">
            <!-- Badge & Rating -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <span style="display: inline-block; padding: 4px 12px; background: ${catInfo.color}; color: #ffffff; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                ${catInfo.emoji} ${catInfo.label}
              </span>
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
              <a href="https://meowlish.imfishball.id.vn/duahau" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 13px; text-decoration: none;">
                Truy Cập Trang Quản Trị /duahau
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
    logger.info(`[Support] Notification email sent to admin for: ${subject}`);
    logEmail({
      recipient: ADMIN_EMAIL,
      subject: mailSubject,
      purpose: 'support_admin_alert',
      status: 'sent',
    });

    // 2. Gửi email xác nhận đến người dùng (Acknowledgement)
    try {
      const userAckOptions = {
        from: `"Meowlish English" <${smtpUser}>`,
        to: email,
        subject: `🐱 Cảm ơn bạn đã đóng góp ý kiến cho Meowlish: "${subject}"`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 24px; text-align: center; color: #ffffff;">
              <div style="font-size: 32px; margin-bottom: 6px;">💌</div>
              <h2 style="margin: 0; font-size: 18px; font-weight: 800;">CẢM ƠN BẠN ĐÃ GỬI PHẢN HỒI!</h2>
            </div>
            <div style="padding: 20px; color: #334155; font-size: 14px; line-height: 1.6;">
              <p>Chào <strong>${name}</strong>,</p>
              <p>Ban Quản Trị Meowlish đã nhận được góp ý của bạn về: <strong>"${subject}"</strong>.</p>
              <p>Mỗi ý kiến đóng góp của bạn là động lực vô cùng quý giá để đội ngũ phát triển hoàn thiện giao diện, tối ưu tính năng và mang lại trải nghiệm học tiếng Anh thú vị nhất cho cộng đồng học viên.</p>
              <p>Chúng mình sẽ xem xét cẩn thận và phản hồi sớm nhất có thể nếu cần thêm thông tin.</p>
              <div style="background: #f8fafc; border-radius: 12px; padding: 12px; border: 1px dashed #cbd5e1; font-size: 12px; color: #64748b; margin-top: 16px;">
                💡 <em>Mẹo học tập: Hãy tiếp tục nuôi dưỡng chuỗi ngày Streak và chăm sóc thú cưng mỗi ngày để nhận thêm thật nhiều Coins thưởng nhé!</em>
              </div>
            </div>
            <div style="background: #f1f5f9; padding: 12px; text-align: center; font-size: 11px; color: #64748b;">
              Thân ái, Đội ngũ Meowlish English
            </div>
          </div>
        `,
      };
      await transporter.sendMail(userAckOptions);
      logEmail({
        recipient: email,
        subject: `Cảm ơn bạn đã đóng góp ý kiến: "${subject}"`,
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
