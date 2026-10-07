import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken } from '@/lib/adminAuth';
import { getAccessLogs, getErrorLogs, getEmailLogs, getLogSummary } from '@/lib/systemLogs';
import logger from '@/lib/logger';

function verifyAdmin(request: Request, authHeader?: string | null, adminSecret?: string | null): boolean {
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (verifyAdminToken(token)) return true;
  }
  if (adminSecret && verifyAdminToken(adminSecret)) return true;

  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/duahau_admin_session=([^;]+)/);
  if (match && verifyAdminToken(decodeURIComponent(match[1]))) return true;

  return false;
}

/**
 * 60s thay vì mặc định 10s của Vercel.
 *
 * Các route này có thể phải đẩy file SQLite ~67MB lên Filebase S3. Đo được:
 * ~5.4s ở 100Mbit/s nhưng ~26.8s ở 20Mbit/s. Trượt mặc định 10s ⇒ upload bị
 * cắt giữa chừng ⇒ dữ liệu mất. 60s là trần của gói Vercel Hobby.
 */
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    // KHONG nhan token qua query string (`?token=`/`?adminSecret=`): token se roi
    // vao access log, Referer khi admin mo link noi boi va lich su trinh duyet.
    // Chi chap nhan header `Authorization` va cookie httpOnly.
    const tokenParam = null;

    if (!verifyAdmin(request, authHeader, tokenParam)) {
      return NextResponse.json({ error: 'Truy cập bị từ chối. Vui lòng đăng nhập quyền quản trị.' }, { status: 401 });
    }

    const type = searchParams.get('type') || 'access'; // 'access', 'error', 'email', 'summary'
    const limit = Number(searchParams.get('limit')) || 50;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';

    const summary = getLogSummary();

    if (type === 'access') {
      const result = getAccessLogs({
        limit,
        offset,
        search,
        action: filter,
      });
      return NextResponse.json({
        success: true,
        type: 'access',
        logs: result.logs,
        total: result.total,
        page,
        limit,
        summary,
      });
    }

    if (type === 'error') {
      const result = getErrorLogs({
        limit,
        offset,
        search,
        severity: filter,
      });
      return NextResponse.json({
        success: true,
        type: 'error',
        logs: result.logs,
        total: result.total,
        page,
        limit,
        summary,
      });
    }

    if (type === 'email') {
      const result = getEmailLogs({
        limit,
        offset,
        search,
        purpose: filter,
      });
      return NextResponse.json({
        success: true,
        type: 'email',
        logs: result.logs,
        total: result.total,
        page,
        limit,
        summary,
      });
    }

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (err: any) {
    logger.error('Error in GET /api/admin/logs:', { error: err });
    return NextResponse.json({ error: err.message || 'Lỗi tải nhật ký hệ thống' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    const { action, logType, adminSecret } = body;

    if (!verifyAdmin(request, authHeader, adminSecret)) {
      return NextResponse.json({ error: 'Truy cập bị từ chối.' }, { status: 401 });
    }

    if (action === 'clear') {
      if (logType === 'access') {
        db.exec('DELETE FROM system_access_logs;');
      } else if (logType === 'error') {
        db.exec('DELETE FROM system_error_logs;');
      } else if (logType === 'email') {
        db.exec('DELETE FROM system_email_logs;');
      }
      return NextResponse.json({ success: true, message: `Đã dọn dẹp nhật ký ${logType} thành công.` });
    }

    return NextResponse.json({ error: 'Action không hợp lệ.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi thao tác' }, { status: 500 });
  }
}
