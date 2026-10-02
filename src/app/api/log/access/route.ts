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

    let username = 'guest';
    let userId: string | null = null;

    // 1. Kiểm tra phiên đăng nhập Quản Trị Viên (duahau_admin_session)
    const cookieHeader = request.headers.get('cookie') || '';
    const adminMatch = cookieHeader.match(/duahau_admin_session=([^;]+)/);
    if (adminMatch && verifyAdminToken(decodeURIComponent(adminMatch[1]))) {
      username = 'admin';
      userId = 'user_admin_root';
    } else {
      // 2. Kiểm tra phiên đăng nhập Học viên (meowlish_user_session)
      const userMatch = cookieHeader.match(/meowlish_user_session=([^;]+)/);
      if (userMatch) {
        const token = decodeURIComponent(userMatch[1]);
        const sessionUserId = verifyUserSessionToken(token);
        if (sessionUserId) {
          userId = sessionUserId;
          try {
            const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as any;
            if (user && user.username) {
              username = user.username;
            }
          } catch {}
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
