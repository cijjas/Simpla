'use client';

import Link from 'next/link';
import { CalendarIcon, FileTextIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDatePretty } from '@/lib/utils';

import { Copy, CheckIcon } from 'lucide-react';
import { JSX, useState } from 'react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { NormaItem } from '../utils/types';

export default function NormaListItem({
  norma,
}: {
  norma: NormaItem;
}): JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const { nombreNorma: _nombreNorma, esNumerada: _esNumerada, ...cleanNorma } = norma;
    const rawJson = JSON.stringify(cleanNorma, null, 2);
    navigator.clipboard
      .writeText(rawJson)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Error copiando al portapapeles:', err);
      });
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
      {/* Copy button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type='button'
            variant='outline'
            size='icon'
            onClick={e => {
              e.preventDefault();
              handleCopy();
            }}
            className='absolute top-3 right-3 z-10 h-8 w-8 border border-white/30 bg-white/10 backdrop-blur-xs shadow-sm'
          >
            {copied ? (
              <CheckIcon className='h-4 w-4 text-green-600' />
            ) : (
              <Copy className='h-4 w-4' />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side='top' align='center'>
          Copiar JSON
        </TooltipContent>
      </Tooltip>

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
