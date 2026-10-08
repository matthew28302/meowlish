/**
 * Regression guard cho các fix accessibility từ audit 2026-10-08 (H8/M7/L6/L6b):
 *
 * - H8: nút icon-only phải có accessible name (axe `button-name` critical) và
 *   AuthModal phải có role="dialog" + focus-trap + Esc.
 * - M7: /encyclopedia không còn 2 nút danh mục chết (category không tồn tại
 *   trong CSDL) và không fallback dữ liệu cứng khi filter đang áp dụng.
 * - L6: /vocabulary sync trạng thái đã-lưu từ GET /api/bookmarks khi tải trang.
 * - L6b: /bookmarks không dùng confirm() native.
 *
 * Đây là test quét source (giống no-hardcoded-secrets) — chạy nhanh, chặn tái
 * phát; kiểm chứng runtime thật nằm ở scripts/verify-a11y-fixes.mjs (Playwright).
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

const FILES = {
  authModal: 'src/components/AuthModal.tsx',
  encyclopedia: 'src/app/encyclopedia/page.tsx',
  vocabulary: 'src/app/vocabulary/page.tsx',
  bookmarks: 'src/app/bookmarks/page.tsx',
};

const readSrc = (key: string): string =>
  fs.readFileSync(path.join(ROOT, FILES[key as keyof typeof FILES]), 'utf8');

/**
 * Tách từng block <button ...>...</button> (các file này không lồng button).
 */
function extractButtonBlocks(src: string): string[] {
  const blocks: string[] = [];
  let from = 0;
  for (;;) {
    const start = src.indexOf('<button', from);
    if (start === -1) break;
    const end = src.indexOf('</button>', start);
    if (end === -1) break;
    blocks.push(src.slice(start, end + '</button>'.length));
    from = end + 1;
  }
  return blocks;
}

/** Tìm vị trí ký tự '>' kết thúc thẻ mở, bỏ qua nội dung trong quote/brace. */
function findOpeningTagEnd(tag: string): number {
  let quote: string | null = null;
  let depth = 0;
  for (let i = 0; i < tag.length; i++) {
    const ch = tag[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') depth = Math.max(0, depth - 1);
    else if (ch === '>' && depth === 0) return i;
  }
  return -1;
}

/**
 * Text sẽ hiển thị của block button (mô phỏng cách JSX render):
 * - Ngoài {}: raw text giữa các tag (bỏ tag).
 * - Trong {}: string literal tính là text (text điều kiện render chuỗi đó);
 *   identifier thuần (VD `{word}`, `{item.word}`) render giá trị động -> name;
 *   prose trong fragment (2+ chữ cách nhau bởi khoảng trắng) -> text điều kiện.
 * Còn lại (JS operator/identifier trong biểu thức có render element) -> không
 * phải text.
 */
function renderedText(block: string): string {
  const openEnd = findOpeningTagEnd(block);
  if (openEnd === -1) return '';
  const closeIdx = block.indexOf('</button>', openEnd);
  const body =
    closeIdx === -1 ? block.slice(openEnd + 1) : block.slice(openEnd + 1, closeIdx);

  let raw0 = ''; // JSX text thuần (ngoài {})
  let raw1 = ''; // raw ký tự trong {} (JS identifier / prose)
  let literal = ''; // string literal trong {} (text điều kiện)
  let quote: string | null = null;
  let depth = 0;
  let inTag = false;

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inTag) {
      if (ch === '>') inTag = false;
      continue;
    }
    if (quote) {
      if (ch === quote) quote = null;
      else if (depth > 0) literal += ch;
      continue;
    }
    if (ch === '<' && /[A-Za-z>\/]/.test(body[i + 1] || '')) {
      inTag = true;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (ch === '{') {
      depth++;
      continue;
    }
    if (ch === '}') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth === 0) raw0 += ch;
    else raw1 += ch;
  }

  const wordRe = /[A-Za-zÀ-ỹ0-9]+/g;

  // 1. JSX text thuần + string literal điều kiện.
  const words0 = (raw0 + ' ' + literal).match(wordRe) || [];
  if (words0.length > 0) return words0.join(' ');

  // 2. Identifier thuần trong {} => text động (VD chip {word} render 'hello').
  const expr = raw1.trim();
  if (/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(expr)) return expr;

  // 3. Prose trong {} (2+ chữ cách nhau bởi khoảng trắng) => text điều kiện.
  if (/\p{L}\s+\p{L}/u.test(expr)) {
    const words1 = expr.match(wordRe) || [];
    return words1.join(' ');
  }

  return '';
}

/** Block button có accessible name: thuộc tính ARIA/title hoặc text hiển thị. */
function hasAccessibleName(block: string): boolean {
  if (/\saria-label=/.test(block)) return true;
  if (/\saria-labelledby=/.test(block)) return true;
  if (/\stitle=/.test(block)) return true;
  return renderedText(block).length > 0;
}

