/**
 * Fetch có RETRY/backoff cho các lời gọi tra từ trên client.
 *
 * VÌ SAO CẦN (đo production 2026-10-18): burst 100 tra từ lạnh đồng thời gặp
 * 10 lần HTTP 504 `FUNCTION_INVOCATION_TIMEOUT` (instance Vercel mất quá lâu để
 * khôi phục dictionary.db 64MB từ Filebase). Với người dùng, một cú bấm tra từ
 * rơi trúng instance đang cold-start là mất trắng kết quả dù chỉ ~10–30s sau đó
 * instance đã sẵn sàng. Retry ở client biến "lỗi cứng" thành "chậm một nhịp".
 *
 * PHẠM VI RETRY (cố tình hẹp):
 *   - CHỈ thử lại khi: lỗi mạng (fetch ném) hoặc status 502/503/504.
 *   - KHÔNG thử lại: 4xx (lỗi của mình, thử nữa vô ích), 500 (lỗi code phía
 *     server — thử lại chỉ nhân tải), và AbortError (người dùng/bộ gọi chủ động
 *     huỷ request — thử lại sẽ hồi sinh một request đã bị huỷ).
 *   - Mặc định 2 lần thử lại (tổng 3 lần gọi), chờ 1s rồi 3s.
 */

/** Status được coi là tạm thời — retry có ý nghĩa. */
export const RETRYABLE_STATUSES = new Set([502, 503, 504]);

/** Lịch chờ mặc định giữa các lần thử lại (ms). */
export const DEFAULT_RETRY_BACKOFF_MS = [1000, 3000];

export interface FetchWithRetryOptions {
  /** Số lần THỬ LẠI (mặc định 2 ⇒ tối đa 3 lần gọi fetch). */
  retries?: number;
  /** Lịch chờ giữa các lần thử (ms); phần tử cuối được dùng lại nếu thiếu. */
  backoffMs?: number[];
  /** Hook quan sát (log/test) — gọi NGAY TRƯỚC mỗi lần thử lại. */
  onRetry?: (info: { attempt: number; status?: number; error?: unknown }) => void;
  /** Cho test: thay fetch thật. */
  fetchImpl?: typeof fetch;
  /** Cho test: thay setTimeout thật. */
  sleep?: (ms: number) => Promise<void>;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gọi fetch với retry/backoff giới hạn. Trả về Response CUỐI CÙNG (kể cả khi
 * status vẫn là 5xx sau khi hết lượt — người gọi tự quyết định cách hiển thị);
 * chỉ NÉM lỗi khi mọi lần gọi đều lỗi mạng.
 */
export async function fetchWithRetry(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
  options?: FetchWithRetryOptions
): Promise<Response> {
  const retries = Math.max(0, options?.retries ?? 2);
  const backoff = options?.backoffMs && options.backoffMs.length > 0 ? options.backoffMs : DEFAULT_RETRY_BACKOFF_MS;
  const doFetch = options?.fetchImpl ?? fetch;
  const sleep = options?.sleep ?? defaultSleep;

  let lastError: unknown = null;
  let lastStatus: number | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      options?.onRetry?.({ attempt, status: lastStatus, error: lastError });
      await sleep(backoff[Math.min(attempt - 1, backoff.length - 1)]);
    }

    try {
      const res = await doFetch(input, init);
      if (!RETRYABLE_STATUSES.has(res.status) || attempt === retries) {
        return res;
      }
      // Tạm thời: nhả body của response bị bỏ trước khi thử lại để không giữ
      // connection/socket của lần gọi thất bại.
      lastStatus = res.status;
      lastError = null;
      try {
        await res.body?.cancel?.();
      } catch {
        /* body đã đóng/không huỷ được — không sao */
      }
    } catch (error) {
      // Huỷ chủ động (AbortController của người gọi, timeout signal) → trả nguyên
      // lỗi, KHÔNG hồi sinh request.
      if (error instanceof Error && error.name === 'AbortError') throw error;

      lastError = error;
      lastStatus = undefined;
      if (attempt === retries) throw error;
    }
  }

  // Không tới được đây (vòng lặp luôn return/throw ở lần cuối) — giữ cho TS.
  throw lastError instanceof Error ? lastError : new Error('[dictionaryFetch] fetch thất bại sau khi thử lại');
}
