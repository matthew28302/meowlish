/**
 * scripts/verify-seo-dom.mjs
 *
 * H5 (audit 2026-10-08) — kiểm chứng DOM guest sau fix "gate overlay đè lên":
 * guest (localStorage TRỐNG, không seed) vào từng trang và kiểm:
 *   (a) DOM có nội dung thật trong <main> (chữ tiếng Việt có dấu, đủ dài,
 *       không còn splash "Đang tải không gian học tập...")
 *   (b) có ít nhất 1 heading (h1/h2/h3) với text tiếng Việt
 *   (c) với trang gated: AuthModal vẫn hiện (full-screen takeover) NHƯNG
 *       children vẫn nằm trong DOM + gate overlay `[data-guest-gate]` có mặt
 *   (d) sau khi đóng modal (nút X "Đóng cửa sổ"): gate + modal biến mất khỏi
 *       DOM, nội dung KHÔNG còn bị che (elementFromPoint), và bấm 1 link
 *       protected trong sidebar → modal mở lại (chứng minh bấm được + hành vi
 *       chặn guest vẫn nguyên)
 *
 * Chạy: node scripts/verify-seo-dom.mjs   (dev server phải đang chạy :3000)
 * === KHÔNG đụng file của agent khác — chỉ đọc DOM qua Playwright ===
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const SPLASH_TEXT = 'Đang tải không gian học tập';
const AUTH_MODAL_SELECTOR = 'div[class*="z-[10000]"]'; // AuthModal full-screen takeover
const GATE_SELECTOR = '[data-guest-gate]'; // Guest gate overlay (AppShell)
const CLOSE_BUTTON_SELECTOR = 'button[title="Đóng cửa sổ"]'; // Nút X của AuthModal

// /encyclopedia là trang public (không gate) — còn lại đều gated (điều kiện
// gate GIỮ NGUYÊN: !currentUser && pathname !== '/encyclopedia').
const PAGES = [
  { path: '/', gated: true },
  { path: '/encyclopedia', gated: false },
  { path: '/grammar', gated: true },
  { path: '/vocabulary', gated: true },
  { path: '/practice/speaking', gated: true },
  { path: '/practice/writing', gated: true },
  { path: '/practice/listening', gated: true },
  { path: '/practice/roleplay', gated: true },
  { path: '/pet', gated: true },
  { path: '/flashcards', gated: true },
  { path: '/bookmarks', gated: true },
  { path: '/support', gated: true },
];

async function verifyPage(browser, { path, gated }) {
  const result = {
    path,
    gated,
    mainTextLen: 0,
    headings: [],
    splashPresent: null,
    modalVisible: null,
    gateInDom: null,
    afterCloseCovered: null,
    afterCloseElement: null,
    reopenWorks: null,
    checks: { realContent: false, vietnameseHeading: false, modalOpenButChildrenInDom: null, contentClickableAfterClose: false, interactionWorksAfterClose: false },
    error: null,
  };

  // Mỗi trang 1 context MỚI — localStorage trống hoàn toàn → guest thật
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  try {
    await page.goto(BASE_URL + path, { waitUntil: 'domcontentloaded', timeout: 90000 });

    // Đợi hydration + auth check: splash biến mất (AppShell unmount splash khi
    // isAuthChecked=true; guest không fetch nên rất nhanh)
    await page
      .waitForFunction(
        (splash) => !document.body?.innerText?.includes(splash),
        SPLASH_TEXT,
        { timeout: 60000 }
      )
      .catch(() => {}); // timeout → splashPresent phía dưới sẽ bắt

    if (gated) {
      await page.waitForSelector(GATE_SELECTOR, { timeout: 60000 });
    }

    // Đợi nội dung trang mount vào DOM bên trong <main> (không phải shell rỗng)
    await page.waitForFunction(
      () => {
        const m = document.querySelector('main');
        return !!m && (m.textContent || '').trim().length > 30;
      },
      null,
      { timeout: 60000 }
    );

    // ---- (a)+(b)+(c): đo khi modal ĐANG mở (với trang gated) ----
    const dom = await page.evaluate(() => {
      const VN = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
      const headingTexts = Array.from(document.querySelectorAll('h1, h2, h3'))
        .map((h) => (h.textContent || '').trim())
        .filter(Boolean);
      const mainText = (document.querySelector('main')?.textContent || '').trim();
      const bodyText = (document.body?.textContent || '').trim();
      const modal = document.querySelector('div[class*="z-[10000]"]');
      const modalRect = modal?.getBoundingClientRect();
      return {
        headingTexts,
        mainTextLen: mainText.length,
        hasVnHeading: headingTexts.some((t) => VN.test(t)),
        hasVnMain: VN.test(mainText),
        splashPresent: bodyText.includes('Đang tải không gian học tập'),
        modalInDom: !!modal,
        modalVisible: !!modalRect && modalRect.width > 0 && modalRect.height > 0,
        gateInDom: !!document.querySelector('[data-guest-gate]'),
      };
    });

    result.mainTextLen = dom.mainTextLen;
    result.headings = dom.headingTexts.slice(0, 6);
    result.splashPresent = dom.splashPresent;
    result.modalVisible = dom.modalVisible;
    result.gateInDom = dom.gateInDom;

    // (a) Nội dung thật: <main> đủ dài + có tiếng Việt có dấu + splash đã tắt
    result.checks.realContent = dom.mainTextLen >= 80 && dom.hasVnMain && !dom.splashPresent;
    // (b) Ít nhất 1 heading tiếng Việt
    result.checks.vietnameseHeading = dom.hasVnHeading;
    // (c) Modal vẫn hiện NHƯNG children vẫn trong DOM (trang public: không có gate ép mở)
    result.checks.modalOpenButChildrenInDom = gated
      ? dom.modalVisible && dom.gateInDom && dom.headingTexts.length > 0 && dom.mainTextLen > 30
      : null;

    // ---- (d) đóng modal → nội dung bấm được ----
    if (gated) {
      await page.locator(CLOSE_BUTTON_SELECTOR).click({ timeout: 20000 });
      await page.waitForFunction(
        () => !document.querySelector('[data-guest-gate]') && !document.querySelector('div[class*="z-[10000]"]'),
        null,
        { timeout: 20000 }
      );
    }

    const afterClose = await page.evaluate(() => {
      const el = document.elementFromPoint(
        Math.floor(window.innerWidth / 2),
        Math.max(240, Math.floor(window.innerHeight / 2))
      );
      const covered = el ? !!(el.closest('[data-guest-gate]') || el.closest('div[class*="z-[10000]"]')) : true;
      return {
        covered,
        describe: el ? `${el.tagName.toLowerCase()}.${(el.className || '').toString().slice(0, 60)}` : 'null',
      };
    });
    result.afterCloseCovered = afterClose.covered;
    result.afterCloseElement = afterClose.describe;
    result.checks.contentClickableAfterClose = !afterClose.covered;

    // Bấm thử link protected trong sidebar ("Lộ Trình Học" → href /) — guest bị
    // chặn (preventDefault) + modal mở lại = tương tác thành công, hành vi giữ nguyên
    try {
      await page
        .locator('aside')
        .getByRole('link', { name: /Lộ Trình/ })
        .first()
        .click({ timeout: 15000 });
      await page.waitForFunction(
        () => !!document.querySelector('div[class*="z-[10000]"]'),
        null,
        { timeout: 15000 }
      );
      result.reopenWorks = true;
    } catch {
      result.reopenWorks = false;
    }
    result.checks.interactionWorksAfterClose = result.reopenWorks;
  } catch (e) {
    result.error = e.message?.split('\n')[0] || String(e);
  } finally {
    await context.close();
  }

  return result;
}

function verdict(r) {
  const required = [r.checks.realContent, r.checks.vietnameseHeading, r.checks.contentClickableAfterClose, r.checks.interactionWorksAfterClose];
  if (r.gated) required.push(r.checks.modalOpenButChildrenInDom === true);
  return required.every(Boolean) && !r.error ? 'PASS' : 'FAIL';
}

function printResult(r) {
  const status = verdict(r);
  const gate = r.gated ? 'gated  ' : 'public ';
  console.log(`\n=== ${gate} ${r.path} → ${status}`);
  if (r.error) {
    console.log(`  LỖI: ${r.error}`);
    return;
  }
  console.log(`  (a) Nội dung thật trong <main>: ${r.checks.realContent ? 'PASS' : 'FAIL'} — ${r.mainTextLen} ký tự, splash còn: ${r.splashPresent}`);
  console.log(`  (b) Heading tiếng Việt:         ${r.checks.vietnameseHeading ? 'PASS' : 'FAIL'} — ví dụ: ${r.headings.map((t) => `"${t.slice(0, 40)}"`).join(', ') || '(không có heading)'}`);
  if (r.gated) {
    console.log(`  (c) Modal hiện + children trong DOM: ${r.checks.modalOpenButChildrenInDom ? 'PASS' : 'FAIL'} — modal visible: ${r.modalVisible}, gate overlay trong DOM: ${r.gateInDom}`);
    console.log(`  (d) Sau khi đóng modal: elementFromPoint → ${r.afterCloseCovered ? 'VẪN BỊ CHE' : 'không bị che'} (${r.afterCloseElement}); bấm link sidebar → modal mở lại: ${r.reopenWorks}`);
  } else {
    console.log(`  (d) Trang public (không gate ép mở): elementFromPoint → ${r.afterCloseCovered ? 'BỊ CHE (LỖI)' : 'không bị che'} (${r.afterCloseElement}); bấm link sidebar → modal mở lại: ${r.reopenWorks}`);
  }
}

const browser = await chromium.launch();
console.log(`Kiểm chứng DOM guest (H5) trên ${BASE_URL} — ${PAGES.length} trang, localStorage trống (không seed)...`);

const results = [];
for (const p of PAGES) {
  const r = await verifyPage(browser, p);
  results.push(r);
  printResult(r);
}
await browser.close();

const failed = results.filter((r) => verdict(r) === 'FAIL');
console.log(`\n================ TỔNG KẾT: ${results.length - failed.length}/${results.length} trang PASS ================`);
if (failed.length) {
  console.log(`FAIL: ${failed.map((r) => r.path).join(', ')}`);
  process.exitCode = 1;
}
