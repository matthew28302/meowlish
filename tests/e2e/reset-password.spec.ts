import { expect, test } from '@playwright/test';

/**
 * E2E luồng /reset-password (bug báo cáo 2026-10-17):
 * 1. Guest (chưa đăng nhập) bấm link từ email phải THẤY form đặt lại — trước
 *    đây guest gate + AuthModal đè kín trang, mất lối làm lại mật khẩu.
 * 2. Nút "Yêu cầu link mới" mở form inline và POST /api/auth/forgot-password —
 *    trước đây là <Link href="/api/auth/forgot-password"> (GET tới route
 *    POST-only) ⇒ trình duyệt mở trang lỗi HTTP 405.
 */

test.describe('/reset-password', () => {
  test('guest thấy form đặt lại mật khẩu (không bị login gate đè)', async ({ page }) => {
    await page.goto('/reset-password?token=token-e2e-reset-flow');

    // Form xuất hiện
    await expect(page.getByRole('heading', { name: 'Đặt Lại Mật Khẩu' })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();

    // Không có AuthModal/gate: heading Đăng Nhập của modal phải không tồn tại
    await expect(page.getByText('Đăng Nhập Vào Học')).toBeHidden();
  });

  test('thiếu xác nhận khớp → báo lỗi client, không gọi API', async ({ page }) => {
    await page.goto('/reset-password?token=token-e2e-reset-flow');

    const apiCalls: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/auth/reset-password')) apiCalls.push(req.url());
    });

    await expect(page.locator('#password')).toBeVisible({ timeout: 15_000 });
    await page.locator('#password').fill('Abcd1234');
    await page.locator('#confirmPassword').fill('Abcd12345');
    await page.getByRole('button', { name: /đặt lại mật khẩu/i }).click();

    await expect(page.getByText(/không khớp/i)).toBeVisible({ timeout: 5000 });
    // Không bắn API vì đã chặn ở client
    expect(apiCalls).toEqual([]);
  });

  test('"Yêu cầu link mới" mở form inline và POST đúng endpoint', async ({ page }) => {
    // Mock 200 cho POST forgot-password (local không có SMTP — 503 thật).
    await page.route('**/api/auth/forgot-password', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Link đặt lại mật khẩu đã được gửi đến email đăng ký của bạn.',
        }),
      });
    });

    await page.goto('/reset-password?token=token-e2e-reset-flow');
    await expect(page.getByRole('heading', { name: 'Đặt Lại Mật Khẩu' })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /yêu cầu link mới/i }).click();
    await expect(page.locator('#resend-email')).toBeVisible({ timeout: 5000 });
    await page.locator('#resend-email').fill('user@example.com');
    await page.getByRole('button', { name: /gửi link mới/i }).click();

    await expect(
      page.getByText(/link đặt lại mật khẩu đã được gửi/i),
    ).toBeVisible({ timeout: 8000 });
  });
});
