import type { MetadataRoute } from 'next';

const BASE_URL = 'https://meowlish.io.vn';

// Các trang public chính thức — không bao gồm trang dev/test (duahau, pet-test, fitcheck).
const PUBLIC_ROUTES = [
  '',
  '/vocabulary',
  '/grammar',
  '/encyclopedia',
  '/flashcards',
  '/exam',
  '/pet',
  '/support',
  '/bookmarks',
  '/practice/speaking',
  '/practice/writing',
  '/practice/listening',
  '/practice/roleplay',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date().toISOString().split('T')[0];
  return PUBLIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: today,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));
}
