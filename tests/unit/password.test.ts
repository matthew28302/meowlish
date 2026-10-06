/**
 * Lớp băm mật khẩu: scheme mới (scrypt + salt per-user) và tương thích ngược
 * với hash cũ SHA-256 + salt.
 *
 * Bối cảnh (lỗi thật đã xảy ra trên production): Vercel có AUTH_SALT
 * (fingerprint debc23fc8cd9) còn máy local không có (dùng fallback
 * english_for_me_salt_2026, fingerprint 50a253f5f73d). Mọi tài khoản tạo trước
 * khi Vercel có AUTH_SALT đều lưu hash theo salt fallback, nên khi production
 * đổi sang salt của nó thì đúng mật khẩu đó bị từ chối → "sai mật khẩu" dù
 * người dùng không hề đổi gì. verifyPassword phải chấp nhận cả hai salt.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const LEGACY_SALT = 'english_for_me_salt_2026';
const ENV_SALT = 'env-only-salt-xyz';

async function loadDb() {
  vi.resetModules();
  return await import('@/lib/db');
}

describe('verifyPassword / hashPassword', () => {
  const originalSalt = process.env.AUTH_SALT;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (originalSalt === undefined) delete process.env.AUTH_SALT;
    else process.env.AUTH_SALT = originalSalt;
    vi.resetModules();
  });

  it('hash mới là scheme scrypt có version + salt riêng', async () => {
    process.env.AUTH_SALT = ENV_SALT;
    const { hashPassword } = await loadDb();

    const hash = hashPassword('123456');
    expect(hash.startsWith('scrypt$')).toBe(true);
    const parts = hash.split('$');
    expect(parts).toHaveLength(6);
    expect(parts[1]).toBe('16384'); // N
    expect(parts[2]).toBe('8'); // r
    expect(parts[3]).toBe('1'); // p
  });

  it('hai tài khoản cùng mật khẩu có hash KHÁC nhau (salt per-user)', async () => {
    process.env.AUTH_SALT = ENV_SALT;
    const { hashPassword } = await loadDb();

    expect(hashPassword('123456')).not.toBe(hashPassword('123456'));
  });

  it('xác minh hash mới đúng/sai', async () => {
    process.env.AUTH_SALT = ENV_SALT;
    const { hashPassword, verifyPassword } = await loadDb();
    const hash = hashPassword('mat-khau-to');

    expect(verifyPassword('mat-khau-to', hash).ok).toBe(true);
    expect(verifyPassword('mat-khau-sai', hash).ok).toBe(false);
    // Hash đúng scheme mới thì không cần nâng cấp.
    expect(verifyPassword('mat-khau-to', hash).needsRehash).toBe(false);
    expect(verifyPassword('mat-khau-to', hash).scheme).toBe('scrypt');
  });

  it('chấp nhận hash cũ SHA-256 theo salt của instance hiện tại', async () => {
    process.env.AUTH_SALT = ENV_SALT;
    const { hashPasswordLegacy, verifyPassword } = await loadDb();
    const stored = hashPasswordLegacy('123456');

    const res = verifyPassword('123456', stored);
    expect(res.ok).toBe(true);
    expect(res.scheme).toBe('legacy-current');
    expect(res.needsRehash).toBe(true);
  });

  it('CHẤP NHẬN hash cũ theo salt fallback khi instance dùng AUTH_SALT khác (lỗi thật)', async () => {
    // Instance đang chạy với AUTH_SALT riêng (giống production)...
    process.env.AUTH_SALT = ENV_SALT;
    const { hashPasswordLegacy, verifyPassword } = await loadDb();

    // ...nhưng tài khoản này được tạo lúc instance chưa có AUTH_SALT.
    const stored = hashPasswordLegacy('123456', LEGACY_SALT);

    const res = verifyPassword('123456', stored);
    expect(res.ok).toBe(true);
    expect(res.scheme).toBe('legacy-fallback');
    expect(res.needsRehash).toBe(true);
  });

  it('vẫn dùng được hash fallback trên máy không có AUTH_SALT (không nhân đôi công việc)', async () => {
    delete process.env.AUTH_SALT;
    const { hashPasswordLegacy, verifyPassword } = await loadDb();
    const stored = hashPasswordLegacy('123456'); // tự động dùng LEGACY_SALT

    const res = verifyPassword('123456', stored);
    expect(res.ok).toBe(true);
    expect(res.scheme).toBe('legacy-current');
  });

  it('mật khẩu sai thì dù hash cũ cũng bị từ chối', async () => {
    process.env.AUTH_SALT = ENV_SALT;
    const { hashPasswordLegacy, verifyPassword } = await loadDb();

    expect(verifyPassword('khong-dung', hashPasswordLegacy('123456', LEGACY_SALT)).ok).toBe(false);
  });

  it('xử lý an toàn hash rỗng / không đúng định dạng', async () => {
    process.env.AUTH_SALT = ENV_SALT;
    const { verifyPassword } = await loadDb();

    for (const bad of ['', '   ', 'null', 'scrypt$', 'scrypt$1$2$3$4', 'zzz$abc']) {
      expect(verifyPassword('123456', bad).ok).toBe(false);
    }
    expect(verifyPassword('123456', null).ok).toBe(false);
    expect(verifyPassword('123456', undefined).ok).toBe(false);
  });
});
