import { NextResponse } from 'next/server';
import { pgDb, isPgEnabled } from '@/lib/pg';
import { getDictionaryHealth } from '@/lib/db';

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
 *
 * PHẠM VI kiểm tra: Postgres (dữ liệu người dùng) + từ điển tĩnh dictionary.db.
 * Hỏng tầng nào cũng trả 503 — từ điển rỗng đúng là loại chết người dùng im
 * lặng mà `SELECT 1` không bao giờ bắt được.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 60s thay vì mặc định 10s: lần đầu (cold start) endpoint này có thể mở
 * `dictionary.db`, mà mở file đó có thể kích `restore-s3.js --dictionary` với
 * timeout 30s (xem ensureDictionaryRestoredSync trong lib/db.ts). Nếu bị Vercel
 * cắt ở 10s thì endpoint chết trước lúc kịp trả lời — tức lại mất đèn đỏ đúng
 * lúc từ điển hỏng. Các route tra từ đã dùng 60s vì lý do tương tự.
 */
export const maxDuration = 60;

export async function GET() {
  const started = Date.now();
  const body: Record<string, unknown> = {
    ok: true,
    db: 'not-configured',
    latencyMs: null,
    time: new Date().toISOString(),
  };

  // (1) Postgres — dữ liệu người dùng.
  if (isPgEnabled()) {
    try {
      const row = await pgDb.prepare('SELECT 1 AS ok').get<{ ok: number }>();
      body.db = Number(row?.ok) === 1 ? 'ok' : 'unexpected';
      if (body.db !== 'ok') body.ok = false;
    } catch {
      body.db = 'error';
      body.ok = false;
    }
  }

  // (2) Từ điển tĩnh (SQLite dictionary.db) — đo 2026-10-09 trên production:
  // /api/dictionary/search trả `total: 0` cho MỌI từ khoá vì bảng rỗng, còn
  // health check cũ chỉ `SELECT 1` Postgres nên vẫn báo "ok" ⇒ sự cố chết người
  // dùng mà không có đèn đỏ. Giờ từ điển rỗng/hỏng ⇒ `ok: false` ⇒ 503.
  //
  // Chỉ trả boolean + số mục từ: đủ để cơ chế giám sát nhìn thấy đỏ mà không
  // lộ tên bảng/tên host/tên biến (giữ đúng cam kết trong doc comment trên).
  const dictionary = getDictionaryHealth();
  body.dictionary = { ok: dictionary.ok, entries: dictionary.entries };
  if (!dictionary.ok) body.ok = false;

  body.latencyMs = Date.now() - started;

  return NextResponse.json(body, {
    // 503 khi DB hỏng để cơ chế giám sát nhìn thấy đỏ, nhưng nội dung vẫn an toàn.
    status: body.ok ? 200 : 503,
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}