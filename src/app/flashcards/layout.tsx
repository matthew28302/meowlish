import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flashcard 3D Spaced Repetition - Meowlish',
  description: 'Lật thẻ ghi nhớ từ vựng với thuật toán lặp lại ngắt quãng (SRS), hệ thống 3D và sổ tay từ vựng cá nhân.',

};

export default function flashcardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}