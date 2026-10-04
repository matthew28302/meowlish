import { expect, test } from '@playwright/test';

// Smoke: landing (unauthenticated home) loads with zero JS/page errors.
// NOTE: unauthenticated users get the Welcome landing (AppShell gate),
// not the dashboard — the dashboard is covered in login.spec.ts.
test('home loads without console or page errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /meowlish english/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /đăng nhập \/ đăng ký học ngay/i }),
  ).toBeVisible();

  expect(pageErrors, `pageerrors: ${pageErrors.join(' | ')}`).toEqual([]);
  expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([]);
});
