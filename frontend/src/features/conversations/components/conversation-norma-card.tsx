'use client';

import Link from 'next/link';
import { CalendarIcon, FileTextIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDatePretty } from '@/lib/utils';
import { NormaDetalladaResumen } from '@/features/infoleg/utils/types';

interface ConversationNormaCardProps {
  norma: NormaDetalladaResumen;
}

export function ConversationNormaCard({ norma }: ConversationNormaCardProps) {
  return (
    <Link
      href={`/norma/${norma.id}`}
      className='group block h-full rounded-lg border bg-card transition hover:bg-accent hover:shadow-md no-underline'
    >
      <Card className='flex h-full flex-col border-none bg-transparent p-0 shadow-none'>
        <CardContent className='flex grow flex-col gap-2 p-3'>
          {/* Title */}
          <h4 className='text-sm font-bold font-serif leading-snug line-clamp-2'>
            {norma.tituloSumarioFormateado ||
              norma.tituloResumidoFormateado ||
              'Sin título'}
          </h4>

          {/* Summary (shortened for chat context) */}
          {norma.textoResumidoFormateado && (
            <div className='relative h-16 overflow-hidden'>
              <p className='text-xs text-muted-foreground line-clamp-3'>
                {norma.textoResumidoFormateado}
              </p>
              <div className='pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-card via-card/80 to-transparent group-hover:opacity-0 transition-opacity' />
            </div>
          )}

          {/* Meta info */}
          <div className='mt-auto flex flex-col gap-2 text-xs text-muted-foreground'>
            {/* Type and jurisdiction */}
            <div className='flex items-center justify-between'>
              <div className='font-serif font-bold text-sm text-foreground'>
                {norma.nombreNorma}
              </div>
              <Badge className='text-xs rounded-full' variant='outline'>
                {norma.jurisdiccion}
              </Badge>
            </div>

            {/* Publication date */}
            {norma.publicacion && (
              <div className='flex items-center gap-1'>
                <CalendarIcon className='h-3 w-3' />
                <span className='text-xs'>{formatDatePretty(norma.publicacion)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
