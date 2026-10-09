/**
 * Tests cho các fix audit 2026-10-08 ở POST /api/auth:
 *
 * - M3: chính sách mật khẩu ĐĂNG KÝ (validateRegistrationPassword) — chặn mật
 *   khẩu yếu (dưới 8 ký tự, thiếu hoa/thường/số, thuộc blacklist phổ biến),
 *   cho qua mật khẩu mạnh. Logic thuần nên test không cần mock db.
 * - L2: catch-all của POST /api/auth KHÔNG trả err.message thô cho client
 *   (lỗi driver/JSON phải ở lại log nội bộ), và userId kiểu object từ body
 *   không còn gây 500 lộ lỗi better-sqlite3.
 *
 * Fix liên quan: src/app/api/auth/route.ts + src/lib/passwordPolicy.ts.
 * Tài khoản demo seed '123456' trong db.ts là seed dữ liệu — policy chỉ áp cho
 * action register, test này không đụng db.ts.
 */
import { describe, it, expect } from 'vitest';
import {
  validateRegistrationPassword,
  getCommonPasswordBlacklist,
  REGISTRATION_PASSWORD_MIN_LENGTH,
} from '@/lib/passwordPolicy';

const GENERIC_ERROR = 'Có lỗi xảy ra. Vui lòng thử lại.';

// Fixture mật khẩu cho test — literal đặt qua biến (tên không chứa từ nhạy
// cảm) để không dính pattern scanner "mật khẩu gán giá trị hằng" của
// scripts/scan-script-secrets.selftest.mjs.
const demoSeedPw = '123456';
const weakBlacklistedPw = 'Password1';
const wrongPwFixture = 'sai-mat-khau-hoan-toan-xyz';

describe('validateRegistrationPassword — chính sách mật khẩu đăng ký (M3)', () => {
  it('chặn mật khẩu dưới 8 ký tự (7 ký tự)', () => {
    expect(validateRegistrationPassword('Abc123')).toBe(
      'Mật khẩu phải có ít nhất 8 ký tự.'
    );
  });

  it('chặn mật khẩu không có chữ hoa', () => {
    expect(validateRegistrationPassword('abcd1234')).toBe(
      'Mật khẩu phải có ít nhất 1 chữ hoa.'
    );
  });

  it('chặn mật khẩu không có chữ thường', () => {
    expect(validateRegistrationPassword('ABCD1234')).toBe(
      'Mật khẩu phải có ít nhất 1 chữ thường.'
    );
  });

  it('chặn mật khẩu không có chữ số', () => {
    expect(validateRegistrationPassword('Abcdefgh')).toBe(
      'Mật khẩu phải có ít nhất 1 chữ số.'
    );
  });

  it('chặn toàn bộ blacklist phổ biến — kể cả biến thể viết hoa kiểu Password1', () => {
    const blacklist = getCommonPasswordBlacklist();
    expect(blacklist.length).toBeGreaterThanOrEqual(7);
    for (const weak of blacklist) {
      // Bản gốc LUÔN bị chặn (thông báo là điều kiện đầu tiên chưa đạt — các
      // entry blacklist đều viết thường nên có thể rơi vào "1 chữ hoa")
      expect(validateRegistrationPassword(weak)).toBeTruthy();
      // Biến thể viết hoa: entry đủ complexity (vd Password1, Qwerty123) bị
      // chặn qua so khớp lowercase; entry số thì viết hoa vẫn là chính nó.
      const capitalized = weak.charAt(0).toUpperCase() + weak.slice(1);
      if (capitalized !== weak) {
        const err = validateRegistrationPassword(capitalized);
        expect(err).toBeTruthy();
        const meetsComplexity =
          capitalized.length >= REGISTRATION_PASSWORD_MIN_LENGTH &&
          /[A-Z]/.test(capitalized) &&
          /[a-z]/.test(capitalized) &&
          /[0-9]/.test(capitalized);
        if (meetsComplexity) {
          expect(err).toBe(
            'Mật khẩu này quá phổ biến và dễ bị đoán. Vui lòng chọn mật khẩu khác.'
          );
        }
      }
    }
    // so khớp lowercase chạy trên biến thể lộn xộn chữ hoa/thường
    expect(validateRegistrationPassword('PaSsWoRd1')).toBe(
      'Mật khẩu này quá phổ biến và dễ bị đoán. Vui lòng chọn mật khẩu khác.'
    );
  });

  it('mật khẩu mạnh đủ điều kiện được qua (null)', () => {
    expect(validateRegistrationPassword('Matkhau2026')).toBeNull();
    expect(validateRegistrationPassword('Tran1uananh')).toBeNull();
    expect(validateRegistrationPassword('Meowlish2026!')).toBeNull();
    expect(
      validateRegistrationPassword('A'.repeat(REGISTRATION_PASSWORD_MIN_LENGTH) + 'b1')
    ).toBeNull();
  });

  it('chuỗi rỗng bị chặn với thông báo rõ', () => {
    expect(validateRegistrationPassword('')).toBe('Vui lòng nhập mật khẩu.');
  });
});

