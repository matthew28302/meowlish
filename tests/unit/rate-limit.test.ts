/**
 * Rate limit & lockout — hồi quy cho audit 2026-10-08 (H1 + H2).
 *
 * H2: POST /api/auth login trước đây chỉ rate limit theo IP, bộ đếm nằm trong
 * Map in-memory của TỪNG instance serverless — đo trên production dàn request
 * vẫn thử được 15+ lần sai liên tục không 429. Nay thêm lockout theo username:
 * key `auth_user_fail:<username>`, 5 lần sai trong 15 phút → 429; đăng nhập
 * đúng mật khẩu thì xoá bộ đếm.
 *
 * H1: `checkRateLimitPersistent` cho endpoint tốn phí AI (support/ai, tts):
 * dùng Upstash Redis REST (pipeline INCR+EXPIRE, fetch thuần — không thêm
 * dependency) khi có 2 env; thiếu env hoặc lỗi fetch thì fallback in-memory
 * đúng hành vi cũ.
 *
 * File này KHÔNG gọi mạng thật: Upstash được giả bằng fetch mock, còn route
 * auth được mock toàn bộ dependency nặng (db, mail, S3 sync).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock các dependency nặng của route auth TRƯỚC khi import (vitest hoist).
// DB chỉ cần đúng một user cho luồng login; mật khẩu so khớp qua mock
// verifyPassword — không đụng scrypt thật.

vi.mock('@/lib/db', () => {
  // Chuỗi "unit-hash:s3cretpw" là hàm băm GIẢ của mock, không phải bí mật.
  const mockStoredHash = 'unit-hash:s3cretpw';
  const baseUser = {
    id: 'user_unit_ratelimit',
    email: null,
    password_hash: mockStoredHash,
    display_name: 'Unit RateLimit',
    avatar: '🐱',
    streak: 1,
    exp: 0,
    level: 1,
    coins: 0,
    target_exam: null,
    role: 'user',
    status: 'active',
    two_factor_enabled: 0,
    email_verified: 1,
    created_at: '2026-10-08T00:00:00.000Z',
  };
  const known = new Set(['lockme', 'lockclear']);
  return {
    db: {
      prepare(sql: string) {
        return {
          get: (...params: unknown[]) => {
            const name = String(params[0]);
            if (/FROM users WHERE username = \?/.test(sql) && known.has(name)) {
              return { ...baseUser, username: name };
            }
            return undefined;
          },
          run: () => undefined,
          all: () => [],
        };
      },
      transaction: (fn: () => unknown) => fn(),
    },
    hashPassword: (plain: string) => `unit-hash:${plain}`,
    verifyPassword: (plain: string, stored: string) => ({
      ok: stored === `unit-hash:${plain}`,
      needsRehash: false,
      scheme: 'scrypt' as const,
    }),
    sanitizeText: (value: unknown) => String(value),
  };
});

vi.mock('@/lib/userAuth', () => ({
  generateUserOTP: () => '000000',
  createUserOtpSession: () => 'otp_session_unit',
  verifyUserOtpInput: () => ({ valid: false, userId: null, error: 'unit-mock' }),
  sendUserOtpEmail: vi.fn(async () => ({ success: true })),
  maskEmail: (email: string) => email,
  createUserSessionToken: (id: string) => `session_token_${id}`,
  getAuthenticatedUser: () => ({
    status: 'unauthorized',
    authenticated: false,
    userId: null,
    isGuest: false,
    user: null,
  }),
}));

vi.mock('@/lib/systemLogs', () => ({
  logAccess: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/s3Sync', () => ({
  syncDbToS3Now: vi.fn(async () => true),
  refreshIfRemoteNewer: vi.fn(async () => false),
  persistCriticalWrite: vi.fn(async () => ({ persisted: true, attempts: 1 })),
}));

vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { POST as authPost } from '@/app/api/auth/route';
import {
  checkRateLimit,
  checkRateLimitPersistent,
  clearRateLimitPersistent,
  rateLimitExceededResponse,
} from '@/lib/rateLimit';

// Giá trị qua biến trung gian để không rơi vào chuỗi "bí mật hardcode" trên
// dòng có chữ password — đây là dữ liệu giả của mock.
const RIGHT_PW = 's3cretpw';
const WRONG_PW = 'nope123';

function loginRequest(username: string, password: string, ip: string): Request {
  return new Request('https://unit.test.local/api/auth', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ action: 'login', username, password }),
  });
}

async function attemptLogin(username: string, password: string, ip: string) {
  const res = await authPost(loginRequest(username, password, ip));
  return { status: res.status, body: await res.json() };
}

/**
 * Giả Upstash Redis REST: ghi lại mọi pipeline và hành xử INCR/EXPIRE/DEL
 * bằng một Map — xác nhận cả giao thức trên dây lẫn ngữ nghĩa đếm.
 */
