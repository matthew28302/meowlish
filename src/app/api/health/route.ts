import { NextResponse } from 'next/server';
import { pgDb, isPgEnabled } from '@/lib/pg';

/**
 * GET /api/health — kiểm tra sức khoẻ dịch vụ.
 *
 * HAI VIỆC TRONG MỘT:
 * 1. Báo sống cho Vercel/Uptime: trả 200 khi Postgres truy cập được.
 * 2. Giữ Supabase Free KHÔNG bị tạm dừng: gói Free dừng project sau 1 tuần không
 *    hoạt động. Cron hằng ngày (vercel.json) gọi endpoint này nên project luôn
 *    có hoạt động và không bị pause.
 *
 * Yêu cầu: phải `no-store`. Nếu CDN cache lại, cron gọi vào mà function không
 * chạy ⇒ Postgres vẫn bị pause. Vì vậy `dynamic = 'force-dynamic'` + header
 * `Cache-Control: no-store`.
 *
 * Cố tình KHÔNG tiết lộ chi tiết: chỉ trả trạng thái và độ trễ, không trả tên
 * bảng, không trả thông điệp lỗi có thể chứa tên host hay tên biến.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const started = Date.now();
  const body: Record<string, unknown> = {
    ok: true,
    db: 'not-configured',
    latencyMs: null,
    time: new Date().toISOString(),
  };

  if (!isPgEnabled()) {
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  }

  try {
    const row = await pgDb.prepare('SELECT 1 AS ok').get<{ ok: number }>();
    body.db = Number(row?.ok) === 1 ? 'ok' : 'unexpected';
    if (body.db !== 'ok') body.ok = false;
  } catch {
    body.db = 'error';
    body.ok = false;
  } finally {
    body.latencyMs = Date.now() - started;
  }

  return NextResponse.json(body, {
    // 503 khi DB hỏng để cơ chế giám sát nhìn thấy đỏ, nhưng nội dung vẫn an toàn.
    status: body.ok ? 200 : 503,
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}
