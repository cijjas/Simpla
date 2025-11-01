'use client';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { Division } from '@/features/normas/api/normas-api';
import { NormaDivisionComponent } from './norma-division';
import { TextSelectionTooltip } from './text-selection-tooltip';
import { useRef } from 'react';

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
  onAskThemis?: (selectedText: string) => void;
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
  onAskThemis,
}: NormaBodyProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasNoContent =
    !divisions.length && !textoNorma && !textoNormaActualizado;
  const hasOriginalText = !!(textoNorma || textoNormaActualizado);

  if (hasNoContent) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[400px] text-center py-8'>
        
        <div className='space-y-3 max-w-md'>
          <h2 className='text-2xl font-serif font-bold tracking-tight'>
            Sin contenido estructurado
          </h2>
          
          <p className='text-sm leading-relaxed text-muted-foreground'>
            Esta norma tiene contenido disponible para mostrar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className='w-full'>
        {showOriginal && hasOriginalText ? (
          <div
            className='prose prose-sm max-w-none text-muted-foreground norma-html font-serif text-justify w-full'
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(
                textoNorma || textoNormaActualizado || '',
              ),
            }}
          />
        ) : (
          <div className='space-y-8 w-full'>
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
      </div>
      {onAskThemis && (
        <TextSelectionTooltip 
          containerRef={containerRef}
          onAskThemis={onAskThemis}
        />
      )}
    </>
  );
}
