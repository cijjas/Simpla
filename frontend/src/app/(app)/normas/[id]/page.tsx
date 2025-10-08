import { NormaDetailPage } from '@/features/normas/pages/norma-detail-page';
import { FoldersProvider } from '@/features/folders/context/folders-context';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NormaDetailRoute({ params }: Props) {
  const { id } = await params;
  const infolegId = parseInt(id, 10);

  if (isNaN(infolegId)) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">ID de norma inválido</h3>
          <p className="text-muted-foreground">El ID proporcionado no es válido.</p>
        </div>
      </div>
    );
  }

  return (
    <FoldersProvider>
      <NormaDetailPage infolegId={infolegId} />
    </FoldersProvider>
  );
}
