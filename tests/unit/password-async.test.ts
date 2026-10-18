/**
 * Lớp băm mật khẩu BẢN ASYNC (hashPasswordAsync / verifyPasswordAsync).
 *
 * Bối cảnh: scryptSync chặn event loop ⇒ 30 VU login đồng thời đo được
 * p50 ≈ 2.1s vì các lần băm xếp hàng tuần tự (~10 login/s/instance). Bản async
 * dùng crypto.scrypt (libuv threadpool). Các test dưới đây khóa lại hợp đồng
 * quan trọng nhất: HAI BẢN PHẢI TƯƠNG THÍCH HAI CHIỀU và không bản nào được
 * từ chối hash cũ (scrypt của bản sync, SHA-256 legacy theo cả 2 salt) — nếu
 * lệch, người dùng thật bị "sai mật khẩu" sau khi đổi call site.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const LEGACY_SALT = 'english_for_me_salt_2026';
const ENV_SALT = 'env-only-salt-xyz';

async function loadDb() {
  vi.resetModules();
  return await import('@/lib/db');
}

describe('hashPasswordAsync / verifyPasswordAsync', () => {
  const originalSalt = process.env.AUTH_SALT;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (originalSalt === undefined) delete process.env.AUTH_SALT;
    else process.env.AUTH_SALT = originalSalt;
    vi.resetModules();
  });

  it('hash async giữ ĐÚNG format scrypt có version + salt ngẫu nhiên riêng', async () => {
    process.env.AUTH_SALT = ENV_SALT;
    const { hashPasswordAsync } = await loadDb();

    const hash = await hashPasswordAsync('123456');
    expect(hash.startsWith('scrypt$')).toBe(true);
    const parts = hash.split('$');
    expect(parts).toHaveLength(6);
    expect(parts[1]).toBe('16384');
    expect(parts[2]).toBe('8');
    expect(parts[3]).toBe('1');
    // Salt ngẫu nhiên: cùng mật khẩu ⇒ hash khác nhau.
    expect(await hashPasswordAsync('123456')).not.toBe(hash);
  });

  it('round-trip: hash async verify được bằng CẢ async lẫn sync', async () => {
    process.env.AUTH_SALT = ENV_SALT;
    const { hashPasswordAsync, verifyPasswordAsync, verifyPassword } = await loadDb();

    const hash = await hashPasswordAsync('mat-khau-to-2026');

    const asyncRes = await verifyPasswordAsync('mat-khau-to-2026', hash);
    expect(asyncRes).toEqual({ ok: true, needsRehash: false, scheme: 'scrypt' });

    // Bản sync (đường lạnh) phải chấp nhận hash do bản async tạo.
    expect(verifyPassword('mat-khau-to-2026', hash).ok).toBe(true);

    expect((await verifyPasswordAsync('mat-khau-sai', hash)).ok).toBe(false);
  });

  it('hash do bản SYNC tạo (hash cũ trong DB) verify được bằng bản async', async () => {
    process.env.AUTH_SALT = ENV_SALT;
    const { hashPassword, verifyPasswordAsync } = await loadDb();

    const stored = hashPassword('mat-khau-cu'); // mô phỏng hash đang nằm trong DB
    const res = await verifyPasswordAsync('mat-khau-cu', stored);
    expect(res).toEqual({ ok: true, needsRehash: false, scheme: 'scrypt' });
    expect((await verifyPasswordAsync('khong-dung', stored)).ok).toBe(false);
  });

  it('chấp nhận hash SHA-256 legacy theo salt hiện hành (needsRehash = true)', async () => {
    process.env.AUTH_SALT = ENV_SALT;
    const { hashPasswordLegacy, verifyPasswordAsync } = await loadDb();

    const res = await verifyPasswordAsync('123456', hashPasswordLegacy('123456'));
    expect(res.ok).toBe(true);
    expect(res.scheme).toBe('legacy-current');
    expect(res.needsRehash).toBe(true);
  });

  it('chấp nhận hash SHA-256 legacy theo salt FALLBACK (lỗi thật đã xảy ra)', async () => {
    // Instance đang chạy với AUTH_SALT riêng (giống production)...
    process.env.AUTH_SALT = ENV_SALT;
    const { hashPasswordLegacy, verifyPasswordAsync } = await loadDb();

    // ...nhưng tài khoản được tạo lúc instance chưa có AUTH_SALT.
    const res = await verifyPasswordAsync('123456', hashPasswordLegacy('123456', LEGACY_SALT));
    expect(res.ok).toBe(true);
    expect(res.scheme).toBe('legacy-fallback');
    expect(res.needsRehash).toBe(true);
  });

  it('hash hỏng / rỗng / sai định dạng → từ chối an toàn, không ném lỗi', async () => {
    process.env.AUTH_SALT = ENV_SALT;
    const { verifyPasswordAsync } = await loadDb();

    for (const bad of ['', '   ', 'null', 'scrypt$', 'scrypt$1$2$3$4', 'zzz$abc', 'scrypt$16384$8$1$!!!$???']) {
      const res = await verifyPasswordAsync('123456', bad);
      expect(res.ok).toBe(false);
    }
    expect((await verifyPasswordAsync('123456', null)).ok).toBe(false);
    expect((await verifyPasswordAsync('123456', undefined)).ok).toBe(false);
  });

  it('bản async và bản sync cho KẾT QUẢ GIỐNG NHAU trên cùng hash', async () => {
    process.env.AUTH_SALT = ENV_SALT;
    const { hashPasswordAsync, hashPasswordLegacy, verifyPasswordAsync, verifyPassword } = await loadDb();

    const scryptHash = await hashPasswordAsync('dong-nhat');
    const legacyHash = hashPasswordLegacy('dong-nhat');

    for (const [pw, stored] of [
      ['dong-nhat', scryptHash],
      ['sai-mat-khau', scryptHash],
      ['dong-nhat', legacyHash],
      ['sai-mat-khau', legacyHash],
      // Hash rỗng decode ra keylen 0 (lỗi cũ: mọi mật khẩu đều khớp) — hai bản phải cùng từ chối.
      ['dong-nhat', 'scrypt$16384$8$1$!!!$???'],
    ] as const) {
      expect(await verifyPasswordAsync(pw, stored)).toEqual(verifyPassword(pw, stored));
    }
  });

  it('nhiều lời gọi async đồng thời đều trả kết quả đúng (không phụ thuộc thứ tự)', async () => {
    process.env.AUTH_SALT = ENV_SALT;
    const { hashPasswordAsync, verifyPasswordAsync } = await loadDb();

    const hashes = await Promise.all(Array.from({ length: 6 }, (_, i) => hashPasswordAsync(`pw-${i}`)));
    const checks = await Promise.all(hashes.map((h, i) => verifyPasswordAsync(`pw-${i}`, h)));
    expect(checks.every((c) => c.ok)).toBe(true);

    // Kiểm tra chéo: hash của người này không dùng được cho người khác.
    const cross = await Promise.all(hashes.map((h, i) => verifyPasswordAsync(`pw-${(i + 1) % hashes.length}`, h)));
    expect(cross.some((c) => c.ok)).toBe(false);
  });
});
