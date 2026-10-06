/**
 * Chặn PII lọt vào bundle phía client.
 *
 * Vấn đề thật: `src/lib/petData.ts` được CLIENT import (`PETS_CATALOG`) nên mọi
 * hằng số ở đó đều bị đóng gói và gửi tới trình duyệt. Danh sách email được cấp
 * quyền Cinnamoroll từng nằm trong file đó ⇒ 3 địa chỉ email thật xuất hiện
 * trong JS tải về cho MỌI khách truy cập `/pet` (đã xác minh trên production).
 *
 * Nguyên tắc: client chỉ được biết CỜ quyền do server gửi, không được biết danh
 * sách email. Test này chặn tái phát theo cả hai chiều:
 *   1. Module client không chứa email/danh sách cấp quyền.
 *   2. Component client không tự import hàm kiểm tra quyền phía server.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

/** Các module được phép client import (bundle đóng gói cho trình duyệt). */
const CLIENT_IMPORTED_LIBS = ['src/lib/petData.ts', 'src/lib/petFarmData.ts', 'src/lib/petSocialData.ts'];

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

function readLines(file: string): string[] {
  return fs.readFileSync(path.join(ROOT, file), 'utf8').split(/\r?\n/);
}

describe('PII không được lọt vào bundle client', () => {
  it('module client-import không chứa địa chỉ email nào', () => {
    for (const file of CLIENT_IMPORTED_LIBS) {
      const hits: string[] = [];
      readLines(file).forEach((line, i) => {
        // Bỏ qua dòng chú thích — chỉ soi mã thực thi.
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        const found = line.match(EMAIL_RE);
        if (found) hits.push(`  ${file}:${i + 1}`);
      });
      expect(hits, `${file} chứa email — sẽ được đóng gói cho client`).toEqual([]);
    }
  });

  it('danh sách email cấp quyền nằm trong module riêng, chỉ server dùng', () => {
    const serverOnly = path.join(ROOT, 'src/lib/cinnamorollAccess.ts');
    expect(fs.existsSync(serverOnly)).toBe(true);

    // Không file client nào được import module chứa danh sách email.
    const clientFiles: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(e.name)) clientFiles.push(p);
      }
    };
    walk(path.join(ROOT, 'src/app'));
    walk(path.join(ROOT, 'src/components'));

    const offenders: string[] = [];
    for (const file of clientFiles) {
      const rel = path.relative(ROOT, file).replace(/\\/g, '/');
      const text = fs.readFileSync(file, 'utf8');
      // Chỉ component client ('use client' hoặc .tsx trong app/components) mới
      // được import; route API là server nên không tính.
      const isClientSide = rel.startsWith('src/app/api/') === false;
      if (!isClientSide) continue;
      if (/from\s+['"]@\/lib\/cinnamorollAccess['"]/.test(text)) {
        offenders.push(rel);
      }
    }
    expect(offenders, 'component client không được import module chứa email cấp quyền').toEqual([]);
  });

  it('catalog thú cưng không mang trường chứa email', () => {
    const text = fs.readFileSync(path.join(ROOT, 'src/lib/petData.ts'), 'utf8');
    expect(text).not.toMatch(/requiredEmails/);
    expect(text).not.toMatch(/CINNAMOROLL_ALLOWED_EMAILS/);
  });

  it('địa chỉ email được cấp quyền chỉ xuất hiện ở module server-only', () => {
    // Đọc danh sách từ module server, rồi đòi KHÔNG địa chỉ nào đó xuất hiện ở
    // bất kỳ file nào khác trong src/. Nhờ vậy test không đánh đổi nhầm các
    // email hợp lệ khác (email đã che trong UI, mẫu email gửi đi ở server).
    const serverFile = path.join(ROOT, 'src/lib/cinnamorollAccess.ts');
    const privileged = (fs.readFileSync(serverFile, 'utf8').match(EMAIL_RE) || []) as string[];
    expect(privileged.length, 'phải đọc được danh sách email cấp quyền từ module server').toBeGreaterThan(0);

    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
          walk(p);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(e.name)) continue;
        const rel = path.relative(ROOT, p).replace(/\\/g, '/');
        if (rel === 'src/lib/cinnamorollAccess.ts') continue;
        const text = fs.readFileSync(p, 'utf8');
        for (const addr of privileged) {
          if (text.includes(addr)) offenders.push(`${rel} (${addr})`);
        }
      }
    };
    walk(path.join(ROOT, 'src'));
    expect(
      offenders,
      'địa chỉ email cấp quyền xuất hiện ngoài module server-only ⇒ có thể lọt vào bundle'
    ).toEqual([]);
  });
});