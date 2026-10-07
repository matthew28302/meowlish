/**
 * Chọn bản backup cũ cần dọn — hàm thuần, không I/O.
 *
 * Tách riêng khỏi route vì đây là chỗ NGUY HIỂM NHẤT của cron sao lưu: nó XOÁ
 * file trên bucket thật. Sai một dòng là mất bản backup mới nhất.
 *
 * BÀI HỌC TỪ LỖI ĐÃ MẮC:
 * Bản đầu tiên sắp xếp bằng `keys.sort()` — tức so sánh CHUỖI tên key. Đo được
 * khi có key lạ trong cùng thư mục: 'a' < 'd' nên `aaa-testprune-…` đứng trước
 * `db-2026-…`, và bản backup THẬT bị xoá đầu tiên.
 *
 *   → Sắp xếp theo TÊN KHÔNG BAO GIỜ đúng. Phải theo MỐC THỜI GIAN.
 *   → Và phải lọc theo định dạng: key không do cron tạo thì không có quyền bị xoá.
 */

/** Đúng định dạng tên key mà cron tự sinh: `backups/db-<ISO>.db`. */
export const BACKUP_KEY_RE = /^backups\/db-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.db$/;

export interface BackupEntry {
  key: string;
  /** Epoch ms. `undefined` khi S3 không trả về — coi như cũ nhất. */
  at?: number;
}

/**
 * Trả về danh sách key cần XOÁ.
 *
 * @param entries tất cả object trong thư mục backup
 * @param keep    số bản mới nhất cần giữ
 * @param sourceKey key nguồn — luôn được miễn xoá dù có nhầm định dạng
 */
export function selectStaleBackups(
  entries: BackupEntry[],
  keep: number,
  sourceKey?: string
): string[] {
  if (keep < 0) throw new RangeError('keep phai >= 0');

  const ours = entries
    .filter((e) => BACKUP_KEY_RE.test(e.key))
    .map((e) => ({ key: e.key, at: e.at ?? 0 }));

  // Mới nhất trước. Hoà thì so tên để thứ tự ổn định (không quan trọng về mặt an toàn).
  ours.sort((a, b) => b.at - a.at || (a.key < b.key ? 1 : -1));

  return ours
    .slice(keep)
    .map((e) => e.key)
    // Chặn chặn cuối, phòng khi có ai đó đổi hằng số ở nơi khác.
    .filter((k) => k !== sourceKey);
}