import { expect, test } from '@playwright/test';

// Must mirror the `categories` array in src/app/vocabulary/page.tsx.
const FILTER_LABELS = [
  'Tất Cả Từ Vựng',
  'IT: Daily Standup',
  'IT: Code Review',
  'IT: Debug & Bug Triage',
  'IT: System Architecture',
  'Office & Workplace',
  'Daily: Small Talk',
  'Daily: Travel & Commute',
  'Daily: Cafe & Dining',
  'Daily: Bày Tỏ Quan Điểm',
  'Daily: Gia Đình & Nhà Cửa',
  'Daily: Ăn Uống & Nấu Nướng',
  'Daily: Sức Khỏe & Thể Chất',
  'Daily: Mua Sắm & Tiền Bạc',
  'Daily: Phim Nhạc & Giải Trí',
  'Daily: Thời Tiết & Bốn Mùa',
  'IT: Tech Interview',
];

// Smoke: /vocabulary (protected route) renders the full filter bar + cards,
// and category filtering narrows the list. Logs in via UI demo first.
test('/vocabulary renders all filter groups', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: /thử nhanh với tài khoản demo/i })
    .click();
  await expect(
    page.getByRole('heading', { name: /tự tin nói tiếng anh/i }),
  ).toBeVisible({ timeout: 15_000 });

  await page.goto('/vocabulary');
  await expect(
    page.getByRole('heading', { name: /học từ vựng giao tiếp theo ngữ cảnh/i }),
  ).toBeVisible();

  // Every filter group button exists exactly once (17 total).
  for (const label of FILTER_LABELS) {
    await expect(
      page.getByRole('button', { name: label, exact: false }),
    ).toHaveCount(1);
  }

  // Cards render on "all", and category filtering narrows them.
  await expect(page.getByRole('heading', { name: 'blocker' })).toBeVisible();
  await page
    .getByRole('button', { name: 'IT: Code Review', exact: false })
    .click();
  await expect(page.getByRole('heading', { name: 'refactor' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'blocker' })).toBeHidden();
});
