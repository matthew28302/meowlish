import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/AppShell';
import HighlightTooltip from '@/components/HighlightTooltip';
import ClickEffect from '@/components/ClickEffect';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Meowlish - Học Tiếng Anh Giao Tiếp & IT Thực Chiến',
  description: 'Nền tảng học tiếng Anh giao tiếp phản xạ, ngữ pháp Lego trực quan, từ vựng IT, luyện nói Speech AI, bôi đen tra từ và Flashcard Spaced Repetition.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} min-h-dvh lg:h-dvh antialiased lg:overflow-hidden`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Charis+SIL:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#f8fafc] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <AppShell>{children}</AppShell>
        {/* Global floating highlight & quick translate tooltip */}
        <HighlightTooltip />
        {/* Interactive Click Effect & Sparkles */}
        <ClickEffect />
      </body>
    </html>
  );
}
