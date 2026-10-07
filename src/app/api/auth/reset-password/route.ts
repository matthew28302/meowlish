import { NextResponse } from 'next/server';
import { db, hashPassword, verifyPassword } from '@/lib/db';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import { logAccess, logError } from '@/lib/systemLogs';
import { persistCriticalWrite } from '@/lib/s3Sync';
import logger from '@/lib/logger';
import crypto from 'crypto';

/**
 * 60s thay vì mặc định 10s của Vercel.
 */
export const maxDuration = 60;

// POST /api/auth/reset-password
// Body: { token: string, newPassword: string }
export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || '';
  try {
    // Rate Limiting: Chống brute-force token
    const rateCheck = checkRateLimit({
      key: `reset_pwd:${clientIp}`,
      maxAttempts: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateCheck.allowed) {
      logger.warn(`Reset password rate limit reached for IP: ${clientIp}`);
      return rateLimitExceededResponse('Quá nhiều lần thử đặt lại mật khẩu. Vui lòng thử lại sau ít phút.', rateCheck.resetInSeconds);
    }

    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Thiếu token hoặc mật khẩu mới.' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Mật khẩu mới phải có ít nhất 8 ký tự.' },
        { status: 400 }
      );
    }

    // Hash token để so sánh với DB
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Tìm token trong DB
    const tokenRow = db.prepare(`
      SELECT token_hash, user_id, expires_at, used_at
      FROM password_reset_tokens
      WHERE token_hash = ?
    `).get(tokenHash) as { token_hash: string; user_id: string; expires_at: number; used_at: number | null } | undefined;

    if (!tokenRow) {
      logger.warn(`Invalid reset token attempted from IP: ${clientIp}`);
      logAccess({
        action: 'reset_password_invalid_token',
        ip: clientIp,
        user_agent: userAgent,
        status: 'failed',
        details: 'Token đặt lại mật khẩu không hợp lệ hoặc đã được dùng.',
      });
      return NextResponse.json(
        { error: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' },
        { status: 400 }
      );
    }

    // Kiểm tra token đã dùng chưa
    if (tokenRow.used_at) {
      logger.warn(`Already used reset token attempted from IP: ${clientIp}`);
      return NextResponse.json(
        { error: 'Link này đã được sử dụng. Vui lòng yêu cầu link mới.' },
        { status: 400 }
      );
    }

    // Kiểm tra token hết hạn
    if (tokenRow.expires_at < Date.now()) {
      logger.warn(`Expired reset token attempted from IP: ${clientIp}`);
      return NextResponse.json(
        { error: 'Link đặt lại mật khẩu đã hết hạn (60 phút). Vui lòng yêu cầu link mới.' },
        { status: 400 }
      );
    }

    const userId = tokenRow.user_id;

    // Lấy thông tin user
    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(userId) as { id: string; username: string; role?: string } | undefined;

    if (!user) {
      logger.error(`User not found for valid reset token: ${userId}`);
      return NextResponse.json(
        { error: 'Tài khoản không tồn tại.' },
        { status: 404 }
      );
    }

    // Admin không được reset qua cổng công khai
    if (user.role === 'admin' || user.username === 'admin') {
      return NextResponse.json(
        { error: 'Tài khoản Quản trị viên chỉ có thể quản lý tại cổng bảo mật /duahau.' },
        { status: 403 }
      );
    }

    // Cập nhật mật khẩu + đánh dấu token đã dùng + cập nhật password_changed_at
    const newHash = hashPassword(newPassword);

    const applyChanges = () => {
      const tx = db.transaction(() => {
        // 1. Cập nhật mật khẩu user
        db.prepare('UPDATE users SET password_hash = ?, password_changed_at = ? WHERE id = ?')
          .run(newHash, Date.now(), userId);
        // 2. Đánh dấu token đã dùng
        db.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE token_hash = ?')
          .run(Date.now(), tokenHash);
      });
      tx();
    };

    const verifyChanges = () => {
      const u = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as { password_hash: string } | undefined;
      const t = db.prepare('SELECT used_at FROM password_reset_tokens WHERE token_hash = ?').get(tokenHash) as { used_at: number | null } | undefined;
      return Boolean(
        u && verifyPassword(newPassword, u.password_hash).ok &&
        t && t.used_at !== null
      );
    };

    const persistResult = await persistCriticalWrite(
      `đặt lại mật khẩu @${user.username}`,
      applyChanges,
      verifyChanges
    );

    if (!persistResult.persisted) {
      logger.error(`Reset password @${user.username} không lưu được lên Filebase sau ${persistResult.attempts} lần thử.`);
      return NextResponse.json(
        { error: 'Chưa lưu được mật khẩu mới lên máy chủ. Vui lòng thử lại sau ít phút!' },
        { status: 503 }
      );
    }

    logger.info(`Password successfully reset for user: ${user.username}`);

    logAccess({
      user_id: user.id,
      username: user.username,
      action: 'reset_password_success',
      ip: clientIp,
      user_agent: userAgent,
      status: 'success',
      details: `Đã đặt lại mật khẩu qua link một lần`,
    });

    return NextResponse.json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập với mật khẩu mới.',
    });
  } catch (err: unknown) {
    logger.error('Unexpected error in POST /api/auth/reset-password', { error: err });
    logError({
      endpoint: 'POST /api/auth/reset-password',
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : null,
      ip: clientIp,
      severity: 'error',
    });
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}