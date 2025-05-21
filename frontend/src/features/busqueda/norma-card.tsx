'use client';

import Link from 'next/link';
import { CalendarIcon, FileTextIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDatePretty } from '@/lib/utils';

import { Copy, CheckIcon } from 'lucide-react';
import { JSX, useState } from 'react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { NormaItem } from '@/lib/infoleg/types';

export default function NormaCard({
  norma,
}: {
  norma: NormaItem;
}): JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const { nombreNorma, esNumerada, ...cleanNorma } = norma;
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

  return (
    <Link
      href={`/norma/${norma.id}`}
      className='group block h-full rounded-xl border bg-card transition hover:bg-accent hover:shadow-md relative'
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

      {/* rest of your card content below */}
      <Card className='flex h-full flex-col border-none bg-transparent p-0 shadow-none'>
        <CardContent className='flex grow flex-col gap-3 p-4'>
          {/* ---------- TOP SECTION : title & summary ---------- */}
          <div className='flex flex-col gap-2'>
            <h3 className='text-base font-extrabold font-serif leading-snug line-clamp-2'>
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
