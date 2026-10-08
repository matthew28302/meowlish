// Kiểm tra H10 (audit 2026-10-08): nút "Thoát phòng thi" trong phòng thi phải
// mở modal THOÁT RIÊNG (2 nút: "Ở lại làm tiếp" / "Thoát (lưu tiến độ)") —
// KHÔNG còn mở modal NỘP BÀI, và Thoát KHÔNG ghi nộp bài (không POST /api/exam).
//
// Usage: node scripts/verify-exam-exit.mjs [url]
import { chromium } from 'playwright';

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'vi-VN' });
const page = await ctx.newPage();

const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
page.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)));

let examPostCount = 0;
page.on('request', (req) => {
  if (req.method() === 'POST' && req.url().includes('/api/exam')) examPostCount++;
});

const results = [];
const check = (name, ok) => {
  results.push({ name, ok });
  console.log(`  ${ok ? 'PASS ✅' : 'FAIL ❌'} — ${name}`);
};

// 1. Đăng nhập demo (AppShell gate chặn route chưa đăng nhập)
await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
const demoButton = page.getByRole('button', { name: /thử nhanh với tài khoản demo/i });
await demoButton.click({ timeout: 20_000 });
await page.waitForFunction(
  () => {
    try {
      const raw = localStorage.getItem('english_for_me_user');
      return raw ? JSON.parse(raw).username === 'demo' : false;
    } catch {
      return false;
    }
  },
  { timeout: 20_000 },
);

// 2. Vào /exam và mở một đề thi
await page.goto(`${BASE_URL}/exam`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
await page.waitForTimeout(1500);
await page.getByRole('button', { name: /Bắt đầu làm bài thi|Thi lại đề này/ }).first().click();
await page.waitForTimeout(800);

// 3. Đang ở phòng thi: bấm nút "Thoát phòng thi" (mũi tên lùi, title=...)
await page.locator('button[title="Thoát phòng thi"]').click();
await page.waitForTimeout(600);

// 4. Modal THOÁT phải hiện (không phải modal NỘP BÀI)
const exitModalOpen = await page.getByText('Thoát phòng thi?').isVisible().catch(() => false);
const submitModalOpen = await page.getByText('Xác nhận nộp bài thi?').isVisible().catch(() => false);
check('nút "Thoát phòng thi" mở modal thoát riêng', exitModalOpen);
check('KHÔNG mở modal nộp bài khi bấm thoát', !submitModalOpen);
check('chưa có POST /api/exam (chưa nộp bài)', examPostCount === 0);

// 5. Modal thoát có đủ nội dung + 2 nút đúng nhãn
check(
  'modal thoát có câu "Tiến độ bài làm đang được lưu"',
  await page.getByText(/Tiến độ bài làm đang được lưu/).isVisible().catch(() => false),
);
const stayBtn = page.getByRole('button', { name: 'Ở lại làm tiếp' });
const exitConfirmBtn = page.getByRole('button', { name: 'Thoát (lưu tiến độ)' });
check('modal thoát có nút "Ở lại làm tiếp"', await stayBtn.isVisible().catch(() => false));
check('modal thoát có nút "Thoát (lưu tiến độ)"', await exitConfirmBtn.isVisible().catch(() => false));

// 6. "Ở lại làm tiếp" → đóng modal, vẫn ở phòng thi
await stayBtn.click();
await page.waitForTimeout(600);
check(
  '"Ở lại làm tiếp" đóng modal và vẫn ở phòng thi',
  await page.locator('button[title="Thoát phòng thi"]').isVisible().catch(() => false),
);

// 7. Thoát (lưu tiến độ) → quay về danh sách đề, phiên dở được giữ, không nộp
// Bước 6 đã đóng modal — mở lại modal thoát trước khi chọn thoát.
await page.locator('button[title="Thoát phòng thi"]').click();
await page.waitForTimeout(500);
await exitConfirmBtn.click();
await page.waitForTimeout(800);
const backInCatalog = await page.getByText('Bộ Đề Kiểm Tra & Thi Thử Chuẩn CEFR').isVisible().catch(() => false);
const resultView = await page.getByText(/Chúc Mừng Bạn Đã Vượt Qua|Đừng Nản Lòng/).isVisible().catch(() => false);
const resumeBanner = await page.getByText('Bạn đang có bài thi thử chưa hoàn tất!').isVisible().catch(() => false);
const savedSession = await page.evaluate(() => !!sessionStorage.getItem('session_exam_practice_v2'));
check('Thoát → quay về danh sách đề', backInCatalog);
check('Thoát → KHÔNG vào màn kết quả (không nộp bài)', !resultView);
check('Thoát → banner "bài thi dở dang" hiện (phiên được lưu như resume)', resumeBanner);
check('sessionStorage còn phiên dở', savedSession);
check('KHÔNG có POST /api/exam trong toàn bộ phiên thoát', examPostCount === 0);

// 8. Resume lại được từ banner (tiến độ không mất)
const resumeTopBtn = page.getByRole('button', { name: /Tiếp Tục Bài Thi Dở/ });
if (await resumeTopBtn.isVisible().catch(() => false)) {
  await resumeTopBtn.click();
  await page.waitForTimeout(800);
  check(
    'resume từ banner quay lại phòng thi',
    await page.locator('button[title="Thoát phòng thi"]').isVisible().catch(() => false),
  );
}

console.log('\n[ERRORS]', errs.length ? errs.slice(0, 6) : 'none');
const failed = results.filter((r) => !r.ok).length;
console.log(failed === 0 ? '\n=> H10 ĐÃ VÃ ✅' : `\n=> VẪN CÒN ${failed} CHECK FAIL ❌`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
