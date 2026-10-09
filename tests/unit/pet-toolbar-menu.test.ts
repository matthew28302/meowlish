// Thanh công cụ /pet: menu "Thêm" phải mở LÊN TRÊN và không bị cắt.
//
// Báo cáo 2026-10-09: menu dùng `absolute ... top-full mt-2` nằm ở đáy màn
// hình ⇒ rơi ra ngoài viewport (đo: bottom = 940 > viewport 852), bị lớp phủ
// overlay của chính nó che nên bấm không trúng mục nào.
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const SRC = path.join(process.cwd(), 'src', 'app', 'pet', 'page.tsx');
const src = fs.readFileSync(SRC, 'utf8');

describe('menu "Thêm" cua thanh cong cu /pet', () => {
  it('mo LEN TREN (bottom-full), khong mo xuong duoi (top-full mt-2)', () => {
    expect(src).toMatch(/role="menu"[\s\S]{0,600}bottom-full/);
    expect(src).not.toMatch(/role="menu"[\s\S]{0,600}top-full mt-2/);
  });

  it('khong dung position fixed/absolute phu thuoc viewport de neo menu', () => {
    // Menu phai neo bang absolute trong container (de khong nhay khi scroll).
    expect(src).toMatch(/role="menu"[\s\S]{0,400}absolute/);
  });

  it('co fallback cuon noi bo (khong bao gio cat muc)', () => {
    // Chốt chặn cuối: kể cả khung nhìn thấp, menu cuon được thay vì bị cắt.
    expect(src).toMatch(/role="menu"[\s\S]{0,400}max-h-\[60vh\][\s\S]{0,200}overflow-y-auto/);
  });

  it('Escape dong duoc menu (WAI-ARIA menu pattern)', () => {
    expect(src).toMatch(/e\.key\s*===\s*'Escape'\)\s*setShowMoreMenu\(false\)/);
  });

  it('nut mo menu co aria-haspopup + aria-expanded', () => {
    expect(src).toMatch(/aria-haspopup="menu"/);
    expect(src).toMatch(/aria-expanded=\{showMoreMenu\}/);
  });
});