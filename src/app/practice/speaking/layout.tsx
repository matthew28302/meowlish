import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Luyện Nói AI Voice & Phát Âm IPA - Meowlish',
  description: 'Luyện nói tiếng Anh với AI Voice: chấm điểm phát âm chuẩn từng âm tiết IPA, phát hiện lỗi sai và luyện phản xạ giao tiếp.',
};

export default function speakingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}