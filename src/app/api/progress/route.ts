import { NextResponse } from 'next/server';
import { db, sanitizeText, consumeProgressBudget } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/userAuth';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import { syncDbToS3Now } from '@/lib/s3Sync';

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
        progress: existing || null,
      });
    }

    // `itemId` do client gửi lên nên kẻ tấn công bịa itemId mới ở mỗi request để né
    // chống trùng. Hạn mức thưởng theo ngày chặn nốt đường đó: tổng phần thưởng
    // học tập trong ngày bị giới hạn cứng, không thể vượt bằng cách bịa itemId.
    if (!consumeProgressBudget(userId, today, safeCoins, safeExp)) {
      // Hoàn tác dòng vừa chèn. Nếu không, người dùng mất luôn item này mà không
      // nhận được thưởng: lần gọi lại sẽ thành "đã hoàn thành" và không bao giờ
      // nhận được nữa.
      db.prepare('DELETE FROM progress WHERE id = ?').run(id);
      return NextResponse.json(
        {
          success: false,
          error: 'Bạn đã nhận đủ phần thưởng học tập hôm nay. Hãy quay lại vào ngày mai nhé!',
          budgetReached: true,
        },
        { status: 429 }
      );
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
      const newExp = (user.exp || 0) + safeExp;
      const newCoins = (user.coins || 0) + safeCoins;
      const newLevel = Math.floor(newExp / 200) + 1;

      let newStreak = user.streak || 1;
      if (user.last_active_date !== today) {
        newStreak = (user.streak || 0) + 1;
      }

      db.prepare(`
        UPDATE users 
        SET exp = ?, level = ?, streak = ?, coins = ?, last_active_date = ?
        WHERE id = ?
      `).run(newExp, newLevel, newStreak, newCoins, today, userId);

      // Also award pet EXP to pet if user has a pet
      try {
        const pet = db.prepare('SELECT exp FROM user_pets WHERE user_id = ?').get(userId) as { exp: number } | undefined;
        if (pet) {
          const newPetExp = (pet.exp || 0) + 8;
          const newPetLevel = Math.floor(newPetExp / 50) + 1;
          db.prepare('UPDATE user_pets SET exp = ?, level = ? WHERE user_id = ?').run(newPetExp, newPetLevel, userId);
        }
      } catch {}
    }

    const updatedUser = db.prepare('SELECT id, username, display_name, avatar, streak, exp, level, coins, target_exam, created_at FROM users WHERE id = ?').get(userId);
    syncDbToS3Now().catch(() => {});

    return NextResponse.json({
      success: true,
      user: updatedUser,
      expGained: safeExp,
      coinsGained: safeCoins,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
