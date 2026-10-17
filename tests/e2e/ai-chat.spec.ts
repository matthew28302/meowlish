import { expect, test } from '@playwright/test';

/**
 * Dam bao nut tron FloatingAiChat mo duoc khung chat (co data-testid de dung
 * nhanh cho regression test sau nay).
 *
 * GHI CHU QUAN TRONG - BUG DA XAC NHAN (Vong 0 baseline, xem docs/test-baseline.md):
 * Nut thu gon co animation `animate-[float-soft_3s_ease-in-out_infinite]`
 * (src/components/FloatingAiChat.tsx:194) khong bao gio dung -> Playwright
 * `.click()` mac dinh LUON timeout voi loi "element is not stable".
 * Do do phai dung `force: true` (hoac dispatch DOM click) trong moi spec
 * cham vao nut nay. Day khong phai loi cua test, la bug UX that: muc tieu
 * 56px lien tuc nhay len xuong ~6px kho kiem soat cho nguoi dung kho can
 * dong tay (WCAG 2.2 SC 2.5.8 Target Size).
 *
 * Khi da dang nhap, nut LA phan tu tren cung, nen `force: true` bam trung.
 * O trang chua dang nhap nhu `/pet`, AuthModal guest gate co backdrop phu toan
 * man hinh nen nut bi chan - day la hanh vi co chu dich, khong phai bug.
 */
test('floating AI chat button opens the chat panel', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: /thử nhanh với tài khoản demo/i })
    .click();
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

  await page.goto('/pet');
  const toggle = page.locator('[data-testid="floating-ai-chat-button"]');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  // force: true bat buoc - xem ghi chu bug o tren.
  await toggle.click({ force: true });

  const panel = page.locator('[data-testid="floating-ai-chat-panel"]');
  await expect(panel).toBeVisible({ timeout: 10_000 });
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.locator('[data-testid="floating-ai-chat-input"]'),
  ).toBeVisible();

  // Dong lai: luc mo, animation da bi thay bang `rotate-90` nen nut dung im.
  await toggle.click({ force: true });
  await expect(panel).toBeHidden();
});