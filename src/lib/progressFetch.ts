/**
 * Gộp các GET /api/progress trùng userId đang "bay" thành MỘT request.
 *
 * Vì sao (đo 2026-10-18, mục tối ưu độ mượt): trang chủ có 3 nơi cùng gọi
 * /api/progress?userId=<id> ngay khi mount — page.tsx (widget thú cưng),
 * StudyPlanSection (checklist lộ trình) và AppShell (syncUser) — response của
 * tài khoản thật ~70KB nén (~0.5MB thô) nên tải 3 lần là lãng phí thật đo được
 * (3 request trong cùng một lần tải trang chủ).
 *
 * Hàm chia sẻ đúng promise ĐANG CHẠY cho mọi caller trong cùng khoảng in-flight;
 * KHÔNG cache sau khi xong (không TTL) nên dữ liệu luôn tươi — tránh làm chậm
 * tick "đã học xong" ngay sau khi người dùng vừa hoàn thành một bài.
 *
 * Trả về dạng tối thiểu tương thích chỗ gọi cũ: { status, ok, json() }.
 */
export interface ProgressLikeResponse {
  status: number;
  ok: boolean;
  json: () => Promise<any>;
}

const inflight = new Map<string, Promise<ProgressLikeResponse>>();

export function fetchProgress(userId: string): Promise<ProgressLikeResponse> {
  const existing = inflight.get(userId);
  if (existing) return existing;

  const p = fetch(`/api/progress?userId=${encodeURIComponent(userId)}`)
    .then(async (res): Promise<ProgressLikeResponse> => {
      const data = await res.json().catch(() => null);
      return { status: res.status, ok: res.ok, json: async () => data };
    })
    .finally(() => {
      inflight.delete(userId);
    });

  inflight.set(userId, p);
  return p;
}
