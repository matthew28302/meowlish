import { NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

// In-memory rate limit store — phục vụ cả `checkRateLimit` lẫn fallback của
// `checkRateLimitPersistent` khi chưa cấu hình Upstash (hoặc khi gọi lỗi).
//
// GIỚI HẠN (audit 2026-10-08, H1/H2): Map này nằm trong RAM của TỪNG instance
// serverless — Vercel có nhiều instance và chúng reset theo process, nên bộ đếm
// bị chia nhỏ: kẻ tấn công dàn request qua nhiều IP/instance vẫn vượt được hạn
// mức. Endpoint tốn phí AI (support/ai, tts) và khoá đăng nhập theo username
// vì thế phải dùng `checkRateLimitPersistent` (khoá dùng chung qua Upstash
// Redis khi có 2 biến môi trường, fallback về chính Map này khi thiếu).
const ipStore = new Map<string, RateLimitRecord>();

// Periodically clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of ipStore.entries()) {
      if (record.resetAt <= now) {
        ipStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Lấy IP thật của client.
 *
 * Vì sao KHÔNG lấy phần tử ĐẦU của `x-forwarded-for`: header này do CLIENT tự
 * gửi, còn edge/proxy chỉ APPEND thêm vào CUỐI. Kẻ tấn công đặt sẵn
 * `x-forwarded-for: 1.2.3.4` thì chuỗi thành `1.2.3.4, <IP thật>`; lấy phần tử
 * đầu là lấy giá trị do kẻ tấn công tự chọn ⇒ **đổi header mỗi request là vô
 * hiệu toàn bộ rate limit của ứng dụng**. Đã đo trên production: 70 request
 * cùng một IP giả tới endpoint giới hạn 60/phút → 0 lần nào bị 429.
 *
 * Phần tử CUỐI là giá trị do hạ tầng tin cậy thêm vào, nằm ngoài tầm kiểm soát
 * của client.
 *
 * Giới hạn: cách này chặn được giả mạo header, KHÔNG chặn được việc dồn request
 * từ nhiều IP khác nhau — việc đó cần kho đếm dùng chung giữa các instance
 * serverless: xem `checkRateLimitPersistent` bên dưới và
 * docs/security-audit-2026-10.md.
 */
export function getClientIp(request: Request): string {
  const fromPlatform = request.headers.get('x-vercel-forwarded-for');
  if (fromPlatform) {
    const parts = fromPlatform.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) return parts[parts.length - 1];
    if (parts.length === 1) return parts[0];
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp && realIp.trim()) return realIp.trim();

  return '127.0.0.1';
}

/**
 * Bộ đếm in-memory (fixed window): tạo/mở rộng bản ghi khi hết cửa sổ,
 * tăng đếm mỗi lần gọi và chặn khi vượt `maxAttempts`.
 *
 * Trả về đúng shape mà `checkRateLimit` (dạng object) đã trả từ trước — giữ
 * nguyên cả các giá trị lề (remaining có thể âm khi maxAttempts = 0) để 30+
 * call site hiện tại không đổi hành vi.
 */
function checkRateLimitMemory(
  key: string,
  maxAttempts: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = ipStore.get(key);

  if (!existing || existing.resetAt <= now) {
    ipStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, maxAttempts - existing.count);
  const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  if (existing.count > maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  return {
    allowed: true,
    remaining,
    resetInSeconds,
  };
}

/**
 * Check if a client IP has exceeded the allowed limit within windowMs.
 * Supports both object options { key, maxAttempts, windowMs } and legacy positional (key, maxAttempts, windowMs).
 */
export function checkRateLimit(
  opts: { key: string; maxAttempts: number; windowMs: number }
): RateLimitResult;
export function checkRateLimit(
  key: string,
  maxAttempts?: number,
  windowMs?: number
): boolean;
export function checkRateLimit(
  arg1: string | { key: string; maxAttempts: number; windowMs: number },
  arg2?: number,
  arg3?: number
): any {
  let key: string;
  let maxAttempts: number;
  let windowMs: number;
  let isPositional = false;

  if (typeof arg1 === 'string') {
    isPositional = true;
    key = arg1;
    maxAttempts = arg2 || 30;
    windowMs = arg3 || 60 * 1000;
  } else {
    key = arg1.key;
    maxAttempts = arg1.maxAttempts;
    windowMs = arg1.windowMs;
  }

  const result = checkRateLimitMemory(key, maxAttempts, windowMs);
  return isPositional ? result.allowed : result;
}

// ---------------------------------------------------------------------------
// Lớp bền vững: Upstash Redis REST (KHÔNG thêm dependency — fetch thuần).
//
// Tự bật khi có CẢ HAI biến môi trường (đọc MỖI lần gọi, không cache ở module
// scope, để xoay/bật-tắt env không cần deploy lại):
//   UPSTASH_REDIS_REST_URL   — vd https://meowlish-x.upstash.io
//   UPSTASH_REDIS_REST_TOKEN — REST token (không phải password Redis TCP)
//
// Thuật toán cố tình tối giản, không dùng Lua: pipeline 2 lệnh
//   INCR key        — tăng bộ đếm, trả về số lần trong cửa sổ
//   EXPIRE key <s>  — đặt lại TTL sau MỖI lần thử ⇒ cửa sổ "lăn": bộ đếm chỉ
//                     tự xoá sau <s> giây NGHỈ hoàn toàn, tức spam liên tục
//                     thì bị khoá vô hạn thời gian (an toàn cho endpoint tốn
//                     phí), ngừng thử thì <s> giây sau mở lại.
//
// Lỗi mạng/HTTP (timeout, token sai, Redis giật) ⇒ fallback in-memory + warn
// đúng 1 lần mỗi 10 phút (không spam log). Rate limit fail-open có kiểm soát:
// tệ nhất là trở về đúng hành vi cũ (Map theo instance) — không làm gãy login.
// ---------------------------------------------------------------------------

const UPSTASH_TIMEOUT_MS = 2000;
const UPSTASH_WARN_COOLDOWN_MS = 10 * 60 * 1000;

let lastUpstashWarnAt = 0;

function getUpstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return { url, token };
  return null;
}

function warnUpstashFailureOnce(err: unknown): void {
  const now = Date.now();
  if (now - lastUpstashWarnAt < UPSTASH_WARN_COOLDOWN_MS) return;
  lastUpstashWarnAt = now;
  console.warn(
    '[rate-limit] Upstash Redis không dùng được — fallback về limiter in-memory ' +
      '(bộ đếm bị chia nhỏ theo từng instance, hạn mức sẽ lỏng hơn mong đợi):',
    err instanceof Error ? err.message : err
  );
}

/**
 * Gửi một pipeline lệnh tới Upstash Redis REST API bằng fetch thuần.
 * Trả về mảng kết quả theo thứ tự lệnh, hoặc `null` khi: chưa cấu hình env,
 * lỗi mạng/HTTP, hoặc phản hồi không đúng shape. `null` nghĩa là "bên gọi hãy
 * dùng fallback in-memory".
 */
async function upstashPipeline(commands: (string | number)[][]): Promise<unknown[] | null> {
  const cfg = getUpstashConfig();
  if (!cfg) return null;

  try {
    // Chặn rate limit không được treo cả request: Redis giật thì 2s sau đã
    // fallback, login vẫn chạy. AbortSignal.timeout không có ở mọi runtime
    // cũ nên kiểm tra trước khi dùng.
    let signal: AbortSignal | undefined;
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      signal = AbortSignal.timeout(UPSTASH_TIMEOUT_MS);
    }

    const res = await fetch(`${cfg.url.replace(/\/+$/, '')}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
      // POST không bị Next cache, nhưng ghi rõ để sau này không ai "tối ưu"
      // làm cache luôn lệnh INCR.
      cache: 'no-store',
      ...(signal ? { signal } : {}),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} từ Upstash`);

    const data = await res.json();
    const rows = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.result)
        ? (data as any).result
        : null;
    if (!rows || rows.length < commands.length) {
      throw new Error('Phản hồi pipeline không đúng shape');
    }
    for (const row of rows) {
      if (row && typeof row === 'object' && 'error' in row) {
        throw new Error(String((row as { error?: unknown }).error).slice(0, 120));
      }
    }
    return rows;
  } catch (err) {
    warnUpstashFailureOnce(err);
    return null;
  }
}

