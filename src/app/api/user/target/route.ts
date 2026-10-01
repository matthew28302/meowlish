import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/userAuth';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import logger from '@/lib/logger';

// POST: Update target_exam for user
export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit({
      key: `user_target:${clientIp}`,
      maxAttempts: 30,
      windowMs: 5 * 60 * 1000,
    });
    if (!rateCheck.allowed) {
      return rateLimitExceededResponse('Quá nhiều yêu cầu thay đổi mục tiêu. Vui lòng thử lại sau ít phút!', rateCheck.resetInSeconds);
    }

    const body = await request.json();
    const { userId: rawUserId, targetExam } = body;

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

    const cleanExam = (targetExam || '').trim().toLowerCase();
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
    logger.error('Error updating target_exam', { error: err });
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
