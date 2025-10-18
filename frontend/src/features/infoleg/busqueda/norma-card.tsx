'use client';

import Link from 'next/link';
import { CalendarIcon, FileTextIcon, Bookmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDatePretty } from '@/lib/utils';

import { JSX } from 'react';
import { useBookmarkToggle } from '@/features/bookmark';
import { NormaItem } from '../utils/types';

export default function NormaCard({
  norma,
}: {
  norma: NormaItem;
}): JSX.Element {
  // Check if this norma is bookmarked
  const { isBookmarked, toggleBookmark } = useBookmarkToggle(norma.id);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleBookmark();
  };

  return (
    <Link
      href={`/norma/${norma.id}`}
      className='group block h-full rounded-xl border bg-card transition hover:bg-accent hover:shadow-md relative'
    >
      {/* Bookmark indicator (only show if bookmarked) */}
      {isBookmarked && (
        <div className='absolute top-4.5 right-3 z-10'>
          <Bookmark
            className='h-5 w-5 text-yellow-400 fill-yellow-400 cursor-pointer drop-shadow-sm'
            onClick={handleBookmarkClick}
          />
        </div>
      )}

      {/* rest of your card content below */}
      <Card className='flex h-full flex-col border-none bg-transparent p-0 shadow-none'>
        <CardContent className='flex grow flex-col gap-3 p-4'>
          {/* ---------- TOP SECTION : title & summary ---------- */}
          <div className='flex flex-col gap-2'>
            <h3
              className={`text-base font-extrabold font-serif leading-snug line-clamp-2 ${isBookmarked ? 'pr-8' : ''}`}
            >
              {norma.tituloSumarioFormateado ||
                norma.tituloResumidoFormateado ||
                'Sin título'}
            </h3>

            {norma.textoResumidoFormateado && (
              <div className='relative h-24 overflow-hidden'>
                <p className='text-sm text-muted-foreground line-clamp-5'>
                  {norma.textoResumidoFormateado}
                </p>
                {/* fade */}
                <div className='pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card via-card/80 to-transparent group-hover:opacity-0 transition-opacity' />
              </div>
            )}
          </div>

          {/* visual divider */}
          <hr className='border-muted/90' />

          {/* ---------- META SECTION ---------- */}
          <div className='mt-auto flex flex-col gap-3 pt-4 text-xs text-muted-foreground leading-tight'>
            {/* Top line with tipo + número */}
            <div className='flex flex-wrap items-center justify-between w-full'>
              <div className='font-serif font-bold text-base leading-tight text-foreground'>
                {norma.nombreNorma}
              </div>
              <Badge className='font-semibold rounded-full' variant='default'>
                {norma.jurisdiccion}
              </Badge>
            </div>

            {/* Dependencia */}
            {norma.idNormas?.[0]?.dependencia && (
              <div className='whitespace-normal break-words'>
                {norma.idNormas[0].dependencia}
              </div>
            )}

            {/* Bottom info line */}
            <div className='flex flex-wrap items-center justify-between w-full pt-2 text-muted-foreground text-xs'>
              {norma.publicacion && (
                <div className='flex items-center gap-1'>
                  <CalendarIcon className='h-4 w-4' />
                  <span>{formatDatePretty(norma.publicacion)}</span>
                </div>
              )}
              {norma.nroBoletin && (
                <div className='flex items-center gap-1'>
                  <FileTextIcon className='h-4 w-4' />
                  <span>
                    B.O.R.A. {norma.nroBoletin} • pág. {norma.pagBoletin}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
