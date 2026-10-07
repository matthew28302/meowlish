import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Luyện Nghe Tiếng Anh Phản Xạ - Meowlish',
  description: 'Luyện nghe tiếng Anh phản xạ với các tình huống giao tiếp thực tế, bài nghe theo chủ đề IT và đời sống.',
};

export default function listeningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}