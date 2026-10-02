import { NextResponse } from 'next/server';
import { db, sanitizeText } from '@/lib/db';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import { sendSupportNotificationEmail } from '@/lib/supportEmail';
import { logAccess, logError } from '@/lib/systemLogs';

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
    const { name, email, category, subject, message, rating, userId } = body;

    const cleanName = sanitizeText(name || '').trim().slice(0, 80);
    const cleanEmail = String(email || '').trim().toLowerCase().slice(0, 120);
    const cleanCategory = ['feedback', 'bug', 'guide', 'other'].includes(category) ? category : 'feedback';
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
      return NextResponse.json({ error: 'Vui lòng nhập tiêu đề góp ý / hỗ trợ.' }, { status: 400 });
    }

    if (!cleanMessage || cleanMessage.length < 10) {
      return NextResponse.json({ error: 'Nội dung phản hồi cần tối thiểu 10 ký tự để chúng mình hiểu rõ hơn nhé.' }, { status: 400 });
    }

    const ticketId = `sup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Lưu vào cơ sở dữ liệu SQLite
    db.prepare(`
      INSERT INTO support_messages (id, name, email, user_id, category, subject, message, rating, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')
    `).run(
      ticketId,
      cleanName,
      cleanEmail,
      userId || null,
      cleanCategory,
      cleanSubject,
      cleanMessage,
      numRating
    );

    // 2. Gửi email thông báo về email Ban Quản Trị & acknowledgement đến người dùng
    sendSupportNotificationEmail({
      name: cleanName,
      email: cleanEmail,
      category: cleanCategory,
      subject: cleanSubject,
      message: cleanMessage,
      rating: numRating,
    }).catch(() => {});

    // 3. Ghi log truy cập / thao tác
    logAccess({
      user_id: userId || null,
      username: cleanName,
      action: 'submit_support',
      ip: clientIp,
      details: `Gửi góp ý: ${cleanCategory} - "${cleanSubject}"`,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      ticketId,
      message: 'Cảm ơn bạn! Góp ý của bạn đã được gửi thành công đến Ban Quản Trị và email quản trị viên 🚀',
    });
  } catch (err: any) {
    logError({
      endpoint: 'POST /api/support',
      error_message: err?.message || 'Lỗi xử lý gửi góp ý',
      stack_trace: err?.stack,
      ip: clientIp,
    });
    return NextResponse.json({ error: 'Có lỗi xảy ra khi gửi góp ý. Vui lòng thử lại sau ít phút!' }, { status: 500 });
  }
}
