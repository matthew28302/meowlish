import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken } from '@/lib/adminAuth';
import { getClientIp } from '@/lib/rateLimit';
import logger from '@/lib/logger';
import nodemailer from 'nodemailer';
import dns from 'dns';
import { logEmail, logAccess, logError } from '@/lib/systemLogs';
import { maskEmail } from '@/lib/userAuth';
import { syncDbToS3Now } from '@/lib/s3Sync';
import { supportReplyTemplate, mailFrom, EMAIL_BRAND } from '@/lib/emailTemplates';

/**
 * Escape ký tự đại diện của LIKE (`\`, `%`, `_`).
 *
 * Vì sao: chuỗi tìm kiếm được bọc thành `%${q}%`. Không escape thì admin gõ
 * `%` là toàn bảng bị quét (`LIKE '%%'` khớp mọi dòng) — 1 thao tác search là
 * full-table-scan. Placeholder `?` vẫn dùng như cũ: đây KHÔNG phải SQL
 * injection, chỉ là siết bề rộ cho truy vấn. Cùng cách làm với
 * `escapeLikeTerm` trong `api/dictionary/search/route.ts`.
 */
function escapeLikeTerm(rawQuery: string): string {
  return rawQuery.replace(/[\\%_]/g, '\\$1');
}

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
/**
 * 60s thay vì mặc định 10s của Vercel.
 *
 * Các route này có thể phải đẩy file SQLite ~67MB lên Filebase S3. Đo được:
 * ~5.4s ở 100Mbit/s nhưng ~26.8s ở 20Mbit/s. Trượt mặc định 10s ⇒ upload bị
 * cắt giữa chừng ⇒ dữ liệu mất. 60s là trần của gói Vercel Hobby.
 */
export const maxDuration = 60;

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
      const q = `%${escapeLikeTerm(search.trim().replace(/^#/, ''))}%`;
      conditions.push("(id LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR subject LIKE ? ESCAPE '\\' OR message LIKE ? ESCAPE '\\')");
      values.push(q, q, q, q, q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // LIMIT 100: trước đây `SELECT *` không giới hạn ⇒ một admin mở trang danh
    // sách là kéo TOÀN BỘ bảng support_messages (kèm nội dung khiếu nại dài) vào
    // RAM rồi ghi thẳng vào response. `id` là TEXT nên `created_at DESC` có thể
    // trùng nhau → thêm `id DESC` cho thứ tự ổn định giữa các lần tải.
    const messages = db.prepare(`
      SELECT * FROM support_messages
      ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT 100
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
  } catch (err: unknown) {
    // KHÔNG trả err.message thô: better-sqlite3 lộ tên bảng/cột driver.
    logger.error('Error in GET /api/admin/support', { error: err });
    logError({
      endpoint: 'GET /api/admin/support',
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : null,
      ip: getClientIp(request),
      severity: 'error',
    });
    return NextResponse.json({ error: 'Lỗi tải danh sách hỗ trợ' }, { status: 500 });
  }
}

// POST: Thao tác cập nhật trạng thái, trả lời, xóa góp ý
export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || '';
  try {
    const authHeader = request.headers.get('authorization');
    // JSON hỏng (body rỗng / cắt ngang) là lỗi CLIENT, không phải lỗi hệ thống:
    // không bắt thì `request.json()` ném SyntaxError → 500 kèm chi tiết driver.
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
    }
    const { action, ticketId, status, adminSecret } = body ?? {};
    // `replyContent` là dữ liệu client KHÔNG kiểm soát kiểu: `.trim()` trên
    // number/object ném TypeError → 500. Ép string ở biên rồi mới trim.
    const replyContent = String(body?.replyContent ?? '');

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
        // PII: KHÔNG ghi email đầy đủ vào access log (mọi call site khác đã mask,
      // vd auth/route.ts dùng `maskEmail`). Tên người gửi + mã ticket đủ để
      // tra cứu, email đã nằm sẵn trong bảng support_messages.
      details: `Phản hồi thư góp ý #${ticketId} của ${ticket.name} (${maskEmail(ticket.email)})`,
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
    // KHÔNG trả err.message thô: better-sqlite3 lộ tên bảng/cột driver.
    return NextResponse.json({ error: 'Lỗi thao tác hỗ trợ' }, { status: 500 });
  }
}
