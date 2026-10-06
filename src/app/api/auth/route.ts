import { NextResponse } from 'next/server';
import { db, hashPassword, verifyPassword, sanitizeText } from '@/lib/db';
import {
  generateUserOTP,
  createUserOtpSession,
  verifyUserOtpInput,
  sendUserOtpEmail,
  maskEmail,
  createUserSessionToken,
  getAuthenticatedUser,
} from '@/lib/userAuth';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import { logAccess, logError } from '@/lib/systemLogs';
import { syncDbToS3Now, refreshIfRemoteNewer } from '@/lib/s3Sync';
import logger from '@/lib/logger';

function formatSafeUser(user: any) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return {
    ...safe,
    two_factor_enabled: Boolean(safe.two_factor_enabled),
    email_verified: Boolean(safe.email_verified),
  };
}

// GET: Lấy thông tin user theo userId hoặc username
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');

    let user = null;
    if (userId) {
      user = db.prepare(`
        SELECT id, username, email, display_name, avatar, streak, exp, level, coins, target_exam, role, status, two_factor_enabled, email_verified, created_at 
        FROM users WHERE id = ?
      `).get(userId);
    } else if (username) {
      user = db.prepare(`
        SELECT id, username, email, display_name, avatar, streak, exp, level, coins, target_exam, role, status, two_factor_enabled, email_verified, created_at 
        FROM users WHERE username = ?
      `).get(username);
    } else {
      // Default to demo
      user = db.prepare(`
        SELECT id, username, email, display_name, avatar, streak, exp, level, coins, target_exam, role, status, two_factor_enabled, email_verified, created_at 
        FROM users WHERE username = ?
      `).get('demo');
    }

    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    const targetUser = user as any;
    if (targetUser.username === 'admin' || targetUser.role === 'admin') {
      return NextResponse.json({ error: 'Tài khoản Quản trị viên chỉ được quản lý tại cổng /duahau.' }, { status: 403 });
    }

    if (targetUser.status === 'disabled') {
      return NextResponse.json({
        error: 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.',
        status: 'disabled',
      }, { status: 403 });
    }

    return NextResponse.json({ user: formatSafeUser(targetUser) });
  } catch (err: unknown) {
    logger.error('Database error in GET /api/auth', { error: err });
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Đăng ký, Đăng nhập, Xác thực 2FA, Xác thực Email, Bật/Tắt 2FA
export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || '';
  try {
    const body = await request.json();
    const { action, username, email, password, displayName, sessionId, otp, userId, enable, avatar, currentPassword, newPassword } = body;

    // Chống Spam / Brute Force cho các tác vụ Auth
    if (action === 'register') {
      const rate = checkRateLimit({ key: `auth_reg:${clientIp}`, maxAttempts: 10, windowMs: 10 * 60 * 1000 });
      if (!rate.allowed) return rateLimitExceededResponse('Bạn đã tạo tài khoản quá nhiều lần. Vui lòng thử lại sau ít phút!', rate.resetInSeconds);
    } else if (action === 'resend_email_verification' || action === 'request_email_verification') {
      const rate = checkRateLimit({ key: `auth_resend:${clientIp}`, maxAttempts: 6, windowMs: 10 * 60 * 1000 });
      if (!rate.allowed) return rateLimitExceededResponse('Tần suất gửi mã quá nhanh. Vui lòng chờ ít phút trước khi yêu cầu lại!', rate.resetInSeconds);
    } else if (action === 'verify_2fa' || action === 'verify_email') {
      const rate = checkRateLimit({ key: `auth_verify:${clientIp}`, maxAttempts: 15, windowMs: 10 * 60 * 1000 });
      if (!rate.allowed) return rateLimitExceededResponse('Đã nhập sai mã xác thực quá nhiều lần. Vui lòng chờ trước khi thử lại!', rate.resetInSeconds);
    } else if (action === 'toggle_2fa') {
      const rate = checkRateLimit({ key: `auth_toggle_2fa:${clientIp}`, maxAttempts: 10, windowMs: 10 * 60 * 1000 });
      if (!rate.allowed) return rateLimitExceededResponse('Thao tác cài đặt bảo mật quá nhanh. Vui lòng chờ vài phút!', rate.resetInSeconds);
    } else if (action === 'update_profile') {
      const rate = checkRateLimit({ key: `auth_update_profile:${clientIp}`, maxAttempts: 10, windowMs: 10 * 60 * 1000 });
      if (!rate.allowed) return rateLimitExceededResponse('Thao tác cập nhật thông tin quá nhanh. Vui lòng chờ vài phút!', rate.resetInSeconds);
    }

    // 0. ACTION: USER LOGOUT (HỦY PHIÊN BẢO MẬT & XÓA COOKIE)
    if (action === 'logout') {
      logAccess({
        user_id: userId || null,
        username: username || null,
        action: 'logout',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: 'Đăng xuất khỏi hệ thống',
      });
      const response = NextResponse.json({ success: true, message: 'Đăng xuất thành công.' });
      response.cookies.delete('meowlish_user_session');
      return response;
    }

    // 1. ACTION: VERIFY 2FA LOGIN OTP
    if (action === 'verify_2fa') {
      if (!sessionId || !otp) {
        logAccess({
          action: '2fa_verify_failed',
          ip: clientIp,
          user_agent: userAgent,
          status: 'failed',
          details: 'Thiếu mã OTP hoặc Session ID',
        });
        return NextResponse.json({ error: 'Vui lòng nhập đầy đủ mã OTP xác thực.' }, { status: 400 });
      }

      const verifyRes = verifyUserOtpInput({
        sessionId,
        inputOtp: otp,
        expectedPurpose: '2fa_login',
      });

      if (!verifyRes.valid || !verifyRes.userId) {
        logAccess({
          user_id: verifyRes.userId || null,
          action: '2fa_verify_failed',
          ip: clientIp,
          user_agent: userAgent,
          status: 'failed',
          details: verifyRes.error || 'Mã xác thực OTP không hợp lệ hoặc đã hết hạn',
        });
        return NextResponse.json({ error: verifyRes.error || 'Mã xác thực không hợp lệ.' }, { status: 400 });
      }

      const user = db.prepare(`
        SELECT id, username, email, display_name, avatar, streak, exp, level, coins, target_exam, role, status, two_factor_enabled, email_verified, created_at
        FROM users WHERE id = ?
      `).get(verifyRes.userId);

      if (!user) {
        return NextResponse.json({ error: 'Người dùng không tồn tại.' }, { status: 404 });
      }

      if ((user as any).status === 'disabled') {
        logAccess({
          user_id: (user as any).id,
          username: (user as any).username,
          action: 'login_blocked_disabled',
          ip: clientIp,
          user_agent: userAgent,
          status: 'blocked',
          details: 'Tài khoản đã bị vô hiệu hóa bởi Quản trị viên',
        });
        return NextResponse.json({
          error: 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.',
          status: 'disabled',
        }, { status: 403 });
      }

      logger.info(`User logged in via 2FA successfully: ${verifyRes.userId}`);
      logAccess({
        user_id: (user as any).id,
        username: (user as any).username,
        action: '2fa_login_success',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: 'Đăng nhập thành công qua xác thực 2FA',
      });

      const response = NextResponse.json({
        success: true,
        message: 'Xác thực 2 lớp thành công! Đăng nhập thành công.',
        user: formatSafeUser(user),
      });

      const sessionToken = createUserSessionToken((user as any).id);
      response.cookies.set('meowlish_user_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 14 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    // 2. ACTION: VERIFY EMAIL OTP (MỞ KHÓA TÍNH NĂNG)
    if (action === 'verify_email') {
      let activeSessionId = sessionId;
      if (!activeSessionId && userId) {
        const found = db.prepare(
          "SELECT id FROM user_otp_sessions WHERE user_id = ? AND purpose = 'verify_email' AND expires_at > ? ORDER BY expires_at DESC LIMIT 1"
        ).get(userId, Date.now()) as any;
        if (found) {
          activeSessionId = found.id;
        }
      }

      if (!activeSessionId || !otp || !userId) {
        logAccess({
          user_id: userId || null,
          action: 'verify_email_failed',
          ip: clientIp,
          user_agent: userAgent,
          status: 'failed',
          details: 'Thiếu thông tin xác thực email hoặc mã OTP chưa được gửi',
        });
        return NextResponse.json({ error: 'Thiếu thông tin xác thực email hoặc mã OTP chưa được gửi.' }, { status: 400 });
      }

      const verifyRes = verifyUserOtpInput({
        sessionId: activeSessionId,
        inputOtp: otp,
        expectedPurpose: 'verify_email',
      });

      if (!verifyRes.valid) {
        logAccess({
          user_id: userId,
          action: 'verify_email_failed',
          ip: clientIp,
          user_agent: userAgent,
          status: 'failed',
          details: verifyRes.error || 'Mã OTP không hợp lệ',
        });
        return NextResponse.json({ error: verifyRes.error || 'Mã OTP không hợp lệ.' }, { status: 400 });
      }

      // Mark email as verified in database
      db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(userId);
      syncDbToS3Now().catch(() => {});

      const updatedUser = db.prepare(`
        SELECT id, username, email, display_name, avatar, streak, exp, level, coins, target_exam, role, status, two_factor_enabled, email_verified, created_at
        FROM users WHERE id = ?
      `).get(userId);

      logger.info(`Email verified for user: ${userId}`);
      logAccess({
        user_id: userId,
        username: (updatedUser as any)?.username,
        action: 'verify_email_success',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: 'Xác thực email thành công - Mở khóa toàn bộ tính năng',
      });

      return NextResponse.json({
        success: true,
        message: 'Xác thực email thành công! Toàn bộ tính năng học tập và lưu tiến độ đã được mở khóa 🚀',
        user: formatSafeUser(updatedUser),
      });
    }

    // 3. ACTION: RESEND / REQUEST EMAIL VERIFICATION OTP
    if (action === 'resend_email_verification' || action === 'request_email_verification') {
      if (!userId) {
        return NextResponse.json({ error: 'Thiếu ID người dùng.' }, { status: 400 });
      }

      const user = db.prepare('SELECT id, username, email, display_name FROM users WHERE id = ?').get(userId) as any;
      if (!user) {
        return NextResponse.json({ error: 'Không tìm thấy người dùng.' }, { status: 404 });
      }

      let targetEmail = user.email;
      if ((!targetEmail || targetEmail.trim() === '') && body.email) {
        const cleanEmail = String(body.email).trim().toLowerCase();
        if (cleanEmail.includes('@') && cleanEmail.includes('.')) {
          const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(cleanEmail, userId);
          if (existing) {
            return NextResponse.json({ error: 'Email này đã được sử dụng bởi một tài khoản khác.' }, { status: 400 });
          }
          db.prepare('UPDATE users SET email = ? WHERE id = ?').run(cleanEmail, userId);
          targetEmail = cleanEmail;
        }
      }

      if (!targetEmail) {
        return NextResponse.json({ error: 'Tài khoản chưa có email. Vui lòng nhập địa chỉ email để nhận mã.' }, { status: 400 });
      }

      const newOtp = generateUserOTP();
      const newSessionId = createUserOtpSession({
        userId: user.id,
        email: targetEmail,
        purpose: 'verify_email',
        otp: newOtp,
      });

      // Gửi email
      const emailRes = await sendUserOtpEmail({
        email: targetEmail,
        otp: newOtp,
        purpose: 'verify_email',
        displayName: user.display_name,
      });

      if (!emailRes.success) {
        return NextResponse.json({
          error: `Không thể gửi email xác thực: ${emailRes.error || 'Lỗi gửi mail'}. Vui lòng thử lại sau giây lát!`,
        }, { status: 500 });
      }

      logAccess({
        user_id: user.id,
        username: user.username,
        action: 'resend_email_verification',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: `Gửi lại mã OTP xác thực email tới ${maskEmail(user.email)}`,
      });

      return NextResponse.json({
        success: true,
        sessionId: newSessionId,
        maskedEmail: maskEmail(user.email),
        message: `Mã xác thực mới đã được gửi đến email ${maskEmail(user.email)}! Vui lòng kiểm tra cả Hộp thư đến (Inbox) và Thư rác (Spam).`,
      });
    }

    // 4. ACTION: TOGGLE 2FA (BẬT / TẮT 2FA CHO TÀI KHOẢN)
    if (action === 'toggle_2fa') {
      if (!userId) {
        return NextResponse.json({ error: 'Thiếu ID người dùng.' }, { status: 400 });
      }

      // Kiểm soát phân quyền: Chỉ chính chủ sở hữu tài khoản mới được bật/tắt 2FA
      const auth = getAuthenticatedUser(request, userId);
      if (!auth.authenticated || auth.status !== 'active' || auth.userId !== userId) {
        return NextResponse.json({ error: auth.error || 'Vui lòng đăng nhập để cài đặt bảo mật.' }, { status: auth.status === 'unauthorized' ? 401 : 403 });
      }

      const user = auth.user;
      const wantEnable = Boolean(enable);

      if (wantEnable && !user.email) {
        return NextResponse.json({ error: 'Tài khoản cần có email hợp lệ trước khi bật bảo mật 2 lớp.' }, { status: 400 });
      }

      db.prepare('UPDATE users SET two_factor_enabled = ? WHERE id = ?').run(wantEnable ? 1 : 0, userId);
      syncDbToS3Now().catch(() => {});

      const updatedUser = db.prepare(`
        SELECT id, username, email, display_name, avatar, streak, exp, level, coins, target_exam, role, status, two_factor_enabled, email_verified, created_at
        FROM users WHERE id = ?
      `).get(userId);

      logger.info(`User ${user.username} toggled 2FA to ${wantEnable}`);
      logAccess({
        user_id: userId,
        username: user.username,
        action: 'toggle_2fa',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: wantEnable ? 'Bật tính năng xác thực 2 lớp (2FA)' : 'Tắt tính năng xác thực 2 lớp (2FA)',
      });

      return NextResponse.json({
        success: true,
        two_factor_enabled: wantEnable,
        message: wantEnable
          ? 'Đã kích hoạt bảo mật 2 lớp (2FA)! Mã xác thực sẽ được gửi về email khi đăng nhập.'
          : 'Đã tắt tính năng bảo mật 2 lớp.',
        user: formatSafeUser(updatedUser),
      });
    }

    // 4b. ACTION: CẬP NHẬT THÔNG TIN CÁ NHÂN (TÊN / ẢNH ĐẠI DIỆN / MẬT KHẨU)
    if (action === 'update_profile') {
      if (!userId) {
        return NextResponse.json({ error: 'Thiếu ID người dùng.' }, { status: 400 });
      }

      // Kiểm soát phân quyền: chỉ chính chủ sở hữu tài khoản mới được sửa
      const auth = getAuthenticatedUser(request, userId);
      if (!auth.authenticated || auth.status !== 'active' || auth.userId !== userId) {
        return NextResponse.json(
          { error: auth.error || 'Vui lòng đăng nhập để sửa thông tin.' },
          { status: auth.status === 'unauthorized' ? 401 : 403 }
        );
      }

      const dbUser = db.prepare(
        'SELECT id, username, display_name, avatar, password_hash FROM users WHERE id = ?'
      ).get(userId) as any;
      if (!dbUser) {
        return NextResponse.json({ error: 'Tài khoản không tồn tại.' }, { status: 404 });
      }

      const updates: string[] = [];
      const params: any[] = [];

      // a) Tên hiển thị
      if (displayName !== undefined && displayName !== null) {
        const cleanName = sanitizeText(String(displayName)).replace(/\s+/g, ' ').trim().slice(0, 30);
        if (cleanName.length < 2 || cleanName.length > 30) {
          return NextResponse.json({ error: 'Tên hiển thị phải từ 2 đến 30 ký tự.' }, { status: 400 });
        }
        if (cleanName !== dbUser.display_name) {
          updates.push('display_name = ?');
          params.push(cleanName);
        }
      }

      // b) Ảnh đại diện (emoji)
      if (avatar !== undefined && avatar !== null) {
        const cleanAvatar = String(avatar).trim();
        if (!cleanAvatar || cleanAvatar.length > 8 || /[\s<>]/.test(cleanAvatar)) {
          return NextResponse.json({ error: 'Ảnh đại diện không hợp lệ (chỉ chọn 1 emoji).' }, { status: 400 });
        }
        if (cleanAvatar !== dbUser.avatar) {
          updates.push('avatar = ?');
          params.push(cleanAvatar);
        }
      }

      // c) Đổi mật khẩu (bắt buộc nhập đúng mật khẩu hiện tại)
      if (newPassword !== undefined && newPassword !== null && String(newPassword).length > 0) {
        const cleanNew = String(newPassword).trim();
        const cleanCurrent = String(currentPassword || '');
        if (cleanNew.length < 6 || cleanNew.length > 100) {
          return NextResponse.json({ error: 'Mật khẩu mới phải từ 6 đến 100 ký tự.' }, { status: 400 });
        }
        if (!cleanCurrent) {
          return NextResponse.json({ error: 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu.' }, { status: 400 });
        }
        if (!verifyPassword(cleanCurrent, dbUser.password_hash).ok) {
          logAccess({
            user_id: userId,
            username: dbUser.username,
            action: 'update_profile',
            ip: clientIp,
            user_agent: userAgent,
            status: 'failed',
            details: 'Đổi mật khẩu thất bại: sai mật khẩu hiện tại',
          });
          return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng.' }, { status: 400 });
        }
        updates.push('password_hash = ?');
        params.push(hashPassword(cleanNew));
      }

      if (updates.length === 0) {
        return NextResponse.json({ error: 'Không có thay đổi nào để lưu.' }, { status: 400 });
      }

      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params, userId);
      void syncDbToS3Now();

      const updatedUser = db.prepare(`
        SELECT id, username, email, display_name, avatar, streak, exp, level, coins, target_exam, role, status, two_factor_enabled, email_verified, created_at
        FROM users WHERE id = ?
      `).get(userId);

      const changedFields = updates.map((u) => u.split(' =')[0]).join(', ');
      logger.info(`User ${dbUser.username} updated profile fields: ${changedFields}`);
      logAccess({
        user_id: userId,
        username: dbUser.username,
        action: 'update_profile',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: `Cập nhật thông tin cá nhân (${changedFields})`,
      });

      return NextResponse.json({
        success: true,
        message: updates.includes('password_hash = ?') ? 'Đã lưu thông tin và đổi mật khẩu thành công!' : 'Đã lưu thay đổi thông tin cá nhân!',
        user: formatSafeUser(updatedUser),
      });
    }

    // Standard Auth: Username and Password check
    const cleanUsername = (username || '').trim().toLowerCase().slice(0, 30);
    const cleanPassword = (password || '').trim().slice(0, 100);

    if (!cleanUsername || !cleanPassword) {
      logger.warn('Failed login/register attempt due to missing fields');
      return NextResponse.json(
        { error: 'Vui lòng nhập tên đăng nhập và mật khẩu' },
        { status: 400 }
      );
    }

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: 'Tên đăng nhập phải có ít nhất 3 ký tự' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      return NextResponse.json(
        { error: 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới (không dấu cách).' },
        { status: 400 }
      );
    }

    // Đăng ký: ghi bằng scheme MỚI (scrypt + salt riêng cho từng tài khoản).
    const pwdHash = hashPassword(cleanPassword);

    // 5. ACTION: REGISTER (ĐĂNG KÝ MỚI)
    if (action === 'register') {
      // Admin account cannot be registered publicly
      if (cleanUsername === 'admin') {
        return NextResponse.json({ error: 'Tên tài khoản này được bảo lưu cho Quản trị viên.' }, { status: 400 });
      }

      const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
      if (existing) {
        return NextResponse.json(
          { error: 'Tên đăng nhập này đã tồn tại, vui lòng chọn tên khác' },
          { status: 409 }
        );
      }

      const cleanEmail = (email || '').trim().toLowerCase().slice(0, 100);
      if (cleanEmail) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
          return NextResponse.json(
            { error: 'Địa chỉ email không đúng định dạng.' },
            { status: 400 }
          );
        }

        const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
        if (existingEmail) {
          return NextResponse.json(
            { error: 'Địa chỉ email này đã được sử dụng cho một tài khoản khác.' },
            { status: 409 }
          );
        }
      }

      const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const name = sanitizeText(displayName || cleanUsername).slice(0, 50);
      const today = new Date().toISOString().split('T')[0];
      const emailVerifiedStatus = cleanEmail ? 0 : 1; // Chưa xác thực nếu có email

      // Tài khoản mới nhận 1000 Coins mặc định
      db.prepare(`
        INSERT INTO users (id, username, email, password_hash, display_name, avatar, streak, last_active_date, exp, level, coins, role, status, two_factor_enabled, email_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1000, 'user', 'active', 0, ?)
      `).run(id, cleanUsername, cleanEmail || null, pwdHash, name, '🐱', 1, today, 50, 1, emailVerifiedStatus);

      // Tự động cấp thú cưng khởi đầu cho tài khoản mới
      db.prepare(`
        INSERT OR IGNORE INTO user_pets (user_id, pet_type, pet_name, level, exp, hunger, happiness, energy, selected_habitat, equipped_hat, equipped_outfit, equipped_accessory)
        VALUES (?, 'cat', 'Meowlish', 1, 0, 90, 95, 100, 'emerald_garden', 'grad_cap', 'none', 'none')
      `).run(id);

      db.prepare(`
        INSERT OR IGNORE INTO pet_inventory (id, user_id, item_id, item_type, is_equipped)
        VALUES (?, ?, 'grad_cap', 'hat', 1)
      `).run(`inv_${id}_1`, id);

      const newUser = db.prepare(`
        SELECT id, username, email, display_name, avatar, streak, exp, level, coins, target_exam, role, status, two_factor_enabled, email_verified, created_at 
        FROM users WHERE id = ?
      `).get(id);

      // Nếu có email, tự động gửi mã OTP xác thực email đầu tiên
      let verifySessionId = null;
      if (cleanEmail) {
        const otpCode = generateUserOTP();
        verifySessionId = createUserOtpSession({
          userId: id,
          email: cleanEmail,
          purpose: 'verify_email',
          otp: otpCode,
        });

        // Bắt buộc await để hoàn thành gửi SMTP trước khi kết thúc response
        const emailSendRes = await sendUserOtpEmail({
          email: cleanEmail,
          otp: otpCode,
          purpose: 'verify_email',
          displayName: name,
        });
        if (!emailSendRes.success) {
          logger.warn('[Register] Send verification email warning:', { error: emailSendRes.error });
        }
      }

      logger.info(`User registered successfully: ${cleanUsername}`, { id });
      logAccess({
        user_id: id,
        username: cleanUsername,
        action: 'register_success',
        ip: clientIp,
        user_agent: userAgent,
        status: 'success',
        details: `Đăng ký tài khoản mới: @${cleanUsername}${cleanEmail ? ` (${cleanEmail})` : ''}`,
      });

      // Bảo toàn dữ liệu người dùng mới lên Filebase S3 ngay lập tức
      syncDbToS3Now().catch(() => {});

      const response = NextResponse.json({
        success: true,
        message: cleanEmail
          ? 'Đăng ký tài khoản thành công! Bạn nhận được 1.000 Coins 🪙. Vui lòng xác thực email để mở khóa toàn bộ tính năng.'
          : 'Đăng ký tài khoản thành công! Bạn nhận được 1.000 Coins khởi đầu 🪙',
        user: formatSafeUser(newUser),
        requires_email_verification: Boolean(cleanEmail),
        verifySessionId,
      });

      const sessionToken = createUserSessionToken(id);
      response.cookies.set('meowlish_user_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 14 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    // 6. ACTION: LOGIN (ĐĂNG NHẬP NGƯỜI DÙNG)
    const loginRate = checkRateLimit({ key: `auth_login:${clientIp}`, maxAttempts: 20, windowMs: 10 * 60 * 1000 });
    if (!loginRate.allowed) {
      logger.warn(`Login rate limit exceeded for IP: ${clientIp}`);
      logAccess({
        username: cleanUsername,
        action: 'login_rate_limited',
        ip: clientIp,
        user_agent: userAgent,
        status: 'rate_limited',
        details: 'Đăng nhập sai quá nhiều lần (20 lần/10 phút)',
      });
      return rateLimitExceededResponse('Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 10 phút!', loginRate.resetInSeconds);
    }

    // TÁCH BIỆT ADMIN VÀ USER: Tài khoản Admin chỉ được đăng nhập tại /duahau
    if (cleanUsername === 'admin') {
      logger.warn(`Blocked admin login on public user form: ${cleanUsername}`);
      logAccess({
        username: 'admin',
        action: 'admin_login_public_blocked',
        ip: clientIp,
        user_agent: userAgent,
        status: 'blocked',
        details: 'Thử đăng nhập tài khoản Quản trị tại form người dùng công khai',
      });
      return NextResponse.json(
        { error: 'Tài khoản Quản trị viên (Admin) chỉ được phép đăng nhập tại cổng quản trị bảo mật (/duahau).' },
        { status: 403 }
      );
    }

    const userQuery = `
      SELECT id, username, email, password_hash, display_name, avatar, streak, exp, level, coins, target_exam, role, status, two_factor_enabled, email_verified, created_at 
      FROM users WHERE username = ?
    `;
    let user = db.prepare(userQuery).get(cleanUsername) as any;
    let pwdCheck = user ? verifyPassword(cleanPassword, user.password_hash) : { ok: false, needsRehash: false, scheme: 'unknown' as const };

    if (!user || !pwdCheck.ok) {
      // Instance này có thể đang giữ bản SQLite CŨ trong /tmp (user vừa đăng ký
      // hoặc đổi mật khẩu ở instance khác, bản mới chưa kịp về đây) → làm tươi
      // từ Filebase rồi tra lại. Hai tình huống khác nhau:
      // - KHÔNG có dòng user ⇒ instance lạnh đang giữ bản cũ ⇒ ép refresh (bỏ
      //   throttle), nếu không người dùng phải thử lại nhiều lần mới vào được.
      // - CÓ dòng nhưng hash không khớp ⇒ refresh thường (throttle 15s/instance).
      const refreshed = await refreshIfRemoteNewer(!user ? 'login-missing-user' : 'login-retry', {
        force: !user,
      });
      if (refreshed) {
        user = db.prepare(userQuery).get(cleanUsername) as any;
        pwdCheck = user ? verifyPassword(cleanPassword, user.password_hash) : { ok: false, needsRehash: false, scheme: 'unknown' as const };
      }
    }

    if (!user || !pwdCheck.ok) {
      // Phân biệt trong log nội bộ: "không có tài khoản" (DB lệch phiên bản) với
      // "sai mật khẩu" (người dùng gõ sai). Thông báo trả về vẫn chung để không
      // lộ ra tài khoản nào tồn tại.
      const reason = !user ? 'Không tìm thấy tài khoản ở instance này (DB có thể chưa đồng bộ)' : 'Mật khẩu không khớp';
      logger.warn(`Failed login attempt for username: ${cleanUsername} — ${reason}`);
      logAccess({
        username: cleanUsername,
        action: 'login_failed',
        ip: clientIp,
        user_agent: userAgent,
        status: 'failed',
        details: reason,
      });
      return NextResponse.json(
        { error: 'Tên đăng nhập hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // Tự chữa dữ liệu: tài khoản này còn hash kiểu cũ (SHA-256 + salt) nên khi
    // đăng nhập thành công ta có plaintext để nâng cấp ngay lập tức sang scrypt.
    // Nhờ vậy dữ liệu tự lành dần mà không cần reset mật khẩu cho người dùng.
    if (pwdCheck.needsRehash) {
      try {
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(cleanPassword), user.id);
        void syncDbToS3Now();
        logger.info(`[Auth] Đã nâng cấp hash mật khẩu cho @${cleanUsername} (${pwdCheck.scheme} -> scrypt)`);
      } catch (err) {
        logger.warn('[Auth] Nâng cấp hash mật khẩu thất bại (đăng nhập vẫn thành công):', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (user.role === 'admin') {
      logAccess({
        user_id: user.id,
        username: user.username,
        action: 'admin_login_public_blocked',
        ip: clientIp,
        user_agent: userAgent,
        status: 'blocked',
        details: 'Tài khoản admin bị chặn đăng nhập tại form công khai',
      });
      return NextResponse.json(
        { error: 'Tài khoản Quản trị viên (Admin) chỉ được phép đăng nhập tại cổng quản trị bảo mật (/duahau).' },
        { status: 403 }
      );
    }

    if (user.status === 'disabled') {
      logger.warn(`Blocked login attempt for disabled user: ${cleanUsername}`);
      logAccess({
        user_id: user.id,
        username: user.username,
        action: 'login_blocked_disabled',
        ip: clientIp,
        user_agent: userAgent,
        status: 'blocked',
        details: 'Tài khoản đã bị vô hiệu hóa bởi Quản trị viên',
      });
      return NextResponse.json(
        { error: 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.', status: 'disabled' },
        { status: 403 }
      );
    }

    // KIỂM TRA TÍNH NĂNG 2FA CỦA USER:
    if (Boolean(user.two_factor_enabled) && user.email) {
      const otpCode = generateUserOTP();
      const sessionId = createUserOtpSession({
        userId: user.id,
        email: user.email,
        purpose: '2fa_login',
        otp: otpCode,
      });

      // Gửi mã OTP xác thực 2FA qua email người dùng
      const emailRes = await sendUserOtpEmail({
        email: user.email,
        otp: otpCode,
        purpose: '2fa_login',
        displayName: user.display_name,
      });

      if (!emailRes.success) {
        logger.error('[User Login 2FA] Failed to send email:', { error: emailRes.error });
      }

      logger.info(`2FA required for user login: ${user.username}, email: ${user.email}`);
      logAccess({
        user_id: user.id,
        username: user.username,
        action: 'login_2fa_prompted',
        ip: clientIp,
        user_agent: userAgent,
        status: 'pending_2fa',
        details: `Yêu cầu xác thực 2FA gửi tới email ${maskEmail(user.email)}`,
      });

      return NextResponse.json({
        success: true,
        requires_2fa: true,
        sessionId,
        maskedEmail: maskEmail(user.email),
        message: `Mã xác thực 2FA 6 số đã được gửi đến email ${maskEmail(user.email)}. Vui lòng kiểm tra hộp thư!`,
      });
    }

    // Đăng nhập bình thường khi không bật 2FA
    logger.info(`User logged in successfully: ${user.username}`, { id: user.id });
    logAccess({
      user_id: user.id,
      username: user.username,
      action: 'login_success',
      ip: clientIp,
      user_agent: userAgent,
      status: 'success',
      details: `Đăng nhập thành công: @${user.username}`,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công!',
      user: formatSafeUser(user),
    });

    const sessionToken = createUserSessionToken(user.id);
    response.cookies.set('meowlish_user_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err: unknown) {
    logger.error('Error in POST /api/auth', { error: err });
    logError({
      endpoint: 'POST /api/auth',
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : null,
      ip: clientIp,
      severity: 'error',
    });
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
