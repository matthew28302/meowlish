import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/userAuth';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import { logError } from '@/lib/systemLogs';
import logger from '@/lib/logger';

// POST: Update target_exam for user
/**
 * 60s thay vì mặc định 10s của Vercel.
 *
 * Các route này có thể phải đẩy file SQLite ~67MB lên Filebase S3. Đo được:
 * ~5.4s ở 100Mbit/s nhưng ~26.8s ở 20Mbit/s. Trượt mặc định 10s ⇒ upload bị
 * cắt giữa chừng ⇒ dữ liệu mất. 60s là trần của gói Vercel Hobby.
 */
export const maxDuration = 60;

export async function POST(request: Request) {
  // Khai báo NGOÀI try: khối catch cũng cần clientIp để ghi logError.
  const clientIp = getClientIp(request);
  try {
    const rateCheck = checkRateLimit({
      key: `user_target:${clientIp}`,
      maxAttempts: 30,
      windowMs: 5 * 60 * 1000,
    });
    if (!rateCheck.allowed) {
      return rateLimitExceededResponse('Quá nhiều yêu cầu thay đổi mục tiêu. Vui lòng thử lại sau ít phút!', rateCheck.resetInSeconds);
    }

    // JSON hỏng (body rỗng / cắt ngang) là lỗi CLIENT, không phải lỗi hệ thống:
    // không bắt thì `request.json()` ném SyntaxError → 500 kèm chi tiết driver.
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
    }
    const { userId: rawUserId, targetExam } = body ?? {};

    const auth = getAuthenticatedUser(request, rawUserId);
    if (auth.status === 'disabled') {
      return NextResponse.json({ error: 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.' }, { status: 403 });
    }
    if (auth.status === 'unauthorized') {
      return NextResponse.json({ error: auth.error || 'Vui lòng đăng nhập để thay đổi mục tiêu học tập.' }, { status: 401 });
    }
    if (auth.status === 'forbidden') {
      return NextResponse.json({ error: auth.error || 'Bạn không có quyền sửa đổi mục tiêu của tài khoản khác (Chống IDOR).' }, { status: 403 });
    }

    const userId = auth.userId;

    // `targetExam` là dữ liệu client TÙY Ý: có thể là number/object/boolean.
    // `.trim()` trên giá trị đó ném TypeError → 500. Ép sang string ở biên,
    // và từ chối (400) nếu không phải chuỗi thay vì âm thầm chấp nhận.
    if (typeof targetExam !== 'string') {
      return NextResponse.json({ error: 'Mục tiêu học tập không hợp lệ.' }, { status: 400 });
    }
    const cleanExam = targetExam.trim().toLowerCase();
    const validTargets = ['toeic', 'vstep', 'ielts', 'toefl', 'it_work', 'daily_comm', 'it_dev', 'toeic_speaking', 'ielts_general', 'it_scrum'];
    if (!validTargets.includes(cleanExam)) {
      return NextResponse.json({ error: 'Mục tiêu học tập không hợp lệ.' }, { status: 400 });
    }

    db.prepare('UPDATE users SET target_exam = ? WHERE id = ?').run(cleanExam, userId);

    const updatedUser = db.prepare(
      'SELECT id, username, display_name, avatar, streak, exp, level, coins, target_exam, created_at FROM users WHERE id = ?'
    ).get(userId);

    logger.info(`User updated learning target to ${cleanExam}`, { userId });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      targetExam: cleanExam,
    });
  } catch (err: unknown) {
    // KHÔNG trả err.message thô: better-sqlite3 lộ tên bảng/cột, SyntaxError
    // của request.json() là chi tiết nội bộ. Chi tiết chỉ nằm trong log.
    logger.error('Error updating target_exam', { error: err });
    logError({
      endpoint: 'POST /api/user/target',
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : null,
      ip: clientIp,
      severity: 'error',
    });
    return NextResponse.json({ error: 'Có lỗi xảy ra. Vui lòng thử lại.' }, { status: 500 });
  }
}
