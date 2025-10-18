import DOMPurify from 'isomorphic-dompurify';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { Division } from '@/features/normas/api/normas-api';
import { NormaDivisionComponent } from './norma-division';

interface NormaBodyProps {
  divisions: Division[];
  textoNorma: string | null;
  textoNormaActualizado: string | null;
  expandedDivisions: Set<number>;
  expandedArticles: Set<number>;
  showOriginal: boolean;
  onToggleDivision: (divisionId: number) => void;
  onToggleArticle: (articleId: number) => void;
  divisionRefs: Map<number, HTMLDivElement>;
}

export function NormaBody({
  divisions,
  textoNorma,
  textoNormaActualizado,
  expandedDivisions,
  expandedArticles,
  showOriginal,
  onToggleDivision,
  onToggleArticle,
  divisionRefs,
}: NormaBodyProps) {
  const hasNoContent =
    !divisions.length && !textoNorma && !textoNormaActualizado;
  const hasOriginalText = !!(textoNorma || textoNormaActualizado);

  if (hasNoContent) {
    return (
      <Alert variant='default' className='my-6'>
        <Info className='h-4 w-4' />
        <AlertTitle>Sin contenido estructurado</AlertTitle>
        <AlertDescription>
          Esta norma no contiene divisiones o artículos estructurados.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      {showOriginal && hasOriginalText ? (
        <div
          className='prose max-w-none text-gray-700 dark:text-slate-300 norma-html font-serif text-justify'
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              textoNorma || textoNormaActualizado || '',
            ),
          }}
        />
      ) : (
        <div className='space-y-8'>
          {divisions.map(division => (
            <NormaDivisionComponent
              key={division.id}
              division={division}
              level={0}
              isExpanded={expandedDivisions.has(division.id)}
              onToggleDivision={onToggleDivision}
              expandedArticles={expandedArticles}
              onToggleArticle={onToggleArticle}
              divisionRef={el => el && divisionRefs.set(division.id, el)}
            />
          ))}
        </div>
      )}
    </>
  );
}
