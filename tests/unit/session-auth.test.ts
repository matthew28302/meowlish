/**
 * Xác thực phiên người dùng — chống giả mạo cookie.
 *
 * Lỗ hổng thật đã xác nhận trên production: `verifyUserSessionToken` có nhánh
 * `token.startsWith('user_')` gọi là "tương thích ngược phiên dev". Cookie do
 * client gửi lên nên đó là bypass hoàn toàn: đặt
 * `meowlish_user_session=<userId của nạn nhân>` là đọc/ghi được tài khoản đó.
 * Các test dưới đây dùng đúng mẫu tấn công đó.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import type {
  verifyUserSessionToken as VerifyFn,
  createUserSessionToken as CreateFn,
  getAuthenticatedUser as AuthFn,
} from '@/lib/userAuth';

// Đặt AUTH_SALT TRƯỚC khi nạp module: `userAuth` đọc biến này ở module scope.
// Nhờ vậy test không cần nhân bản secret fallback trong source — test tự nhân bản
// secret là nguyên nhân test hỏng mỗi lần ta đổi cơ chế fallback.
process.env.AUTH_SALT = 'test-only-auth-salt-0123456789abcdef';

let verifyUserSessionToken: typeof VerifyFn;
let createUserSessionToken: typeof CreateFn;
let getAuthenticatedUser: typeof AuthFn;

const SECRET = process.env.AUTH_SALT;
const sign = (payload: string) =>
  crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
const b64 = (s: string) => Buffer.from(s).toString('base64url');

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
    const payload = `user_1791298260433_rh7b:${Date.now() + 60_000}`;
    const forged = `${b64(payload)}.${sign(payload).slice(0, 63)}f`;
    expect(verifyUserSessionToken(forged)).toBeNull();
  });

  it('TỪ CHỐI token hết hạn', () => {
    const payload = `user_123:${Date.now() - 1000}`;
    expect(verifyUserSessionToken(`${b64(payload)}.${sign(payload)}`)).toBeNull();
  });

  it('TỪ CHỐI token rác, rỗng, thiếu dấu chấm', () => {
    for (const t of ['', 'abc', 'a.b', '..', 'user_1.deadbeef', null, undefined]) {
      expect(verifyUserSessionToken(t as any)).toBeNull();
    }
  });

  it('giữ được userId chứa dấu hai chấm', () => {
    const userId = 'user_x:y';
    const payload = `${userId}:${Date.now() + 60_000}`;
    expect(verifyUserSessionToken(`${b64(payload)}.${sign(payload)}`)).toBe(userId);
  });

  it('token của người dùng khác không thể dùng để đọc dữ liệu người này', () => {
    // Token hợp lệ nhưng requestedUserId trỏ sang tài khoản khác → phải chặn.
    // Dùng id demo (có thật trong DB) làm "bản thân", id khác làm "người nạn nhân".
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
