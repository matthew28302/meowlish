import type { MetadataRoute } from 'next';

const BASE_URL = 'https://meowlish.io.vn';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Trang dev/test không được index
        disallow: ['/duahau', '/pet-test', '/fitcheck', '/api/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
