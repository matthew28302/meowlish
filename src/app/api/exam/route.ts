import { NextResponse } from 'next/server';
import { db, sanitizeText } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/userAuth';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import logger from '@/lib/logger';

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
  } catch (error) {
    logger.error('Error in GET /api/exam', { error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit({
      key: `exam_post:${clientIp}`,
      maxAttempts: 30,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateCheck.allowed) {
      return rateLimitExceededResponse('Quá nhiều yêu cầu nộp bài thi. Vui lòng thử lại sau ít phút!', rateCheck.resetInSeconds);
    }

    const body = await request.json();
    const { userId: rawUserId, testId, testName, score, totalQuestions, correctCount, percentage, passed } = body;

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

    const cleanTestId = sanitizeText(testId || 'test_exam').slice(0, 100);
    const cleanTestName = sanitizeText(testName || cleanTestId || 'General Test').slice(0, 200);

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
  } catch (error) {
    logger.error('Error in POST /api/exam', { error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
