import { FoldersPage } from '@/features/folders/components/folders-page';
import { FoldersProvider } from '@/features/folders/context/folders-context';

export default function CarpetasPage() {
  return (
    <FoldersProvider>
      <FoldersPage />
    </FoldersProvider>
  );
}
