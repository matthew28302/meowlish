import { expect, test } from '@playwright/test';

/**
 * E2E test cho hệ Toast dùng chung (UX-008).
 *
 * Trigger là UI THẬT, không mock window (trước đây test gắn `window.toast`
 * vào Toast.tsx — code test-only lọt vào production, đã gỡ).
 *
 * Luồng trigger ổn định với user demo:
 *   login demo → set coins=0 trong localStorage (key `english_for_me_user`)
 *   → /pet → nút "Thêm chức năng" → menu "Cho Ăn" → bấm món ăn (giá 🪙 > 0,
 *   không có trong kho) → `handleFeed` check coins client-side → toast.error.
 */

test.describe('Toast system (UX-008)', () => {
  /** Chặn POST /api/pet (cho ăn) trả 400 — nhánh server error của handleFeed. */
  async function mockFeedServerError(page) {
    await page.route('**/api/pet*', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Kho thực đơn tạm hết hàng (mock test).' }),
        });
        return;
      }
      route.continue();
    });
  }

  async function loginAsDemo(page) {
    await page.goto('/');
    const demoButton = page.getByRole('button', {
      name: /thử nhanh với tài khoản demo/i,
    });
    await expect(demoButton).toBeVisible();
    await demoButton.click();
    // 30s: dev mode Turbopack có thể recompile trang giữa chừng làm login chậm
    // (baseline docs/test-baseline.md — e2e flaky khi chạy dây chuyền).
    await expect(demoButton).toBeHidden({ timeout: 30_000 });
    await expect(
      page.getByRole('heading', { name: /tự tin nói tiếng anh/i }),
    ).toBeVisible({ timeout: 30_000 });
  }

  /** Ép coins=0 để click món ăn luôn rơi vào nhánh "thiếu Coins" (client check). */
  async function setCoins(page, coins) {
    await page.evaluate((c) => {
      const raw = localStorage.getItem('english_for_me_user');
      const user = raw ? JSON.parse(raw) : {};
      user.coins = c;
      localStorage.setItem('english_for_me_user', JSON.stringify(user));
    }, coins);
  }

  /**
   * Mở modal Cho Ăn và bấm 1 món ăn. Toast xuất hiện ở CẢ HAI nhánh:
   *   - món CHƯA có trong kho + coins=0 → toast client-side "thiếu Coins"
   *   - món ĐÃ có trong kho → chặn POST /api/pet trả 400 → toast server error
   * (Do đó cài route trước khi gọi hàm này.)
   */
  async function triggerInsufficientCoinsToast(page) {
    await page.goto('/pet');
    // Trang mở ở tab farm mặc định — toolbar Cho Ăn nằm trong tab Sân Vườn.
    const gardenTab = page.getByRole('button', { name: /Sân Vườn Linh Vật/ });
    await expect(gardenTab).toBeVisible({ timeout: 15_000 });
    await gardenTab.click();
    await expect(page.getByTitle('Thêm chức năng')).toBeVisible({ timeout: 15_000 });
    await page.getByTitle('Thêm chức năng').click();
    await page.getByRole('menuitem', { name: 'Cho Ăn' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    const foodButton = dialog.getByRole('button').filter({ hasText: /🪙|Kho:/ }).first();
    await expect(foodButton).toBeVisible({ timeout: 8000 });
    await foodButton.click();

    const toastRegion = page.getByTestId('toast-region');
    const toastAlert = toastRegion.getByRole('alert').first();
    await expect(toastAlert).toBeVisible({ timeout: 5000 });
    return toastAlert;
  }

  test('toast.error xuất hiện với role=alert khi thiếu Coins', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await loginAsDemo(page);
    await mockFeedServerError(page);
    await setCoins(page, 0);
    const toastAlert = await triggerInsufficientCoinsToast(page);
    await expect(toastAlert).toContainText(/cần thêm|hết hàng/i);

    expect(
      // "Failed to load resource ... 400" là log trình duyệt cho chính mock 400
      // ta chủ động trả về — không phải lỗi app.
      consoleErrors.filter(
        (e) => !/favicon|React DevTools|Failed to load resource/i.test(e),
      ),
    ).toEqual([]);
  });

  test('Esc đóng toast', async ({ page }) => {
    await loginAsDemo(page);
    await mockFeedServerError(page);
    await setCoins(page, 0);
    const toastAlert = await triggerInsufficientCoinsToast(page);
    await page.keyboard.press('Escape');
    await expect(toastAlert).toBeHidden({ timeout: 3000 });
  });

  test('nút X đóng toast', async ({ page }) => {
    await loginAsDemo(page);
    await mockFeedServerError(page);
    await setCoins(page, 0);
    const toastAlert = await triggerInsufficientCoinsToast(page);
    await toastAlert.getByRole('button', { name: /đóng thông báo/i }).click();
    await expect(toastAlert).toBeHidden({ timeout: 3000 });
  });

  test('overlay toast không chặn thao tác phía sau (pointer-events: none)', async ({ page }) => {
    await loginAsDemo(page);
    const toastRegion = page.getByTestId('toast-region');
    await expect(toastRegion).toBeAttached();

    const pointerEvents = await toastRegion.evaluate(
      (el) => window.getComputedStyle(el).pointerEvents,
    );
    expect(pointerEvents).toBe('none');
  });
});
