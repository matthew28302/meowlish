import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/AppShell';
import HighlightTooltip from '@/components/HighlightTooltip';
import ClickEffect from '@/components/ClickEffect';
import AccessTracker from '@/components/AccessTracker';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// L7b — viewport qua export chuẩn Next (chỉ hỗ trợ Server Component, root layout
// là Server Component). Giữ nguyên giá trị cũ: maximum-scale=5, viewport-fit=cover.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

// ===== M11 — JSON-LD Structured Data (schema.org) =====
// Nội dung hoàn toàn tĩnh do ta soạn (không phải user input) nên script
// ld+json với dangerouslySetInnerHTML là an toàn & đúng chuẩn (Next docs).
// Host non-www — khớp metadataBase + Google Search Console property `meowlish.io.vn`.
const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Meowlish',
  url: 'https://meowlish.io.vn',
  inLanguage: 'vi-VN',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://meowlish.io.vn/encyclopedia?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Meowlish',
  url: 'https://meowlish.io.vn',
  logo: 'https://meowlish.io.vn/meo.png',
};

// `.replace(/</g, '\\u003c')` — scrub theo khuyến nghị docs Next.js chống XSS.
const SITE_JSON_LD_HTML = JSON.stringify([WEBSITE_JSON_LD, ORGANIZATION_JSON_LD]).replace(
  /</g,
  '\\u003c'
);

export const metadata: Metadata = {
  // Canonical là non-www — khớp Google Search Console property `meowlish.io.vn`.
  // www 308-redirect về non-www (cấu hình ở Vercel → Settings → Domains).
  // metadataBase để Next giải mọi URL tương đối (OG, canonical) về đúng host.
  metadataBase: new URL('https://meowlish.io.vn'),
  title: 'Meowlish - Học Tiếng Anh Giao Tiếp & IT Thực Chiến',
  description: 'Nền tảng học tiếng Anh giao tiếp phản xạ, ngữ pháp Lego trực quan, từ vựng IT, luyện nói Speech AI, bôi đen tra từ và Flashcard Spaced Repetition.',
  // M11 — OG image meo.png 176x144 (kích thước thật trong public/, không vuông
  // nên không khai chuẩn 1200x630; Twitter Card dùng 'summary' tương ứng).
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: '/',
    siteName: 'Meowlish',
    title: 'Meowlish - Học Tiếng Anh Giao Tiếp & IT Thực Chiến',
    description: 'Nền tảng học tiếng Anh giao tiếp phản xạ, ngữ pháp Lego trực quan, từ vựng IT, luyện nói Speech AI, bôi đen tra từ và Flashcard Spaced Repetition.',
    images: [{ url: '/meo.png', width: 176, height: 144, alt: 'Meowlish' }],
  },
  twitter: {
    card: 'summary',
    title: 'Meowlish - Học Tiếng Anh Giao Tiếp & IT Thực Chiến',
    description: 'Nền tảng học tiếng Anh giao tiếp phản xạ, ngữ pháp Lego trực quan, từ vựng IT, luyện nói Speech AI, bôi đen tra từ và Flashcard Spaced Repetition.',
    images: ['/meo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-dvh antialiased overflow-hidden`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('meowlish_theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}document.documentElement.style.colorScheme=t}catch(e){}})();`,
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: SITE_JSON_LD_HTML }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Charis+SIL:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-dvh overflow-hidden bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <AppShell>{children}</AppShell>
        {/* Global floating highlight & quick translate tooltip */}
        <HighlightTooltip />
        {/* Interactive Click Effect & Sparkles */}
        <ClickEffect />
        {/* Global Access & Page Visit Tracker for Admin System Logs */}
        <AccessTracker />
      </body>
    </html>
  );
}
