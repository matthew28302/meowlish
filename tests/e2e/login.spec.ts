import { expect, test } from '@playwright/test';

// Smoke: demo login via UI (demo / 123456) lands on the dashboard.
// NOTE: the auth modal is already open on the unauthenticated landing,
// so the one-click demo entry point is visible without extra clicks.
test('login demo succeeds via UI', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /meowlish english/i }),
  ).toBeVisible();

  const demoButton = page.getByRole('button', {
    name: /thử nhanh với tài khoản demo/i,
  });
  await expect(demoButton).toBeVisible();
  await demoButton.click();

  // Landing unmounts once the session exists; dashboard takes over.
  await expect(demoButton).toBeHidden({ timeout: 15_000 });
  await expect(
    page.getByRole('heading', { name: /tự tin nói tiếng anh/i }),
  ).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          try {
            const raw = localStorage.getItem('english_for_me_user');
            return raw ? JSON.parse(raw).username : null;
          } catch {
            return null;
          }
        }),
      { timeout: 15_000 },
    )
    .toBe('demo');
  await expect(page.getByText('@demo').first()).toBeVisible({ timeout: 15_000 });
});
