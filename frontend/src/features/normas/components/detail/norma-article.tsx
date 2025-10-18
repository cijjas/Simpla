import DOMPurify from 'isomorphic-dompurify';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Article as NormaArticle } from '@/features/normas/api/normas-api';

interface NormaArticleProps {
  article: NormaArticle;
  level?: number;
  isExpanded: boolean;
  onToggle: (articleId: number) => void;
}

export function NormaArticleComponent({
  article,
  level = 0,
  isExpanded,
  onToggle,
}: NormaArticleProps) {
  const hasChildren = article.child_articles.length > 0;
  const cleanBody = DOMPurify.sanitize(article.body);
  const indent = level * 24;

  return (
    <div className='relative'>
      {level > 0 && (
        <div
          className='absolute top-0 bottom-0 w-px bg-border'
          style={{ left: `${indent - 12}px` }}
        />
      )}

      <div
        className='flex items-start gap-3 py-2'
        style={{ paddingLeft: `${indent}px` }}
      >
        <div className='flex-shrink-0 w-6 h-6 flex items-center justify-center mt-0.5'>
          {hasChildren ? (
            <button
              onClick={() => onToggle(article.id)}
              className='hover:bg-accent rounded transition-colors p-0.5'
            >
              {isExpanded ? (
                <ChevronDown className='h-4 w-4 text-muted-foreground' />
              ) : (
                <ChevronRight className='h-4 w-4 text-muted-foreground' />
              )}
            </button>
          ) : (
            <div className='w-1.5 h-1.5 rounded-full bg-border' />
          )}
        </div>

        <div className='flex-1 min-w-0'>
          {article.ordinal && (
            <span className='font-serif font-semibold text-base text-foreground mr-2'>
              Artículo {article.ordinal}
            </span>
          )}
          <div
            className='text-[15px] text-muted-foreground leading-[1.8] tracking-wide prose prose-sm max-w-none norma-html text-justify'
            dangerouslySetInnerHTML={{ __html: cleanBody }}
          />
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className='mt-1'>
          {article.child_articles.map((child: NormaArticle) => (
            <NormaArticleComponent
              key={child.id}
              article={child}
              level={level + 1}
              isExpanded={isExpanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
