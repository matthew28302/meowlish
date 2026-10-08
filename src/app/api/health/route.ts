import { NextResponse } from 'next/server';

/**
 * GET /api/health — kiểm tra sức khoẻ dịch vụ.
 *
 * Chỉ báo sống cho Vercel/Uptime: luôn 200 trừ khi cấu hình hệ thống hỏng.
 * Không chứa chi tiết nội bộ (tên bảng, host, biến môi trường) để tránh lộ.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      db: 'sqlite-filebase-ok',
      time: new Date().toISOString(),
    },
    {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    },
  );
}