describe('H8: mọi nút icon-only trong 4 file có accessible name', () => {
  for (const key of Object.keys(FILES) as Array<keyof typeof FILES>) {
    it(`${FILES[key]}: không có button nào thiếu name`, () => {
      const blocks = extractButtonBlocks(readSrc(key));
      expect(blocks.length).toBeGreaterThan(0);
      const unnamed = blocks
        .map((block, idx) => ({ block, idx }))
        .filter(({ block }) => !hasAccessibleName(block));
      const detail = unnamed
        .map(({ block, idx }) => `#${idx}: ${block.replace(/\s+/g, ' ').slice(0, 110)}`)
        .join('\n');
      expect(detail, `Các button thiếu accessible name:\n${detail}`).toBe('');
    });
  }

  it('AuthModal: 2 nút eye (login + register) có aria-label hiện/ẩn', () => {
    const src = readSrc('authModal');
    const eyeLabels = src.match(/aria-label=\{showPassword/g) || [];
    expect(eyeLabels.length).toBe(2);
    expect(src).toContain('Hiện mật khẩu');
    expect(src).toContain('Ẩn mật khẩu');
  });

  it('encyclopedia: nút bookmark save có aria-label + aria-pressed', () => {
    const src = readSrc('encyclopedia');
    expect(src).toContain(
      "aria-label={isSaved ? 'Bỏ lưu khỏi sổ tay' : 'Lưu vào sổ tay'}"
    );
    expect(src).toContain('aria-pressed={isSaved}');
  });
});

describe('H8: AuthModal role="dialog" + focus-trap + Esc', () => {
  const src = readSrc('authModal');

  it('root div có role="dialog" + aria-modal + aria-labelledby', () => {
    expect(src).toContain('role="dialog"');
    expect(src).toContain('aria-modal="true"');
    expect(src).toContain('aria-labelledby="auth-modal-title"');
    expect(src).toContain('id="auth-modal-title"');
  });

  it('có focus-trap (Tab cycle) và Esc đóng modal', () => {
    expect(src).toContain("e.key === 'Escape'");
    expect(src).toContain("e.key !== 'Tab'");
    expect(src).toContain('modalRef');
    expect(src).toContain('triggerRef');
    // Đưa focus vào control đầu tiên khi mở, trả focus về trigger khi đóng.
    expect(src).toContain('first.focus()');
    expect(src).toContain('prev.focus()');
  });
});

describe('M7: /encyclopedia danh mục + empty-state', () => {
  const src = readSrc('encyclopedia');

  /** Lấy mảng `categories` (bỏ qua comment) để check chính xác. */
  const categoriesArray = (): string => {
    const start = src.indexOf('const categories = [');
    const end = src.indexOf('];', start);
    return src.slice(start, end);
  };

  it('không còn 2 nút danh mục chết (Phrasal Verbs / Idioms)', () => {
    const cats = categoriesArray();
    expect(cats).not.toContain('Phrasal Verbs');
    expect(cats).not.toContain('Idioms Giao Tiếp');
    expect(cats).not.toContain("'phrasal-verbs'");
    expect(cats).not.toContain("'idioms'");
    // Các danh mục CÓ dữ liệu vẫn giữ nguyên.
    expect(cats).toContain("'toeic'");
    expect(cats).toContain("'vstep'");
    expect(cats).toContain("'daily'");
  });

  it('không fallback dữ liệu cứng khi filter/search đang áp dụng', () => {
    expect(src).toContain('hasActiveFilters');
    expect(src).toContain('isFilteredEmpty');
    // Empty-state chuẩn giống /vocabulary
    expect(src).toContain('Không tìm thấy mục từ nào phù hợp');
    expect(src).toContain('Xóa tìm kiếm');
  });
});

describe('L6: /vocabulary sync savedIds khi tải trang', () => {
  const src = readSrc('vocabulary');

  it('fetch GET /api/bookmarks khi mount để khởi tạo savedIds', () => {
    expect(src).toContain('/api/bookmarks?userId=');
    expect(src).toContain('auth-state-changed');
    // Guest chưa đăng nhập thì bỏ qua fetch.
    expect(src).toContain('getCurrentUser()');
  });
});

describe('L6b: /bookmarks không dùng confirm() native', () => {
  /** Bỏ comment để không dò nhầm chính chuỗi mô tả trong comment. */
  const srcNoComments = (): string =>
    readSrc('bookmarks')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');

  it('đã thay confirm() bằng modal trong app', () => {
    expect(srcNoComments()).not.toMatch(/\bconfirm\(/);
    expect(srcNoComments()).toContain('Xoá khỏi sổ tay?');
    expect(srcNoComments()).toContain('Giữ lại');
    expect(readSrc('bookmarks')).toContain('role="dialog"');
  });
});
