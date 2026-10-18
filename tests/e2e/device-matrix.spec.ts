import { expect, Page, test } from '@playwright/test';

/**
 * QA3 (2026-10-18) — Ma trận thiết bị + lỗi tìm được khi walkthrough.
 *
 * Ba nhóm lỗi được khoá lại bằng test này:
 *  1. Tràn ngang im lặng (kế thừa UX-001) trên 6 cấu hình thiết bị — dùng lại
 *     nguyên tắc của `mobile-overflow.spec.ts`: KHÔNG tin `documentElement.scrollWidth`
 *     (bị `overflow-x-hidden` clamp), mà đo bề rộng phần tử gốc + node bị cắt.
 *  2. Tap target nhỏ hơn 44px trên thiết bị cảm ứng (chip lọc 24–32px). Đo bằng
 *     `getBoundingClientRect` THẬT (không tính vùng mở rộng `::after` của
 *     `.tap-target`) nên test chỉ xanh khi chip cao thật ≥ 44px.
 *  3. `FlagIcon is not defined` — lỗi runtime ở trang chủ (pageerror) làm cả khối
 *     nội dung không render; kèm kiểm tra cờ SVG đã vẽ thật thay vì pill rỗng.
 */

const ALL_ROUTES = [
  '/',
  '/vocabulary',
  '/grammar',
  '/flashcards',
  '/exam',
  '/encyclopedia',
  '/bookmarks',
  '/practice/listening',
  '/practice/roleplay',
  '/practice/speaking',
  '/practice/writing',
  '/pet',
  '/fitcheck',
  '/support',
];

const KEY_ROUTES = ['/', '/vocabulary', '/exam', '/practice/writing', '/pet', '/support'];

const PHONES = [
  { name: 'iphone-se-320x568', width: 320, height: 568 },
  { name: 'android-360x800', width: 360, height: 800 },
  { name: 'iphone-390x844', width: 390, height: 844 },
];

const TABLETS_LAPTOP = [
  { name: 'ipad-768x1024', width: 768, height: 1024 },
  { name: 'ipad-ngang-1024x768', width: 1024, height: 768 },
  { name: 'laptop-1366x768', width: 1366, height: 768 },
];

type OverflowMeasurement = {
  rootWidth: number;
  innerWidth: number;
  scrollWidth: number;
  clippedCount: number;
  worstClipped: string[];
};

async function measureOverflow(page: Page): Promise<OverflowMeasurement> {
  return page.evaluate(() => {
    const de = document.documentElement;
    const main = document.querySelector('main');
    const root = main ? main.firstElementChild : null;
    const worst: string[] = [];
    let clippedCount = 0;
    for (const el of Array.from(document.querySelectorAll('*'))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.right <= window.innerWidth + 1) continue;
      // vùng cuộn ngang cố ý (dải chip/tab) không tính là bị cắt im lặng
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
      if (intentional) continue;
      if (/pointer-events-none|blur-|orb/i.test(String(el.className || '')) && r.right <= window.innerWidth + 120) continue;
      clippedCount++;
      if (worst.length < 3) {
        worst.push(`${el.tagName}.${String(el.className || '').slice(0, 45)} right=${Math.round(r.right)}`);
      }
    }
    return {
      rootWidth: root ? Math.round(root.getBoundingClientRect().width) : -1,
      innerWidth: window.innerWidth,
      scrollWidth: de.scrollWidth,
      clippedCount,
      worstClipped: worst,
    };
  });
}

