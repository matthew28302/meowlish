/**
 * Chống double-encoding (mojibake) trong source.
 *
 * Sự cố đã xảy ra thật: dùng PowerShell `Get-Content -Raw` + `Set-Content
 * -Encoding utf8` để sửa 16 file. PowerShell đọc UTF-8 bằng **cp1252**, nên mỗi
 * byte UTF-8 gốc bị tách thành 2 byte khi ghi lại:
 *   `ệ` (U+1EC7, e1 bb 87) → `á»‡`      `đ` (U+0111, c4 91) → `Đ‘`
 * Toàn bộ chữ tiếng Việt hiển thị hỏng trên production, trong khi `tsc` và
 * `vitest` vẫn xanh hoàn toàn — lỗi này không bắt được bằng type check.
 *
 * Cách phát hiện KHÔNG dựa vào literal tiếng Việt (dễ sai, và file sạch vẫn
 * có thể chứa ký tự giống hệt): điểm mojibake = ký tự Latin-1 đứng sát byte
 * thô, cộng U+FFFD do giải mã hỏng. Chuỗi tiếng Việt hợp lệ dùng code point
 * > 0xFF nên không bị đếm nhầm.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['src', 'scripts', 'tests'];
const EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.css', '.md', '.json']);

/**
 * Công cụ dò mojibake CỐ Ý chứa chuỗi hỏng (`á»`, `Ã¡`…) làm mẫu đối chiếu,
 * nên bản thân chúng sẽ bị chấm điểm hỏng. Nhận biết bằng cách chúng import
 * `lib/cp1252.mjs` — chính xác hơn lọc theo tên file, và tự mô tả: file dùng
 * bộ dò mojibake thì được miễn trừ.
 */
function isMojibakeTooling(file: string): boolean {
  try {
    return fs.readFileSync(file, 'utf8').includes('cp1252.mjs');
  } catch {
    return false;
  }
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
      walk(p, out);
    } else if (EXT.has(path.extname(entry.name))) {
      out.push(p);
    }
  }
  return out;
}

/** Điểm mojibake: U+FFFD (nặng) + cặp Latin-1/byte-thô liền kề (nhẹ). */
function mojibakeScore(text: string): number {
  let score = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c === 0xfffd) score += 3;
    else if (c >= 0x80 && c <= 0xff) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0x80 && next <= 0xbf) score += 1;
    }
  }
  return score;
}

const files = ROOTS.filter((r) => fs.existsSync(r))
  .flatMap((r) => walk(r))
  .filter((f) => !isMojibakeTooling(f));

describe('encoding nguon — chong mojibake', () => {
  it('co file de quet', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('KHONG file nao bi double-encoding', () => {
    const bad = files
      .map((f) => ({ f, score: mojibakeScore(fs.readFileSync(f, 'utf8')) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    expect(
      bad.map((x) => `${x.score} điểm  ${x.f}`).join('\n'),
      'Chạy `node scripts/fix-mojibake.mjs --apply` để hoàn nguyên. Nếu lỗi quay lại sau khi sửa, đừng dùng PowerShell Get-Content/Set-Content — hãy dùng Edit tool.'
    ).toBe('');
  });

  it('KHONG file nao co BOM (U+FEFF) o dau', () => {
    const withBom = files.filter((f) => {
      const b = fs.readFileSync(f);
      return b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf;
    });
    expect(withBom.map((f) => f).join('\n'), 'BOM sinh ra từ PowerShell Set-Content.').toBe('');
  });

  it('tieng Viet trong file nguon doc dung (khong phai mojibake)', () => {
    // Spot-check: các cụm này đã từng hỏng trên production.
    const samples: [string, string][] = [
      ['src/app/page.tsx', 'tiếng Anh'],
      ['src/app/support/page.tsx', 'đăng nhập'],
      ['src/lib/s3Sync.ts', 'đồng bộ'],
      ['src/app/pet/page.tsx', 'Thú cưng'],
      ['src/app/duahau/page.tsx', 'Quản trị'],
    ];
    const missing = samples
      .filter(([file, phrase]) => !fs.readFileSync(file, 'utf8').includes(phrase))
      .map(([file, phrase]) => `${file}: ${JSON.stringify(phrase)}`);
    expect(missing.join('\n')).toBe('');
  });
});
