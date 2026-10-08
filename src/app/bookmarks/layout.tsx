import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sổ Tay Từ Vựng Đã Lưu - Meowlish',
  description: 'Quản lý từ vựng bạn đã lưu từ Bách Khoa Toàn Thư: tra cứu, phát âm, ghi chú và xóa từ khỏi sổ tay.',

};

export default function bookmarksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}