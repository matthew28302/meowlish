import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fit Check - Meowlish',
  description: 'Trang kiểm tra thời trang thú cưng nội bộ.',
  robots: { index: false, follow: false },
};

export default function fitcheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}