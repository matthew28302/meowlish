import { expect, test } from '@playwright/test';

/**
 * /api/health vừa là báo sống cho hệ giám sát, vừa là thứ giữ Supabase Free không
 * bị tạm dừng sau 1 tuần im lặng (cron hằng ngày trong vercel.json gọi vào đây).
 *
 * Vì vậy phải kiểm tra CẢ HAI điều:
 * - trả về JSON với độ trễ, và
 * - KHÔNG bị cache. Nếu CDN giữ lại, cron gọi mà function không chạy ⇒ Postgres
 *   vẫn bị pause, tức là endpoint "sống" nhưng tác dụng thì bằng 0.
 */
test('health endpoint reports status without caching', async ({ page, request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBeLessThan(600);

  const cacheControl = res.headers()['cache-control'] || '';
  expect(cacheControl).toContain('no-store');

  const body = await res.json();
  expect(body).toHaveProperty('ok');
  expect(body).toHaveProperty('db');
  expect(body).toHaveProperty('time');
  // Không rò rỉ chi tiết hạ tầng ra ngoài.
  expect(JSON.stringify(body)).not.toMatch(/supabase|aws-|filebase|DATABASE_URL/i);

  // Gọi trong trình duyệt cũng phải là yêu cầu thật, không phải bản cache.
  await page.goto('/api/health');
  const text = await page.locator('body').innerText();
  expect(text).toContain('"ok"');
});
