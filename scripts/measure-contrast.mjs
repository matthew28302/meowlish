// Đo contrast WCAG 2.x AA của mọi phần tử CHỮ hiển thị trên các trang chính,
// light + dark mode. Đo bằng getComputedStyle thật (màu chữ + nền hiệu lực đi
// lên cây DOM, trộn alpha, đọc cả gradient), KHÔNG suy đoán từ className.
//
// Cách chạy:
//   node scripts/measure-contrast.mjs                    # light + dark, mọi trang
//   PROBE_PAGES=/pet PROBE_MODES=light node scripts/measure-contrast.mjs
//
// Ngưỡng AA: 4.5:1 (chữ thường), 3:1 (chữ lớn: >=24px hoặc >=18.66px + bold).
import { chromium } from 'playwright';

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const PAGES = (process.env.PROBE_PAGES || '/,/pet,/encyclopedia,/vocabulary,/bookmarks,/grammar').split(',');
const MODES = (process.env.PROBE_MODES || 'light,dark').split(',');
const OPEN_SHOP = process.env.PROBE_SHOP !== '0'; // mở modal shop /pet để đo badge bên trong
const DEMO_PASS = '123456'; // tài khoản demo công khai của repo (README) — không phải secret env

// ---------- đo trong trang ----------
// Tự chứa (chạy trong browser context qua page.evaluate — không tham chiếu ngoài).
function collectInPage() {
  function srgbToLinear(c) { // c: kênh sRGB đã encode, 0..1
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function luminanceFromEncoded(rgb) { // rgb: [r,g,b] encoded sRGB 0..1
    return 0.2126 * srgbToLinear(rgb[0]) + 0.7152 * srgbToLinear(rgb[1]) + 0.0722 * srgbToLinear(rgb[2]);
  }
  function contrastRatio(l1, l2) {
    const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }
  function oklchToLinear(L, C, Hdeg) {
    const h = (Hdeg * Math.PI) / 180;
    const a = C * Math.cos(h), b = C * Math.sin(h);
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;
    const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
    return [
      Math.min(1, Math.max(0, 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
      Math.min(1, Math.max(0, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
      Math.min(1, Math.max(0, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
    ];
  }
  function oklabToLinear(L, a, b) {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;
    const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
    return [
      Math.min(1, Math.max(0, 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
      Math.min(1, Math.max(0, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
      Math.min(1, Math.max(0, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
    ];
  }
  function labToLinear(L100, a, b) {
    // CIE Lab (D65) -> XYZ -> linear sRGB
    const fy = (L100 + 16) / 116;
    const fx = a / 500 + fy;
    const fz = fy - b / 200;
    const e = 216 / 24389, k = 24389 / 27;
    const inv = (t) => (t ** 3 > e ? t ** 3 : (116 * t - 16) / k);
    const yr = L100 > k * e ? ((L100 + 16) / 116) ** 3 : L100 / k;
    const X = 0.9504559 * inv(fx), Y = 1.0 * yr, Z = 1.0890578 * inv(fz);
    return [
      Math.min(1, Math.max(0, 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z)),
      Math.min(1, Math.max(0, -0.969266 * X + 1.8760108 * Y + 0.041556 * Z)),
      Math.min(1, Math.max(0, 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z)),
    ];
  }
  function parseColorToken(str) {
    // Trả về { rgb: [r,g,b] ENCODED sRGB 0..1, alpha } hoặc null nếu không parse được.
    // LƯU Ý: composite alpha phải làm trong không gian encoded sRGB (trình duyệt
    // composite trong sRGB, không phải linear) — nên giữ encoded đến khi tính L.
    const s = (str || '').trim();
    let m = s.match(/^rgba?\(([^)]+)\)$/i);
    if (m) {
      const nums = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
      if (nums.length >= 3 && nums.slice(0, 3).every((n) => !Number.isNaN(n))) {
        return {
          rgb: nums.slice(0, 3).map((n) => Math.min(1, Math.max(0, n / 255))),
          alpha: nums.length >= 4 && !Number.isNaN(nums[3]) ? nums[3] : 1,
        };
      }
      return null;
    }
    if (/^#[0-9a-f]{3,8}$/i.test(s)) {
      const hex = s.slice(1);
      const full = hex.length <= 4 ? hex.split('').map((c) => c + c).join('') : hex;
      return {
        rgb: [0, 2, 4].map((i) => Math.min(1, Math.max(0, parseInt(full.slice(i, i + 2), 16) / 255))),
        alpha: full.length >= 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1,
      };
    }
    m = s.match(/^oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/i);
    if (m) {
      // oklch -> linear -> encode về sRGB để composite đúng không gian.
      let L = parseFloat(m[1]);
      if (L > 1) L = L / 100;
      const lin = oklchToLinear(L, parseFloat(m[2]), parseFloat(m[3]));
      const enc = lin.map((c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055));
      const am = s.match(/\/\s*([\d.]+)\s*\)/);
      return { rgb: enc, alpha: am ? parseFloat(am[1]) : 1 };
    }
    m = s.match(/^oklab\(\s*([\d.]+)%?\s+(-?[\d.]+)\s+(-?[\d.]+)/i);
    if (m) {
      // Chrome serialize computed color dạng oklab(L a b [/ a]) — L 0..1 (hoặc %).
      let L = parseFloat(m[1]);
      if (L > 1) L = L / 100;
      const lin = oklabToLinear(L, parseFloat(m[2]), parseFloat(m[3]));
      const enc = lin.map((c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055));
      const am = s.match(/\/\s*([\d.]+)\s*\)/);
      return { rgb: enc, alpha: am ? parseFloat(am[1]) : 1 };
    }
    m = s.match(/^lab\(\s*([\d.]+)%?\s+(-?[\d.]+)%?\s+(-?[\d.]+)%?/i);
    if (m) {
      // Chrome serialize computed color dạng lab(L a b [/ a]) — L 0..100 (hoặc %).
      let L = parseFloat(m[1]);
      if (L <= 1.0001 && s.includes('%') === false && L <= 1) L = L * 100; // "lab(0.5 …)" hiếm gặp
      const lin = labToLinear(L, parseFloat(m[2]), parseFloat(m[3]));
      const enc = lin.map((c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055));
      const am = s.match(/\/\s*([\d.]+)\s*\)/);
      return { rgb: enc, alpha: am ? parseFloat(am[1]) : 1 };
    }
    m = s.match(/^color\(\s*(srgb|display-p3)\s+([^)]+)\)$/i);
    if (m) {
      // Chrome serialize computed color dạng color(srgb r g b [/ a]) — giá trị 0..1
      // (hoặc %). display-p3 xấp xỉ thành sRGB (sai số nhỏ, chấp nhận được).
      const parts = m[2].split(/[\s,\/]+/).filter(Boolean);
      const val = (t) => (String(t).endsWith('%') ? parseFloat(t) / 100 : parseFloat(t));
      if (parts.length >= 3 && parts.slice(0, 3).every((n) => !Number.isNaN(val(n)))) {
        return {
          rgb: parts.slice(0, 3).map((n) => Math.min(1, Math.max(0, val(n)))),
          alpha: parts.length >= 4 && !Number.isNaN(val(parts[3])) ? val(parts[3]) : 1,
        };
      }
      return null;
    }
    return null; // color-mix lồng nhau… bỏ qua (không đoán)
  }
  function blendOver(fg, alpha, bg) { // trộn fg (encoded sRGB) đè lên bg (encoded sRGB)
    return fg.map((c, i) => c * alpha + bg[i] * (1 - alpha));
  }

  const isLarge = (fs, fw) => fs >= 24 || (fs >= 18.66 && fw >= 700);
  const out = [];
  const all = [...document.querySelectorAll('body *')].filter((el) => {
    if (/^(script|style|noscript|link|meta|title)$/i.test(el.tagName)) return false;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return false;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    if (parseFloat(s.opacity) < 0.5) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });

  for (const el of all) {
    const s = getComputedStyle(el);
    const color = parseColorToken(s.color);
    if (!color) continue;

    // Nền hiệu lực: đi lên từ chính element — gom các lớp rgba mờ, dừng ở lớp đục
    // hoặc gradient. TRỘN alpha trong không gian encoded sRGB (như trình duyệt).
    let base = null, unknown = false;
    const stack = [];
    for (let node = el; node; node = node.parentElement) {
      const ns = getComputedStyle(node);
      const bgc = parseColorToken(ns.backgroundColor);
      const hasImg = ns.backgroundImage && ns.backgroundImage !== 'none';
      if (hasImg) {
        // Đọc các stop màu trong gradient, lấy stop XẤU NHẤT với màu chữ (xấp xỉ axe).
        const stops = (ns.backgroundImage.match(/(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}|oklch\([^)]+\))/g) || [])
          .map((t) => parseColorToken(t)).filter(Boolean);
        if (stops.length) {
          let worst = null;
          for (const st of stops) {
            const c = st.alpha >= 0.99 ? st.rgb : blendOver(st.rgb, st.alpha, [1, 1, 1]);
            const ratio = contrastRatio(luminanceFromEncoded(color.rgb), luminanceFromEncoded(c));
            if (!worst || ratio < worst.ratio) worst = { rgb: c };
          }
          base = worst.rgb;
        } else {
          unknown = true; // gradient không parse được (color-mix lồng)
        }
        break;
      }
      if (bgc && bgc.alpha > 0) {
        if (bgc.alpha >= 0.99) { base = bgc.rgb; break; }
        stack.push({ rgb: bgc.rgb, alpha: bgc.alpha });
      }
    }
    if (!base) {
      if (unknown) continue; // không xác định được nền — không đoán, không đếm
      base = [1, 1, 1]; // trang không có nền nào -> trắng
    }
    // Trộn các lớp mờ (từ xa vào gần) đè lên nền gốc.
    let effBg = base;
    for (const item of [...stack].reverse()) effBg = blendOver(item.rgb, item.alpha, effBg);

    const ratio = contrastRatio(luminanceFromEncoded(color.rgb), luminanceFromEncoded(effBg));
    const fs = parseFloat(s.fontSize);
    const fw = parseInt(s.fontWeight) || 400;
    const threshold = isLarge(fs, fw) ? 3 : 4.5;
    if (ratio < threshold - 0.005) {
      const to255 = (enc) => Math.round(Math.min(1, Math.max(0, enc)) * 255);
      out.push({
        ratio: Math.round(ratio * 100) / 100,
        threshold,
        color: `rgb(${color.rgb.map(to255).join(',')})`,
        bg: `rgb(${effBg.map(to255).join(',')})`,
        fontSize: fs,
        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
        cls: (el.getAttribute('class') || '').slice(0, 80),
      });
    }
  }
  return out;
}

// ---------- đăng nhập (cookie + localStorage) ----------
async function signedInPage(browser, path, mode) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  // Đăng nhập bằng API: vừa lấy cookie phiên, vừa lấy user object để ghi sẵn
  // vào localStorage TRƯỚC khi tải trang (app đọc localStorage — chỉ cookie thì
  // AuthModal vẫn tự mở và che toàn bộ app, mọi click bị chặn).
  const login = await ctx.request.post(`${BASE}/api/auth`, {
    data: { action: 'login', username: 'demo', password: DEMO_PASS },
  });
  let loginUser = null;
  if (login.ok()) {
    try { loginUser = (await login.json())?.user || null; } catch { loginUser = null; }
    const sc = login.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie')?.value || '';
    const [n, ...r] = sc.split(';')[0].split('=');
    await ctx.addCookies([{ name: n, value: r.join('='), url: BASE }]);
  }
  await ctx.addInitScript(
    ({ dark, user }) => {
      localStorage.setItem('meowlish_theme', dark);
      localStorage.removeItem('english_for_me_logged_out');
      if (user) localStorage.setItem('english_for_me_user', JSON.stringify(user));
    },
    { dark: mode === 'dark' ? 'dark' : 'light', user: loginUser }
  );
  const page = await ctx.newPage();
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);
  // AuthModal/guest gate tự mở với tài khoản demo (AppShell coi user_demo_default
  // là guest). H5: nút X / Escape ĐÓNG THẬT (gỡ cả gate) — NHƯNG KHÔNG được
  // reload sau khi đóng: reload remount → gate mở lại. Đóng xong là bấm được.
  const gateOpen = await page
    .evaluate(() => !!document.querySelector('[data-guest-gate], [aria-labelledby="auth-modal-title"]'))
    .catch(() => false);
  if (gateOpen) {
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(600);
    const stillOpen = await page
      .evaluate(() => !!document.querySelector('[data-guest-gate], [aria-labelledby="auth-modal-title"]'))
      .catch(() => false);
    if (stillOpen) {
      // Escape không ăn — bấm nút X (nút icon-only KHÔNG có chữ trong modal).
      const closed = await page
        .evaluate(() => {
          const modal = document.querySelector('[data-guest-gate], [aria-labelledby="auth-modal-title"]');
          if (!modal) return false;
          const btns = [...modal.querySelectorAll('button')];
          const x = btns.filter((b) => !(b.textContent || '').trim()).pop();
          if (x) { x.click(); return true; }
          return false;
        })
        .catch(() => false);
      if (!closed) {
        const x = page.locator('[aria-labelledby="auth-modal-title"] button, [data-guest-gate] button').first();
        await x.click({ timeout: 3000 }).catch(() => {});
      }
      await page.waitForTimeout(600);
    }
  }
  return { ctx, page };
}

const browser = await chromium.launch();
const all = [];
const perPage = [];

for (const mode of MODES) {
  for (const path of PAGES) {
    const { ctx, page } = await signedInPage(browser, path, mode);
    let fails = (await page.evaluate(collectInPage)) || [];

    // /pet: mở modal shop để đo cả badge/chip bên trong. Modal chỉ tới được từ
    // tab SANCTUARY (mặc định là farm): bấm "Sân Vườn Linh Vật" -> menu "Thêm"
    // -> "Cửa Hàng & Thử Đồ".
    if (OPEN_SHOP && path === '/pet') {
      let opened = false;
      for (let attempt = 0; attempt < 2 && !opened; attempt++) {
        try {
          const tab = page.locator('button', { hasText: 'Sân Vườn Linh Vật' }).first();
          if (!(await tab.isVisible({ timeout: 6000 }).catch(() => false))) continue;
          await tab.click();
          await page.waitForTimeout(1500);
          const more = page.locator('button[title="Thêm chức năng"]').first();
          if (!(await more.isVisible({ timeout: 6000 }).catch(() => false))) continue;
          await more.click();
          await page.waitForTimeout(500);
          const item = page.locator('button', { hasText: 'Cửa Hàng & Thử Đồ' }).first();
          if (!(await item.isVisible({ timeout: 2500 }).catch(() => false))) continue;
          await item.click();
          await page.waitForTimeout(1500);
          opened = await page.locator('text=Đang xem thử').first().isVisible({ timeout: 1000 }).catch(() => false)
            || (await page.locator('h3', { hasText: 'Cửa Hàng' }).first().isVisible({ timeout: 1000 }).catch(() => false));
        } catch (e) {
          console.log(`   (mở modal shop lần ${attempt + 1} lỗi: ${String(e).slice(0, 80)})`);
        }
      }
      if (!opened) {
        console.log('   (KHÔNG mở nổi modal shop trên /pet — chỉ đo được phần thân trang)');
      } else {
        const inside = (await page.evaluate(collectInPage)) || [];
        fails = fails.concat(inside);
      }
    }

    const label = `${path} [${mode}]`;
    perPage.push({ label, measured: fails.length });
    console.log(`${label}: ${fails.length} lỗi contrast`);
    for (const f of fails) {
      all.push({ page: label, ...f });
      console.log(`   ${f.ratio}:1 (<${f.threshold}) — ${f.color} trên ${f.bg} — ${f.fontSize}px "${f.text}" — ${f.cls.slice(0, 55)}`);
    }
    await ctx.close();
  }
}

await browser.close();

// Cụm lỗi gộp theo (màu chữ, nền) để tìm gốc sửa.
console.log('\n=== CỤM LỖI (gộp theo màu chữ trên nền) ===');
const clusters = new Map();
for (const f of all) {
  const k = `${f.color} | ${f.bg}`;
  if (!clusters.has(k)) clusters.set(k, { count: 0, ratio: f.ratio, texts: [], cls: f.cls });
  const c = clusters.get(k);
  c.count++;
  if (c.texts.length < 3) c.texts.push(`"${f.text}" (${f.page})`);
}
for (const [k, c] of [...clusters.entries()].sort((a, b) => b[1].count - a[1].count)) {
  console.log(`${c.count}×  ${k}  ratio ${c.ratio}  —  ${c.texts.join(' | ')}`);
}
console.log(`\nTỔNG: ${all.length} lỗi contrast trên ${perPage.length} lần đo.`);
