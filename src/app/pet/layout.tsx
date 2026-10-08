import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thú Cưng PixelFarm 2.5D - Meowlish',
  description: 'Nuôi thú cưng pixel 2.5D, cho ăn, chơi đùa, thay đổi cảnh quan, sắm đồ thời trang, đấu PVP và đua xe kiếm Coins.',

};

export default function petLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}