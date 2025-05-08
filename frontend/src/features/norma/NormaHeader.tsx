'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { NormaActions } from './NormaActions';
import { getNormaDetalladaResumen } from '@/lib/infoleg/api';
import type {
  NormaDetallada,
  NormaDetalladaResumen,
} from '@/lib/infoleg/types';
import { formatDatePretty, formatDateSlash } from '@/lib/utils';

type Props = { norma: NormaDetallada };

export default function NormaHeader({ norma }: Props) {
  const [open, setOpen] = useState<string[]>([]);

  const [modifica, setModifica] = useState<NormaDetalladaResumen[] | null>(
    null,
  );
  const [modificadaPor, setModificadaPor] = useState<
    NormaDetalladaResumen[] | null
  >(null);

  const [modificaProgress, setModificaProgress] = useState(0);
  const [modificadaProgress, setModificadaProgress] = useState(0);

  const fetchList = async (
    ids: number[],
    setter: (d: NormaDetalladaResumen[]) => void,
    setProgress: (p: number) => void,
  ) => {
    if (!ids.length) return;
    const data: NormaDetalladaResumen[] = [];
    for (let i = 0; i < ids.length; i++) {
      const item = await getNormaDetalladaResumen(ids[i]);
      data.push(item);
      setProgress(((i + 1) / ids.length) * 100);
    }
    setter(data);
  };

  useEffect(() => {
    if (
      open.includes('modifica') &&
      modifica === null &&
      norma.listaNormasQueComplementa?.length
    ) {
      fetchList(
        norma.listaNormasQueComplementa,
        setModifica,
        setModificaProgress,
      );
    }
    if (
      open.includes('modificada') &&
      modificadaPor === null &&
      norma.listaNormasQueLaComplementan?.length
    ) {
      fetchList(
        norma.listaNormasQueLaComplementan,
        setModificadaPor,
        setModificadaProgress,
      );
    }
  }, [open, modifica, modificadaPor, norma]);

  const modificaCount = norma.listaNormasQueComplementa?.length ?? 0;
  const modificadaCount = norma.listaNormasQueLaComplementan?.length ?? 0;

  return (
    <header className='space-y-6'>
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <h1 className='text-3xl font-bold font-serif leading-tight break-words'>
          {norma.tituloSumarioFormateado ||
            norma.tituloResumidoFormateado ||
            'Sin título'}
        </h1>
        <NormaActions norma={norma} />
      </div>

      <div className='flex flex-wrap items-center gap-4 text-sm text-muted-foreground'>
        {norma.tipoNorma?.trim() && <Badge>{norma.tipoNorma}</Badge>}
        {norma.claseNorma?.trim() && (
          <Badge variant='secondary'>{norma.claseNorma}</Badge>
        )}
        {norma.nombreNorma && (
          <span className='text-foreground font-serif font-bold'>
            {norma.nombreNorma}
          </span>
        )}

        <div className='h-4 border-l border-border mx-1' />

        {norma.publicacion && (
          <span>Publicación: {formatDateSlash(norma.publicacion)}</span>
        )}

        <span>
          Boletín Oficial&nbsp;{norma.nroBoletin} • pág&nbsp;{norma.pagBoletin}
        </span>

        <div className='h-4 border-l border-border mx-1' />

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
          onValueChange={setOpen}
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

      {norma.textoResumidoFormateado && (
        <blockquote className='border-l-4 border-primary pl-4 italic text-muted-foreground'>
          {norma.textoResumidoFormateado}
        </blockquote>
      )}
    </header>
  );
}

function NormaListItem({
  data,
  secondary = false,
}: {
  data: NormaDetalladaResumen;
  secondary?: boolean;
}) {
  const displayDate = data.publicacion || data.sancion;
  const numero = data.idNormas?.[0]?.numero ?? data.id;

  return (
    <li className='flex flex-wrap items-baseline gap-2'>
      {data.tipoNorma && (
        <Badge variant={secondary ? 'secondary' : 'default'}>
          {data.tipoNorma}
        </Badge>
      )}
      <Link
        href={`/norma/${data.id}`}
        className='font-medium text-foreground font-serif hover:underline'
      >
        N° {numero}
      </Link>
      {data.idNormas?.[0]?.dependencia && (
        <span className='text-xs text-muted-foreground whitespace-nowrap'>
          ({data.idNormas[0].dependencia})
        </span>
      )}
      {displayDate && (
        <span className='text-xs text-muted-foreground whitespace-nowrap'>
          {formatDateSlash(displayDate)}
        </span>
      )}
      <span className='flex-1 truncate text-sm'>
        {data.tituloSumarioFormateado ||
          data.tituloResumidoFormateado ||
          'Sin título'}
      </span>
    </li>
  );
}