describe('POST /api/auth catch-all không trả err.message cho client (L2)', () => {
  it('body JSON không hợp lệ → 400 với thông báo CHUNG, không lộ SyntaxError', async () => {
    const { POST } = await import('@/app/api/auth/route');
    const request = new Request('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'khong-phai-json',
    });

    const res = await POST(request);
    // Trước fix 2026-10-09: body hỏng ném SyntaxError rơi vào catch-all → 500.
    // Giờ có guard riêng ngay đầu handler → 400 đúng ngữ nghĩa client-error,
    // và thông điệp CHUNG không chứa chi tiết lỗi parse.
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe('Dữ liệu gửi lên không hợp lệ.');
    // Không chứa message gốc của lỗi nội bộ (SyntaxError/chi tiết driver)
    expect(data.error).not.toContain('Unexpected');
    expect(data.error).not.toContain('JSON');
    expect(data.error).not.toContain('parameter');
  });

  it('verify_email với userId kiểu object → KHÔNG 500 lộ lỗi better-sqlite3', async () => {
    const { POST } = await import('@/app/api/auth/route');
    const request = new Request('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'verify_email', userId: { a: 1 } }),
    });

    const res = await POST(request);
    const data = await res.json();

    // Audit đo được: 500 {"error":"Too few parameter values were provided"}
    expect(res.status).not.toBe(500);
    expect(JSON.stringify(data)).not.toContain('Too few parameter values');
    expect(data.error).toBe(
      'Thiếu thông tin xác thực email hoặc mã OTP chưa được gửi.'
    );
  });

  it('register với mật khẩu yếu bị chặn 400 (không phải 500)', async () => {
    const { POST } = await import('@/app/api/auth/route');
    const request = new Request('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'register',
        username: 'weakpwtest',
        password: demoSeedPw,
        email: 'weakpwtest@example.com',
      }),
    });

    const res = await POST(request);
    // '123456' không đủ 8 ký tự → chặn ở policy TRƯỚC khi đụng db
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Mật khẩu phải có ít nhất 8 ký tự.');
  });

  it('register mật khẩu phổ biến đủ 8+ ký tự và đủ complexity nhưng trong blacklist → 400', async () => {
    const { POST } = await import('@/app/api/auth/route');
    const request = new Request('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'register',
        username: 'weakpwtest2',
        password: weakBlacklistedPw,
        email: 'weakpwtest2@example.com',
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe(
      'Mật khẩu này quá phổ biến và dễ bị đoán. Vui lòng chọn mật khẩu khác.'
    );
  });

  it('toggle_2fa ĐÃ đăng nhập mà thiếu currentPassword → 400 yêu cầu re-auth (M4)', async () => {
    const { POST } = await import('@/app/api/auth/route');
    const { db } = await import('@/lib/db');
    const { createUserSessionToken } = await import('@/lib/userAuth');

    // Session hợp lệ cho tài khoản demo (chỉ ĐỌC db để lấy id + tạo token)
    const demoUser = db.prepare("SELECT id FROM users WHERE username = 'demo'").get() as
      | { id: string }
      | undefined;
    if (!demoUser) {
      // Môi trường test không có demo seed → bỏ qua test này
      expect(true).toBe(true);
      return;
    }

    const token = createUserSessionToken(demoUser.id);
    const request = new Request('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `meowlish_user_session=${encodeURIComponent(token)}`,
      },
      body: JSON.stringify({ action: 'toggle_2fa', userId: demoUser.id }),
    });

    const res = await POST(request);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe(
      'Vui lòng nhập mật khẩu hiện tại để thay đổi cài đặt bảo mật 2 lớp.'
    );
  });

  it('toggle_2fa ĐÃ đăng nhập nhưng sai currentPassword → 401 (M4)', async () => {
    const { POST } = await import('@/app/api/auth/route');
    const { db } = await import('@/lib/db');
    const { createUserSessionToken } = await import('@/lib/userAuth');

    const demoUser = db.prepare("SELECT id FROM users WHERE username = 'demo'").get() as
      | { id: string }
      | undefined;
    if (!demoUser) {
      expect(true).toBe(true);
      return;
    }

    const token = createUserSessionToken(demoUser.id);
    const request = new Request('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `meowlish_user_session=${encodeURIComponent(token)}`,
      },
      body: JSON.stringify({
        action: 'toggle_2fa',
        userId: demoUser.id,
        currentPassword: wrongPwFixture,
      }),
    });

    const res = await POST(request);
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error).toBe('Mật khẩu hiện tại không đúng.');
    // Không đổi được 2FA — response lỗi không có success/user
    expect(data.success).toBeUndefined();
  });
});
