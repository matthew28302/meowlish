import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken } from '@/lib/adminAuth';
import { getClientIp } from '@/lib/rateLimit';
import logger from '@/lib/logger';
import nodemailer from 'nodemailer';
import dns from 'dns';
import { logEmail, logAccess, logError } from '@/lib/systemLogs';
import { syncDbToS3Now } from '@/lib/s3Sync';
import { supportReplyTemplate, mailFrom, EMAIL_BRAND } from '@/lib/emailTemplates';

async function resolveIpv4(host: string): Promise<string> {
  try {
    const ips = await dns.promises.resolve4(host);
    if (ips && ips.length > 0) return ips[0];
  } catch (e) {
    logger.warn(`[DNS] Could not resolve IPv4 for ${host}, using hostname directly`);
  }
  return host;
}

function verifyAdmin(request: Request, authHeader?: string | null, adminSecret?: string | null): boolean {
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (verifyAdminToken(token)) return true;
  }
  if (adminSecret && verifyAdminToken(adminSecret)) return true;

  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/duahau_admin_session=([^;]+)/);
  if (match && verifyAdminToken(decodeURIComponent(match[1]))) return true;

  return false;
}

// GET: Lấy danh sách góp ý & hỗ trợ
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    // KHONG nhan token qua query string (`?token=`/`?adminSecret=`): token se roi
    // vao access log, Referer khi admin mo link noi boi va lich su trinh duyet.
    // Chi chap nhan header `Authorization` va cookie httpOnly.
    const tokenParam = null;

    if (!verifyAdmin(request, authHeader, tokenParam)) {
      return NextResponse.json({ error: 'Truy cập bị từ chối.' }, { status: 401 });
    }

    const status = searchParams.get('status') || 'all';
    const category = searchParams.get('category') || 'all';
    const search = searchParams.get('search') || '';

    const conditions: string[] = [];
    const values: any[] = [];

    if (status !== 'all') {
      conditions.push('status = ?');
      values.push(status);
    }

    if (category !== 'all') {
      conditions.push('category = ?');
      values.push(category);
    }

    if (search.trim()) {
      const q = `%${search.trim().replace(/^#/, '')}%`;
      conditions.push('(id LIKE ? OR name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)');
      values.push(q, q, q, q, q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const messages = db.prepare(`
      SELECT * FROM support_messages
      ${whereClause}
      ORDER BY created_at DESC
    `).all(...values);

    const counts = {
      total: (db.prepare('SELECT COUNT(*) as c FROM support_messages').get() as any)?.c || 0,
      new: (db.prepare("SELECT COUNT(*) as c FROM support_messages WHERE status = 'new'").get() as any)?.c || 0,
      processing: (db.prepare("SELECT COUNT(*) as c FROM support_messages WHERE status = 'processing'").get() as any)?.c || 0,
      resolved: (db.prepare("SELECT COUNT(*) as c FROM support_messages WHERE status = 'resolved'").get() as any)?.c || 0,
    };

    return NextResponse.json({
      success: true,
      messages,
      counts,
    });
  } catch (err: any) {
    logger.error('Error in GET /api/admin/support:', { error: err });
    return NextResponse.json({ error: err.message || 'Lỗi tải danh sách hỗ trợ' }, { status: 500 });
  }
}

