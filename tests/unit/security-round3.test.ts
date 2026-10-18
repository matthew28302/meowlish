/**
 * Chặn tái phát các lỗ hổng đã vá (đợt audit thứ 3 — 2026-10-18).
 *
 * Mỗi test mô tả đúng một đòn tấn công đã xác nhận trên code cũ:
 *  1. GET /api/support?ticketId=… — tài khoản bất kỳ đoán trúng mã phiếu của
 *     KHÁCH (user_id NULL) đọc được đầy đủ tên/email/nội dung/trả lời admin.
 *  2. /api/auth/forgot-password trả 403 "tài khoản bị vô hiệu hóa" cho tài khoản
 *     bị khóa ⇒ máy dò tài khoản (account enumeration).
 *  3. request_email_verification chỉ kiểm tra `includes('@') && includes('.')`
 *     ⇒ nhận danh sách nhiều địa chỉ / khoảng trắng ⇒ thành máy gửi email.
 *  4. /api/log/access lấy `clientUsername` từ body khi phiên không có dòng users
 *     ⇒ bịa tên trong chính bảng audit.
 *  5. Nhiều route trả `err.message` thô (chi tiết SQLite/AWS/nodemailer).
 *  6. GET /api/pet không có hạn mức (đọc nặng, ai cũng gọi được).
 *  7. Mã phiếu sinh bằng `Math.random()` không phải CSPRNG.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

function read(file: string): string {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

const SUPPORT_ROUTE = 'src/app/api/support/route.ts';
const AUTH_ROUTE = 'src/app/api/auth/route.ts';
const FORGOT_ROUTE = 'src/app/api/auth/forgot-password/route.ts';
const RESET_ROUTE = 'src/app/api/auth/reset-password/route.ts';
const LOG_ROUTE = 'src/app/api/log/access/route.ts';
const SYNC_ROUTE = 'src/app/api/sync/route.ts';
const ADMIN_AUTH_ROUTE = 'src/app/api/admin/auth/route.ts';
const PET_ROUTE = 'src/app/api/pet/route.ts';

describe('1. Phiếu hỗ trợ: chỉ chủ phiếu mới đọc được nội dung', () => {
  const src = read(SUPPORT_ROUTE);

  it('nhánh tra theo mã phiếu phải yêu cầu ticket.user_id TRÙNG tài khoản trong phiên', () => {
    // `ownsTicket` là điều kiện bắt buộc: nếu chỉ kiểm tra "có user_id và khác
    // userId" thì phiếu của khách (user_id NULL) lọt qua và trả full nội dung.
    expect(src).toMatch(/ownsTicket\s*=/);
    expect(src).toMatch(/ticket\.user_id\s*===\s*auth\.userId/);
    expect(src).toMatch(/if\s*\(!ownsTicket\)/);
  });

  it('vẫn chặn 403 khi phiếu thuộc tài khoản khác', () => {
    expect(src).toMatch(/ticket\.user_id\s*&&\s*ticket\.user_id\s*!==\s*auth\.userId/);
  });

  it('mã phiếu phải dùng CSPRNG, không dùng Math.random()', () => {
    expect(src).toMatch(/crypto\.randomInt\(/);
    expect(src).not.toMatch(/Math\.random\(\)/);
  });
});

describe('2. forgot-password không được phân biệt tài khoản bị vô hiệu hóa', () => {
  const src = read(FORGOT_ROUTE);

  it('dùng chung một thông điệp chung cho mọi trường hợp không gửi được email', () => {
    expect(src).toMatch(/GENERIC_RESET_MESSAGE/);
    const uses = src.match(/GENERIC_RESET_MESSAGE/g) ?? [];
    expect(uses.length, 'phải dùng ở cả nhánh disabled và nhánh không tồn tại').toBeGreaterThanOrEqual(3);
    expect(src).not.toMatch(/Tài khoản đã bị vô hiệu hóa\. Vui lòng liên hệ Quản trị viên\./);
  });

  it('nhánh disabled không trả 403 riêng cho client', () => {
    const disabledIdx = src.indexOf("user.status === 'disabled'");
    expect(disabledIdx).toBeGreaterThan(-1);
    const block = src.slice(disabledIdx, disabledIdx + 900);
    expect(block).not.toMatch(/status:\s*403/);
    expect(block).toMatch(/GENERIC_RESET_MESSAGE/);
  });
});

describe('3. request_email_verification phải validate email chặt', () => {
  const src = read(AUTH_ROUTE);
  // Lấy ĐÚNG nhánh xử lý (dòng `emailAuth = getAuthenticatedUser(...)` chỉ có ở
  // handler), không lấy nhầm phần khai báo rate limit phía trên.
  const anchor = src.indexOf('emailAuth = getAuthenticatedUser(request, userId)');
  const branch = src.slice(anchor, anchor + 2500);

  it('không còn phép kiểm tra lỏng includes(@) && includes(.)', () => {
    expect(anchor).toBeGreaterThan(-1);
    expect(branch).not.toMatch(/cleanEmail\.includes\('@'\)\s*&&\s*cleanEmail\.includes\('\.'\)/);
  });

  it('dùng regex một-địa-chỉ và cắt trần độ dài', () => {
    expect(anchor).toBeGreaterThan(-1);
    expect(branch).toMatch(/slice\(0,\s*120\)/);
    expect(branch).toMatch(/A-Za-z0-9\._%\+-/);
    expect(branch).toMatch(/A-Za-z\]\{2,\}/);
    expect(branch).toMatch(/Địa chỉ email không hợp lệ/);
  });
});

describe('4. log/access không lấy danh tính từ body', () => {
  const src = read(LOG_ROUTE);

  it('không còn đọc clientUsername từ body', () => {
    // Chỉ soi CODE, không soi chú thích (chú thích còn nhắc lại tên trường cũ).
    const code = src
      .split(/\r?\n/)
      .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
      .join('\n');
    expect(code).not.toMatch(/body\.clientUsername/);
    expect(code).not.toMatch(/=\s*clientUsername/);
  });

  it('vẫn xác thực phiên bằng token HMAC', () => {
    expect(src).toMatch(/verifyUserSessionToken\(/);
  });
});

describe('5. Không trả err.message thô cho client', () => {
  const cases: Array<[string, string]> = [
    ['sync GET/POST', SYNC_ROUTE],
    ['admin/auth', ADMIN_AUTH_ROUTE],
    ['forgot-password', FORGOT_ROUTE],
    ['reset-password', RESET_ROUTE],
  ];

  for (const [label, file] of cases) {
    it(`${label} không trả (err|error).message trong response`, () => {
      const src = read(file);
      expect(src).not.toMatch(/error:\s*(err|error)\.message/);
      expect(src).not.toMatch(/error:\s*message\s*[,}]\s*\)/);
      // Chi tiết vẫn phải được ghi log nội bộ (không nuốt lỗi).
      expect(src).toMatch(/logger\.(error|warn)\(/);
    });
  }
});

describe('6. GET /api/pet có hạn mức đọc', () => {
  const src = read(PET_ROUTE);

  it('có rate limit cho GET (key pet_read)', () => {
    expect(src).toMatch(/pet_read:\$\{clientIp\}/);
  });

  it('hạn mức đọc nằm trong hàm GET, không phải POST', () => {
    const getIdx = src.indexOf('export async function GET');
    const postIdx = src.indexOf('export async function POST');
    const readIdx = src.indexOf('pet_read:');
    expect(getIdx).toBeGreaterThan(-1);
    expect(readIdx).toBeGreaterThan(getIdx);
    expect(readIdx).toBeLessThan(postIdx);
  });
});

describe('7. Body JSON hỏng trả 400, không phải 500 kèm lỗi nội bộ', () => {
  for (const [label, file] of [
    ['forgot-password', FORGOT_ROUTE],
    ['reset-password', RESET_ROUTE],
  ] as Array<[string, string]>) {
    it(`${label} bắt lỗi JSON.parse và trả 400`, () => {
      const src = read(file);
      expect(src).toMatch(/request\.json\(\)/);
      expect(src).toMatch(/Dữ liệu gửi lên không hợp lệ[\s\S]{0,120}status:\s*400/);
    });
  }
});
