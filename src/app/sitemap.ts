import type { MetadataRoute } from 'next';

const BASE_URL = 'https://meowlish.io.vn';

// Thời điểm BUILD — gọi 1 lần ở module scope để mọi URL trong cùng 1 build chia
// sẻ cùng một lastModified. (Trước đây new Date() chạy mỗi lần render sitemap:
// giá trị tự đổi mỗi ngày dù nội dung trang không đổi, làm mất tín hiệu
// freshness với Google. Next cache route này giữa các build nên lastModified
// chỉ cập nhật theo lần deploy/build mới.)
const BUILD_DATE = new Date().toISOString().split('T')[0];

// Các trang public chính thức — không bao gồm trang dev/test (duahau, pet-test,
// fitcheck) và /bookmarks (trang cá nhân sau đăng nhập, không giá trị SEO).
const PUBLIC_ROUTES = [
  '',
  '/vocabulary',
  '/grammar',
  '/encyclopedia',
  '/flashcards',
  '/exam',
  '/pet',
  '/support',
  '/practice/speaking',
  '/practice/writing',
  '/practice/listening',
  '/practice/roleplay',
];

// Phân tầng priority: trang chủ 1, nội dung chính 0.9, trang phụ 0.7, practice 0.6.
function routePriority(route: string): number {
  if (route === '') return 1;
  if (route.startsWith('/practice/')) return 0.6;
  if (['/encyclopedia', '/grammar', '/vocabulary', '/exam'].includes(route)) return 0.9;
  return 0.7;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: BUILD_DATE,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: routePriority(route),
  }));
}
