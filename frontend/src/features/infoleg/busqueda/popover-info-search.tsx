'use client';

import { Info } from 'lucide-react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';

export default function PopoverInfoSearch() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Info className='h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer' />
      </PopoverTrigger>

      <PopoverContent
        side='bottom'
        align='end'
        className='bg-gray-900 text-white border border-gray-700 shadow-md rounded-md p-4 max-w-sm text-sm'
      >
        <div className='space-y-3'>
          <p className='text-base font-semibold'>¿Cómo usar el buscador?</p>

          <ul className='space-y-1 leading-relaxed list-disc list-inside'>
            <li>
              Seleccioná el <strong>Tipo de Norma</strong> (obligatorio).
            </li>
            <li>
              Usá el campo <strong>Número</strong> si conocés el número exacto
              (ej. <code>70/2023</code>).
            </li>
            <li>
              Si el número contiene año (ej. <code>70/2023</code>), el campo{' '}
              <strong>Año de Sanción</strong> <br />
              se completa automáticamente.
            </li>
            <li>
              El campo <strong>Año de Sanción</strong> permite filtrar por año
              (ej. <code>2023</code> o <code>95</code>).
            </li>
            <li>
              Para normas tipo <strong>Ley</strong>, el año se ignora
              automáticamente.
            </li>
            <li>
              En <strong>Texto</strong> podés usar operadores como{' '}
              <code>AND</code>, <code>OR</code>, <code>NOT</code> y paréntesis.
            </li>
            <li>
              En <strong>Dependencia</strong>, seleccioná el organismo que
              emitió la norma.
            </li>
            <li>
              Filtrá por <strong>Fechas</strong> de publicación para acotar
              resultados.
            </li>
          </ul>

          <p className='text-xs text-gray-400'>
            Tip: Combiná <strong>Texto</strong> con <strong>Fechas</strong> o{' '}
            <strong>Dependencia</strong> para una búsqueda más precisa.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
