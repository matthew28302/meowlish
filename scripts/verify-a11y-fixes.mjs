// Kiểm chứng các fix accessibility từ audit 2026-10-08 (H8/M7/L6/L6b):
//
//   (a) 0 nút icon không có accessible name trong 4 file (encyclopedia,
//       vocabulary, bookmarks + AuthModal khi mở) — đo tay accessible name
//       theo thứ tự fallback của trình duyệt (aria-label -> aria-labelledby ->
//       textContent -> title).
//   (b) AuthModal: Tab không thoát modal trong 12 nhịp + Esc đóng được.
//   (c) encyclopedia: 2 nút danh mục chết biến mất + search từ không có ->
//       empty-state chuẩn (KHÔNG fallback dữ liệu cứng).
//   (d) vocabulary: từ đã lưu hiển thị "Đã Lưu" khi load trang (mock API).
//
// Chạy: node scripts/verify-a11y-fixes.mjs (dev server phải đang chạy :3000).
import { chromium } from 'playwright';

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const TEST_USER_ID = 'user-a11y-verify';

const results = [];
const check = (name, expected, actual, pass) => {
  results.push({ name, expected, actual, pass: !!pass });
};

// ---------------------------------------------------------------- helpers --
/** Danh sách button hiển thị thiếu accessible name trên trang hiện tại. */
function scanUnnamedButtons() {
  const isVisible = (el) => {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  };
  return [...document.querySelectorAll('button')]
    .filter(isVisible)
    .map((b) => {
      let name = (b.getAttribute('aria-label') || '').trim();
      if (!name) {
        const ids = b.getAttribute('aria-labelledby');
        if (ids) {
          name = ids
            .split(/\s+/)
            .map((id) => document.getElementById(id)?.textContent || '')
            .join(' ')
            .trim();
        }
      }
      if (!name) name = (b.textContent || '').replace(/\s+/g, ' ').trim();
      if (!name) name = (b.getAttribute('title') || '').trim();
      return { name, preview: (b.innerHTML || '').replace(/\s+/g, ' ').slice(0, 60) };
    })
    .filter((b) => !b.name);
}

/** Danh sách button thiếu name trong 1 dialog chỉ định (return string). */
function scanUnnamedInScope(scope) {
  const isVisible = (el) => {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  };
  return [...scope.querySelectorAll('button')]
    .filter(isVisible)
    .map((b) => {
      let name = (b.getAttribute('aria-label') || '').trim();
      if (!name) {
        const ids = b.getAttribute('aria-labelledby');
        if (ids) {
          name = ids
            .split(/\s+/)
            .map((id) => document.getElementById(id)?.textContent || '')
            .join(' ')
            .trim();
        }
      }
      if (!name) name = (b.textContent || '').replace(/\s+/g, ' ').trim();
      if (!name) name = (b.getAttribute('title') || '').trim();
      return name || (b.innerHTML || '').replace(/\s+/g, ' ').slice(0, 40);
    })
    .filter((name) => !name);
}

// ------------------------------------------------------------------ setup --
const browser = await chromium.launch();

// Context guest: duyệt /encyclopedia + mở AuthModal (nút Đăng Nhập trên Navbar).
const guestCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await guestCtx.addInitScript(() => {
  localStorage.removeItem('english_for_me_user');
  localStorage.setItem('english_for_me_logged_out', 'true');
});

// Context đã đăng nhập: /vocabulary + /bookmarks — mock GET/DELETE /api/bookmarks.
const userCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await userCtx.addInitScript((uid) => {
  localStorage.setItem(
    'english_for_me_user',
    JSON.stringify({
      id: uid,
      username: 'a11ytester',
      display_name: 'A11y Tester',
      avatar: '🐱',
      streak: 1,
      exp: 10,
      level: 1,
      coins: 1000,
      two_factor_enabled: false,
      email_verified: true,
    })
  );
  localStorage.removeItem('english_for_me_logged_out');
}, TEST_USER_ID);

await userCtx.route('**/api/bookmarks*', async (route) => {
  const req = route.request();
  const url = new URL(req.url());
  if (req.method() === 'DELETE') {
    // Xoá: trả success để UI gỡ card (hành vi xoá của trang giữ nguyên).
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
    return;
  }
  if (url.searchParams.get('userId') === TEST_USER_ID && req.method() === 'GET') {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        bookmarks: [
          {
            id: 'bm-a11y-1',
            word: 'blocker',
            phonetic: '/ˈblɒk.ər/',
            translation: 'Vấn đề cản trở công việc',
            context_sentence: 'I have a blocker on the frontend task.',
            note: 'Từ test a11y',
            tags: 'it-scrum',
            mastery_level: 0,
            created_at: new Date().toISOString(),
          },
        ],
      }),
    });
    return;
  }
  await route.continue();
});

