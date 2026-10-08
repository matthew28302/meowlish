import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bách Khoa Toàn Thư Tiếng Anh 26.500+ Từ - Meowlish',
  description: 'Tra cứu từ vựng tiếng Anh với phiên âm IPA, giải nghĩa chi tiết, collocations, ví dụ tình huống IT và đời sống. Lưu từ vào sổ tay cá nhân.',

};

export default function encyclopediaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}