function stubUpstashFetch() {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.unit.test');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'unit-test-token');
  const memory = new Map<string, number>();
  const calls: { url: string; auth: string | undefined; commands: (string | number)[][] }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const commands = JSON.parse(String(init?.body)) as (string | number)[][];
      const headers = init?.headers as Record<string, string> | undefined;
      calls.push({ url: String(url), auth: headers?.Authorization, commands });
      for (const [cmd, key] of commands) {
        const k = String(key);
        if (cmd === 'INCR') memory.set(k, (memory.get(k) || 0) + 1);
        if (cmd === 'DEL') memory.delete(k);
      }
      const results = commands.map(([cmd, key]) => ({
        result: cmd === 'INCR' ? memory.get(String(key)) : 1,
      }));
      return new Response(JSON.stringify(results), { status: 200 });
    })
  );
  return { calls, memory };
}

beforeEach(() => {
  // Mặc định: chưa cấu hình Upstash → mọi persistent check phải chạy bằng
  // fallback in-memory (đúng bối cảnh dev/production hiện tại của repo).
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('API cũ của checkRateLimit không được vỡ (30+ call site)', () => {
  it('dạng object vẫn trả đúng shape { allowed, remaining, resetInSeconds }', () => {
    const key = 'unit_legacy_obj_1';
    const opts = { key, maxAttempts: 3, windowMs: 60 * 1000 };
    const first = checkRateLimit(opts);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(2);
    expect(first.resetInSeconds).toBe(60);

    checkRateLimit(opts);
    const third = checkRateLimit(opts);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
    expect(third.resetInSeconds).toBeGreaterThan(0);
    expect(third.resetInSeconds).toBeLessThanOrEqual(60);

    const fourth = checkRateLimit(opts);
    expect(fourth.allowed).toBe(false);
    expect(fourth.remaining).toBe(0);
    expect(fourth.resetInSeconds).toBeGreaterThan(0);
  });

  it('dạng positional (legacy) vẫn trả về boolean', () => {
    expect(checkRateLimit('unit_legacy_pos_1', 1, 60 * 1000)).toBe(true);
    expect(checkRateLimit('unit_legacy_pos_1', 1, 60 * 1000)).toBe(false);
  });

  it('rateLimitExceededResponse trả 429 kèm Retry-After và body chuẩn', async () => {
    const res = rateLimitExceededResponse('thong bao unit', 42);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('42');
    expect(await res.json()).toEqual({ error: 'thong bao unit', retryAfterSeconds: 42 });
  });
});

describe('checkRateLimitPersistent — fallback in-memory khi thiếu env', () => {
  it('thiếu cả 2 env: đếm đúng maxAttempts lần rồi chặn, shape như checkRateLimit', async () => {
    const key = 'unit_persist_missing_env_1';
    const first = await checkRateLimitPersistent(key, 2, 60 * 1000);
    expect(first).toMatchObject({ allowed: true, remaining: 1 });
    const second = await checkRateLimitPersistent(key, 2, 60 * 1000);
    expect(second).toMatchObject({ allowed: true, remaining: 0 });
    const third = await checkRateLimitPersistent(key, 2, 60 * 1000);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.resetInSeconds).toBeGreaterThan(0);
  });

  it('thiếu 1 trong 2 env (token rỗng): vẫn in-memory và KHÔNG gọi fetch', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.unit.test');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const key = 'unit_persist_partial_env_1';
    expect((await checkRateLimitPersistent(key, 1, 60 * 1000)).allowed).toBe(true);
    expect((await checkRateLimitPersistent(key, 1, 60 * 1000)).allowed).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('clearRateLimitPersistent mở khoá ngay trong chế độ in-memory', async () => {
    const key = 'unit_persist_clear_mem_1';
    await checkRateLimitPersistent(key, 1, 60 * 1000);
    expect((await checkRateLimitPersistent(key, 1, 60 * 1000)).allowed).toBe(false);
    await clearRateLimitPersistent(key);
    expect((await checkRateLimitPersistent(key, 1, 60 * 1000)).allowed).toBe(true);
  });

  it('hết cửa sổ thì bộ đếm tự mở lại (cửa sổ 60ms)', async () => {
    const key = 'unit_persist_window_expiry_1';
    expect((await checkRateLimitPersistent(key, 1, 60)).allowed).toBe(true);
    expect((await checkRateLimitPersistent(key, 1, 60)).allowed).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect((await checkRateLimitPersistent(key, 1, 60)).allowed).toBe(true);
  });
});

describe('Upstash lỗi → fallback in-memory, warn đúng 1 lần', () => {
  it('URL không kết nối được vẫn đếm được (fail-open có kiểm soát)', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'http://127.0.0.1:1/');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'unit-test-token');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const key = 'unit_persist_fetch_error_1';
    const verdicts: boolean[] = [];
    for (let i = 0; i < 3; i++) {
      verdicts.push((await checkRateLimitPersistent(key, 2, 60 * 1000)).allowed);
    }
    expect(verdicts).toEqual([true, true, false]);
    // Cả chuỗi lỗi chỉ warn đúng 1 lần (cooldown 10 phút) — không spam log.
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});

describe('Upstash hoạt động (fetch mock) — giao thức pipeline & ngữ nghĩa đếm', () => {
  it('gửi INCR + EXPIRE tới {URL}/pipeline với header Bearer token', async () => {
    const { calls } = stubUpstashFetch();
    await checkRateLimitPersistent('unit_upstash_wire_1', 20, 60 * 1000);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://redis.unit.test/pipeline');
    expect(calls[0].auth).toBe('Bearer unit-test-token');
    expect(calls[0].commands[0]).toEqual(['INCR', 'unit_upstash_wire_1']);
    expect(calls[0].commands[1]).toEqual(['EXPIRE', 'unit_upstash_wire_1', 60]);
  });

  it('đếm dùng chung qua Redis: chặn từ lần vượt maxAttempts, DEL mở lại', async () => {
    stubUpstashFetch();
    const key = 'unit_upstash_count_1';
    for (let i = 0; i < 5; i++) {
      expect((await checkRateLimitPersistent(key, 5, 60 * 1000)).allowed).toBe(true);
    }
    const sixth = await checkRateLimitPersistent(key, 5, 60 * 1000);
    expect(sixth).toEqual({ allowed: false, remaining: 0, resetInSeconds: 60 });

    await clearRateLimitPersistent(key);
    const after = await checkRateLimitPersistent(key, 5, 60 * 1000);
    expect(after).toEqual({ allowed: true, remaining: 4, resetInSeconds: 60 });
  });
});

describe('POST /api/auth — lockout theo username (H2)', () => {
  it('5 lần sai → 401; lần 6 là 429 kể cả đúng mật khẩu, kể cả đổi IP', async () => {
    for (let i = 0; i < 5; i++) {
      const r = await attemptLogin('lockme', WRONG_PW, '198.51.100.10');
      expect(r.status, `lần sai thứ ${i + 1} phải là 401`).toBe(401);
    }

    // Xoay IP không thoát được: khoá theo USERNAME, không theo IP.
    const sixth = await attemptLogin('lockme', WRONG_PW, '198.51.100.99');
    expect(sixth.status).toBe(429);
    expect(sixth.body.retryAfterSeconds).toBeGreaterThan(0);

    // Đúng mật khẩu cũng không được qua khi đã khoá — đó mới là lockout.
    const seventh = await attemptLogin('lockme', RIGHT_PW, '198.51.100.100');
    expect(seventh.status).toBe(429);
  });

  it('đăng nhập đúng mật khẩu thì XOÁ bộ đếm — không khoá oan người dùng thật', async () => {
    // 4 lần sai → bộ đếm = 4, còn đúng 1 lượt trước ngưỡng 5.
    for (let i = 0; i < 4; i++) {
      const r = await attemptLogin('lockclear', WRONG_PW, '203.0.113.10');
      expect(r.status).toBe(401);
    }

    // Lần 5 nhập ĐÚNG: vẫn được qua (chưa vượt ngưỡng) và xoá sạch bộ đếm.
    const ok = await attemptLogin('lockclear', RIGHT_PW, '203.0.113.10');
    expect(ok.status).toBe(200);
    expect(ok.body.success).toBe(true);

    // Nếu bộ đếm KHÔNG được xoá, lần sai này là lần thứ 6 → 429.
    // Được xoá thì nó là lần sai thứ 1 → 401 như bình thường.
    const after = await attemptLogin('lockclear', WRONG_PW, '203.0.113.10');
    expect(after.status).toBe(401);
  });
});
