/**
 * Lọc collocations "rác" do template sinh tự động.
 *
 * Bối cảnh: `scripts/importFullDictionary.mjs` từng sinh placeholder cho 100%
 * mục từ (26.416/26.416):
 *   `common <w>` | `<w> in context` | `use <w> [in sentence]`
 *   `in <w> communication` | `standard usage of <w>`
 * Chúng hiện ra trong UI thành chip vô nghĩa, thậm chí dính chữ
 * ("common aa in contextuse a") — làm mất uy tín từ điển.
 *
 * Hàm này chạy ở API để dữ liệu cũ trong DB (đã nạp trước, hoặc được khôi
 * phục lại từ S3) cũng được lọc — không phụ thuộc migration đã chạy hay chưa.
 */

/** Một collocation chỉ gồm tên từ + từ báo/cụm từ chung => không mang thông tin. */
export function isPlaceholderCollocation(word: string, collocation: unknown): boolean {
  if (typeof collocation !== 'string') return true;
  const c = collocation.trim();
  if (!c) return true;

  const w = String(word ?? '').trim();
  if (!w) return false;

  const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const junk = [
    `${w} in context`,
    `common ${w}`,
    `use ${w}`,
    `use ${w} in sentence`,
    `${w} in communication`,
    `in ${w} communication`,
    `standard usage of ${w}`,
  ];
  const lowered = c.toLowerCase();
  return junk.includes(lowered) || new RegExp(`^${esc} in (context|communication)$`, 'i').test(c);
}

/** Trả về mảng collocations đã lọc placeholder (giữ nguyên thứ tự, bỏ trùng). */
export function cleanCollocations(word: string, collocations: unknown): string[] {
  if (!Array.isArray(collocations)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of collocations) {
    if (isPlaceholderCollocation(word, c)) continue;
    const s = String(c).trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}