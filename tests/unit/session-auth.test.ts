/**
 * Xác thực phiên người dùng — chống giả mạo cookie.
 *
 * Lỗ hổng thật đã xác nhận trên production: `verifyUserSessionToken` có nhánh
 * `token.startsWith('user_')` gọi là "tương thích ngược phiên dev". Cookie do
 * client gửi lên nên đó là bypass hoàn toàn: đặt
 * `meowlish_user_session=<userId của nạn nhân>` là đọc/ghi được tài khoản đó.
 * Các test dưới đây dùng đúng mẫu tấn công đó.
 *
 * Cập nhật B1: token format mới userId:expiresAt:iat + session revocation
 * qua password_changed_at (graceful với DB cũ chưa có cột).
 */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import type {
  verifyUserSessionToken as VerifyFn,
  createUserSessionToken as CreateFn,
  getAuthenticatedUser as AuthFn,
} from '@/lib/userAuth';

// Đặt AUTH_SALT TRƯỚC khi nạp module: `userAuth` đọc biến này ở module scope.
process.env.AUTH_SALT = 'test-only-auth-salt-0123456789abcdef';

let verifyUserSessionToken: typeof VerifyFn;
let createUserSessionToken: typeof CreateFn;
let getAuthenticatedUser: typeof AuthFn;

function requestWithCookie(cookie: string | null, method = 'GET', url = 'https://x/') {
  const headers: Record<string, string> = {};
  if (cookie) headers.cookie = cookie;
  return new Request(url, { method, headers });
}

beforeAll(async () => {
  const mod = await import('@/lib/userAuth');
  verifyUserSessionToken = mod.verifyUserSessionToken;
  createUserSessionToken = mod.createUserSessionToken;
  getAuthenticatedUser = mod.getAuthenticatedUser;
});

/**
 * Đổi 1 ký tự cuối của phần chữ ký.
 *
 * Test KHÔNG tự tính HMAC bằng secret riêng: `password.test.ts` cũng sửa
 * `process.env.AUTH_SALT` và gọi `vi.resetModules()`, nên nếu hai file chạy
 * chung worker thì `SESSION_SECRET` của module có thể lệch với giá trị test dùng
 * để ký ⇒ test chập chờn theo thứ tự chạy. Sửa chữ ký trên token do chính hệ
 * thống cấp thì không còn phụ thuộc trạng thái dùng chung đó.
 */
function tamperSignature(token: string): string {
  const parts = token.split('.');
  const sig = parts[1];
  const flipped = sig.slice(0, -1) + (sig.endsWith('a') ? 'b' : 'a');
  return `${parts[0]}.${flipped}`;
}

describe('verifyUserSessionToken', () => {
  beforeAll(() => {
    // Không gọi DB trong test này.
  });

  it('chấp nhận token do chính hệ thống tạo', () => {
    const token = createUserSessionToken('user_123_abc');
    expect(verifyUserSessionToken(token)).toBe('user_123_abc');
  });

  it('TỪ CHỐI userId trần (bypass đã gỡ)', () => {
    expect(verifyUserSessionToken('user_1791298260433_rh7b')).toBeNull();
    expect(verifyUserSessionToken('user_admin_root')).toBeNull();
    expect(verifyUserSessionToken('user_demo_default')).toBeNull();
  });

  it('TỪ CHỐI token có payload hợp lệ nhưng chữ ký sai', () => {
    const valid = createUserSessionToken('user_1791298260433_rh7b');
    expect(verifyUserSessionToken(tamperSignature(valid))).toBeNull();
  });

  it('TỪ CHỐI token hết hạn', () => {
    // Đồng hồ giả để token vừa cấp bị xem là đã hết hạn, thay vì tự tính HMAC.
    vi.useFakeTimers();
    try {
      const token = createUserSessionToken('user_123');
      vi.advanceTimersByTime(15 * 24 * 60 * 60 * 1000 + 1000);
      expect(verifyUserSessionToken(token)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('TỪ CHỐI token rỗng, thiếu dấu chấm', () => {
    for (const t of ['', 'abc', 'a.b', '..', null, undefined]) {
      expect(verifyUserSessionToken(t as any)).toBeNull();
    }
  });

  it('giữ được userId chứa dấu hai chấm', () => {
    const userId = 'user_x:y';
    expect(verifyUserSessionToken(createUserSessionToken(userId))).toBe(userId);
  });

  it('token của người dùng khác không thể dùng để đọc dữ liệu người này', () => {
    // Token hợp lệ nhưng requestedUserId trỏ sang tài khoản khác → phải chặn.
    const token = createUserSessionToken('user_demo_default');
    const res = getAuthenticatedUser(
      requestWithCookie(`meowlish_user_session=${token}`),
      'user_1791298260433_rh7b'
    );
    expect(res.status).toBe('forbidden');
    expect(res.userId).toBe('user_demo_default');
  });

  it('token hợp lệ + requestedUserId của chính mình → active', () => {
    const token = createUserSessionToken('user_demo_default');
    const res = getAuthenticatedUser(requestWithCookie(`meowlish_user_session=${token}`), 'user_demo_default');
    expect(res.status).toBe('active');
    expect(res.userId).toBe('user_demo_default');
  });

  it('token hợp lệ nhưng tài khoản không tồn tại → unauthorized', () => {
    const token = createUserSessionToken('user_khong_ton_tai_zzz');
    const res = getAuthenticatedUser(
      requestWithCookie(`meowlish_user_session=${token}`),
      'user_khong_ton_tai_zzz'
    );
    expect(res.status).toBe('unauthorized');
  });
});

describe('getAuthenticatedUser — khách chưa đăng nhập', () => {
  it('không có cookie + GET: được xem demo (chỉ đọc)', () => {
    const res = getAuthenticatedUser(requestWithCookie(null, 'GET'));
    expect(res.status).toBe('active');
    expect(res.isGuest).toBe(true);
  });

  it('không có cookie + POST: bị chặn (trước đây ghi được vào tài khoản demo)', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      const res = getAuthenticatedUser(requestWithCookie(null, method));
      expect(res.status, `${method} phải bị chặn`).toBe('unauthorized');
      expect(res.isGuest).toBe(false);
    }
  });

  it('cookie giả mạo + POST: bị chặn', () => {
    const res = getAuthenticatedUser(
      requestWithCookie('meowlish_user_session=user_demo_default', 'POST')
    );
    expect(res.status).toBe('unauthorized');
  });

  it('không có cookie + yêu cầu tài khoản thật: unauthorized', () => {
    const res = getAuthenticatedUser(requestWithCookie(null, 'GET'), 'user_1791298260433_rh7b');
    expect(res.status).toBe('unauthorized');
  });
});