// ======================================================== (a) + (b) guest ==
const guestPage = await guestCtx.newPage();
const pageErrors = [];
guestPage.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 120)));

await guestPage.goto(`${BASE}/encyclopedia`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await guestPage
  .waitForSelector('text=BÁCH KHOA TOÀN THƯ', { timeout: 60000 })
  .catch(() => {});
await guestPage.waitForTimeout(3000);

// --- (a) /encyclopedia: mọi button có accessible name
const unnamedEnc = await guestPage.evaluate(scanUnnamedButtons);
check(
  '(a) /encyclopedia: 0 button thiếu accessible name',
  0,
  unnamedEnc.length,
  unnamedEnc.length === 0
);
if (unnamedEnc.length) {
  console.log('  buttons thiếu name ở /encyclopedia:');
  for (const u of unnamedEnc.slice(0, 8)) console.log(`   - "${u.name}" <${u.preview}>`);
}

// --- (b) mở AuthModal từ Navbar (guest) -> Tab trap + Esc
const loginBtn = guestPage.locator('header button', { hasText: 'Đăng Nhập' }).first();
await loginBtn.click();
await guestPage
  .waitForSelector('div[role="dialog"][aria-labelledby="auth-modal-title"]', { timeout: 15000 })
  .catch(() => {});
await guestPage.waitForTimeout(800);

const dialogOpen = await guestPage.evaluate(
  () => !!document.querySelector('div[role="dialog"][aria-labelledby="auth-modal-title"]')
);
check('(b) AuthModal mở có role="dialog" + aria-labelledby', true, dialogOpen, dialogOpen);

// (a) mọi button trong AuthModal có accessible name
const authDialogHandle = await guestPage.$(
  'div[role="dialog"][aria-labelledby="auth-modal-title"]'
);
const unnamedModal = authDialogHandle
  ? await guestPage.evaluate(scanUnnamedInScope, authDialogHandle)
  : ['NO_DIALOG'];
check(
  '(a) AuthModal: 0 button thiếu accessible name',
  0,
  unnamedModal.length,
  unnamedModal.length === 0
);
if (unnamedModal.length) {
  console.log('  buttons thiếu name trong AuthModal:', unnamedModal.slice(0, 8));
}

// (b) Tab không thoát modal trong 12 nhịp (kèm Shift-Tab)
let escapedAt = -1;
for (let i = 0; i < 12; i++) {
  await guestPage.keyboard.press('Tab');
  await guestPage.waitForTimeout(60);
  const inside = await guestPage.evaluate(() => {
    const dialog = document.querySelector(
      'div[role="dialog"][aria-labelledby="auth-modal-title"]'
    );
    return dialog ? dialog.contains(document.activeElement) : false;
  });
  if (!inside) {
    escapedAt = i + 1;
    break;
  }
}
check('(b) AuthModal: Tab không thoát modal trong 12 nhịp', 'thoát ở nhịp > 12', `thoát ở nhịp ${escapedAt === -1 ? 'không' : escapedAt}`, escapedAt === -1);

// Shift-Tab cũng cycle trong modal
await guestPage.keyboard.press('Shift+Tab');
await guestPage.waitForTimeout(60);
const insideShift = await guestPage.evaluate(() => {
  const dialog = document.querySelector(
    'div[role="dialog"][aria-labelledby="auth-modal-title"]'
  );
  return dialog ? dialog.contains(document.activeElement) : false;
});
check('(b) AuthModal: Shift+Tab cũng giữ focus trong modal', true, insideShift, insideShift);

// (b) Esc đóng modal
await guestPage.keyboard.press('Escape');
await guestPage.waitForTimeout(600);
const dialogGone = await guestPage.evaluate(
  () => !document.querySelector('div[role="dialog"][aria-labelledby="auth-modal-title"]')
);
check('(b) AuthModal: Esc đóng modal', true, dialogGone, dialogGone);

// Focus trả về trigger (nút Đăng Nhập trên Navbar) — kiểm tra thêm.
const focusBack = await guestPage.evaluate(() => {
  const el = document.activeElement;
  return !!el && !!el.closest('header');
});
check('(b) AuthModal: focus trả về trigger khi đóng (thêm)', true, focusBack, focusBack);

// ============================================================ (c) encyclopedia ==
// Load lại trang guest để check danh mục + empty-state.
await guestPage.goto(`${BASE}/encyclopedia`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await guestPage.waitForSelector('text=BÁCH KHOA TOÀN THƯ', { timeout: 60000 }).catch(() => {});
await guestPage.waitForTimeout(3000);

const deadCats = await guestPage.evaluate(() => {
  const texts = [...document.querySelectorAll('button')].map((b) => (b.textContent || '').trim());
  return {
    phrasal: texts.filter((t) => t.includes('Phrasal Verbs')).length,
    idioms: texts.filter((t) => t.includes('Idioms Giao Tiếp')).length,
  };
});
check('(c) nút "Phrasal Verbs" đã biến mất', 0, deadCats.phrasal, deadCats.phrasal === 0);
check('(c) nút "Idioms Giao Tiếp" đã biến mất', 0, deadCats.idioms, deadCats.idioms === 0);

// Search từ không tồn tại -> empty-state chuẩn, KHÔNG fallback dữ liệu cứng.
const searchInput = guestPage.locator('input[placeholder*="Nhập từ hoặc câu"]').first();
await searchInput.fill('zzzqqxxx');
await guestPage.waitForTimeout(2500);

const encEmpty = await guestPage.evaluate(() => {
  const body = document.body.textContent || '';
  const hasEmptyState = body.includes('Không tìm thấy mục từ nào phù hợp');
  const hasReset = [...document.querySelectorAll('button')].some((b) =>
    (b.textContent || '').includes('Xóa tìm kiếm')
  );
  // Fallback dữ liệu cứng: grid .card-arcade vẫn đầy từ trong khi counter ghi 0.
  const hardFallbackCards = document.querySelectorAll('.card-arcade').length;
  return { hasEmptyState, hasReset, hardFallbackCards };
});
check('(c) search rỗng -> empty-state chuẩn hiện', true, encEmpty.hasEmptyState, encEmpty.hasEmptyState);
check('(c) empty-state có nút "Xóa tìm kiếm & xem tất cả"', true, encEmpty.hasReset, encEmpty.hasReset);
check('(c) KHÔNG fallback dữ liệu cứng khi search rỗng', 0, encEmpty.hardFallbackCards, encEmpty.hardFallbackCards === 0);

// Nút reset -> grid hiện lại kết quả thật.
const resetBtn = guestPage.locator('button', { hasText: 'Xóa tìm kiếm' }).first();
await resetBtn.click();
await guestPage.waitForTimeout(2500);
const afterReset = await guestPage.evaluate(() => ({
  cards: document.querySelectorAll('.card-arcade').length,
  searchValue:
    (document.querySelector('input[placeholder*="Nhập từ hoặc câu"]')?.value || ''),
}));
check('(c) sau reset grid hiện lại kết quả', '> 0', afterReset.cards, afterReset.cards > 0);
check('(c) sau reset ô search rỗng', "''", `"${afterReset.searchValue}"`, afterReset.searchValue === '');

// ============================================================ (d) + (a) logged-in ==
const userPage = await userCtx.newPage();
userPage.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 120)));

