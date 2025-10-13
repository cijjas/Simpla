'use client';

import Link from 'next/link';
import { CalendarIcon, FileTextIcon, Bookmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDatePretty } from '@/lib/utils';
import { useFavoriteToggle } from '@/features/favorites';
import type { NormaSummary } from '../api/normas-api';

interface NormaCardProps {
  norma: NormaSummary;
}

export function NormaCard({ norma }: NormaCardProps) {
  // Check if this norma is favorited
  const { isFavorite, toggleFavorite } = useFavoriteToggle(norma.infoleg_id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleFavorite();
  };

  // Generate display name from tipo_norma
  const getNombreNorma = () => {
    if (norma.tipo_norma) {
      return norma.tipo_norma.toUpperCase();
    }
    return 'NORMA';
  };

  return (
    <Link
      href={`/normas/${norma.infoleg_id}`}
      className='group block h-full rounded-xl border bg-card transition hover:bg-accent hover:shadow-md relative'
    >
      {/* Favorite bookmark (only show if favorited) */}
      {isFavorite && (
        <div className='absolute top-4.5 right-3 z-10'>
          <Bookmark 
            className='h-6 w-6 text-primary fill-primary dark:text-foreground dark:fill-foreground cursor-pointer drop-shadow-sm' 
            onClick={handleFavoriteClick}
          />
        </div>
      )}

      {/* rest of your card content below */}
      <Card className='flex h-full flex-col border-none bg-transparent p-0 shadow-none'>
        <CardContent className='flex flex-col h-full p-4'>
          {/* ---------- TOP SECTION : title & subtitle (fixed height) ---------- */}
          <div className='flex flex-col gap-2 flex-shrink-0'>
            {/* Title - fixed 2 lines */}
            <h3 className={`text-base font-extrabold font-serif leading-snug line-clamp-2 h-[2.8rem] ${isFavorite ? 'pr-8' : ''}`}>
              {norma.titulo_resumido || 'Sin título'}
            </h3>

            {/* Subtitle - fixed height regardless of content */}
            <div className='relative h-24 overflow-hidden flex-shrink-0'>
              {norma.texto_resumido && (
                <>
                  <p className='text-sm text-muted-foreground line-clamp-5'>
                    {norma.texto_resumido}
                  </p>
                  {/* fade */}
                  <div className='pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card via-card/80 to-transparent group-hover:opacity-0 transition-opacity' />
                </>
              )}
            </div>
          </div>

          {/* visual divider - always at same position */}
          <hr className='border-border/40 flex-shrink-0 my-3' />

          {/* ---------- META SECTION (pushed to fill remaining space) ---------- */}
          <div className='flex flex-col gap-3 text-xs text-muted-foreground leading-tight flex-grow'>
            {/* Top line with tipo + número */}
            <div className='flex flex-wrap items-center justify-between w-full'>
              <div className='font-serif font-bold text-base leading-tight text-foreground'>
                {getNombreNorma()}
              </div>
              {norma.jurisdiccion && (
                <Badge className='font-semibold rounded-full' variant='default'>
                  {norma.jurisdiccion}
                </Badge>
              )}
            </div>

            {/* Clase norma if available */}
            {norma.clase_norma && norma.clase_norma.trim() && (
              <div className='whitespace-normal break-words'>
                {norma.clase_norma}
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
              {norma.nro_boletin && (
                <div className='flex items-center gap-1'>
                  <FileTextIcon className='h-4 w-4' />
                  <span>
                    B.O.R.A. {norma.nro_boletin} • pág. {norma.pag_boletin}
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


