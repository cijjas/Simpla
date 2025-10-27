import { sanitizeHtml } from '@/lib/sanitize-html';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Division } from '@/features/normas/api/normas-api';
import { NormaArticleComponent } from './norma-article';

interface NormaDivisionProps {
  division: Division;
  level?: number;
  isExpanded: boolean;
  onToggleDivision: (divisionId: number) => void;
  expandedArticles: Set<number>;
  onToggleArticle: (articleId: number) => void;
  divisionRef?: (el: HTMLDivElement | null) => void;
}

export function NormaDivisionComponent({
  division,
  level = 0,
  isExpanded,
  onToggleDivision,
  expandedArticles,
  onToggleArticle,
  divisionRef,
}: NormaDivisionProps) {
  const hasContent =
    division.articles.length > 0 || division.child_divisions.length > 0;
  const cleanBody = division.body ? sanitizeHtml(division.body) : null;

  const sizeClasses = {
    0: {
      heading: 'text-2xl',
      ordinal: 'text-xl',
      spacing: 'mb-8',
      topPadding: 'pt-6',
      borderWeight: 'border-b',
      borderColor: 'border-border/40',
    },
    1: {
      heading: 'text-xl',
      ordinal: 'text-lg',
      spacing: 'mb-6',
      topPadding: 'pt-4',
      borderWeight: 'border-b',
      borderColor: 'border-border/30',
    },
    2: {
      heading: 'text-lg',
      ordinal: 'text-base',
      spacing: 'mb-4',
      topPadding: 'pt-3',
      borderWeight: 'border-b',
      borderColor: 'border-border/20',
    },
  };

  const sizes = sizeClasses[Math.min(level, 2) as keyof typeof sizeClasses];
  const indent = level * 24;

  return (
    <div
      className={sizes.spacing}
      ref={divisionRef}
      id={`division-${division.id}`}
    >
      <div
        className={cn('pb-3', sizes.borderWeight, sizes.borderColor)}
        style={{ marginLeft: `${indent}px` }}
      >
        <div className='flex items-start gap-3'>
          <div className='flex-shrink-0 w-6 h-6 flex items-center justify-center mt-1'>
            {hasContent ? (
              <button
                onClick={() => onToggleDivision(division.id)}
                className='hover:bg-accent rounded transition-colors p-0.5'
              >
                {isExpanded ? (
                  <ChevronDown className='h-5 w-5 text-muted-foreground' />
                ) : (
                  <ChevronRight className='h-5 w-5 text-muted-foreground' />
                )}
              </button>
            ) : (
              <div className='w-2 h-2 rounded-full bg-border' />
            )}
          </div>

          <div className='flex-1 min-w-0'>
            <div className='flex items-baseline gap-2 flex-wrap mb-1'>
              {division.ordinal && (
                <span
                  className={cn(
                    'font-serif font-bold',
                    sizes.ordinal,
                    'text-foreground',
                  )}
                >
                  {division.ordinal}
                </span>
              )}
              <h3
                className={cn(
                  'font-serif font-semibold',
                  sizes.heading,
                  'text-foreground',
                )}
              >
                {division.name || division.title || 'División sin título'}
              </h3>
            </div>

            {cleanBody && (
              <div
                className='mt-2 text-[15px] text-muted-foreground leading-[1.8] tracking-wide prose prose-sm max-w-none norma-html text-justify'
                dangerouslySetInnerHTML={{ __html: cleanBody }}
              />
            )}
          </div>
        </div>
      </div>

      {hasContent && isExpanded && (
        <div className='mt-4' style={{ marginLeft: `${indent}px` }}>
          {division.articles.length > 0 && (
            <div className='mb-6'>
              {division.articles.map(article => (
                <NormaArticleComponent
                  key={article.id}
                  article={article}
                  level={0}
                  isExpanded={expandedArticles.has(article.id)}
                  onToggle={onToggleArticle}
                />
              ))}
            </div>
          )}

          {division.child_divisions.length > 0 && (
            <div className='ml-6 border-l border-border pl-6 space-y-6'>
              {division.child_divisions.map(child => (
                <NormaDivisionComponent
                  key={child.id}
                  division={child}
                  level={level + 1}
                  isExpanded={isExpanded}
                  onToggleDivision={onToggleDivision}
                  expandedArticles={expandedArticles}
                  onToggleArticle={onToggleArticle}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
