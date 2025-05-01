'use client';

import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function InfoSearch() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className='h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer' />
        </TooltipTrigger>
        <TooltipContent className='max-w-sm text-sm' align='end'>
          <div className='space-y-2'>
            <p className='font-semibold'>¿Cómo usar el buscador?</p>
            <p className='leading-relaxed'>
              Comenzá seleccionando el <strong>Tipo de Norma*</strong>, que es
              obligatorio. Luego podés completar los campos opcionales para
              refinar la búsqueda:
              <br />- <strong>Número:</strong> si conocés el número exacto.
              <br />- <strong>Texto:</strong> buscá por contenido, usando
              operadores lógicos como <strong>AND</strong>, <strong>OR</strong>,{' '}
              <strong>NOT</strong> o agrupaciones como{' '}
              <code>(educación AND salud) OR justicia</code>.
              <br />- <strong>Dependencia:</strong> filtrá por organismo que
              emitió la norma.
              <br />- <strong>Fechas:</strong> acotás el rango de publicación.
            </p>
            <p className='text-xs text-muted-foreground'>
              Recomendamos combinar <strong>Texto</strong> con{' '}
              <strong>Fechas</strong> o <strong>Dependencia</strong> para
              mejores resultados.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
