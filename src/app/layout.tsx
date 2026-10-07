import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meowlish - Học Tiếng Anh Giao Tiếp & IT Thực Chiến',
  description: 'Nền tảng học tiếng Anh giao tiếp phản xạ, ngữ pháp Lego trực quan, từ vựng IT, luyện nói Speech AI, bôi đen tra từ và Flashcard Spaced Repetition.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}