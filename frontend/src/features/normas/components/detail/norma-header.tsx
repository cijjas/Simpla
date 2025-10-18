'use client';

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
import { NormaListItem } from './norma-list-item';

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
  return (
    <header className='space-y-6'>
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <h1 className='text-3xl font-bold font-serif leading-tight break-words'>
          {norma.titulo_resumido || norma.titulo_sumario || 'Sin título'}
        </h1>
      </div>

      <div className='flex flex-wrap items-center gap-4 text-sm text-muted-foreground'>
        {norma.tipo_norma?.trim() && <Badge>{norma.tipo_norma}</Badge>}
        {norma.clase_norma?.trim() && (
          <Badge variant='secondary'>{norma.clase_norma}</Badge>
        )}
        {norma.estado?.trim() && (
          <Badge variant='outline'>{norma.estado}</Badge>
        )}

        <div className='h-4 border-l border-border/30 mx-1' />

        {norma.publicacion && (
          <span>Publicación: {formatDateSlash(norma.publicacion)}</span>
        )}

        {norma.nro_boletin && (
          <span>
            Boletín Oficial&nbsp;{norma.nro_boletin}
            {norma.pag_boletin && ` • pág ${norma.pag_boletin}`}
          </span>
        )}

        <div className='h-4 border-l border-border/30 mx-1' />

        {norma.sancion && (
          <span>Sanción: {formatDateSlash(norma.sancion)}</span>
        )}
        {norma.jurisdiccion && <span>Jurisdicción: {norma.jurisdiccion}</span>}
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
                      <NormaListItem key={n.id} data={n} />
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
                      <NormaListItem key={n.id} data={n} secondary />
                    ))}
                  </ul>
                )}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      )}

      {norma.observaciones && (
        <blockquote className='border-l-4 border-primary pl-4 italic text-muted-foreground text-justify'>
          {norma.observaciones}
        </blockquote>
      )}
    </header>
  );
}