/**
 * Đọc giá trị `result` từ một phần tử phản hồi pipeline của Upstash.
 * Thường là `{ result: value }`; một số proxy trả thẳng giá trị — chịu cả hai.
 */
function pipelineResult(row: unknown): unknown {
  if (row && typeof row === 'object' && 'result' in (row as Record<string, unknown>)) {
    return (row as Record<string, unknown>).result;
  }
  return row;
}

/**
 * Rate limit BỀN VỮNG cho endpoint tốn phí (AI, TTS) và khoá theo username.
 *
 * - Có env Upstash (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN):
 *   đếm dùng CHUNG giữa mọi instance serverless qua Redis (INCR + EXPIRE).
 * - Thiếu env hoặc lỗi fetch: fallback in-memory đúng như `checkRateLimit`.
 *
 * Trả về shape giống hệt `checkRateLimit` dạng object
 * { allowed, remaining, resetInSeconds } — chỉ khác là async.
 */
export async function checkRateLimitPersistent(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<RateLimitResult> {
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const rows = await upstashPipeline([
    ['INCR', key],
    ['EXPIRE', key, windowSeconds],
  ]);

  if (rows) {
    const count = Number(pipelineResult(rows[0]));
    if (Number.isFinite(count)) {
      const allowed = count <= maxAttempts;
      // Cửa sổ lăn: EXPIRE đặt lại TTL sau mỗi lần thử nên Retry-After luôn
      // là trọn cửa sổ tính từ lần thử gần nhất.
      return {
        allowed,
        remaining: allowed ? Math.max(0, maxAttempts - count) : 0,
        resetInSeconds: windowSeconds,
      };
    }
  }

  // Chưa cấu hình Upstash (hoặc vừa lỗi — đã warn đúng 1 lần): in-memory.
  return checkRateLimitMemory(key, maxAttempts, windowMs);
}

/**
 * Xoá bộ đếm bền vững (vd: đăng nhập ĐÚNG mật khẩu thì xoá bộ đếm thất bại của
 * username đó). Luôn dọn cả bản in-memory (vô hại khi Upstash đang hoạt động
 * vì khi đó key không có trong Map), rồi DEL trên Redis khi đã cấu hình.
 */
export async function clearRateLimitPersistent(key: string): Promise<void> {
  ipStore.delete(key);
  await upstashPipeline([['DEL', key]]);
}

/**
 * Convenience helper to return a standard 429 Too Many Requests response
 */
export function rateLimitExceededResponse(
  message = 'Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng thử lại sau giây lát để đảm bảo an toàn hệ thống.',
  resetInSeconds = 60
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      retryAfterSeconds: resetInSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(resetInSeconds),
      },
    }
  );
}
