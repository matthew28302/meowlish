import { NextResponse } from 'next/server';
import { db, sanitizeText } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/userAuth';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import { sendSupportNotificationEmail } from '@/lib/supportEmail';
import { logAccess, logError } from '@/lib/systemLogs';
import { syncDbToS3Now } from '@/lib/s3Sync';

function generateRandomTicketCode(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TK-${code}`;
}

function getUniqueTicketId(): string {
  for (let i = 0; i < 15; i++) {
    const id = generateRandomTicketCode();
    const existing = db.prepare('SELECT id FROM support_messages WHERE id = ?').get(id);
    if (!existing) return id;
  }
  return `TK-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

// Cột hiển thị đầy đủ khi người dùng đã xác thực hoặc tra cứu bằng mã phiếu.
const TICKET_FULL_COLUMNS = `id, name, email, user_id, category, priority, subject, message, rating, status, admin_reply, created_at, resolved_at`;
// Cột rút gọn cho khách CHƯA đăng nhập tra cứu bằng email: không trả tên, email,
// tiêu đề, nội dung hay trả lời của admin — chỉ đủ để biết "đã có phiếu".
const TICKET_SUMMARY_COLUMNS = `id, category, priority, status, created_at, resolved_at`;

// GET: Lấy lịch sử ticket của học viên
/**
 * 60s thay vì mặc định 10s của Vercel.
 *
 * Các route này có thể phải đẩy file SQLite ~67MB lên Filebase S3. Đo được:
 * ~5.4s ở 100Mbit/s nhưng ~26.8s ở 20Mbit/s. Trượt mặc định 10s ⇒ upload bị
 * cắt giữa chừng ⇒ dữ liệu mất. 60s là trần của gói Vercel Hobby.
 */
export const maxDuration = 60;

export async function GET(request: Request) {
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit({
    key: `support_query:${clientIp}`,
    maxAttempts: 40,
    windowMs: 60 * 1000,
  });

  if (!rateCheck.allowed) {
    return rateLimitExceededResponse('Bạn thao tác tra cứu quá nhanh. Vui lòng chờ ít giây!', rateCheck.resetInSeconds);
  }

  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId')?.trim();
    const email = searchParams.get('email')?.trim().toLowerCase();
    const ticketId = searchParams.get('ticketId')?.trim();

    // Tài khoản lấy từ PHIÊN, không phải từ query. Trước đây GET không xác thực
    // gì: bất kỳ ai cũng đọc được phiếu của người khác bằng ?userId= hoặc
    // ?email= (lộ tên, email, nội dung khiếu nại và trả lời của admin).
    const auth = getAuthenticatedUser(request, requestedUserId);
    const isSession = auth.status === 'active' && !auth.isGuest;

    // 1. Tra cứu theo mã Ticket (mã nằm trong email gửi cho chủ phiếu)
    if (ticketId) {
      const cleanId = ticketId.replace(/^#/, '').trim().toUpperCase();
      const ticket = db.prepare(`
        SELECT ${TICKET_FULL_COLUMNS}
        FROM support_messages
        WHERE UPPER(id) = ? OR id = ?
      `).get(cleanId, ticketId) as any;

      if (!ticket) {
        return NextResponse.json({ success: true, tickets: [] });
      }
      // Đã đăng nhập: mã phiếu của người khác cũng không xem được.
      if (isSession && ticket.user_id && ticket.user_id !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Bạn không có quyền xem phiếu hỗ trợ này.' }, { status: 403 });
      }
      // KHÁCH CHƯA ĐĂNG NHẬP chỉ nhận metadata. Mã phiếu chỉ 4 ký tự (~1,2 triệu
      // giá trị ⇒ enum được), nên trả nguyên nội dung nghĩa là bất kỳ ai đoán
      // trúng mã là đọc được tên, email, nội dung khiếu nại và trả lời admin.
      if (!isSession) {
        return NextResponse.json({
          success: true,
          tickets: [
            {
              id: ticket.id,
              category: ticket.category,
              priority: ticket.priority,
              status: ticket.status,
              created_at: ticket.created_at,
              resolved_at: ticket.resolved_at,
            },
          ],
          redacted: true,
        });
      }
      return NextResponse.json({ success: true, tickets: [ticket] });
    }

    // 2. Đã đăng nhập → chỉ trả phiếu của chính mình, bỏ qua userId/email từ client.
    if (isSession) {
      const tickets = db.prepare(`
        SELECT ${TICKET_FULL_COLUMNS}
        FROM support_messages
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `).all(auth.userId);
      return NextResponse.json({ success: true, tickets });
    }

    // 3. Chưa đăng nhập KHÔNG được tra cứu theo userId (đó là IDOR).
    if (requestedUserId) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để xem lịch sử phiếu hỗ trợ.' },
        { status: 401 }
      );
    }

    // 4. Khách chưa đăng nhập tra cứu bằng email → chỉ metadata, không lộ nội dung.
    if (email) {
      const tickets = db.prepare(`
        SELECT ${TICKET_SUMMARY_COLUMNS}
        FROM support_messages
        WHERE LOWER(email) = ?
        ORDER BY created_at DESC
        LIMIT 50
      `).all(email);
      return NextResponse.json({ success: true, tickets, redacted: true });
    }

    return NextResponse.json({ success: true, tickets: [] });
  } catch (err: any) {
    logError({
      endpoint: 'GET /api/support',
      error_message: err?.message || 'Lỗi tra cứu lịch sử ticket',
      stack_trace: err?.stack,
      ip: clientIp,
    });
    return NextResponse.json({ error: 'Không thể tải lịch sử ticket lúc này.' }, { status: 500 });
  }
}

