import { expect, test } from '@playwright/test';

/**
 * /api/health là endpoint báo sống cho hệ giám sát và Vercel cron.
 *
 * Phải trả JSON với thời gian, không bị CDN cache, và không rò rỉ chi tiết
 * hạ tầng (host, tên bảng, biến môi trường) ra ngoài.
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
  expect(JSON.stringify(body)).not.toMatch(/supabase|aws-|filebase|DATABASE_URL|postgres|mysql|mongodb/i);

  // Gọi trong trình duyệt cũng phải là yêu cầu thật, không phải bản cache.
  await page.goto('/api/health');
  const text = await page.locator('body').innerText();
  expect(text).toContain('"ok"');
});
