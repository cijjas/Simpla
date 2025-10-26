import { BookmarksProvider } from '@/features/bookmark';
import { NormasProvider } from '@/features/normas';

export default function NormasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BookmarksProvider>
      <NormasProvider>
        {children}
      </NormasProvider>
    </BookmarksProvider>
  );
}