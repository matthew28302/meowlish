import { NextResponse } from 'next/server';
import { db, sanitizeText, consumeProgressBudget } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/userAuth';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import { syncDbToS3Now } from '@/lib/s3Sync';

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
      return NextResponse.json({ error: auth.error || 'Từ chối quyền truy cập.' }, { status: 403 });
    }

    const userId = auth.userId;

    const user = db.prepare('SELECT id, username, display_name, avatar, streak, exp, level, coins, target_exam, role, status, created_at FROM users WHERE id = ?').get(userId) as any;

    const progressList = db.prepare('SELECT * FROM progress WHERE user_id = ?').all(userId);
    const testResults = db.prepare('SELECT * FROM test_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(userId);
    const totalBookmarks = db.prepare('SELECT COUNT(*) as count FROM bookmarks WHERE user_id = ?').get(userId);

    return NextResponse.json({
      user,
      progress: progressList,
      testResults,
      bookmarkCount: (totalBookmarks as { count: number })?.count || 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit({
      key: `progress_post:${clientIp}`,
      maxAttempts: 60,
      windowMs: 60 * 1000,
    });
    if (!rateCheck.allowed) {
      return rateLimitExceededResponse('Tần suất cập nhật tiến độ quá nhanh. Vui lòng thử lại sau giây lát!', rateCheck.resetInSeconds);
    }

    const body = await request.json();
    const {
      userId: rawUserId,
      moduleType,
      itemId,
      score = 100,
      expGained = 20,
      coinsGained: rawCoins,
    } = body;

    const auth = getAuthenticatedUser(request, rawUserId);
    if (auth.status === 'disabled') {
      return NextResponse.json({
        error: 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.',
        status: 'disabled',
      }, { status: 403 });
    }
    if (auth.status === 'unauthorized') {
      return NextResponse.json({ error: auth.error || 'Vui lòng đăng nhập để lưu tiến độ.' }, { status: 401 });
    }
    if (auth.status === 'forbidden') {
      return NextResponse.json({ error: auth.error || 'Từ chối quyền cập nhật tiến độ cho tài khoản khác (IDOR).' }, { status: 403 });
    }

    const userId = auth.userId;

    // Security check: Chặn tài khoản chưa xác thực email nếu có email
    const userCheck = db.prepare('SELECT status, email, email_verified FROM users WHERE id = ?').get(userId) as any;
    if (userCheck && userCheck.status === 'disabled') {
      return NextResponse.json({
        error: 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.',
        status: 'disabled',
      }, { status: 403 });
    }
    if (userCheck && userCheck.email && userCheck.email_verified === 0) {
      return NextResponse.json({ error: 'Vui lòng xác thực email để lưu tiến độ học tập và tích lũy Coins!' }, { status: 403 });
    }

    if (!moduleType || !itemId) {
      return NextResponse.json({ error: 'moduleType and itemId are required' }, { status: 400 });
    }

    // Làm sạch và ràng buộc số liệu chống gian lận điểm (EXP / Coins / Score exploit)
    const cleanModule = sanitizeText(moduleType).slice(0, 50);
    const cleanItem = sanitizeText(itemId).slice(0, 100);
    const safeScore = Math.min(100, Math.max(0, parseInt(score, 10) || 0));
    const safeExp = Math.min(100, Math.max(0, parseInt(expGained, 10) || 0));
    const safeCoins = Math.min(50, Math.max(0, rawCoins !== undefined ? parseInt(rawCoins, 10) || 0 : Math.max(5, Math.round(safeExp * 0.75))));

    const id = `prog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const today = new Date().toISOString().split('T')[0];

    // Upsert progress. Chỉ lần ĐẦU (tạo dòng mới) mới được cộng EXP/Coins.
    //
    // PHẢI dùng `DO NOTHING`, KHÔNG dùng `DO UPDATE`: với `DO UPDATE`, SQLite luôn
    // báo `changes = 1` kể cả khi dòng đã tồn tại (đã kiểm chứng bằng
    // scripts/check-progress-upsert.mjs: DO UPDATE → [1,1,1], DO NOTHING → [1,0,0])
    // ⇒ vòng bảo vệ dựa trên `changes` là code chết, gọi lặp vẫn farm coins vô hạn.
    const inserted =
      db
        .prepare(`
      INSERT INTO progress (id, user_id, module_type, item_id, score, status, completed_at)
      VALUES (?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, module_type, item_id) DO NOTHING
    `)
        .run(id, userId, cleanModule, cleanItem, safeScore).changes > 0;

    // Item đã hoàn thành trước đó: chỉ nâng điểm cao nhất, KHÔNG cộng thưởng và
    // KHÔNG đụng hạn mức ngày. Tiêu hạn mức ở nhánh này sẽ khiến lần gọi lại hao
    // hạn mức oan rồi nhận 429, tức người dùng mất cả item lẫn phần thưởng.
    if (!inserted) {
      db.prepare(
        'UPDATE progress SET score = MAX(score, ?) WHERE user_id = ? AND module_type = ? AND item_id = ?'
      ).run(safeScore, userId, cleanModule, cleanItem);
      const existing = db
        .prepare('SELECT id, score FROM progress WHERE user_id = ? AND module_type = ? AND item_id = ?')
        .get(userId, cleanModule, cleanItem) as { id: string; score: number } | undefined;
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        // Client dùng cờ này để KHÔNG hiện "+N coins" khi thực tế không được cộng.
        rewarded: false,
        awarded: { exp: 0, coins: 0 },
        message: 'Bạn đã hoàn thành mục này rồi — tiến độ vẫn được lưu, nhưng không cộng thưởng lần 2.',
        progress: existing || null,
      });
    }

    // `itemId` do client gửi lên nên kẻ tấn công bịa itemId mới ở mỗi request để né
    // chống trùng. Hạn mức thưởng theo ngày chặn nốt đường đó: tổng phần thưởng
    // học tập trong ngày bị giới hạn cứng, không thể vượt bằng cách bịa itemId.
    if (!consumeProgressBudget(userId, today, safeCoins, safeExp)) {
      // QUAN TRỌNG: KHÔNG xoá dòng progress vừa chèn.
      // Bản sửa trước xoá dòng này, khiến học viên mất vĩnh viễn tiến độ sau khi
      // làm bài xong, và UI không đọc `budgetReached` nên không có một dòng thông
      // báo nào. Giờ: giữ nguyên tiến độ, chỉ không cộng thưởng, và trả 200 để
      // client hiển thị đúng.
      const saved = db
        .prepare('SELECT id, score FROM progress WHERE user_id = ? AND module_type = ? AND item_id = ?')
        .get(userId, cleanModule, cleanItem) as { id: string; score: number } | undefined;
      return NextResponse.json({
        success: true,
        budgetReached: true,
        rewarded: false,
        awarded: { exp: 0, coins: 0 },
        message:
          'Hôm nay bạn đã nhận đủ phần thưởng học tập rồi. Tiến độ vẫn được lưu bình thường, ' +
          'phần thưởng sẽ hồi lại vào ngày mai.',
        progress: saved || null,
      });
    }

    // Update user EXP, streak, and coins
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as {
      exp: number;
      level: number;
      streak: number;
      coins: number;
      last_active_date: string;
    } | undefined;

    if (user) {
      let newStreak = user.streak || 1;
      if (user.last_active_date !== today) {
        newStreak = (user.streak || 0) + 1;
      }

      // PHẢI cộng trong SQL, không tính trong RAM rồi ghi đè giá trị đã đọc.
      //
      // Bản trước: `SELECT coins` rồi `UPDATE SET coins = <số đã đọc>` ⇒ đọc-rồi-ghi.
      // Đo được: 5 request "hoàn thành bài" chạy song song, mỗi cái hợp lệ +50 coins
      // ⇒ kết quả 1050 thay vì 1250, mất 200 coins mà không có lỗi nào, không log.
      // Lỗi này tồn tại dù CSDL là SQLite hay Postgres.
      //
      // `level` vẫn phải tính từ tổng mới nên dùng biểu thức phụ thuộc giá trị vừa
      // cập nhật — SQLite/Postgres đều tính được trong cùng câu UPDATE.
      db.prepare(`
        UPDATE users
        SET exp = exp + ?,
            level = CAST((exp + ?) / 200 AS INTEGER) + 1,
            streak = ?,
            coins = coins + ?,
            last_active_date = ?
        WHERE id = ?
      `).run(safeExp, safeExp, newStreak, safeCoins, today, userId);

      // Cộng EXP cho thú cưng — cũng phải cộng trong SQL.
      db.prepare('UPDATE user_pets SET level = CAST((exp + 8) / 50 AS INTEGER) + 1, exp = exp + 8 WHERE user_id = ?')
        .run(userId);
    }

    const updatedUser = db.prepare('SELECT id, username, display_name, avatar, streak, exp, level, coins, target_exam, created_at FROM users WHERE id = ?').get(userId);
    syncDbToS3Now().catch(() => {});

    return NextResponse.json({
      success: true,
      user: updatedUser,
      // Số THỰC TẾ đã cộng, sau khi clamp. Client phải hiển thị đúng số này.
      //
      // Vì sao thêm `awarded`: trước đây UI tự in số phần thưởng lấy từ catalog
      // (ví dụ "+280 Coins" khi làm bộ thi) trong khi server clamp còn 50 ⇒ người
      // dùng thấy quảng cáo một đằng, nhận một nẻo. Giờ client đọc số server trả
      // về nên không còn lệch.
      rewarded: true,
      awarded: { exp: safeExp, coins: safeCoins },
      expGained: safeExp,
      coinsGained: safeCoins,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
