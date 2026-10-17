import { expect, Page, test } from '@playwright/test';

/**
 * UX-001 (BLOCKER): vỡ layout mobile — trang phình ngang viewport nên nội
 * dung bị CẮT im lặng, không có thanh cuộn để người dùng biết còn nội dung.
 *
 * NGUYÊN NHÂN: `<main>` trong AppShell là `flex flex-col`, mà phần tử gốc
 * của trang dùng `max-w-*` + `mx-auto` mà THIẾU `w-full`. Trong flex column,
 * `margin-inline: auto` phá vỡ cơ chế `align-items: stretch`, nên phần tử bị co
 * theo **chiều rộng nội dung** (max-content) thay vì theo khung chứa — đúng bằng
 * `max-w-7xl` = 1280px và `max-w-6xl` = 1152px như đã đo.
 *
 * VÌ SAO KHÔNG DÙNG `documentElement.scrollWidth`: `overflow-x-hidden` trên
 * phần tử gốc sẽ clamp `scrollWidth` về đúng `innerWidth`, khiến phép đo luôn
 * "xanh" dù nội dung vẫn bị cắt. Tín hiệu thật là **bề rộng phần tử gốc**
 * và **node nào vượt mép phải**.
 */

const PAGES = [
  '/bookmarks',
  '/encyclopedia',
  '/exam',
  '/flashcards',
  '/practice/listening',
  '/practice/roleplay',
  '/practice/speaking',
  '/practice/writing',
  '/vocabulary',
];

const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
];

type Measurement = {
  rootWidth: number;
  innerWidth: number;
  scrollWidth: number;
  /** Số node có mép phải vượt khung, KHÔNG nằm trong vùng cuộn ngang chủ ý. */
  clippedCount: number;
};

async function measure(page: Page, path: string): Promise<Measurement> {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  return page.evaluate(() => {
    const de = document.documentElement;
    // Phần tử gốc của trang = node con đầu tiên của <main> do AppShell render.
    const main = document.querySelector('main');
    const root = main ? main.firstElementChild : null;

    let clippedCount = 0;
    for (const el of Array.from(document.querySelectorAll('*'))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.right <= window.innerWidth + 1) continue;
      // Bỏ qua node nằm trong vùng cuộn ngang cố ý (dải filter/tab) — đó là
      // hành vi đúng, người dùng cuộn ngang được chứ không bị cắt im lặng.
      let p: HTMLElement | null = el.parentElement;
      let intentional = false;
      while (p && p !== document.body) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll') {
          intentional = true;
          break;
        }
        p = p.parentElement;
      }
      if (!intentional) clippedCount++;
    }

    return {
      rootWidth: root ? Math.round(root.getBoundingClientRect().width) : -1,
      innerWidth: window.innerWidth,
      scrollWidth: de.scrollWidth,
      clippedCount,
    };
  });
}

async function loginDemo(page: Page) {
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
}

test.describe('UX-001: không tràn ngang ở viewport hẹp', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.name} — 9 trang co phan tu goc khop khung`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginDemo(page);

      const failures: string[] = [];
      for (const path of PAGES) {
        const m = await measure(page, path);
        // `rootWidth <= innerWidth`: trang co the hẹp hơn khung, nhưng KHÔNG
        // được rộng hơn — rộng hơn tức là nội dung tràn ra ngoài.
        if (m.rootWidth > m.innerWidth) {
          failures.push(`${path}: phan tu goc ${m.rootWidth}px > khung ${m.innerWidth}px`);
        }
        if (m.scrollWidth > m.innerWidth) {
          failures.push(`${path}: scrollWidth ${m.scrollWidth}px > khung ${m.innerWidth}px`);
        }
        if (m.clippedCount > 0) {
          failures.push(`${path}: ${m.clippedCount} node tran ngang bi cat im lang`);
        }
      }
      expect(failures.join('\n')).toBe('');
    });
  }
});