import { NextResponse } from 'next/server';
import { db, hashPassword, verifyDbIntegrity } from '@/lib/db';
import { getSyncStatus, uploadDbToS3, syncDbToS3Now } from '@/lib/s3Sync';
import { verifyAdminToken } from '@/lib/adminAuth';
import { getClientIp } from '@/lib/rateLimit';
import { logAccess, logError } from '@/lib/systemLogs';
import logger from '@/lib/logger';

// Helper: Verify admin access from authorization header, request body, or HttpOnly cookie
function verifyAdmin(request: Request, authHeader?: string | null, adminSecret?: string | null): boolean {
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (verifyAdminToken(token)) return true;
  }
  if (adminSecret && verifyAdminToken(adminSecret)) return true;

  // Check HttpOnly Cookie duahau_admin_session
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/duahau_admin_session=([^;]+)/);
  if (match && verifyAdminToken(decodeURIComponent(match[1]))) return true;

  return false;
}

// GET: Lấy toàn bộ danh sách thành viên và thống kê hệ thống cho trang Quản Trị Dưa Hấu
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const tokenParam = searchParams.get('token') || searchParams.get('adminSecret');

    if (!verifyAdmin(request, authHeader, tokenParam)) {
      return NextResponse.json({ error: 'Truy cập bị từ chối. Vui lòng xác thực tài khoản quản trị qua 2FA.' }, { status: 401 });
    }

    // Lấy danh sách users kèm thông tin pet
    const users = db.prepare(`
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.display_name, 
        u.avatar, 
        u.streak, 
        u.exp, 
        u.level, 
        u.coins, 
        u.role, 
        u.status, 
        u.two_factor_enabled,
        u.email_verified,
        u.last_active_date, 
        u.created_at,
        p.pet_type,
        p.pet_name,
        p.level AS pet_level,
        p.selected_habitat
      FROM users u
      LEFT JOIN user_pets p ON u.id = p.user_id
      ORDER BY u.role DESC, u.created_at DESC
    `).all();

    // Thống kê tổng quan
    const totalUsers = users.length;
    const activeUsers = users.filter((u: any) => u.status !== 'disabled').length;
    const disabledUsers = users.filter((u: any) => u.status === 'disabled').length;
    const totalCoins = users.reduce((sum: number, u: any) => sum + (u.coins || 0), 0);

    // Thông tin đồng bộ Filebase S3
    let s3Status = null;
    try {
      s3Status = await getSyncStatus();
    } catch (s3Err) {
      logger.warn('[Admin API] Could not get S3 status:', { error: s3Err });
    }

    // Kiểm tra toàn vẹn cơ sở dữ liệu SQLite
    const dbIntegrity = verifyDbIntegrity();

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        disabledUsers,
        totalCoins,
        s3Status,
        dbIntegrity,
      },
      users,
    });
  } catch (err: unknown) {
    logger.error('Error in GET /api/admin/users:', { error: err });
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Thực hiện các tác vụ quản trị (Khóa/Mở khóa, Set Coin, Set Level, Đổi mật khẩu, Sao lưu S3)
export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || '';
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    const { adminSecret, token, action, targetUserId, coins, level, exp, newPassword } = body;

    if (!verifyAdmin(request, authHeader, token || adminSecret)) {
      logAccess({
        username: 'admin',
        action: 'admin_unauthorized_action',
        ip: clientIp,
        user_agent: userAgent,
        status: 'failed',
        details: `Cố gắng thực hiện ${action} nhưng không có token hợp lệ`,
      });
      return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác quản trị này. Vui lòng xác thực 2FA.' }, { status: 401 });
    }

    // 1. ACTION: SAO LƯU THỦ CÔNG LÊN FILEBASE S3 TỪ TRANG QUẢN TRỊ
    if (action === 'trigger_backup') {
      const ok = await syncDbToS3Now();
      const s3Status = await getSyncStatus();
      logAccess({
        username: 'admin',
        action: 'admin_trigger_backup',
        ip: clientIp,
        user_agent: userAgent,
        status: ok ? 'success' : 'failed',
        details: ok ? 'Sao lưu dữ liệu thủ công lên Filebase S3 thành công' : 'Sao lưu lên Filebase S3 thất bại',
      });
      return NextResponse.json({
        success: ok,
        message: ok ? 'Đã sao lưu cơ sở dữ liệu lên Filebase S3 thành công 100%! 🚀' : (s3Status.lastSyncMessage || 'Sao lưu lên Filebase S3 thất bại.'),
        s3Status,
      });
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Thiếu ID người dùng cần thao tác.' }, { status: 400 });
    }

    const targetUser = db.prepare('SELECT id, username, role, status FROM users WHERE id = ?').get(targetUserId) as any;
    if (!targetUser) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng này trong hệ thống.' }, { status: 404 });
    }

    // Không cho phép vô hiệu hóa hoặc xóa tài khoản root admin
    if (targetUser.username === 'admin' && (action === 'toggle_status' || action === 'delete_user')) {
      return NextResponse.json({ error: 'Không thể khóa hoặc xóa tài khoản Root Admin!' }, { status: 403 });
    }

    // 2. ACTION: KHÓA / MỞ KHÓA TÀI KHOẢN (ENABLE / DISABLE)
    if (action === 'toggle_status') {
      const nextStatus = targetUser.status === 'disabled' ? 'active' : 'disabled';
      db.prepare('UPDATE users SET status = ? WHERE id = ?').run(nextStatus, targetUserId);

      // Nếu vô hiệu hóa, dọn dẹp các phiên xác thực OTP tạm thời
      if (nextStatus === 'disabled') {
        try {
          db.prepare('DELETE FROM user_otp_sessions WHERE user_id = ?').run(targetUserId);
        } catch {}
      }

      logger.info(`Admin toggled status for user ${targetUser.username} to ${nextStatus}`);
      logAccess({
        username: 'admin',
        action: 'admin_toggle_user_status',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: `Đổi trạng thái tài khoản @${targetUser.username} (${targetUserId}) sang "${nextStatus}"`,
      });
      syncDbToS3Now().catch((err) => logger.warn('[Admin API] S3 auto-sync error:', { error: err }));
      return NextResponse.json({
        success: true,
        message: nextStatus === 'active' ? `Đã kích hoạt lại tài khoản ${targetUser.username} thành công!` : `Đã vô hiệu hóa tài khoản ${targetUser.username}. Tài khoản này sẽ bị đăng xuất ngay lập tức khỏi ứng dụng.`,
        newStatus: nextStatus,
      });
    }

    // 3. ACTION: CHỈNH SỬA SỐ COIN (SET COIN)
    if (action === 'set_coins') {
      const parsedCoins = Math.max(0, parseInt(coins, 10) || 0);
      db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(parsedCoins, targetUserId);

      logger.info(`Admin set coins for user ${targetUser.username} to ${parsedCoins}`);
      logAccess({
        username: 'admin',
        action: 'admin_set_coins',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: `Cập nhật số xu của @${targetUser.username} (${targetUserId}) thành ${parsedCoins.toLocaleString()} Coins`,
      });
      syncDbToS3Now().catch((err) => logger.warn('[Admin API] S3 auto-sync error:', { error: err }));
      return NextResponse.json({
        success: true,
        message: `Đã cập nhật số xu cho tài khoản ${targetUser.username} thành ${parsedCoins.toLocaleString()} Coins! 🪙`,
        coins: parsedCoins,
      });
    }

    // 4. ACTION: CHỈNH SỬA CẤP ĐỘ VÀ EXP (SET LEVEL)
    if (action === 'set_level') {
      const parsedLevel = Math.max(1, parseInt(level, 10) || 1);
      const parsedExp = exp !== undefined ? Math.max(0, parseInt(exp, 10) || 0) : (parsedLevel - 1) * 100;
      db.prepare('UPDATE users SET level = ?, exp = ? WHERE id = ?').run(parsedLevel, parsedExp, targetUserId);

      logger.info(`Admin set level for user ${targetUser.username} to Lv.${parsedLevel} (${parsedExp} EXP)`);
      logAccess({
        username: 'admin',
        action: 'admin_set_level',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: `Cập nhật cấp độ @${targetUser.username} (${targetUserId}) thành Lv.${parsedLevel} (${parsedExp} EXP)`,
      });
      syncDbToS3Now().catch((err) => logger.warn('[Admin API] S3 auto-sync error:', { error: err }));
      return NextResponse.json({
        success: true,
        message: `Đã cập nhật cấp độ cho tài khoản ${targetUser.username} thành Lv.${parsedLevel} (${parsedExp} EXP)! ⭐`,
        level: parsedLevel,
        exp: parsedExp,
      });
    }

    // 5. ACTION: ĐỔI MẬT KHẨU CHO USER (SET PASSWORD)
    if (action === 'set_password') {
      if (!newPassword || newPassword.trim().length < 4) {
        return NextResponse.json({ error: 'Mật khẩu mới phải có ít nhất 4 ký tự.' }, { status: 400 });
      }
      const newHash = hashPassword(newPassword.trim());
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, targetUserId);

      logger.info(`Admin reset password for user ${targetUser.username}`);
      logAccess({
        username: 'admin',
        action: 'admin_set_password',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: `Đặt lại mật khẩu cho tài khoản @${targetUser.username} (${targetUserId})`,
      });
      syncDbToS3Now().catch((err) => logger.warn('[Admin API] S3 auto-sync error:', { error: err }));
      return NextResponse.json({
        success: true,
        message: `Đã đổi mật khẩu mới cho tài khoản ${targetUser.username} thành công!`,
      });
    }

    // 6. ACTION: XÓA VĨNH VIỄN TÀI KHOẢN (DELETE USER & CASCADE CLEANUP)
    if (action === 'delete_user') {
      if (targetUser.username === 'admin' || targetUser.role === 'admin') {
        return NextResponse.json({ error: 'Không thể xóa tài khoản Quản Trị Viên!' }, { status: 403 });
      }

      // Xóa toàn bộ dữ liệu phụ thuộc trong Transaction an toàn
      const deleteUserTransaction = db.transaction((uid: string) => {
        try { db.prepare('DELETE FROM user_otp_sessions WHERE user_id = ?').run(uid); } catch {}
        try { db.prepare('DELETE FROM pet_inventory WHERE user_id = ?').run(uid); } catch {}
        try { db.prepare('DELETE FROM pet_garden_decor WHERE user_id = ?').run(uid); } catch {}
        try { db.prepare('DELETE FROM user_pets WHERE user_id = ?').run(uid); } catch {}
        try { db.prepare('DELETE FROM coin_transactions WHERE user_id = ?').run(uid); } catch {}
        try { db.prepare('DELETE FROM bookmarks WHERE user_id = ?').run(uid); } catch {}
        try { db.prepare('DELETE FROM progress WHERE user_id = ?').run(uid); } catch {}
        try { db.prepare('DELETE FROM test_results WHERE user_id = ?').run(uid); } catch {}
        db.prepare('DELETE FROM users WHERE id = ?').run(uid);
      });

      deleteUserTransaction(targetUserId);

      logger.info(`Admin deleted user ${targetUser.username} (ID: ${targetUserId})`);
      logAccess({
        username: 'admin',
        action: 'admin_delete_user',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: `Xóa vĩnh viễn tài khoản @${targetUser.username} (${targetUserId})`,
      });

      // Đồng bộ ngay lập tức lên Filebase S3
      syncDbToS3Now().catch((err) => logger.warn('[Admin API] S3 auto-sync after delete error:', { error: err }));

      return NextResponse.json({
        success: true,
        message: `Đã xóa vĩnh viễn tài khoản @${targetUser.username} (${targetUser.id}) cùng toàn bộ dữ liệu liên quan và đồng bộ lên Filebase S3!`,
      });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ.' }, { status: 400 });
  } catch (err: unknown) {
    logger.error('Error in POST /api/admin/users:', { error: err });
    logError({
      endpoint: 'POST /api/admin/users',
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : null,
      ip: clientIp,
      severity: 'error',
    });
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