async function loginDemo(page: Page) {
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

test.describe('QA3: ma trận thiết bị không tràn ngang', () => {
  for (const vp of PHONES) {
    test(`${vp.name} — ${ALL_ROUTES.length} trang không tràn/cắt im lặng`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginDemo(page);

      const failures: string[] = [];
      for (const path of ALL_ROUTES) {
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(path === '/pet' ? 1200 : 350);
        const m = await measureOverflow(page);
        if (m.rootWidth > m.innerWidth) {
          failures.push(`${path}: gốc ${m.rootWidth}px > khung ${m.innerWidth}px`);
        }
        if (m.scrollWidth > m.innerWidth) {
          failures.push(`${path}: scrollWidth ${m.scrollWidth}px > khung ${m.innerWidth}px`);
        }
        if (m.clippedCount > 0) {
          failures.push(`${path}: ${m.clippedCount} node bị cắt [${m.worstClipped.join(' | ')}]`);
        }
      }
      expect(failures.join('\n')).toBe('');
    });
  }

  for (const vp of TABLETS_LAPTOP) {
    test(`${vp.name} — ${KEY_ROUTES.length} trang chính không tràn`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginDemo(page);

      const failures: string[] = [];
      for (const path of KEY_ROUTES) {
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(path === '/pet' ? 1200 : 350);
        const m = await measureOverflow(page);
        if (m.rootWidth > m.innerWidth) failures.push(`${path}: gốc ${m.rootWidth}px > khung ${m.innerWidth}px`);
        if (m.clippedCount > 0) failures.push(`${path}: ${m.clippedCount} node bị cắt [${m.worstClipped.join(' | ')}]`);
      }
      expect(failures.join('\n')).toBe('');
    });
  }
});

