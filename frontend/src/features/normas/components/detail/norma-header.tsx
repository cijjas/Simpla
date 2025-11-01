'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { formatDateSlash } from '@/lib/utils';
import { NormaSummary } from '@/features/normas/api/normas-api';
import { getNombreNorma } from '@/features/normas/utils/norma-utils';
import { NormaRelatedItem } from './norma-list-item';

interface NormaHeaderProps {
  norma: {
    id: number;
    infoleg_id: number;
    titulo_sumario: string | null;
    titulo_resumido: string | null; 
    tipo_norma: string | null;
    clase_norma: string | null;
    estado: string | null;
    publicacion: string | null;
    nro_boletin: string | null;
    pag_boletin: string | null;
    sancion: string | null;
    jurisdiccion: string | null;
    observaciones: string | null;
    texto_norma: string | null;
    texto_resumido: string | null;
    referencia?: {
      id: number;
      norma_id: number;
      numero: number;
      dependencia?: string;
      rama_digesto?: string;
      created_at: string;
    };
  };
  open: string[];
  onOpenChange: (value: string[]) => void;
  modifica: NormaSummary[] | null;
  modificadaPor: NormaSummary[] | null;
  modificaProgress: number;
  modificadaProgress: number;
  modificaCount: number;
  modificadaCount: number;
}

export function NormaHeader({
  norma,
  open,
  onOpenChange,
  modifica,
  modificadaPor,
  modificaProgress,
  modificadaProgress,
  modificaCount,
  modificadaCount,
}: NormaHeaderProps) {
  const hasBothTitles = norma.titulo_resumido && norma.titulo_sumario;

  // Helper to create filter URL for publication date
  const createPublicacionFilterUrl = (date: string) => {
    const params = new URLSearchParams();
    params.set('publicacion_desde', date);
    params.set('publicacion_hasta', date);
    return `/normas?${params.toString()}`;
  };

  return (
    <header className='space-y-6'>
      {/* Norma Identifier - Prominent display */}
      <div className='flex items-center gap-3 flex-wrap '>
        <div className='text-lg font-bold font-serif text-muted-foreground'>
          {getNombreNorma(norma)}
        </div>
        {norma.estado?.trim() && (
          <Badge variant='outline' className='font-medium'>
            {norma.estado}
          </Badge>
        )}
        
        {/* Dependencia on same row with spacing */}
        {norma.referencia?.dependencia && (
          <>
            <div className='h-4 border-l border-border/30 mx-1' />
            <div className='text-xs text-muted-foreground italic truncate flex-1 min-w-0'>
              {norma.referencia.dependencia}
            </div>
          </>
        )}
      </div>

      {/* Main Title(s) */}
      <div className='space-y-3'>
        <h1 className='text-3xl font-bold font-serif leading-tight break-words'>
          {norma.titulo_resumido || norma.titulo_sumario || 'Sin título'}
        </h1>
        
        {/* Show titulo_sumario as subtitle when titulo_resumido exists */}
        {hasBothTitles && (
          <h2 className='text-xl font-medium text-muted-foreground leading-snug break-words'>
            {norma.titulo_sumario}
          </h2>
        )}
      </div>

      {/* Metadata badges and info */}
      <div className='flex flex-wrap items-center gap-4 text-sm text-muted-foreground'>
        {norma.clase_norma?.trim() && (
          <Badge variant='secondary'>{norma.clase_norma}</Badge>
        )}
        {norma.jurisdiccion && (
          <Badge variant='default'>{norma.jurisdiccion}</Badge>
        )}

        <div className='h-4 border-l border-border/30 mx-1' />

        {norma.publicacion && (
          <span>
            Publicada el{' '}
            <Link
              href={createPublicacionFilterUrl(norma.publicacion)}
              className='font-medium hover:underline hover:text-foreground transition-colors'
            >
              {formatDateSlash(norma.publicacion)}
            </Link>
            {norma.nro_boletin && (
              <>
                {' '}en el Boletín Oficial N°&nbsp;{norma.nro_boletin}
                {norma.pag_boletin && `, pág. ${norma.pag_boletin}`}
              </>
            )}
          </span>
        )}

        {/* Show bulletin info separately only if no publicacion date */}
        {!norma.publicacion && norma.nro_boletin && (
          <span>
            Boletín Oficial N°&nbsp;{norma.nro_boletin}
            {norma.pag_boletin && `, pág. ${norma.pag_boletin}`}
          </span>
        )}

        {norma.sancion && (
          <>
            <div className='h-4 border-l border-border/30 mx-1' />
            <span>Sancionada el {formatDateSlash(norma.sancion)}</span>
          </>
        )}
      </div>

      {!!(modificaCount || modificadaCount) && (
        <Accordion
          type='multiple'
          className='w-full'
          value={open}
          onValueChange={onOpenChange}
        >
          {modificaCount > 0 && (
            <AccordionItem value='modifica'>
              <AccordionTrigger>Modifica ({modificaCount})</AccordionTrigger>
              <AccordionContent>
                {modifica === null ? (
                  <Progress value={modificaProgress} />
                ) : (
                  <ul className='flex flex-col gap-2'>
                    {modifica.map(n => (
                      <NormaRelatedItem key={n.id} data={n} />
                    ))}
                  </ul>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {modificadaCount > 0 && (
            <AccordionItem value='modificada'>
              <AccordionTrigger>
                Modificada por ({modificadaCount})
              </AccordionTrigger>
              <AccordionContent>
                {modificadaPor === null ? (
                  <Progress value={modificadaProgress} />
                ) : (
                  <ul className='flex flex-col gap-2'>
                    {modificadaPor.map(n => (
                      <NormaRelatedItem key={n.id} data={n} secondary />
                    ))}
                  </ul>
                )}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      )}

      {norma.texto_resumido && (
        <blockquote className='border-l-4 border-primary pl-4 italic text-muted-foreground text-justify'>
          {norma.texto_resumido}
        </blockquote>
      )}
    </header>
  );
}
