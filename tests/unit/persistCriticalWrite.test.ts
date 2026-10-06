/**
 * persistCriticalWrite: ghi dữ liệu quan trọng (đăng ký/đổi mật khẩu) rồi bảo đảm
 * nó không bị instance khác ghi đè mất trên Filebase.
 *
 * Bối cảnh (sự cố thật trên production): DB là một tệp SQLite 66MB trên Filebase,
 * mọi instance Vercel giữ bản riêng và đẩy nguyên tệp lên. Khi hai instance ghi
 * cùng lúc, bản bị đánh bại bị tải bản remote đè lên (forkRejoin) và ghi cục bộ
 * bị vứt vào key .conflict.db. User `kangyoungha` (đăng ký 14:51) chỉ còn trong
 * english_learning.conflict.db, không có trong bản chính → "đăng ký xong, một
 * lúc sau không đăng nhập được".
 *
 * Test bên dưới mô phỏng đúng tình huống đó bằng cách cho verify() trả về false ở
 * những lần đầu (tức là bản ghi vừa bị ghi đè mất).
 */
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';

const ENV_KEYS = ['DB_SYNC_AUTO', 'FILEBASE_ACCESS_KEY', 'FILEBASE_SECRET_KEY', 'FILEBASE_ENDPOINT', 'VERCEL'];

describe('persistCriticalWrite', () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of ENV_KEYS) saved[k] = process.env[k];
    // Không có khoá Filebase trong môi trường test ⇒ upload trả về false ngay,
    // không gọi mạng. Vẫn giữ auto-sync "bật" để vòng lặp ghi-thử-chạy.
    delete process.env.FILEBASE_ACCESS_KEY;
    delete process.env.FILEBASE_SECRET_KEY;
    delete process.env.VERCEL;
    vi.resetModules();
  });

  afterAll(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k] as string;
    }
  });

  it('ngoài Vercel (auto-sync tắt) chỉ ghi một lần và coi là đã lưu', async () => {
    delete process.env.DB_SYNC_AUTO;
    const { persistCriticalWrite } = await import('@/lib/s3Sync');

    let applies = 0;
    let verifies = 0;
    const res = await persistCriticalWrite(
      'test',
      () => {
        applies++;
      },
      () => {
        verifies++;
        return true;
      }
    );

    expect(res).toEqual({ persisted: true, attempts: 1 });
    expect(applies).toBe(1);
    expect(verifies).toBe(0); // không có remote để tranh chấp thì không cần xác minh
  });

  it('ghi lại khi bản ghi bị instance khác ghi đè, và báo đúng số lần thử', async () => {
    process.env.DB_SYNC_AUTO = '1';
    const { persistCriticalWrite } = await import('@/lib/s3Sync');

    let applies = 0;
    let verifies = 0;
    const res = await persistCriticalWrite(
      'đăng ký @test',
      () => {
        applies++;
      },
      () => {
        verifies++;
        return verifies >= 3; // lần 1-2 bị ghi đè, lần 3 mới thành công
      }
    );

    expect(res).toEqual({ persisted: true, attempts: 3 });
    expect(applies).toBe(3);
    expect(verifies).toBe(3);
  });

  it('trả persisted=false khi hết số lần thử (không báo cáo thành công giả)', async () => {
    process.env.DB_SYNC_AUTO = '1';
    const { persistCriticalWrite } = await import('@/lib/s3Sync');

    let applies = 0;
    const res = await persistCriticalWrite(
      'đăng ký @test',
      () => {
        applies++;
      },
      () => false,
      2
    );

    expect(res).toEqual({ persisted: false, attempts: 2 });
    expect(applies).toBe(2);
  });

  it('xác minh lỗi không làm sập vòng lặp', async () => {
    process.env.DB_SYNC_AUTO = '1';
    const { persistCriticalWrite } = await import('@/lib/s3Sync');

    let verifies = 0;
    const res = await persistCriticalWrite(
      'test',
      () => {},
      () => {
        verifies++;
        throw new Error('CSDL đang bận');
      },
      2
    );

    expect(res.persisted).toBe(false);
    expect(verifies).toBe(2);
  });
});
