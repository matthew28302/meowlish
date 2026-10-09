import { NextResponse } from 'next/server';
import { db, sanitizeText } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/userAuth';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import { logError } from '@/lib/systemLogs';
import logger from '@/lib/logger';

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
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    const auth = getAuthenticatedUser(request, requestedUserId);
    if (auth.status === 'disabled') {
      return NextResponse.json({
        error: 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.',
        status: 'disabled',
      }, { status: 403 });
    }
    if (auth.status === 'unauthorized') {
      return NextResponse.json({ error: auth.error || 'Vui lòng đăng nhập.' }, { status: 401 });
    }
    if (auth.status === 'forbidden') {
      return NextResponse.json({ error: auth.error || 'Từ chối quyền truy cập kết quả thi của người khác (IDOR).' }, { status: 403 });
    }

    const userId = auth.userId;

    const history = db.prepare(`
      SELECT id, test_name, score, total_questions, correct_count, details_json, created_at 
      FROM test_results 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(userId);

    // Map to the format expected by the frontend
    const formattedHistory = history.map((item: any) => {
      let details: any = {};
      try {
        details = item.details_json ? JSON.parse(item.details_json) : {};
      } catch {}

      return {
        id: item.id,
        testId: details.testId || item.test_name,
        date: item.created_at,
        score: item.score,
        totalQuestions: item.total_questions,
        correctCount: item.correct_count,
        percentage: details.percentage || 0,
        passed: details.passed || false
      };
    });

    return NextResponse.json({ success: true, history: formattedHistory });
  } catch (err: unknown) {
    // Thông báo chung cho client; chi tiết driver chỉ nằm trong log nội bộ.
    logger.error('Error in GET /api/exam', { error: err });
    logError({
      endpoint: 'GET /api/exam',
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : null,
      ip: getClientIp(request),
      severity: 'error',
    });
    return NextResponse.json({ error: 'Có lỗi xảy ra. Vui lòng thử lại.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Khai báo NGOÀI try: khối catch cũng cần clientIp để ghi logError.
  const clientIp = getClientIp(request);
  try {
    const rateCheck = checkRateLimit({
      key: `exam_post:${clientIp}`,
      maxAttempts: 30,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateCheck.allowed) {
      return rateLimitExceededResponse('Quá nhiều yêu cầu nộp bài thi. Vui lòng thử lại sau ít phút!', rateCheck.resetInSeconds);
    }

    // JSON hỏng (body rỗng / cắt ngang) là lỗi CLIENT, không phải lỗi hệ thống:
    // không bắt thì `request.json()` ném SyntaxError → 500 kèm chi tiết driver.
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
    }
    const { userId: rawUserId, testId, testName, score, totalQuestions, correctCount, percentage, passed } = body ?? {};

    const auth = getAuthenticatedUser(request, rawUserId);
    if (auth.status === 'disabled') {
      return NextResponse.json({
        error: 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.',
        status: 'disabled',
      }, { status: 403 });
    }
    if (auth.status === 'unauthorized') {
      return NextResponse.json({ error: auth.error || 'Vui lòng đăng nhập để lưu kết quả thi.' }, { status: 401 });
    }
    if (auth.status === 'forbidden') {
      return NextResponse.json({ error: auth.error || 'Từ chối quyền nộp kết quả thi cho tài khoản khác (IDOR).' }, { status: 403 });
    }

    const userId = auth.userId;

    // `testId`/`testName` từ body là dữ liệu client KHÔNG kiểm soát kiểu.
    // `sanitizeText` gọi `.replace()` nên number/object sẽ ném TypeError → 500.
    // Ép string ở biên TRƯỚC khi sanitize/slice (kể cả khi sanitizeText được
    // mở rộng sang `unknown`, đây vẫn là một chuỗi hợp lệ đã giới hạn độ dài).
    const cleanTestId = sanitizeText(String(testId || 'test_exam')).slice(0, 100);
    const cleanTestName = sanitizeText(String(testName || cleanTestId || 'General Test')).slice(0, 200);

    const safeTotal = Math.min(500, Math.max(1, parseInt(totalQuestions, 10) || 1));
    const safeCorrect = Math.min(safeTotal, Math.max(0, parseInt(correctCount, 10) || 0));
    const safeScore = Math.min(1000, Math.max(0, parseInt(score, 10) || 0));
    const safePercentage = Math.min(100, Math.max(0, parseFloat(percentage) || 0));

    const id = `exam-${userId}-${Date.now()}`;
    
    // Store percentage and passed status in details_json safely
    const details = {
      testId: cleanTestId,
      percentage: safePercentage,
      passed: Boolean(passed)
    };

    db.prepare(`
      INSERT INTO test_results (id, user_id, test_name, score, total_questions, correct_count, details_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, cleanTestName, safeScore, safeTotal, safeCorrect, JSON.stringify(details));

    const newRecord = db.prepare('SELECT created_at FROM test_results WHERE id = ?').get(id) as { created_at: string };

    return NextResponse.json({ 
      success: true, 
      exam: {
        id,
        date: newRecord?.created_at || new Date().toISOString(),
        score: safeScore,
        totalQuestions: safeTotal,
        correctCount: safeCorrect
      }
    });
  } catch (err: unknown) {
    // Thông báo chung cho client; chi tiết driver chỉ nằm trong log nội bộ.
    logger.error('Error in POST /api/exam', { error: err });
    logError({
      endpoint: 'POST /api/exam',
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : null,
      ip: clientIp,
      severity: 'error',
    });
    return NextResponse.json({ error: 'Có lỗi xảy ra. Vui lòng thử lại.' }, { status: 500 });
  }
}
