import { NextResponse } from 'next/server';
import { logAccess } from '@/lib/systemLogs';
import { getClientIp } from '@/lib/rateLimit';
import { verifyAdminToken } from '@/lib/adminAuth';
import { verifyUserSessionToken } from '@/lib/userAuth';
import { db } from '@/lib/db';

const PAGE_NAMES: Record<string, string> = {
  '/': 'Trang chủ (Home)',
  '/vocabulary': 'Học Từ vựng Thông minh',
  '/grammar': 'Học Ngữ pháp Lego',
  '/practice/writing': 'Luyện viết phản xạ AI',
  '/practice/speaking': 'Luyện phát âm chuẩn IPA',
  '/practice/listening': 'Luyện nghe phản xạ',
  '/practice/roleplay': 'Hội thoại Roleplay AI',
  '/fitcheck': 'Tủ đồ Fitcheck Thời trang',
  '/pet': 'Nông trại Thú cưng PixelFarm',
  '/duahau': 'Trang Quản Trị Cấp Cao (Dưa Hấu)',
  '/support': 'Trung tâm Hỗ trợ & Góp ý',
  '/exam': 'Phòng Thi & Đánh Giá Năng Lực',
  '/bookmarks': 'Sổ tay Từ vựng Yêu thích',
  '/encyclopedia': 'Bách khoa toàn thư IT',
  '/flashcards': 'Thẻ nhớ Flashcards',
};

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || '';
    const body = await request.json().catch(() => ({}));
    const pathname: string = String(body.pathname || '/').trim();
    const title: string = String(body.title || '').trim();

    // Bỏ qua các endpoint nội bộ hoặc static asset
    if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
      return NextResponse.json({ success: true });
    }

    const clientUserId = typeof body.clientUserId === 'string' ? body.clientUserId.trim() : null;
    const clientUsername = typeof body.clientUsername === 'string' ? body.clientUsername.trim() : null;
    const isAdminRoute = pathname.startsWith('/duahau');

    const cookieHeader = request.headers.get('cookie') || '';
    const adminMatch = cookieHeader.match(/duahau_admin_session=([^;]+)/);
    const userMatch = cookieHeader.match(/meowlish_user_session=([^;]+)/);

    let username = 'guest';
    let userId: string | null = null;

    if (isAdminRoute) {
      // 1. Tuyến đường Quản Trị (/duahau) -> Ưu tiên phiên Admin
      if (adminMatch && verifyAdminToken(decodeURIComponent(adminMatch[1]))) {
        username = 'admin';
        userId = 'user_admin_root';
      }
    } else {
      // 2. Tuyến đường Học Viên / Công khai -> Ưu tiên phiên Học Viên (tránh bị cookie admin của tab khác đè)
      if (userMatch) {
        const token = decodeURIComponent(userMatch[1]);
        const sessionUserId = verifyUserSessionToken(token);
        if (sessionUserId) {
          userId = sessionUserId;
        }
      }

      // Nếu cookie chưa đồng bộ kịp hoặc phiên lưu ở client, sử dụng clientUserId nếu khớp dữ liệu
      if (!userId && clientUserId) {
        userId = clientUserId;
      }

      if (userId) {
        try {
          const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as any;
          if (user && user.username) {
            username = user.username;
          } else if (clientUsername) {
            username = clientUsername;
          }
        } catch {
          if (clientUsername) username = clientUsername;
        }
      }
    }

    const pageDesc = PAGE_NAMES[pathname] || (title ? `${title} (${pathname})` : `Trang ${pathname}`);
    const actionKey = pathname === '/' ? 'visit_home' : `visit_${pathname.replace(/^\//, '').replace(/\//g, '_')}`;

    logAccess({
      user_id: userId,
      username,
      action: actionKey.slice(0, 50),
      ip: clientIp,
      user_agent: userAgent,
      status: 'success',
      details: `Truy cập: ${pageDesc}`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
