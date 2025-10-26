import { FoldersProvider } from '@/features/folders/context/folders-context';

export default function CarpetasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FoldersProvider>{children}</FoldersProvider>;
}
