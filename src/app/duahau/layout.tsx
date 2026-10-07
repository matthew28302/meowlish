import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản Trị - Meowlish',
  description: 'Trang quản trị nội bộ Meowlish.',
  robots: { index: false, follow: false },
};

export default function duahauLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}