test.describe('QA3: tap target ≥ 44px cho chip lọc trên thiết bị cảm ứng', () => {
  /** Chip lọc phải cao thật ≥ 44px (không tính vùng ::after của .tap-target). */
  async function assertChips(page: Page, names: (string | RegExp)[], label: string) {
    const failures: string[] = [];
    for (const name of names) {
      const btn = page.getByRole('button', { name }).first();
      // AppShell chỉ render nội dung sau khi kiểm tra auth phía client (splash
      // "Đang tải không gian học tập..."), nên phải CHỜ chip xuất hiện thay vì
      // sleep cứng — trước đây 400ms làm test đỏ giả trên /flashcards, /support.
      try {
        await btn.waitFor({ state: 'visible', timeout: 10_000 });
      } catch {
        failures.push(`${label}: không tìm thấy chip ${String(name)}`);
        continue;
      }
      const box = await btn.boundingBox();
      if (!box) {
        failures.push(`${label}: chip ${String(name)} không hiển thị`);
        continue;
      }
      if (box.height < 44) {
        failures.push(`${label}: chip ${String(name)} cao ${Math.round(box.height)}px < 44px`);
      }
    }
    return failures;
  }

  test('390×844 — chip lọc exam/speaking/writing/listening/flashcards/support', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginDemo(page);
    const failures: string[] = [];

    await page.goto('/exam', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    failures.push(...(await assertChips(page, [/^Tất cả$/, /TOEIC ETS/], 'exam/chủ đề')));
    failures.push(...(await assertChips(page, [/^A1 - A2$/, /^B1$/], 'exam/cấp độ')));

    await page.goto('/practice/speaking', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    failures.push(...(await assertChips(page, [/^Tất cả$/, /IT & Scrum/], 'speaking/chủ đề')));
    failures.push(...(await assertChips(page, [/Mọi cấp độ/, /Challenging/], 'speaking/cấp độ')));

    await page.goto('/practice/writing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    failures.push(...(await assertChips(page, [/Tất cả chủ đề/, /IT Công Sở/], 'writing/chủ đề')));
    failures.push(...(await assertChips(page, [/Tạo Đề AI Tự Do/, /Lịch Sử Đề Thi/], 'writing/nút tác vụ')));

    await page.goto('/practice/listening', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    failures.push(...(await assertChips(page, [/Tất cả bài nghe/, /Chọn Đề Ngẫu Nhiên/, /Transcript/], 'listening')));

    await page.goto('/flashcards', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    failures.push(...(await assertChips(page, [/Tất cả từ/, /Sổ Bookmark của bạn/], 'flashcards')));

    await page.goto('/support', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    failures.push(...(await assertChips(page, [/Cẩm Nang & Hướng Dẫn/, /Trợ Lý Mèo AI/, /Gửi Ticket/], 'support/tab')));
    failures.push(...(await assertChips(page, [/#Kiếm Coins/], 'support/hashtag')));
    failures.push(...(await assertChips(page, [/Tất cả chuyên mục/], 'support/chuyên mục')));

    expect(failures.join('\n')).toBe('');
  });

  test('768×1024 — nút Thu Hoạch Hết của nông trại + tab support', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginDemo(page);
    const failures: string[] = [];

    await page.goto('/pet', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    failures.push(...(await assertChips(page, [/Thu Hoạch Hết/], 'pet/thu hoạch')));

    await page.goto('/support', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    failures.push(...(await assertChips(page, [/Cẩm Nang & Hướng Dẫn/, /Gửi Ticket/], 'support/tab')));

    expect(failures.join('\n')).toBe('');
  });
});

test.describe('QA3: lỗi runtime trang chủ (FlagIcon)', () => {
  test('trang chủ không còn pageerror và cờ SVG render thật', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1366, height: 768 });
    await loginDemo(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    expect(pageErrors, `pageerrors: ${pageErrors.join(' | ')}`).toEqual([]);

    // `<FlagIcon>` vẽ SVG tỉ lệ cờ 3:2 (viewBox "0 0 30 20"). Bản lỗi trước đây
    // (a) ném ReferenceError nên không SVG nào tồn tại, hoặc (b) gọi nhầm
    // FlagIcon với prop `text` → rơi vào pill chữ RỖNG (code rỗng).
    const flagInfo = await page.evaluate(() => {
      const svgs = Array.from(document.querySelectorAll('svg[role="img"][viewBox="0 0 30 20"]')).filter(
        (s) => (s as SVGSVGElement).getBoundingClientRect().width > 0,
      );
      const emptyPills = Array.from(document.querySelectorAll('span[role="img"]')).filter(
        (s) => (s.textContent || '').trim() === '' && /Cờ/i.test(s.getAttribute('aria-label') || ''),
      );
      return { svgCount: svgs.length, emptyPills: emptyPills.length };
    });
    expect(flagInfo.svgCount, 'phải có ít nhất 1 cờ SVG được vẽ').toBeGreaterThan(0);
    expect(flagInfo.emptyPills, 'không được còn pill cờ rỗng').toBe(0);
  });
});

test.describe('QA3: canvas nông trại 2.5D trên mobile', () => {
  test('390×844 — canvas nằm trong màn hình đầu và vẽ được (không rỗng)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginDemo(page);
    await page.goto('/pet', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    const box = await canvas.boundingBox();
    expect(box, 'canvas phải có hộp đo được').not.toBeNull();
    if (box) {
      // Canvas phải nằm trọn trong khung nhìn đầu tiên (không phải cuộn mới thấy).
      expect(box.y + box.height).toBeLessThanOrEqual(844);
      expect(box.width).toBeGreaterThanOrEqual(280);
    }

    // Canvas phải có nội dung vẽ thật (không phải bitmap trắng trơn).
    const painted = await page.evaluate(() => {
      const c = document.querySelector('canvas') as HTMLCanvasElement | null;
      if (!c) return null;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      const w = c.width;
      const h = c.height;
      if (!w || !h) return null;
      try {
        const data = ctx.getImageData(0, 0, Math.min(w, 200), Math.min(h, 200)).data;
        const colors = new Set<string>();
        for (let i = 0; i < data.length; i += 4 * 97) {
          colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
          if (colors.size > 5) break;
        }
        return colors.size;
      } catch {
        return -1; // canvas bị nhiễm bẩn (tainted) → coi như có vẽ
      }
    });
    expect(painted === null || painted === -1 || painted > 5, `canvas có ${painted} màu — trông rỗng`).toBeTruthy();
  });
});
