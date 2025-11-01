'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  ExternalLink,
  Bookmark,
  CalendarIcon,
} from 'lucide-react';
import { formatDatePretty } from '@/lib/utils';
import { useBookmarkToggle } from '@/features/bookmark';
import { getNombreNorma } from '@/features/normas/utils/norma-utils';
import type { NormaSummary } from '@/features/normas/api/normas-api';

interface NormaListItemProps {
  norma: NormaSummary;
  /** If provided, skip the API check and use this value directly (optimization for bookmark page) */
  isBookmarked?: boolean;
  /** Index for alternating row colors */
  index?: number;
}

export function NormaListItem({ norma, isBookmarked: initialBookmarked, index = 0 }: NormaListItemProps) {
  // Use the hook's state for optimistic updates
  const { isBookmarked, toggleBookmark } = useBookmarkToggle(norma.infoleg_id, {
    initialBookmarkedState: initialBookmarked,
  });

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark();
  };

  return (
    <div
      className={`grid grid-cols-12 gap-3 px-6 py-4 transition-all cursor-pointer group ${
        index % 2 === 0 ? 'bg-background' : 'bg-muted/40'
      } hover:bg-accent/50 hover:shadow-sm`}
      onClick={() => (window.location.href = `/normas/${norma.infoleg_id}`)}
    >
      {/* Norma Column - Name & Summary */}
      <div className='col-span-3 flex flex-col gap-1.5 min-w-0'>
        <div className='flex items-center gap-2'>
          <h3 className='font-serif font-bold text-sm text-foreground truncate'>
            {getNombreNorma(norma)}
          </h3>
        </div>
        {norma.titulo_sumario && (
          <span className='text-xs text-muted-foreground line-clamp-2 leading-relaxed'>
            {norma.titulo_sumario}
          </span>
        )}
      </div>

      {/* Description Column - Title & Summary */}
      <div className='col-span-4 flex flex-col gap-1 min-w-0'>
        <h4 className='text-sm font-medium text-foreground line-clamp-1'>
          {norma.titulo_resumido || norma.titulo_sumario || 'Sin título'}
        </h4>
        {norma.texto_resumido && (
          <p className='text-xs text-muted-foreground line-clamp-2 leading-relaxed'>
            {norma.texto_resumido}
          </p>
        )}
      </div>

      {/* Details Column - Jurisdiccion & Clase */}
      <div className='col-span-2 flex flex-col gap-1.5 min-w-0'>
        {norma.jurisdiccion && (
          <Badge variant='default' className='w-fit text-xs font-semibold rounded-full'>
            {norma.jurisdiccion}
          </Badge>
        )}
        {norma.clase_norma && norma.clase_norma.trim() && (
          <span className='text-xs text-muted-foreground line-clamp-2'>
            {norma.clase_norma}
          </span>
        )}
      </div>

      {/* Publication Column - Date & Boletin */}
      <div className='col-span-2 flex flex-col gap-1.5 text-xs text-muted-foreground'>
        {norma.publicacion && (
          <div className='flex items-center gap-1.5'>
            <CalendarIcon className='h-3.5 w-3.5 flex-shrink-0' />
            <span className='truncate'>{formatDatePretty(norma.publicacion)}</span>
          </div>
        )}
        {norma.nro_boletin && (
          <span className='text-xs truncate'>
            B.O. {norma.nro_boletin}
            {norma.pag_boletin && ` • p. ${norma.pag_boletin}`}
          </span>
        )}
      </div>

      {/* Actions Column */}
      <div className='col-span-1 flex items-start justify-end gap-1'>
        <Button
          variant='ghost'
          size='sm'
          className={`h-8 w-8 p-0 transition-opacity ${
            isBookmarked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          onClick={handleBookmarkClick}
        >
          <Bookmark
            className={`h-4 w-4 ${
              isBookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'
            }`}
          />
        </Button>
        <Button
          variant='ghost'
          size='sm'
          className='h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
          onClick={e => {
            e.stopPropagation();
            window.location.href = `/normas/${norma.infoleg_id}`;
          }}
        >
          <Eye className='h-4 w-4 text-muted-foreground' />
        </Button>
        <Button
          variant='ghost'
          size='sm'
          className='h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
          onClick={e => {
            e.stopPropagation();
            window.open(
              `https://www.argentina.gob.ar/normativa/nacional/${norma.infoleg_id}`,
              '_blank',
            );
          }}
        >
          <ExternalLink className='h-4 w-4 text-muted-foreground' />
        </Button>
      </div>
    </div>
  );
}


