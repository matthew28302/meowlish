/**
 * SEO — structured data & metadata (audit 2026-10-08: M11, L7, L7b, L8).
 *
 * - Root layout: JSON-LD WebSite + SearchAction + EducationalOrganization,
 *   URL non-www (khớp metadataBase + Google Search Console property
 *   `meowlish.io.vn`), viewport qua export chuẩn (không còn 2 thẻ meta viewport).
 * - /support: FAQPage JSON-LD serialize từ chính mảng `faqArticles` — kiểm tra
 *   đồng bộ 1:1 (số lượng + nội dung) giữa structured data và UI.
 * - sitemap: không chứa /bookmarks, lastModified cố định trong 1 build,
 *   priority phân tầng.
 * - /reset-password: robots noindex — trang cá nhân, không rò rỉ link một lần dùng.
 *
 * Root layout KHÔNG được import trực tiếp (tránh chạy next/font + AppShell trong
 * môi trường test node) — thay vào đó trích object literal từ mã nguồn rồi eval.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import sitemap from '@/app/sitemap';
import { metadata as resetPasswordLayoutMetadata } from '@/app/reset-password/layout';
import { buildSupportFaqJsonLd } from '@/app/support/page';

const ROOT = process.cwd();
const readSource = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

interface JsonLdRecord {
  [key: string]: unknown;
}

interface FaqArticleLike {
  id: string;
  title: string;
  content: string[];
}

interface FaqJsonLd {
  '@context': string;
  '@type': string;
  mainEntity: Array<{
    '@type': string;
    name: string;
    acceptedAnswer: { '@type': string; text: string };
  }>;
}

/**
 * Trích một object literal từ mã nguồn (từ `const NAME = {` đến `\n};` ở cột 0)
 * rồi eval thành object JS. Các object JSON-LD trong layout.tsx chỉ chứa literal
 * (không tham chiếu biến) nên eval luôn thành công.
 */
function extractObjectLiteral(source: string, constName: string): JsonLdRecord {
  const prefix = `const ${constName} = `;
  const start = source.indexOf(`${prefix}{`);
  if (start < 0) throw new Error(`Không tìm thấy const ${constName} trong mã nguồn`);
  const close = source.indexOf('\n};', start);
  if (close < 0) throw new Error(`Không tìm thấy dấu đóng của ${constName}`);
  const literal = source.slice(start + prefix.length, close + 2);
  return new Function(`return (${literal})`)() as JsonLdRecord;
}