// POST: Thao tác cập nhật trạng thái, trả lời, xóa góp ý
export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || '';
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    const { action, ticketId, status, replyContent, adminSecret } = body;

    if (!verifyAdmin(request, authHeader, adminSecret)) {
      logAccess({
        username: 'admin',
        action: 'admin_unauthorized_action',
        ip: clientIp,
        user_agent: userAgent,
        status: 'failed',
        details: 'Cố gắng thực hiện thao tác hỗ trợ nhưng không có token hợp lệ',
      });
      return NextResponse.json({ error: 'Truy cập bị từ chối.' }, { status: 401 });
    }

    if (!ticketId) {
      return NextResponse.json({ error: 'Thiếu mã thư góp ý (ticketId).' }, { status: 400 });
    }

    const ticket = db.prepare('SELECT * FROM support_messages WHERE id = ?').get(ticketId) as any;
    if (!ticket) {
      return NextResponse.json({ error: 'Không tìm thấy thư góp ý.' }, { status: 404 });
    }

    // 1. Cập nhật trạng thái
    if (action === 'update_status') {
      const validStatuses = ['new', 'processing', 'resolved'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Trạng thái không hợp lệ.' }, { status: 400 });
      }

      const resolvedAt = status === 'resolved' ? new Date().toISOString() : null;
      db.prepare(`
        UPDATE support_messages
        SET status = ?, resolved_at = ?
        WHERE id = ?
      `).run(status, resolvedAt, ticketId);

      logAccess({
        username: 'admin',
        action: 'admin_support_update_status',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: `Cập nhật trạng thái thư góp ý #${ticketId} sang "${status}"`,
      });

      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật trạng thái sang "${status}".`,
      });
    }

    // 2. Trả lời góp ý qua email và lưu ghi chú
    if (action === 'reply') {
      if (!replyContent || !replyContent.trim()) {
        return NextResponse.json({ error: 'Nội dung phản hồi không được để trống.' }, { status: 400 });
      }

      db.prepare(`
        UPDATE support_messages
        SET admin_reply = ?, status = 'resolved', resolved_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(replyContent.trim(), ticketId);

      logAccess({
        username: 'admin',
        action: 'admin_support_reply',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: `Phản hồi thư góp ý #${ticketId} của ${ticket.name} (${ticket.email})`,
      });

      // Gửi email phản hồi đến người dùng (chỉ presentation — không đổi logic lưu DB)
      const replyEmail = supportReplyTemplate({
        name: ticket.name,
        ticketId: String(ticket.id),
        subject: ticket.subject,
        reply: replyContent.trim(),
      });

      try {
        // Xem giải thích ở api/auth/forgot-password: repo PUBLIC nên không được
        // để dự phòng hardcode cho thông tin SMTP.
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        const smtpHost = process.env.SMTP_HOST;
        if (!smtpUser || !smtpPass || !smtpHost) {
          throw new Error('Thiếu cấu hình SMTP (SMTP_USER/SMTP_PASS/SMTP_HOST)');
        }
        const smtpPort = Number(process.env.SMTP_PORT) || 465;
        const resolvedHost = await resolveIpv4(smtpHost);

        const transporter = nodemailer.createTransport({
          host: resolvedHost,
          port: smtpPort,
          secure: true,
          auth: { user: smtpUser, pass: smtpPass },
          tls: { rejectUnauthorized: false, servername: smtpHost },
          ...({ family: 4 } as any),
        });

        await transporter.sendMail({
          from: mailFrom(smtpUser),
          to: ticket.email,
          replyTo: EMAIL_BRAND.contactEmail,
          subject: replyEmail.subject,
          html: replyEmail.html,
          text: replyEmail.text,
        });

        logEmail({
          recipient: ticket.email,
          subject: replyEmail.subject,
          purpose: 'support_admin_reply',
          status: 'sent',
        });
      } catch (mailErr: any) {
        logger.warn('[Support Reply] Email send failed:', { error: mailErr });
        logEmail({
          recipient: ticket.email,
          subject: replyEmail.subject,
          purpose: 'support_admin_reply',
          status: 'failed',
          error_message: mailErr?.message,
        });
      }

      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: 'Đã lưu phản hồi và gửi email thông báo cho học viên thành công!',
      });
    }

    // 3. Xóa thư góp ý
    if (action === 'delete') {
      db.prepare('DELETE FROM support_messages WHERE id = ?').run(ticketId);
      logAccess({
        username: 'admin',
        action: 'admin_support_delete',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: `Đã xóa thư góp ý #${ticketId}`,
      });

      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: 'Đã xóa thư góp ý thành công.',
      });
    }

    return NextResponse.json({ error: 'Action không hợp lệ.' }, { status: 400 });
  } catch (err: any) {
    logger.error('Error in POST /api/admin/support:', { error: err });
    logError({
      endpoint: 'POST /api/admin/support',
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : null,
      ip: clientIp,
      severity: 'error',
    });
    return NextResponse.json({ error: err.message || 'Lỗi thao tác hỗ trợ' }, { status: 500 });
  }
}
