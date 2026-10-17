import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { formatCoins } from '@/lib/formatNumber';

/**
 * UX-009: số dư Coins trước đây hiện 3 kiểu ("9291" / "9,291" / "9.291").
 * Chốt lại định dạng Việt Nam (dấu CHẤM) và chính sách với 0 / số âm /
 * dữ liệu hỏng, vì đây là quyết định sản phẩm chứ không phải chi tiết
 * triển khai — cần test để không ai vô tình đổi lại.
 */
describe('formatCoins', () => {
  it('dung dau cham de tach nhom (chuan Viet Nam)', () => {
    expect(formatCoins(1000)).toBe('1.000');
    expect(formatCoins(9291)).toBe('9.291');
    expect(formatCoins(1234567)).toBe('1.234.567');
    expect(formatCoins(1000000000)).toBe('1.000.000.000');
  });

  it('khong them dau tach nhom khi con 3 chu so', () => {
    expect(formatCoins(0)).toBe('0');
    expect(formatCoins(9)).toBe('9');
    expect(formatCoins(99)).toBe('99');
    expect(formatCoins(999)).toBe('999');
  });

  it('chu so 0 giu nguyen la "0"', () => {
    // Chinh sach: 0 hien "0" (khong "0,00" / "-0"), cho noi hien thi tu
    // them don vi "Coins" sau. Nguoi dung phai thay "0 xu" chu khong phai
    // chuoi rong.
    expect(formatCoins(0)).toBe('0');
    expect(formatCoins(-0)).toBe('0');
  });

  it('so am giu dau "-", khong lam cho no bien mat hay doi thanh duong', () => {
    // So du am la trang thai loi that - che giu no se lam nguoi dung khong
    // hieu vi sao khong mua duoc. Chi can tach nhom cho phan so duoc.
    expect(formatCoins(-500)).toBe('-500');
    expect(formatCoins(-1000)).toBe('-1.000');
    expect(formatCoins(-1234567)).toBe('-1.234.567');
  });

  it('lam tron ve 0 chu so thap phan vi Coins la don vi nguyen', () => {
    expect(formatCoins(12.4)).toBe('12');
    expect(formatCoins(12.5)).toBe('13');
    expect(formatCoins(999.99)).toBe('1.000');
  });

  it('du lieu hong (null/undefined/NaN/Infinity) tra "0" de khong lam vo render', () => {
    expect(formatCoins(null)).toBe('0');
    expect(formatCoins(undefined)).toBe('0');
    expect(formatCoins(NaN)).toBe('0');
    expect(formatCoins(Infinity)).toBe('0');
    expect(formatCoins(-Infinity)).toBe('0');
  });
});

/**
 * Chốt việc "một số dư, một kiểu hiển thị". Bug UX-009 tái diễn ngay khi có
 * ai đó viết thêm `{coins.toLocaleString()}` ở đâu đó: hàm không locale thì
 * ra dấu phẩy trên máy dev en-US, có locale thì ra dấu chấm — cùng một số,
 * hai màn hình, hai kết quả. Quét source chặn trước khi lỗi quay lại.
 */
describe('UX-009: không còn hiển thị Coins bằng toLocaleString', () => {
  const ROOT = process.cwd();

  /** Mọi file .ts/.tsx dưới src/ (bỏ qua node_modules). */
  function allSourceFiles(dir = path.join(ROOT, 'src')): string[] {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...allSourceFiles(full));
      else if (/\.tsx?$/.test(entry.name)) out.push(full);
    }
    return out;
  }

  it('không file nào tự định dạng số dư / giá tiền Coins bằng toLocaleString', () => {
    const offenders: string[] = [];
    for (const file of allSourceFiles()) {
      const src = fs.readFileSync(file, 'utf8');
      src.split('\n').forEach((line, i) => {
        if (!/toLocaleString/.test(line)) return;
        // Chỉ soi chỗ liên quan Coins/giá tiền; `new Date().toLocaleString()`
        // (ngày giờ) và `entries.toLocaleString()` (số mục CSDL) là chuyện khác.
        if (!/coins|Coins|price|totalCoins/i.test(line)) return;
        offenders.push(`${path.relative(ROOT, file)}:${i + 1}: ${line.trim()}`);
      });
    }
    expect(offenders.join('\n')).toBe('');
  });

  it('mọi màn hiện số dư đều import formatCoins', () => {
    // Danh sách chốt từ audit 2026-10-15. Thêm màn mới hiện Coins mà quên
    // helper sẽ bị test này bắt khi thêm vào danh sách.
    const screens = [
      'src/components/AppShell.tsx',
      'src/app/page.tsx',
      'src/app/exam/page.tsx',
      'src/app/pet/page.tsx',
      'src/components/pet/PixelFarmGame.tsx',
      'src/components/pet/PixelFarmCanvas.tsx',
      'src/components/pet/PetSocialHub.tsx',
      'src/components/pet/PetPvPArenaCanvas.tsx',
      'src/components/pet/PetRacingCanvas.tsx',
    ];
    const missing = screens.filter((f) => {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      return !/from ['"]@\/lib\/formatNumber['"]/.test(src);
    });
    expect(missing.join('\n')).toBe('');
  });
});