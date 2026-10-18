/**
 * fetchWithRetry — helper retry cho các lời gọi tra từ trên client.
 *
 * Bối cảnh (đo production 2026-10-18): burst tra từ lạnh gặp 504
 * FUNCTION_INVOCATION_TIMEOUT khi instance khôi phục dictionary.db 64MB. Test
 * dưới đây khóa hành vi QUAN TRỌNG: chỉ retry 502/503/504 + lỗi mạng, không
 * retry 4xx/500, không hồi sinh request đã bị huỷ — sai ở đây là hoặc vô dụng,
 * hoặc tự bắn vào chân (retry 500 nhân tải, retry Abort làm treo UI).
 */
import { describe, it, expect, vi } from 'vitest';
import { fetchWithRetry, DEFAULT_RETRY_BACKOFF_MS } from '@/lib/dictionaryFetch';

/** fetch giả trả lần lượt các kết quả đã định; ghi lại lịch chờ. */
function fakeFetch(results: Array<Response | Error>) {
  const calls: Array<{ url: unknown; init: unknown }> = [];
  let idx = 0;
  const impl = (async (url: unknown, init?: unknown) => {
    calls.push({ url, init });
    const next = results[Math.min(idx, results.length - 1)];
    idx++;
    if (next instanceof Error) throw next;
    return next;
  }) as unknown as typeof fetch;
  return { impl, calls, get callCount() { return calls.length; } };
}

function sleeping() {
  const slept: number[] = [];
  return { slept, sleep: async (ms: number) => { slept.push(ms); } };
}

function abortError() {
  const err = new Error('The operation was aborted');
  err.name = 'AbortError';
  return err;
}

describe('fetchWithRetry', () => {
  it('502/503/504 là retryable — 504 rồi 200 thì trả 200 sau 1 lần chờ 1s', async () => {
    const f = fakeFetch([new Response('busy', { status: 504 }), new Response('ok', { status: 200 })]);
    const s = sleeping();
    const onRetry = vi.fn();

    const res = await fetchWithRetry('/api/translate', {}, { fetchImpl: f.impl, sleep: s.sleep, onRetry });

    expect(res.status).toBe(200);
    expect(f.callCount).toBe(2);
    expect(s.slept).toEqual([1000]);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry.mock.calls[0][0]).toMatchObject({ attempt: 1, status: 504 });
  });

  it('lịch backoff mặc định là 1s rồi 3s (2 lần thử lại)', async () => {
    const f = fakeFetch([
      new Response('a', { status: 503 }),
      new Response('b', { status: 503 }),
      new Response('c', { status: 200 }),
    ]);
    const s = sleeping();

    const res = await fetchWithRetry('/api/dictionary/search?q=cat', {}, { fetchImpl: f.impl, sleep: s.sleep });

    expect(res.status).toBe(200);
    expect(f.callCount).toBe(3);
    expect(s.slept).toEqual(DEFAULT_RETRY_BACKOFF_MS);
  });

  it('500 KHÔNG retry — lỗi code phía server, thử lại chỉ nhân tải', async () => {
    const f = fakeFetch([new Response('boom', { status: 500 })]);
    const s = sleeping();

    const res = await fetchWithRetry('/api/translate', {}, { fetchImpl: f.impl, sleep: s.sleep });

    expect(res.status).toBe(500);
    expect(f.callCount).toBe(1);
    expect(s.slept).toEqual([]);
  });

  it('4xx KHÔNG retry', async () => {
    const f = fakeFetch([new Response('bad', { status: 429 }), new Response('ok', { status: 200 })]);
    const s = sleeping();

    const res = await fetchWithRetry('/api/translate', {}, { fetchImpl: f.impl, sleep: s.sleep });

    expect(res.status).toBe(429);
    expect(f.callCount).toBe(1);
  });

  it('lỗi mạng (fetch ném) thì retry; thành công lần sau vẫn trả kết quả', async () => {
    const f = fakeFetch([new TypeError('fetch failed'), new Response('ok', { status: 200 })]);
    const s = sleeping();
    const onRetry = vi.fn();

    const res = await fetchWithRetry('/api/translate', {}, { fetchImpl: f.impl, sleep: s.sleep, onRetry });

    expect(res.status).toBe(200);
    expect(f.callCount).toBe(2);
    expect(s.slept).toEqual([1000]);
    expect(onRetry.mock.calls[0][0].error).toBeInstanceOf(TypeError);
  });

  it('lỗi mạng kéo dài hết lượt thì NÉM lỗi cuối cùng (số lần gọi = retries + 1)', async () => {
    const boom = new TypeError('fetch failed');
    const f = fakeFetch([boom, boom, boom]);
    const s = sleeping();

    await expect(fetchWithRetry('/api/translate', {}, { fetchImpl: f.impl, sleep: s.sleep })).rejects.toBe(boom);
    expect(f.callCount).toBe(3);
    expect(s.slept).toEqual([1000, 3000]);
  });

  it('AbortError KHÔNG retry — request đã bị người gọi huỷ thì không hồi sinh', async () => {
    const abort = abortError();
    const f = fakeFetch([abort, new Response('ok', { status: 200 })]);
    const s = sleeping();

    await expect(fetchWithRetry('/api/translate', {}, { fetchImpl: f.impl, sleep: s.sleep })).rejects.toBe(abort);
    expect(f.callCount).toBe(1);
    expect(s.slept).toEqual([]);
  });

  it('hết lượt mà vẫn 5xx thì TRẢ response cuối (không ném) để người gọi tự xử lý', async () => {
    const f = fakeFetch([new Response('a', { status: 503 }), new Response('b', { status: 503 }), new Response('c', { status: 504 })]);
    const s = sleeping();

    const res = await fetchWithRetry('/api/translate', {}, { fetchImpl: f.impl, sleep: s.sleep });

    expect(res.status).toBe(504);
    expect(f.callCount).toBe(3);
  });

  it('retries = 0 thì gọi đúng 1 lần', async () => {
    const f = fakeFetch([new Response('a', { status: 503 })]);
    const s = sleeping();

    const res = await fetchWithRetry('/api/translate', {}, { fetchImpl: f.impl, sleep: s.sleep, retries: 0 });

    expect(res.status).toBe(503);
    expect(f.callCount).toBe(1);
  });
});
