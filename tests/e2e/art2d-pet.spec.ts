import { expect, test } from '@playwright/test';

/**
 * Regression cho bộ pet art 2D "Nhân Vật Nổi Tiếng" (2026-10-09):
 * chọn nhân vật 2D trong modal Đổi Thú Cưng → khu vườn render STANDEE WebP
 * (Art2dPetSprite, không còn là chibi vector) → reload vẫn giữ (server truth
 * qua /api/pet), và PET DEMO ĐƯỢC TRẢ VỀ OWL cuối test (tài khoản demo dùng
 * chung — không được để lại trạng thái test cho user thật).
 */
test('chọn nhân vật 2D (Naruto) → vườn render standee → reload vẫn giữ', async ({ page }) => {
  test.setTimeout(90_000);

  // 1. Đăng nhập demo qua UI (luồng chính, như mọi spec khác)
  await page.goto('/');
  await page
    .getByRole('button', { name: /thử nhanh với tài khoản demo/i })
    .click();
  await expect(
    page.getByRole('heading', { name: /tự tin nói tiếng anh/i }),
  ).toBeVisible({ timeout: 15_000 });

  // 2. Vào khu vườn: tab mặc định là "Nông Trại 2.5D" — nút Đổi Bé nằm trong
  // tab SANCTUARY ("Sân Vườn Linh Vật") nên phải chuyển tab trước.
  await page.goto('/pet');
  await page.getByRole('button', { name: /sân vườn linh vật/i }).click();
  await page.getByTitle('Chọn nuôi thú cưng khác').click();
  const modal = page.getByRole('dialog', { name: /chọn bạn đồng hành/i });
  await expect(modal).toBeVisible();

  // 3. Lọc tab franchise 2D rồi chọn Naruto
  await page.getByRole('button', { name: /naruto 2d/i }).click();
  await modal
    .getByRole('button', { name: /naruto uzumaki/i })
    .click();

  // Modal tự đóng sau khi chọn (pet/page.tsx:787) — standee phải xuất hiện.
  await expect(modal).toBeHidden({ timeout: 15_000 });
  const standee = page.locator('img[src*="/pet-art-2d/art2d_naruto__naruto"]');
  await expect(standee.first()).toBeVisible({ timeout: 15_000 });

  // 4. SERVER TRUTH: /api/pet phải trả đúng pet_type vừa chọn
  const petResponse = await page.evaluate(async () => {
    const raw = localStorage.getItem('english_for_me_user');
    const user = raw ? JSON.parse(raw) : null;
    const res = await fetch(`/api/pet?userId=${user?.id}`);
    return res.json();
  });
  expect(petResponse.pet?.pet_type).toBe('art2d_naruto__naruto');
  expect(petResponse.pet?.pet_name).toBe('Naruto Uzumaki');

  // 5. Reload: nhân vật 2D vẫn là pet đang chọn (không mất sau F5).
  // gameTab là state client nên F5 reset về mặc định 'farm' — phải chuyển
  // lại tab sanctuary rồi mới thấy standee.
  await page.reload();
  await page.getByRole('button', { name: /sân vườn linh vật/i }).click();
  await expect(page.locator('img[src*="/pet-art-2d/art2d_naruto__naruto"]').first()).toBeVisible({
    timeout: 15_000,
  });
});

test.afterAll(async ({ browser }) => {
  // CLEANUP: trả pet demo về owl — tài khoản demo DÙNG CHUNG cho mọi khách
  // (userAuth.ts coi demo là read-only cho guest), tuyệt đối không để lại
  // Naruto sau khi test xong. Làm qua API (login thật → cookie → POST
  // switch_pet) thay vì UI: nút "Đổi Bé" nằm trong HUD của garden chỉ mount
  // sau khi pet data load xong, cleanup qua UI hay flaky theo thời gian load.
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('/');

  const login = await page.evaluate(async () => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username: 'demo', password: '123456' }),
    });
    return { ok: res.ok };
  });
  expect(login.ok).toBe(true);

  const restored = await page.evaluate(async () => {
    const raw = localStorage.getItem('english_for_me_user');
    const user = raw ? JSON.parse(raw) : null;
    const res = await fetch('/api/pet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id, action: 'switch_pet', petType: 'owl' }),
    });
    const data = await res.json();
    return data.pet?.pet_type ?? null;
  });
  expect(restored).toBe('owl');
  await ctx.close();
});
