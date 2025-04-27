'use client';

import { useState, useRef } from 'react';
import { Info } from 'lucide-react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export default function InfoSearch() {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  function handleMouseEnter() {
    // Si mantiene el mouse unos ms encima, abrimos
    timerRef.current = setTimeout(() => setOpen(true), 400); // 400ms delay
  }

  function handleMouseLeave() {
    // Si se va antes, cancelamos
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
  }

  function handleClick() {
    // Toggle manual con click
    setOpen(prev => !prev);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='h-6 w-6 p-0 text-muted-foreground hover:text-primary'
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          <Info className='h-4 w-4' />
        </Button>
      </PopoverTrigger>

      <PopoverContent className='max-w-sm text-sm' align='start'>
        <div className='space-y-2'>
          <p className='font-semibold'>¿Cómo usar el buscador?</p>
          <p className='leading-relaxed text-muted-foreground'>
            Es obligatorio seleccionar un <strong>Tipo de Norma*</strong>. Los
            campos
            <strong> Número</strong>, <strong>Texto</strong> (admite operadores
            como
            <strong> AND/OR/NOT</strong>), <strong>Dependencia</strong> y
            <strong> Fechas</strong> son opcionales para refinar la búsqueda.
            También podés ajustar la cantidad de{' '}
            <strong>Resultados por página</strong>.
          </p>
          <p className='text-xs text-muted-foreground'>
            Para mejores resultados, combiná <strong>texto</strong> con{' '}
            <strong>fechas</strong> o <strong>dependencias</strong>.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