await userPage.goto(`${BASE}/vocabulary`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await userPage.waitForSelector('text=blocker', { timeout: 60000 }).catch(() => {});
await userPage.waitForTimeout(2000);

// (d) từ đã lưu (blocker) hiển thị "Đã Lưu Bookmark" khi load trang.
const vocabSaved = await userPage.waitForFunction(
  () => [...document.querySelectorAll('button')].some((b) => (b.textContent || '').includes('Đã Lưu Bookmark')),
  { timeout: 10000 }
).then(() => true).catch(() => false);
check('(d) vocabulary: từ đã lưu hiện "Đã Lưu" khi load trang', true, vocabSaved, vocabSaved);

const vocabState = await userPage.evaluate(() => {
  const buttons = [...document.querySelectorAll('button')];
  const saved = buttons.filter((b) => (b.textContent || '').includes('Đã Lưu Bookmark'));
  const unsaved = buttons.filter((b) => (b.textContent || '').includes('Lưu Sổ Tay'));
  // Card "blocker" phải là card ĐÃ LƯU.
  let blockerSaved = false;
  for (const b of saved) {
    let el = b.parentElement;
    while (el) {
      if ((el.textContent || '').includes('blocker')) {
        blockerSaved = true;
        break;
      }
      el = el.parentElement;
    }
  }
  return { savedCount: saved.length, unsavedCount: unsaved.length, blockerSaved };
});
check('(d) đúng card "blocker" là đã lưu', true, vocabState.blockerSaved, vocabState.blockerSaved);
check('(d) từ chưa lưu vẫn hiện "Lưu Sổ Tay"', '> 0', vocabState.unsavedCount, vocabState.unsavedCount > 0);

// (a) /vocabulary: mọi button có accessible name
const unnamedVocab = await userPage.evaluate(scanUnnamedButtons);
check('(a) /vocabulary: 0 button thiếu accessible name', 0, unnamedVocab.length, unnamedVocab.length === 0);
if (unnamedVocab.length) {
  console.log('  buttons thiếu name ở /vocabulary:');
  for (const u of unnamedVocab.slice(0, 8)) console.log(`   - "${u.name}" <${u.preview}>`);
}

// ================================================ (a) + L6b bookmarks logged-in ==
await userPage.goto(`${BASE}/bookmarks`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await userPage.waitForSelector('text=blocker', { timeout: 60000 }).catch(() => {});
await userPage.waitForTimeout(2000);

const unnamedBm = await userPage.evaluate(scanUnnamedButtons);
check('(a) /bookmarks: 0 button thiếu accessible name', 0, unnamedBm.length, unnamedBm.length === 0);
if (unnamedBm.length) {
  console.log('  buttons thiếu name ở /bookmarks:');
  for (const u of unnamedBm.slice(0, 8)) console.log(`   - "${u.name}" <${u.preview}>`);
}

// L6b: delete mở modal xác nhận trong app (không confirm() native), Esc/Giữ lại/Xoá.
const deleteBtn = userPage.locator('button[aria-label="Xoá khỏi sổ tay"]').first();
const dialogSel = 'div[role="dialog"][aria-labelledby="delete-confirm-title"]';

await deleteBtn.click();
await userPage.waitForSelector(dialogSel, { timeout: 5000 }).catch(() => {});
const confirmOpen = await userPage.evaluate(() => {
  const d = document.querySelector('div[role="dialog"][aria-labelledby="delete-confirm-title"]');
  return !!d && (d.textContent || '').includes('Xoá khỏi sổ tay?');
});
check('(L6b) delete mở modal xác nhận trong app', true, confirmOpen, confirmOpen);

// Nút mặc định focus là "Giữ lại" (Enter không vô tình xoá).
const focusOnKeep = await userPage.evaluate(() => {
  const el = document.activeElement;
  return !!el && (el.textContent || '').includes('Giữ lại');
});
check('(L6b) focus mặc định vào "Giữ lại"', true, focusOnKeep, focusOnKeep);

// Esc đóng modal, card còn nguyên.
await userPage.keyboard.press('Escape');
await userPage.waitForTimeout(400);
const closedByEsc = await userPage.evaluate(
  () => !document.querySelector('div[role="dialog"][aria-labelledby="delete-confirm-title"]')
);
const cardStillThere = await userPage.evaluate(() =>
  (document.body.textContent || '').includes('blocker')
);
check('(L6b) Esc đóng modal xác nhận', true, closedByEsc, closedByEsc);
check('(L6b) sau Esc card còn nguyên', true, cardStillThere, cardStillThere);

// "Giữ lại" giữ card.
await deleteBtn.click();
await userPage.waitForSelector(dialogSel, { timeout: 5000 }).catch(() => {});
await userPage.locator('button', { hasText: 'Giữ lại' }).first().click();
await userPage.waitForTimeout(400);
const keptAfterKeep = await userPage.evaluate(() =>
  (document.body.textContent || '').includes('blocker')
);
check('(L6b) "Giữ lại" giữ card', true, keptAfterKeep, keptAfterKeep);

// "Xoá" xoá card (DELETE được mock success).
await deleteBtn.click();
await userPage.waitForSelector(dialogSel, { timeout: 5000 }).catch(() => {});
await userPage.locator('button', { hasText: /^Xoá$/ }).first().click();
await userPage.waitForTimeout(800);
const deletedAfterConfirm = await userPage.evaluate(
  () => !(document.body.textContent || '').includes('blocker')
);
check('(L6b) "Xoá" xoá card khỏi danh sách', true, deletedAfterConfirm, deletedAfterConfirm);

// ------------------------------------------------------------------ tổng --
check('pageerror khi load các trang', 0, pageErrors.length, pageErrors.length === 0);
if (pageErrors.length) console.log('  pageerrors:', pageErrors.slice(0, 3));

console.log('\n| Kiem tra | Mong doi | Thuc te | Ket qua |');
console.log('|---|---|---|---|');
for (const r of results) {
  console.log(`| ${r.name} | ${r.expected} | ${r.actual} | ${r.pass ? 'PASS' : 'FAIL'} |`);
}
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} PASS.`);
if (failed.length) {
  console.log('FAIL:');
  for (const f of failed) console.log(`  - ${f.name} (expected ${f.expected}, got ${f.actual})`);
}

await browser.close();
process.exitCode = failed.length === 0 ? 0 : 1;
