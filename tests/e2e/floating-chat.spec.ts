import { expect, test } from '@playwright/test';

/**
 * UX-004: nut tron AI chat phai dung yEN khi tro chuot vao.
 *
 * Truoc khi sua, animation `float-soft` chay vo han (~6px/3s) nen
 * `.click()` mac dinh LUON timeout 30s voi loi "element is not stable".
 * Test nay danh dau lai cam on vi `hover` + `click({ timeout: 5000 })`
 * phai xong trong 5s - bat buoc Playwright thay muc tieu da dung.
 * Neu regression (animation chay lai vo han) thi test FAIL, dung chu
 * khong im la nhu truoc khi sua.
 */
async function loginDemo(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /thử nhanh với tài khoản demo/i }).click();
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
      { timeout: 20_000 },
    )
    .toBe('demo');
}

test('hover nut AI chat -> click khong timeout, panel mo/dong dung', async ({ page }) => {
  await loginDemo(page);
  await page.goto('/pet');

  const toggle = page.locator('[data-testid="floating-ai-chat-button"]');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  // (1) Animation phai HU HAN: day moi la cai tri chuyen goc. Kiem tra qua
  // Web Animations de khong phu thuoc vao mayy co bao gio dung canh hay khong
  // (neu de mayy "may" thi Playwright co the pass tinh co khi animation van
  // chay - kiem tra nay loai bo ngoi cho do).
  const finite = await toggle.evaluate((el) => {
    const anims = el.getAnimations();
    return anims.map((a) => {
      const t = a.effect?.getComputedTiming?.() as { iterations?: number } | undefined;
      return { name: a.animationName, iterations: t?.iterations ?? Infinity };
    });
  });
  console.log(`  -> animations: ${JSON.stringify(finite)}`);
  expect(finite.length).toBeGreaterThan(0);
  for (const a of finite) {
    expect(a.iterations, `${a.name} phai chay hu han`).toBeLessThan(Infinity);
  }

  // Hover truoc: dung cai dat hover:[animation-play-state:paused].
  await toggle.hover();

  // KHONG `force: true` - `force` bo qua actionability check nen se bo
  // qua het loi "element is not stable". Timeout 5s la phep do cua nhiem vu.
  const t0 = Date.now();
  await toggle.click({ timeout: 5_000 });
  const clickMs = Date.now() - t0;

  const panel = page.locator('[data-testid="floating-ai-chat-panel"]');
  await expect(panel).toBeVisible({ timeout: 10_000 });
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('[data-testid="floating-ai-chat-input"]')).toBeVisible();

  // Esc dong khung chat lai.
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden({ timeout: 10_000 });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  console.log(`  -> click() hoan tat sau ${clickMs}ms (khong force)`);
});

/**
 * Yeu cau thu 2 cua UX-004: `prefers-reduced-motion` phai tat han.
 * globals.css co block `@media (prefers-reduced-motion: reduce)` dat
 * animation-duration 0.01ms + iteration 1 cho moi phan tu - giu nguyen,
 * test nay chi chot lai de khong ai vo tinh xoa block do.
 */
test('prefers-reduced-motion: nut AI chat khong chay animation', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  try {
    await loginDemo(page);
    await page.goto('/pet');
    const toggle = page.locator('[data-testid="floating-ai-chat-button"]');
    await expect(toggle).toBeVisible();

    const state = await toggle.evaluate((el) =>
      el.getAnimations().map((a) => {
        const t = a.effect?.getComputedTiming?.() as
          | { duration?: number; iterations?: number }
          | undefined;
        return { duration: t?.duration, iterations: t?.iterations };
      }),
    );
    console.log(`  -> reduced-motion animations: ${JSON.stringify(state)}`);
    for (const a of state) {
      // 0.01ms = 0.00001s, do animation-duration 0.01ms !important.
      expect(Number(a.duration)).toBeLessThanOrEqual(0.001);
    }
  } finally {
    await ctx.close();
  }
});