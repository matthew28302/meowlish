import { NextResponse } from 'next/server';
import { db, sanitizeText, consumeProgressBudget } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/userAuth';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import { syncDbToS3Now } from '@/lib/s3Sync';
import { logError } from '@/lib/systemLogs';

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
    // KHÔNG trả err.message cho client: better-sqlite3/Postgres đều để lộ tên
    // bảng, tên cột và câu chữ driver (vd "Too few parameter values were
    // provided") ⇒ người dùng đọc được cấu trúc CSDL. Chi tiết thật đi vào
    // nhật ký lỗi hệ thống, client chỉ nhận thông điệp chung chung.
    logError({
      endpoint: 'GET /api/progress',
      error_message: err instanceof Error ? err.message : 'Lỗi không xác định khi tải tiến độ',
      stack_trace: err instanceof Error ? err.stack : null,
      ip: getClientIp(request),
    });
    return NextResponse.json({ error: 'Không thể tải tiến độ lúc này. Vui lòng thử lại sau.' }, { status: 500 });
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

    // `request.json()` ném SyntaxError khi body rỗng / bị cắt / không phải JSON
    // ⇒ trước đây thành 500 kèm câu chữ thô của Node. Giờ trả 400 có thông điệp
    // rõ ràng (body hỏng là lỗi phía client, không phải sự cố máy chủ).
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
    }
    // Body hợp lệ về JSON nhưng không phải object (`null`, số, chuỗi) — ép về
    // `{}` để rơi tiếp vào nhánh 400 "thiếu moduleType/itemId" thay vì ném
    // TypeError khi destructuring.
    if (!body || typeof body !== 'object') body = {};

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
    // Hôm qua, cùng múi giờ UTC với `today` và cùng một thời điểm gần nhất —
    // `last_active_date` lưu đúng định dạng này nên so chuỗi là đủ. Dùng để
    // phân biệt "vừa học liên tục" với "bỏ ngày rồi quay lại" khi cộng streak.
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
    //
    // Câu SELECT này giờ chỉ còn làm "cổng chặn": không ghi phần thưởng nếu dòng
    // tài khoản đã bị xoá giữa chừng. Số liệu (exp/coins/streak/last_active_date)
    // KHÔNG được đọc ra RAM nữa — mọi phép cộng nằm trong SQL (xem comment dưới).
    const userExists = db.prepare('SELECT 1 AS ok FROM users WHERE id = ?').get(userId);

    if (userExists) {
      // PHẢI cộng trong SQL, không tính trong RAM rồi ghi đè giá trị đã đọc.
      //
      // Bản trước: `SELECT coins` rồi `UPDATE SET coins = <số đã đọc>` ⇒ đọc-rồi-ghi.
      // Đo được: 5 request "hoàn thành bài" chạy song song, mỗi cái hợp lệ +50 coins
      // ⇒ kết quả 1050 thay vì 1250, mất 200 coins mà không có lỗi nào, không log.
      // Lỗi này tồn tại dù CSDL là SQLite hay Postgres.
      //
      // `streak` CŨNG dính đúng lỗi đó trước đây (`streak = ?` với số vừa đọc):
      // hai lần hoàn thành bài vượt nửa đêm chạy song song cùng đọc `streak` cũ
      // rồi cùng ghi đè ⇒ chuỗi ngày bị nhân đôi hoặc bị đặt lại. Giờ tính
      // ngay trong SQL (đọc-nhìn-ghi trong MỘT câu lệnh ⇒ không kẹp giữa).
      //
      // Thêm nhánh ELSE = 1: bản cũ chỉ có "+1", KHÔNG BAO GIỜ ngắt chuỗi — người
      // bỏ học 3 tháng rồi quay lại vẫn cộng tiếp vào chuỗi cũ (đã cộng dồn hàng
      // trăm ngày). `last_active_date` là chuỗi ngày UTC `YYYY-MM-DD` nên so
      // "hôm qua" đủ để biết có bỏ ngày hay không: hôm nay → giữ, hôm qua →
      // +1, thiếu từ hôm qua trở đi (hoặc NULL) → bắt đầu lại từ 1.
      //
      // `level` vẫn phải tính từ tổng mới nên dùng biểu thức phụ thuộc giá trị vừa
      // cập nhật — SQLite/Postgres đều tính được trong cùng câu UPDATE.
      db.prepare(`
        UPDATE users
        SET exp = exp + ?,
            level = CAST((exp + ?) / 200 AS INTEGER) + 1,
            streak = CASE
                        WHEN last_active_date = ? THEN MAX(COALESCE(streak, 0), 1)
                        WHEN last_active_date = ? THEN COALESCE(streak, 0) + 1
                        ELSE 1
                      END,
            coins = coins + ?,
            last_active_date = ?
        WHERE id = ?
      `).run(safeExp, safeExp, today, yesterday, safeCoins, today, userId);

      // Cộng EXP cho thú cưng — cũng phải cộng trong SQL, VÀ phải cộng đúng số
      // được thưởng. Bản cũ ghi thẳng hằng số 8: `exp + 8` ⇒ người học được
      // 100 EXP nhưng thú cưng chỉ nhận 8 (và `level` của pet cũng bám theo số 8).
      // `safeExp` đã clamp ở trên nên không vượt được hạn mức.
      db.prepare('UPDATE user_pets SET level = CAST((exp + ?) / 50 AS INTEGER) + 1, exp = exp + ? WHERE user_id = ?')
        .run(safeExp, safeExp, userId);
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
    // KHÔNG trả err.message cho client: better-sqlite3/Postgres để lộ tên bảng,
    // tên cột, số tham số thiếu và câu chữ driver (vd "Too few parameter values
    // were provided") — người dùng đọc lỗi đó hiểu ngay cấu trúc CSDL và có thể
    // dò ra file trên /tmp. Ghi chi tiết vào nhật ký lỗi hệ thống, client chỉ
    // nhận thông điệp chung chung.
    logError({
      endpoint: 'POST /api/progress',
      error_message: err instanceof Error ? err.message : 'Lỗi không xác định khi cập nhật tiến độ',
      stack_trace: err instanceof Error ? err.stack : null,
      ip: getClientIp(request),
    });
    return NextResponse.json(
      { error: 'Không thể lưu tiến độ lúc này. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
