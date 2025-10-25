'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDatePretty } from '@/lib/utils';
import { type NormaSummary } from '@/features/normas';

interface ConversationNormaCardProps {
  norma: NormaSummary;
}

export function ConversationNormaCard({ norma }: ConversationNormaCardProps) {
  return (
    <Link
      href={`/normas/${norma.infoleg_id}`}
      className='group block h-full rounded-lg border bg-card transition hover:bg-accent no-underline'
    >
      <Card className='flex h-full flex-col border-none bg-transparent p-0 shadow-none'>
        <CardContent className='flex grow flex-col gap-2 p-3'>
          {/* Title */}
          <h4 className='text-sm font-bold font-serif leading-snug line-clamp-2'>
            {norma.titulo_resumido || norma.titulo_sumario || 'Sin título'}
          </h4>

          {/* Summary (shortened for chat context) */}
          {norma.texto_resumido && (
            <div className='relative h-16 overflow-hidden'>
              <p className='text-xs text-muted-foreground line-clamp-3'>
                {norma.texto_resumido}
              </p>
            </div>
          )}

          {/* Meta info */}
          <div className='mt-auto flex flex-col gap-2 text-xs text-muted-foreground'>
            {/* Type and jurisdiction */}
            <div className='flex items-center justify-between'>
              <div className='font-serif font-bold text-sm text-foreground'>
                {norma.tipo_norma && norma.referencia?.numero 
                  ? `${norma.tipo_norma} ${norma.referencia.numero}/${norma.sancion?.split('-')[0] || ''}`
                  : norma.tipo_norma || 'NORMA'
                }
              </div>
              
            </div>

            {/* Publication date */}
            {norma.publicacion && (
              <div className='flex items-center gap-1'>
                <span className='text-xs'>{formatDatePretty(norma.publicacion)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