/** Đọc kích thước PNG thật từ header IHDR (big-endian uint32 ở offset 16/20). */
function readPngSize(rel: string): { width: number; height: number } {
  const buf = fs.readFileSync(path.join(ROOT, rel));
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/**
 * Trích mảng `faqArticles` từ mã nguồn /support rồi eval thành dữ liệu thật.
 * Mảng nằm trong component (client component, không export được ở module scope),
 * nên trích từ source — vẫn chính là dữ liệu được render ra UI và JSON-LD.
 * Nội dung chỉ là literal (không tham chiếu biến) nên eval luôn thành công.
 */
function extractFaqArticles(): FaqArticleLike[] {
  const src = readSource('src/app/support/page.tsx');
  const declMarker = 'const faqArticles: FaqArticle[] = [';
  const declIdx = src.indexOf(declMarker);
  if (declIdx < 0) throw new Error('Không tìm thấy mảng faqArticles trong support/page.tsx');
  // declMarker kết thúc bằng '[' nên vị trí mở mảng = cuối marker.
  const arrayStart = declIdx + declMarker.length - 1;
  const closeIdx = src.indexOf('\n  ];', declIdx);
  if (closeIdx < 0) throw new Error('Không tìm thấy dấu đóng mảng faqArticles');
  const literal = src.slice(arrayStart, closeIdx + 4);
  return new Function(`return (${literal})`)() as FaqArticleLike[];
}

describe('SEO — root layout JSON-LD (schema.org)', () => {
  const layoutSource = readSource('src/app/layout.tsx');

  it('render script application/ld+json trong RootLayout', () => {
    expect(layoutSource).toContain('type="application/ld+json"');
  });

  it('WebSite: URL non-www + SearchAction trỏ /encyclopedia?q=', () => {
    const website = extractObjectLiteral(layoutSource, 'WEBSITE_JSON_LD');
    expect(website['@type']).toBe('WebSite');
    expect(website['url']).toBe('https://meowlish.io.vn');

    const potentialAction = website['potentialAction'] as JsonLdRecord;
    expect(potentialAction['@type']).toBe('SearchAction');
    expect(potentialAction['query-input']).toBe('required name=search_term_string');

    const target = potentialAction['target'] as JsonLdRecord;
    expect(target['urlTemplate']).toBe(
      'https://meowlish.io.vn/encyclopedia?q={search_term_string}'
    );
  });

  it('EducationalOrganization: name Meowlish + logo + url non-www', () => {
    const org = extractObjectLiteral(layoutSource, 'ORGANIZATION_JSON_LD');
    expect(org['@type']).toBe('EducationalOrganization');
    expect(org['name']).toBe('Meowlish');
    expect(org['url']).toBe('https://meowlish.io.vn');
    expect(org['logo']).toBe('https://meowlish.io.vn/meo.png');
  });

  it('JSON-LD không dùng host www. (canonical là non-www)', () => {
    const website = extractObjectLiteral(layoutSource, 'WEBSITE_JSON_LD');
    const org = extractObjectLiteral(layoutSource, 'ORGANIZATION_JSON_LD');
    expect(JSON.stringify(website)).not.toContain('www.');
    expect(JSON.stringify(org)).not.toContain('www.');
  });

  it('metadataBase non-www (giữ nguyên từ trước)', () => {
    expect(layoutSource).toContain("metadataBase: new URL('https://meowlish.io.vn')");
  });

  it('OG image khai đúng kích thước thật của public/meo.png', () => {
    const real = readPngSize('public/meo.png');
    const match = layoutSource.match(/url: '\/meo\.png', width: (\d+), height: (\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBe(real.width);
    expect(Number(match![2])).toBe(real.height);
  });

  it('L7b — viewport qua export chuẩn, không còn meta viewport thủ công', () => {
    expect(layoutSource).toContain('export const viewport: Viewport');
    expect(layoutSource).toContain("maximumScale: 5");
    expect(layoutSource).toContain("viewportFit: 'cover'");
    expect(layoutSource).not.toContain('<meta name="viewport"');
  });
});

describe('SEO — /support FAQPage JSON-LD', () => {
  const faqArticles = extractFaqArticles();
  const jsonLd = buildSupportFaqJsonLd(
    faqArticles as Parameters<typeof buildSupportFaqJsonLd>[0]
  ) as unknown as FaqJsonLd;

  it('là FAQPage với @context schema.org', () => {
    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('FAQPage');
  });

  it('mainEntity khớp 1:1 với mảng faqArticles (số lượng + nội dung)', () => {
    expect(jsonLd.mainEntity.length).toBe(faqArticles.length);
    expect(jsonLd.mainEntity.length).toBeGreaterThan(0);
    faqArticles.forEach((article, i) => {
      expect(jsonLd.mainEntity[i]['@type']).toBe('Question');
      expect(jsonLd.mainEntity[i].name).toBe(article.title);
      expect(jsonLd.mainEntity[i].acceptedAnswer['@type']).toBe('Answer');
      expect(jsonLd.mainEntity[i].acceptedAnswer.text).toBe(article.content.join('\n\n'));
      expect(jsonLd.mainEntity[i].acceptedAnswer.text.length).toBeGreaterThan(0);
    });
  });

  it('page thực sự render script JSON-LD từ dữ liệu thật (không copy tay)', () => {
    const src = readSource('src/app/support/page.tsx');
    expect(src).toContain('type="application/ld+json"');
    expect(src).toContain('buildSupportFaqJsonLd(faqArticles)');
  });
});

describe('SEO — sitemap', () => {
  const entries = sitemap();

  it('không chứa /bookmarks (trang cá nhân sau đăng nhập, không giá trị SEO)', () => {
    const urls = entries.map((entry) => entry.url);
    expect(urls.some((url) => url.includes('/bookmarks'))).toBe(false);
  });

  it('mọi URL thuộc meowlish.io.vn non-www', () => {
    entries.forEach((entry) => {
      expect(entry.url.startsWith('https://meowlish.io.vn')).toBe(true);
      expect(entry.url).not.toContain('www.');
    });
  });

  it('lastModified cố định trong 1 build (cùng giá trị, định dạng YYYY-MM-DD)', () => {
    const dates = entries.map((entry) => String(entry.lastModified));
    expect(new Set(dates).size).toBe(1);
    expect(dates[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('priority phân tầng: root 1, nội dung chính 0.9, phụ 0.7, practice 0.6', () => {
    const priorityByUrl = new Map(entries.map((entry) => [entry.url, entry.priority]));

    expect(priorityByUrl.get('https://meowlish.io.vn')).toBe(1);
    for (const route of ['/encyclopedia', '/grammar', '/vocabulary', '/exam']) {
      expect(priorityByUrl.get(`https://meowlish.io.vn${route}`)).toBe(0.9);
    }
    for (const route of [
      '/practice/speaking',
      '/practice/writing',
      '/practice/listening',
      '/practice/roleplay',
    ]) {
      expect(priorityByUrl.get(`https://meowlish.io.vn${route}`)).toBe(0.6);
    }
    for (const route of ['/flashcards', '/pet', '/support']) {
      expect(priorityByUrl.get(`https://meowlish.io.vn${route}`)).toBe(0.7);
    }
  });
});

describe('SEO — /reset-password robots', () => {
  it('noindex + nofollow (không rò rỉ link một lần dùng)', () => {
    expect(resetPasswordLayoutMetadata.robots?.index).toBe(false);
    expect(resetPasswordLayoutMetadata.robots?.follow).toBe(false);
  });

  it('giữ nguyên title/description hiện có', () => {
    expect(resetPasswordLayoutMetadata.title).toBe('Đặt Lại Mật Khẩu - Meowlish');
    expect(resetPasswordLayoutMetadata.description).toBe(
      'Đặt lại mật khẩu tài khoản Meowlish qua link một lần dùng.'
    );
  });
});
