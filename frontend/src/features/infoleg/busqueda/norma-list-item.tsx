'use client';

import Link from 'next/link';
import { CalendarIcon, FileTextIcon, Bookmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatDatePretty } from '@/lib/utils';

import { JSX } from 'react';
import { useBookmarkToggle } from '@/features/bookmark';
import { NormaItem } from '../utils/types';

export default function NormaListItem({
  norma,
  isBookmarked: initialBookmarked,
}: {
  norma: NormaItem;
  isBookmarked?: boolean;
}): JSX.Element {
  // Use the provided bookmark status (from batch check) or check individually if not provided
  const { isBookmarked, toggleBookmark } = useBookmarkToggle(norma.id, {
    initialBookmarkedState: initialBookmarked,
  });

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleBookmark();
  };

  const tituloVisible =
    norma.tituloResumidoFormateado?.toUpperCase() !== 'DISPOSICIONES'
      ? norma.tituloResumidoFormateado
      : norma.tituloSumarioFormateado || 'Sin título';

  return (
    <Link
      href={`/norma/${norma.id}`}
      className='group relative block rounded-xl border bg-card transition hover:bg-accent hover:shadow-md'
    >
      {/* Bookmark indicator (only show if bookmarked) */}
      {isBookmarked && (
        <div className='absolute top-3 right-3 z-10'>
          <Bookmark
            className='h-5 w-5 text-yellow-400 fill-yellow-400 cursor-pointer drop-shadow-sm'
            onClick={handleBookmarkClick}
          />
        </div>
      )}

      {/* Main layout */}
      <Card className='border-none bg-transparent p-0'>
        <div className='flex flex-col gap-3 p-4'>
          {/* Title */}
          <h3 className='text-base font-extrabold font-serif leading-snug line-clamp-2'>
            {tituloVisible}
          </h3>

          {/* Summary */}
          {norma.textoResumidoFormateado && (
            <div className='relative h-20 overflow-hidden'>
              <p className='text-sm text-muted-foreground line-clamp-4'>
                {norma.textoResumidoFormateado}
              </p>
              <div className='pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-card via-card/80 to-transparent group-hover:opacity-0 transition-opacity' />
            </div>
          )}

          {/* Meta Info */}
          <div className='flex flex-wrap justify-between items-start gap-4 border-t pt-2 text-xs text-muted-foreground leading-tight'>
            {/* Left block */}
            <div className='flex flex-col gap-1 min-w-0'>
              <div className='flex items-center gap-4'>
                <div className='font-serif font-bold text-base leading-tight text-foreground'>
                  {norma.nombreNorma}
                </div>
                {norma.jurisdiccion && (
                  <Badge
                    className='font-semibold rounded-full'
                    variant='default'
                  >
                    {norma.jurisdiccion}
                  </Badge>
                )}
              </div>

              {norma.idNormas?.[0]?.dependencia && (
                <span className='whitespace-normal break-words'>
                  {norma.idNormas[0].dependencia}
                </span>
              )}
            </div>

            {/* Right block */}
            <div className='flex flex-col items-end gap-1 whitespace-nowrap'>
              {norma.publicacion && (
                <div className='flex items-center gap-1'>
                  <CalendarIcon className='h-4 w-4' />
                  <span>{formatDatePretty(norma.publicacion)}</span>
                </div>
              )}
              {norma.nroBoletin && (
                <div className='flex items-center gap-1 text-[11px]'>
                  <FileTextIcon className='h-4 w-4' />
                  <span>
                    Boletín Oficial {norma.nroBoletin} • pág. {norma.pagBoletin}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
