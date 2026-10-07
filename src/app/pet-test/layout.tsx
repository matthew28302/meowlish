import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pet Test - Meowlish',
  description: 'Trang kiểm tra thú cưng nội bộ.',
  robots: { index: false, follow: false },
};

export default function PetTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}