'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, Search as SearchIcon } from 'lucide-react';
import { formatDatePretty, cn } from '@/lib/utils';
import InfoSearch from './InfoSearch';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { DateRangePopoverPicker } from '../ui/date-picker';

interface Props {
  onSearch: (params: Record<string, unknown>) => void;
}

export default function SearchForm({ onSearch }: Props) {
  const [tipos, setTipos] = useState<{ detalle: string; route: string }[]>([]);
  const [dependencias, setDependencias] = useState<string[]>([]);

  const [form, setForm] = useState({
    tipo: '',
    numero: '',
    texto: '',
    dependencia: '',
    dateRange: undefined as DateRange | undefined,
    limit: 10,
  });

  useEffect(() => {
    fetch('/api/infoleg/tipos')
      .then(r => r.json())
      .then(setTipos)
      .catch(console.error);

    fetch('/api/infoleg/dependencies')
      .then(r => r.json())
      .then(setDependencias)
      .catch(console.error);
  }, []);

  // ---------------------------------------------
  // handlers
  // ---------------------------------------------
  const updateField = (name: string, value: string) =>
    setForm(f => ({ ...f, [name]: value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.tipo) return;

    const params: Record<string, unknown> = {
      tipo: form.tipo,
      numero: form.numero ? Number(form.numero) : undefined,
      texto: form.texto || undefined,
      dependencia: form.dependencia || undefined,
      publicacion_desde: form.dateRange?.from
        ? format(form.dateRange.from, 'yyyy-MM-dd')
        : undefined,
      publicacion_hasta: form.dateRange?.to
        ? format(form.dateRange.to, 'yyyy-MM-dd')
        : undefined,
      limit: form.limit,
      offset: 1,
    };
    onSearch(params);
  }

  const handleReset = () =>
    setForm({
      tipo: '',
      numero: '',
      texto: '',
      dependencia: '',
      dateRange: undefined,
      limit: 10,
    });

  const textoRef = useRef<HTMLInputElement>(null);

  const insertAtCursor = (text: string) => {
    const input = textoRef.current;
    if (!input) return;

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const before = form.texto.slice(0, start);
    const after = form.texto.slice(end);

    const newTexto = `${before}${text}${after}`;
    setForm(f => ({ ...f, texto: newTexto }));

    // Move cursor after inserted text
    setTimeout(() => {
      input.selectionStart = input.selectionEnd = start + text.length;
      input.focus();
    }, 0);
  };

  return (
    <div className='sticky top-6'>
      <div className='bg-card rounded-2xl border p-6 shadow-sm'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Buscar Legislación</h2>
          <InfoSearch />
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Tipo de Norma */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Tipo de Norma *</label>
            <Select
              value={form.tipo}
              onValueChange={val => updateField('tipo', val)}
              required
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Seleccionar' />
              </SelectTrigger>
              <SelectContent>
                {tipos.map(t => (
                  <SelectItem key={t.route} value={t.route}>
                    {t.detalle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Número */}
          <Input
            name='numero'
            placeholder='Número'
            value={form.numero}
            onChange={e => updateField('numero', e.target.value)}
          />

          {/* Texto */}
          <div className='space-y-1'>
            <label className='text-sm font-medium' htmlFor='texto'>
              Texto
            </label>
            <Input
              id='texto'
              name='texto'
              ref={textoRef}
              placeholder='Ej: "educación AND salud"'
              value={form.texto}
              onChange={e => updateField('texto', e.target.value)}
            />

            {/* Operator buttons */}
            <div className='flex gap-2 pt-1'>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={() => insertAtCursor(' AND ')}
              >
                + AND
              </Button>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={() => insertAtCursor(' OR ')}
              >
                + OR
              </Button>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={() => insertAtCursor(' NOT ')}
              >
                + NOT
              </Button>
            </div>

            <p className='text-xs text-muted-foreground'>
              Usá operadores lógicos para mejorar la búsqueda.
            </p>
          </div>

          {/* Dependencia */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Dependencia</label>
            <Select
              value={form.dependencia}
              onValueChange={val => updateField('dependencia', val)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='--' />
              </SelectTrigger>
              <SelectContent>
                {dependencias.map(dep => (
                  <SelectItem key={dep} value={dep}>
                    {dep}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rango de Fechas */}
          <div className='space-y-1'>
            {/* <DateRangePopoverPicker
              value={form.dateRange}
              onChange={range =>
                setForm(f => ({
                  ...f,
                  dateRange: range?.from
                    ? { from: range.from, to: range.to }
                    : undefined,
                }))
              }
            /> */}

            <label className='text-sm font-medium'>Publicación</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  type='button'
                  className={cn(
                    'w-full justify-between overflow-hidden text-ellipsis whitespace-nowrap',
                    !form.dateRange?.from && 'text-muted-foreground',
                  )}
                >
                  {form.dateRange?.from
                    ? form.dateRange.to
                      ? `${formatDatePretty(
                          form.dateRange.from,
                        )} → ${formatDatePretty(form.dateRange.to)}`
                      : formatDatePretty(form.dateRange.from)
                    : 'Seleccionar rango o fecha'}
                  <CalendarIcon className='ml-2 h-4 w-4 opacity-50' />
                </Button>
              </PopoverTrigger>
              <PopoverContent align='start' className='w-auto p-0'>
                <Calendar
                  mode='range'
                  selected={form.dateRange}
                  onSelect={range => setForm(f => ({ ...f, dateRange: range }))}
                  initialFocus
                />
                <div className='flex justify-end gap-2 border-t p-2'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setForm(f => ({ ...f, dateRange: undefined }))
                    }
                  >
                    Limpiar
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setForm(f => ({
                        ...f,
                        dateRange: {
                          from: f.dateRange?.from || new Date(),
                          to: new Date(),
                        },
                      }))
                    }
                    disabled={!form.dateRange?.from}
                  >
                    Hasta hoy
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Límite */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Resultados por página</label>
            <Select
              value={String(form.limit)}
              onValueChange={val => updateField('limit', val)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map(n => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botones */}
          <div className='flex gap-2'>
            <Button type='button' variant='outline' onClick={handleReset}>
              Limpiar
            </Button>
            <Button type='submit' className='flex-1'>
              <SearchIcon className='mr-2 h-4 w-4' /> Buscar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
