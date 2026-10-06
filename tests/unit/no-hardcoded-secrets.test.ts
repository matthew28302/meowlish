/**
 * Chặn secret bị hardcode quay lại source.
 *
 * Bối cảnh: khoá Filebase thật từng nằm trong `src/lib/s3Sync.ts`,
 * `scripts/restore-s3.js` và `scripts/upload-s3.js` — tức là trong git, ai đọc
 * repo là nắm được toàn bộ database production. Đã gỡ khỏi code, nhưng git
 * history vẫn còn nên BẮT BUỘC phải xoay khoá. Test này chỉ chặn việc tái phát,
 * không thay thế việc xoay khoá.
 *
 * Nguyên tắc: mọi thông tin nhạy cảm phải đến từ biến môi trường. Chỉ `.env*`
 * mới được chứa bí mật, và `.env.example` phải là mẫu rỗng.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SCAN_DIRS = ['src', 'scripts'];
const SKIP_FILE = /(\.test\.|\.spec\.|_tmp-|\.bak)/i;

/**
 * File bị bỏ qua có chủ đích.
 *
 * - File test này chứa chính các mẫu cần dò.
 * - `scan-script-secrets.selftest.mjs` cố tình chứa chuỗi giống bí mật làm
 *   probe để chứng minh scanner thật sự bắt được. Đó là dữ liệu kiểm thử, không
 *   phải khoá thật. Nếu muốn dò file này, hãy sửa probe để ghép từ mảnh chuỗi.
 */
const ALLOWED_FILES = new Set([
  'tests/unit/no-hardcoded-secrets.test.ts',
  'scripts/scan-script-secrets.selftest.mjs',
]);
const SELF = 'tests/unit/no-hardcoded-secrets.test.ts';

function walk(dir: string, out: string[] = []): string[] {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return out;
  for (const e of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = path.join(dir, e.name).replace(/\\/g, '/');
    if (e.isDirectory()) walk(rel, out);
    else if (/\.(ts|tsx|js|mjs|cjs)$/.test(e.name)) out.push(rel);
  }
  return out;
}

const files = SCAN_DIRS.flatMap((d) => walk(d));

/**
 * Mẫu phát hiện:
 * - khoá truy cập kiểu Filebase/AWS: chuỗi literal 20+ ký tự chữ/số viết hoa.
 *   Bắt buộc phải có dấu nháy bao, nếu không sẽ báo nhầm bảng ký tự dùng để sinh
 *   mã (ví dụ "0123456789ABCDEF..." trong api/support/route.ts).
 * - tên biến nhạy cảm được gán bằng chuỗi literal dài.
 * - giá trị DỰ PHÒNG sau `||` cho biến môi trường nhạy cảm — đây chính là mẫu
 *   đã lọt mật khẩu SMTP thật (`process.env.SMTP_PASS || '28032002Aa@'`).
 *
 * `skipProcessEnvLine` phải BẬT cho các mẫu cần bỏ qua dòng đọc biến môi
 * trường, và TẮT cho mẫu dự phòng — nếu không đặt sai thì mẫu dự phòng bị chính
 * điều kiện bỏ qua vô hiệu hoá (đã dính lỗi này một lần).
 */
const PATTERNS: { name: string; re: RegExp; skipProcessEnvLine?: boolean }[] = [
  {
    name: 'khoa truy cap kieu Filebase/AWS (literal 20+ ky tu hoa+so)',
    re: /['"][A-Z0-9]{20,}['"]/,
    skipProcessEnvLine: true,
  },
  {
    name: 'biet bien nhay cam gan bang chuoi literal',
    re: /(secret|password|passwd|token|access[_-]?key|api[_-]?key|private[_-]?key)\s*[:=]\s*['"][^'"]{8,}['"]/i,
    skipProcessEnvLine: true,
  },
  {
    name: 'gia tri DU PHONG hardcode cho bien moi truong nhay cam',
    re: /process\.env\.[A-Z0-9_]*(PASS|SECRET|KEY|TOKEN|PWD|CREDENTIAL)[A-Z0-9_]*\s*\|\|\s*['"][^'"]+['"]/,
    skipProcessEnvLine: false,
  },
];

/**
 * Ngoại lệ CÓ CHỦ ĐÍCH — không phải bí mật:
 * Bảng ký tự sinh mã ticket (TK-XXXX) trong api/support/route.ts. Nó là chuỗi 36
 * ký tự chữ/số viết hoa nên khớp mẫu "khoá truy cập". Nới lỏng mẫu thay vì liệt
 * kê ở đây sẽ làm mẫu yếu đi và lọt khoá thật — nên ghi rõ từng ngoại lệ.
 */
const ALLOWED_LITERALS = new Set([
  '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ', // bảng ký tự sinh mã ticket
]);

/**
 * Biến môi trường có chứa từ khoá nhạy cảm nhưng bản thân KHÔNG phải bí mật.
 * `PG_SOURCE_KEY` là tên object trên S3 (tên tệp), không phải khoá truy cập —
 * có giá trị dự phòng hợp lệ.
 */
const ALLOWED_ENV_NAMES = new Set(['PG_SOURCE_KEY']);

describe('khong co secret hardcode trong source', () => {
  it('co it nhat mot file de quet (tranh truong hop quet sai duong dan)', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  for (const f of files) {
    if (SKIP_FILE.test(f)) continue;
    if (ALLOWED_FILES.has(f)) continue;

    it(`${f} khong chua secret hardcode`, () => {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      src.split(/\r?\n/).forEach((line, i) => {
        for (const { name, re, skipProcessEnvLine } of PATTERNS) {
          const m = re.exec(line);
          if (!m) continue;
          // Bỏ qua giá trị lấy từ biến môi trường và dòng ghi chú — CHỈ với mẫu
          // cần; mẫu dự phòng thì phải soi.
          if (skipProcessEnvLine && line.includes('process.env')) continue;
          if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue;
          // Biến môi trường được ghi rõ là không phải bí mật
          const envName = /process\.env\.([A-Z0-9_]+)/.exec(line)?.[1];
          if (envName && ALLOWED_ENV_NAMES.has(envName)) continue;
          // Bỏ qua ngoại lệ đã khai báo có chủ đích
          if (m[0].length >= 2) {
            const literal = m[0].replace(/^['"]|['"]$/g, '');
            if (ALLOWED_LITERALS.has(literal)) continue;
          }
          // Bỏ qua chuỗi ví dụ trong test và tên biến không nhạy cảm
          if (f === SELF) continue;
          throw new Error(
            `${f}:${i + 1} nghi phat hien ${name}: "${m[0].slice(0, 40)}..."\n` +
              '  -> doc biến môi trường thay vì ghi literal (vd process.env.FILEBASE_ACCESS_KEY)'
          );
        }
      });
      expect(true).toBe(true);
    });
  }

  it('.env.example khong chua gia tri that (chi duoc phep placeholder)', () => {
    const p = path.join(ROOT, '.env.example');
    if (!fs.existsSync(p)) return;
    const src = fs.readFileSync(p, 'utf8');
    for (const line of src.split(/\r?\n/)) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (!m) continue;
      const [, key, value] = m;
      if (!value) continue;
      const isPlaceholder =
        value === '' ||
        /^(your|changeme|example|<|\$\{|xxx)/i.test(value) ||
        value === 'true' ||
        value === 'false';
      expect(
        isPlaceholder,
        `.env.example bi gia tri that o bien "${key}" — mau phai de trong hoac placeholder`
      ).toBe(true);
    }
  });
});
