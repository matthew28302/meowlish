import { NextResponse } from 'next/server';
import { db, sanitizeText } from '@/lib/db';
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

// GET: Lấy lịch sử ticket của học viên theo userId, email hoặc tra cứu theo ticketId
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
    const userId = searchParams.get('userId')?.trim();
    const email = searchParams.get('email')?.trim().toLowerCase();
    const ticketId = searchParams.get('ticketId')?.trim();

    // 1. Tra cứu theo mã Ticket cụ thể
    if (ticketId) {
      const cleanId = ticketId.replace(/^#/, '').trim().toUpperCase();
      const ticket = db.prepare(`
        SELECT id, name, email, user_id, category, priority, subject, message, rating, status, admin_reply, created_at, resolved_at
        FROM support_messages
        WHERE UPPER(id) = ? OR id = ?
      `).get(cleanId, ticketId);

      return NextResponse.json({
        success: true,
        tickets: ticket ? [ticket] : [],
      });
    }

    // 2. Tra cứu theo tài khoản học viên (userId hoặc email)
    if (userId && email) {
      const tickets = db.prepare(`
        SELECT id, name, email, user_id, category, priority, subject, message, rating, status, admin_reply, created_at, resolved_at
        FROM support_messages
        WHERE user_id = ? OR LOWER(email) = ?
        ORDER BY created_at DESC
        LIMIT 50
      `).all(userId, email);
      return NextResponse.json({ success: true, tickets });
    }

    if (userId) {
      const tickets = db.prepare(`
        SELECT id, name, email, user_id, category, priority, subject, message, rating, status, admin_reply, created_at, resolved_at
        FROM support_messages
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `).all(userId);
      return NextResponse.json({ success: true, tickets });
    }

    if (email) {
      const tickets = db.prepare(`
        SELECT id, name, email, user_id, category, priority, subject, message, rating, status, admin_reply, created_at, resolved_at
        FROM support_messages
        WHERE LOWER(email) = ?
        ORDER BY created_at DESC
        LIMIT 50
      `).all(email);
      return NextResponse.json({ success: true, tickets });
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
    const body = await request.json();
    const { name, email, category, priority, subject, message, rating, userId } = body;

    const cleanName = sanitizeText(name || '').trim().slice(0, 80);
    const cleanEmail = String(email || '').trim().toLowerCase().slice(0, 120);
    const cleanCategory = ['feedback', 'bug', 'guide', 'account', 'other'].includes(category) ? category : 'feedback';
    const cleanPriority = ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium';
    const cleanSubject = sanitizeText(subject || '').trim().slice(0, 150);
    const cleanMessage = sanitizeText(message || '').trim().slice(0, 3000);
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
    db.prepare(`
      INSERT INTO support_messages (id, name, email, user_id, category, priority, subject, message, rating, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
    `).run(
      ticketId,
      cleanName,
      cleanEmail,
      userId || null,
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
      user_id: userId || null,
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