// POST: Tạo ticket hỗ trợ mới, lưu vào CSDL, đồng bộ S3 và gửi email xác nhận
export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit({
    key: `support_submit:${clientIp}`,
    maxAttempts: 6,
    windowMs: 10 * 60 * 1000, // 6 submissions per 10 mins
  });

  if (!rateCheck.allowed) {
    return rateLimitExceededResponse('Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau ít phút!', rateCheck.resetInSeconds);
  }

  try {
    // JSON hỏng (body rỗng / cắt ngang) là lỗi CLIENT, không phải lỗi hệ thống:
    // không bắt thì `request.json()` ném SyntaxError → 500 kèm chi tiết driver.
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
    }
    const { email, category, priority, rating } = body ?? {};

    // name/subject/message từ body là dữ liệu client KHÔNG kiểm soát kiểu:
    // `sanitizeText` gọi `.replace()` nên number/object sẽ ném TypeError → 500.
    // Ép sang string ở biên TRƯỚC khi sanitize/trim/slice (giữ nguyên mẫu
    // `String(x ?? '')` đã dùng cho email bên dưới).
    const cleanName = sanitizeText(String(body?.name ?? '')).trim().slice(0, 80);
    const cleanEmail = String(email ?? '').trim().toLowerCase().slice(0, 120);
    const cleanCategory = ['feedback', 'bug', 'guide', 'account', 'other'].includes(category) ? category : 'feedback';
    const cleanPriority = ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium';
    const cleanSubject = sanitizeText(String(body?.subject ?? '')).trim().slice(0, 150);
    const cleanMessage = sanitizeText(String(body?.message ?? '')).trim().slice(0, 3000);
    const numRating = Math.max(1, Math.min(5, Number(rating) || 5));

    if (!cleanName) {
      return NextResponse.json({ error: 'Vui lòng nhập họ và tên của bạn.' }, { status: 400 });
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: 'Vui lòng nhập địa chỉ email hợp lệ để chúng mình có thể phản hồi.' }, { status: 400 });
    }

    if (!cleanSubject) {
      return NextResponse.json({ error: 'Vui lòng nhập tiêu đề phiếu hỗ trợ / góp ý.' }, { status: 400 });
    }

    if (!cleanMessage || cleanMessage.length < 10) {
      return NextResponse.json({ error: 'Nội dung phản hồi cần tối thiểu 10 ký tự để chúng mình hiểu rõ hơn nhé.' }, { status: 400 });
    }

    // Sinh mã ticket chuẩn dạng #TK-XXXX
    const ticketId = getUniqueTicketId();

    // 1. Lưu vào cơ sở dữ liệu SQLite
    // user_id lấy từ PHIÊN đã xác thực, KHÔNG lấy từ body — nếu không, ai cũng
    // có thể đính phiếu giả vào tài khoản người khác.
    const sessionAuth = getAuthenticatedUser(request, undefined);
    const sessionUserId = sessionAuth.status === 'active' && !sessionAuth.isGuest ? sessionAuth.userId : null;

    db.prepare(`
      INSERT INTO support_messages (id, name, email, user_id, category, priority, subject, message, rating, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
    `).run(
      ticketId,
      cleanName,
      cleanEmail,
      sessionUserId,
      cleanCategory,
      cleanPriority,
      cleanSubject,
      cleanMessage,
      numRating
    );

    syncDbToS3Now().catch(() => {});

    // 2. Gửi email thông báo về email Ban Quản Trị & acknowledgement đến người dùng
    sendSupportNotificationEmail({
      ticketId,
      name: cleanName,
      email: cleanEmail,
      category: cleanCategory,
      priority: cleanPriority,
      subject: cleanSubject,
      message: cleanMessage,
      rating: numRating,
    }).catch(() => {});

    // 3. Ghi log truy cập / thao tác
    logAccess({
      user_id: sessionUserId,
      username: cleanName,
      action: 'submit_support_ticket',
      ip: clientIp,
      details: `Gửi ticket #${ticketId}: [${cleanCategory}] [${cleanPriority}] "${cleanSubject}"`,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      ticketId,
      ticketCode: `#${ticketId}`,
      message: `Cảm ơn bạn! Phiếu hỗ trợ #${ticketId} đã được gửi thành công đến Ban Quản Trị và email xác nhận đã được gửi tới ${cleanEmail} 🚀`,
    });
  } catch (err: any) {
    logError({
      endpoint: 'POST /api/support',
      error_message: err?.message || 'Lỗi xử lý gửi ticket hỗ trợ',
      stack_trace: err?.stack,
      ip: clientIp,
    });
    return NextResponse.json({ error: 'Có lỗi xảy ra khi tạo ticket hỗ trợ. Vui lòng thử lại sau ít phút!' }, { status: 500 });
  }
}
