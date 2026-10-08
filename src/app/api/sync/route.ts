import { NextResponse } from 'next/server';
import { getSyncStatus, uploadDbToS3, downloadDbFromS3 } from '@/lib/s3Sync';
import { verifyAdminToken } from '@/lib/adminAuth';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import logger from '@/lib/logger';

/**
 * 60s thay vì mặc định 10s của Vercel.
 *
 * POST action upload/download đẩy/kéo NGUYÊN file SQLite 67MB qua mạng
 * Vercel→Filebase. Trần mặc định 10s chỉ đủ khi ≥56.5Mbit/s — chậm hơn là
 * 504, và upload bị cắt giữa chừng chính là kịch bản mất dữ liệu mà
 * docs/db-sync.md tự cảnh báo.
 */
export const maxDuration = 60;

// Helper: Check if request has admin rights (via Bearer token or HttpOnly cookie)
function isAuthorizedAdmin(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (verifyAdminToken(token)) return true;
  }
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/duahau_admin_session=([^;]+)/);
  if (match && verifyAdminToken(decodeURIComponent(match[1]))) return true;

  return false;
}

// GET: Kiểm tra trạng thái đồng bộ S3 Filebase (Admin only)
export async function GET(request: Request) {
  try {
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền xem thông tin sao lưu hệ thống.' }, { status: 401 });
    }

    const status = await getSyncStatus();
    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error: any) {
    logger.error('Error in GET /api/sync:', { error });
    return NextResponse.json(
      { error: error.message || 'Không thể kiểm tra trạng thái đồng bộ S3' },
      { status: 500 }
    );
  }
}

// POST: Thực hiện đồng bộ (upload hoặc download)
export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate limit: tối đa 6 requests / 5 phút per IP
    const rateCheck = checkRateLimit({
      key: `sync:${clientIp}`,
      maxAttempts: 6,
      windowMs: 5 * 60 * 1000,
    });

    if (!rateCheck.allowed) {
      return rateLimitExceededResponse('Tần suất đồng bộ quá nhanh. Vui lòng chờ vài phút trước khi thao tác tiếp.', rateCheck.resetInSeconds);
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is allowed, defaults to 'upload'
    }

    const action = body?.action || 'upload';

    // BẢO MẬT TUYỆT ĐỐI: Thao tác đồng bộ S3 BẮT BUỘC có quyền Admin
    if (!isAuthorizedAdmin(request)) {
      logger.warn(`Unauthorized attempt to execute S3 sync (${action}) from IP: ${clientIp}`);
      return NextResponse.json({ error: 'Từ chối truy cập. Chỉ Quản trị viên có quyền thực hiện đồng bộ Filebase S3.' }, { status: 403 });
    }

    if (action === 'download') {
      const ok = await downloadDbFromS3();
      const status = await getSyncStatus();
      return NextResponse.json({
        success: ok,
        action: 'download',
        message: status.lastSyncMessage,
        status,
      });
    }

    // Upload backup: Admin kích hoạt
    const ok = await uploadDbToS3();
    const status = await getSyncStatus();

    return NextResponse.json({
      success: ok,
      action: 'upload',
      message: status.lastSyncMessage,
      status,
    });
  } catch (error: any) {
    logger.error('Error in POST /api/sync:', { error });
    return NextResponse.json(
      { error: error.message || 'Đồng bộ Filebase S3 thất bại' },
      { status: 500 }
    );
  }
}
