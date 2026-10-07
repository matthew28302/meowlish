import { describe, it, expect } from 'vitest';
import { BACKUP_KEY_RE, selectStaleBackups } from '@/lib/backupRetention';

/**
 * Cron sao lưu XOÁ file trên bucket thật. Đây là các bảo vệ chống lỗi đã xảy ra
 * thật: bản đầu tiên sắp xếp bằng TÊN KEY, dẫn tới đo được bản backup thật bị
 * xoá khi có key lạ trong cùng thư mục. Không được nới lỏng bất kỳ test nào ở đây.
 */
describe('selectStaleBackups — chọn bản backup cũ để dọn', () => {
  const KEEP = 14;
  const SOURCE = 'english_learning.db';

  const real = (day: string, hhmm = '00-00-00-000') => `backups/db-${day}T${hhmm}Z.db`;

  it('định dạng key do cron tạo được nhận, key lạ thì không', () => {
    expect(BACKUP_KEY_RE.test(real('2026-10-07'))).toBe(true);
    // Những thứ có thể nằm nhầm trong thư mục backups/ nhưng KHÔNG phải của cron.
    for (const foreign of [
      'backups/aaa-testprune-0.db',
      'backups/manual-copy.db',
      'backups/db-2026-10-07.db', // thiếu phần giờ
      'backups/db-2026-10-07T00-00-00-000Z.db.bak',
      'backups/db-2026-10-07T00-00-00Z.db', // thiếu mili giây
      'english_learning.db',
    ]) {
      expect(BACKUP_KEY_RE.test(foreign)).toBe(false);
    }
  });

  it('lọc theo HÌNH DẠNG, không kiểm tra lịch — và điều đó không gây hại', () => {
    // Regex không phân biệt được tháng 13, nhưng cũng không cần: mọi key khớp hình
    // dạng đều do chính cron này tạo ra. Và thứ tự dọn dựa vào `LastModified` của
    // S3 chứ không dựa vào tên — nên một tên "vô lý" vẫn bị xoá đúng thứ tự thời
    // gian, không bao giờ bị giữ lại mãi.
    const badDate = real('2026-13-45', '99-99-99-999');
    expect(BACKUP_KEY_RE.test(badDate)).toBe(true);

    const stale = selectStaleBackups(
      [{ key: badDate, at: 1 }, { key: real('2026-10-07'), at: 2 }],
      1,
      SOURCE
    );
    expect(stale).toEqual([badDate]); // bản CŨ hơn bị dọn, bản mới hơn được giữ
  });

  it('TUYỆT ĐỐI không xoá key lạ, dù tên nó sắp xếp trước bản thật', () => {
    // Đây chính là kịch bản đã hỏng: 'a' < 'd' nên key lạ đứng đầu danh sách
    // khi sắp xếp theo tên, và bản backup thật bị xoá nhầm.
    const entries = [
      ...Array.from({ length: 20 }, (_, i) => ({ key: `backups/aaa-testprune-${i}.db`, at: 1_000 + i })),
      { key: real('2026-10-07'), at: 9_999_999 },
    ];

    const stale = selectStaleBackups(entries, KEEP, SOURCE);

    expect(stale).not.toContain(real('2026-10-07'));
    expect(stale.every((k) => k.startsWith('backups/aaa-testprune-'))).toBe(true);
  });

  it('giữ đúng 14 bản MỚI NHẤT theo thời gian, xoá phần còn lại', () => {
    const entries = Array.from({ length: 20 }, (_, i) => ({
      key: real(`2026-10-${String(i + 1).padStart(2, '0')}`),
      at: i * 1000,
    }));

    const stale = selectStaleBackups(entries, KEEP, SOURCE);
    const kept = entries.map((e) => e.key).filter((k) => !stale.includes(k));

    expect(stale).toHaveLength(6);
    expect(kept).toHaveLength(KEEP);
    // 6 bản cũ nhất bị xoá.
    expect(stale).toContain(entries[0].key);
    expect(stale).toContain(entries[5].key);
    // Bản mới nhất tuyệt đối còn.
    expect(kept).toContain(entries[19].key);
  });

  it('sắp xếp theo thời gian, KHÔNG theo tên — tên đảo ngược thứ tự thì vẫn đúng', () => {
    const entries = [
      { key: real('2026-01-01'), at: 3_000 }, // tên nhỏ nhất nhưng MỚI hơn
      { key: real('2026-12-31'), at: 1_000 }, // tên lớn nhất nhưng CŨ hơn
    ];

    const stale = selectStaleBackups(entries, 1, SOURCE);

    // Giữ bản mới hơn (2026-01-01), dù tên của nó nhỏ hơn.
    expect(stale).toEqual([real('2026-12-31')]);
  });

  it('không bao giờ xoá key nguồn, kể cả khi nó lọt vào danh sách', () => {
    const entries = [{ key: SOURCE, at: 5_000 }, { key: real('2026-10-07'), at: 5_000 }];
    expect(selectStaleBackups(entries, 0, SOURCE)).not.toContain(SOURCE);
  });

  it('chưa tới hạn thì không xoá gì', () => {
    const entries = Array.from({ length: KEEP }, (_, i) => ({
      key: real(`2026-10-${String(i + 1).padStart(2, '0')}`),
      at: i,
    }));
    expect(selectStaleBackups(entries, KEEP, SOURCE)).toEqual([]);
  });

  it('mất thông tin thời gian thì coi là cũ nhất, không ném lỗi', () => {
    const entries = [
      { key: real('2026-10-01') }, // không có `at`
      { key: real('2026-10-02'), at: 2_000 },
      { key: real('2026-10-03'), at: 3_000 },
    ];
    const stale = selectStaleBackups(entries, 2, SOURCE);
    expect(stale).toEqual([real('2026-10-01')]);
  });

  it('thư mục trống hoặc chỉ có key lạ thì không xoá gì', () => {
    expect(selectStaleBackups([], KEEP, SOURCE)).toEqual([]);
    expect(selectStaleBackups([{ key: 'backups/can-ban-tay.db', at: 1 }], KEEP, SOURCE)).toEqual([]);
  });
});