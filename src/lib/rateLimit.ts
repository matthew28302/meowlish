import { NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding rate limit store
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
 * Extract client IP from Request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Check if a client IP has exceeded the allowed limit within windowMs.
 * Supports both object options { key, maxAttempts, windowMs } and legacy positional (key, maxAttempts, windowMs).
 */
export function checkRateLimit(
  opts: { key: string; maxAttempts: number; windowMs: number }
): { allowed: boolean; remaining: number; resetInSeconds: number };
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

  const now = Date.now();
  const existing = ipStore.get(key);

  if (!existing || existing.resetAt <= now) {
    ipStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    if (isPositional) return true;
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
    if (isPositional) return false;
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  if (isPositional) return true;
  return {
    allowed: true,
    remaining,
    resetInSeconds,
  };
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
