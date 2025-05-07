'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  TIPOS_HARDCODEADOS,
  DEPENDENCIAS_HARDCODEADAS,
} from '@/lib/infoleg/constants';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown, SearchIcon, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import InfoSearch from './InfoSearch';
import { DateRangePicker } from '@/components/ui/date-range-picker';

interface Props {
  onSearch: (params: Record<string, unknown>) => void;
  loading?: boolean;
  initialValues?: Record<string, string>;
  onReset?: () => void;
}

// --------------------------------------------------
// Zod schema & types
// --------------------------------------------------
const currentYear = new Date().getFullYear();

const schema = z.object({
  tipo: z.string().min(1, 'Seleccioná un tipo de norma'),
  numero: z
    .string()
    .optional()
    .refine(val => !val || /^[0-9]+(\/[0-9]{1,4})?$/.test(val.trim()), {
      message: 'Debe ser un número sin comas o con formato tipo 70/2023',
    }),
  texto: z.string().optional(),
  dependencia: z.string().optional(),
  dateRange: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .optional()
    .refine(
      range =>
        !range ||
        !range.from ||
        !range.to ||
        (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24) <=
          1461,
      {
        message: 'El rango de fechas no puede ser mayor a 4 años',
      },
    ),
  sancion: z
    .string()
    .optional()
    .refine(
      val => {
        if (!val || val.trim() === '') return true;

        /* four‑digit year ----------------------------------------------- */
        if (/^\d{4}$/.test(val)) {
          const n = +val;
          return n >= 1810 && n <= currentYear;
        }

        /* two‑digit year ------------------------------------------------- */
        if (/^\d{2}$/.test(val)) {
          const n = +val;
          const possibilities = [1800 + n, 1900 + n, 2000 + n];
          return possibilities.some(y => y >= 1810 && y <= currentYear);
        }

        return false;
      },
      {
        message: 'Ingresá 2 o 4 dígitos (1810-presente)',
      },
    ),
});

type FormValues = z.infer<typeof schema>;

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day); // JS months are 0-based
}

export default function SearchForm({
  onSearch,
  loading,
  initialValues,
  onReset,
}: Props) {
  // ------------------------------------------------------------------
  // Local state for remote options (tipos, dependencias)
  // ------------------------------------------------------------------
  const [tipos, setTipos] = useState(TIPOS_HARDCODEADOS);
  const [dependencias, setDependencias] = useState(DEPENDENCIAS_HARDCODEADAS);
  const [openDep, setOpenDep] = useState(false);

  useEffect(() => {
    // Cargamos dinámicamente si la API responde algo diferente
    fetch('/api/infoleg/tipos')
      .then(r => r.json())
      .then(fetched => {
        if (Array.isArray(fetched) && fetched.length) setTipos(fetched);
      })
      .catch(() => {});

    fetch('/api/infoleg/dependencias')
      .then(r => r.json())
      .then(fetched => {
        if (Array.isArray(fetched) && fetched.length) setDependencias(fetched);
      })
      .catch(() => {});
  }, []);

  // ------------------------------------------------------------------
  // React‑Hook‑Form setup
  // ------------------------------------------------------------------
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: initialValues?.tipo || '',
      numero: initialValues?.numero || '',
      texto: initialValues?.texto || '',
      dependencia: initialValues?.dependencia || '',
      dateRange:
        initialValues?.publicacion_desde && initialValues?.publicacion_hasta
          ? {
              from: parseLocalDate(initialValues.publicacion_desde),
              to: parseLocalDate(initialValues.publicacion_hasta),
            }
          : undefined,
      sancion: initialValues?.sancion || '',
    },
  });

  /* ------------------------------------------------------------------ */
  /*  Smart numero → sancion UX                                          */
  /* ------------------------------------------------------------------ */
  const sancionInputRef = useRef<HTMLInputElement | null>(null);
  const watchNumero = form.watch('numero');

  /* jump focus on "/" -------------------------------------------------- */
  const handleNumeroKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '/' || e.key === '-') {
      // allow typing full 70/2023 too; only jump if "/" is FIRST typed
      if (!e.currentTarget.value.includes('/')) {
        e.preventDefault();
        sancionInputRef.current?.focus();
      }
    }
  };

  /* split "70/2023" into numero + sancion ------------------------------ */
  useEffect(() => {
    if (!watchNumero || !watchNumero.includes('/')) return;

    const [numPart, yearPartRaw] = watchNumero.split('/');
    const yearPart = yearPartRaw?.slice(0, 4) ?? '';

    if (yearPart) {
      form.setValue('numero', numPart, { shouldValidate: true });
      form.setValue('sancion', yearPart, {
        shouldValidate: true,
        shouldDirty: true,
      });
      sancionInputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchNumero]);

  // Submit ------------------------------------------------------------
  const onSubmit = (values: FormValues) => {
    const { numero, texto, dependencia, tipo, sancion, dateRange } = values;

    const params: Record<string, unknown> = {
      tipo,
      texto: texto || undefined,
      dependencia: dependencia || undefined,
      numero: numero ? Number(numero.trim()) : undefined,
      limit: 12,
      offset: 1,
    };

    if (dateRange?.from && dateRange?.to) {
      params.publicacion_desde = format(dateRange.from, 'yyyy-MM-dd');
      params.publicacion_hasta = format(dateRange.to, 'yyyy-MM-dd');
    }

    if (sancion) {
      const y = sancion.trim();
      const isTwoDigit = /^\d{2}$/.test(y);
      const isFourDigit = /^\d{4}$/.test(y);

      const aniosSancion = isTwoDigit
        ? [1800, 1900, 2000]
            .map(base => base + Number.parseInt(y, 10))
            .filter(year => year <= currentYear)
        : isFourDigit
        ? [Number.parseInt(y, 10)].filter(year => year <= currentYear)
        : [];

      if (aniosSancion.length > 0) params.sancion = aniosSancion;
    }
    onSearch(params);
  };

  const handleReset = () => {
    form.reset({
      tipo: '',
      numero: '',
      texto: '',
      dependencia: '',
      sancion: '',
      dateRange: { from: undefined, to: undefined },
    });
    onReset?.();
  };

  const watchTipo = form.watch('tipo');
  const watchSancion = form.watch('sancion');

  useEffect(() => {
    if (watchTipo === 'leyes' && watchSancion) {
      form.setValue('sancion', '', {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchTipo]);

  // ------------------------------------------------------------------
  // UI
  // ------------------------------------------------------------------
  return (
    <div className='sticky top-6'>
      <div className='bg-card rounded-2xl border p-6 shadow-sm'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Buscar Legislación</h2>
          <InfoSearch />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {/* Tipo de Norma */}
            <FormField
              control={form.control}
              name='tipo'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Norma *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Seleccionar' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Tipo de norma</SelectLabel>

                        {/* Top fixed group */}
                        {[
                          'Decreto',
                          'Ley',
                          'Decreto/Ley',
                          'Resolución',
                          'Disposición',
                          'Decisión Administrativa',
                        ].map(detalle => {
                          const tipo = tipos.find(t => t.detalle === detalle);
                          return (
                            tipo && (
                              <SelectItem key={tipo.route} value={tipo.route}>
                                {tipo.detalle}
                              </SelectItem>
                            )
                          );
                        })}

                        {/* Divider */}
                        <div className='my-1 h-px bg-border' />

                        {/* Other tipos (alphabetically) */}
                        {tipos
                          .filter(
                            t =>
                              ![
                                'Decreto',
                                'Ley',
                                'Decreto/Ley',
                                'Resolución',
                                'Disposición',
                                'Decisión Administrativa',
                              ].includes(t.detalle),
                          )
                          .sort((a, b) => a.detalle.localeCompare(b.detalle))
                          .map(t => (
                            <SelectItem key={t.route} value={t.route}>
                              {t.detalle}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex gap-4'>
              {/* Número (3/5) */}
              <div className={watchTipo === 'leyes' ? 'w-full' : 'w-3/5'}>
                <FormField
                  control={form.control}
                  name='numero'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input
                          type='text'
                          pattern='[0-9]+(/[0-9]{1,4})?'
                          placeholder='Ej: 70 o 70/2023'
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          onKeyDown={handleNumeroKeyDown}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Sanción (2/5) – hide when tipo is "leyes" */}
              {watchTipo !== 'leyes' && (
                <div className='w-2/5'>
                  <FormField
                    control={form.control}
                    name='sancion'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='flex items-center gap-1'>
                          Sanción
                        </FormLabel>

                        <FormControl>
                          <Input
                            type='number'
                            inputMode='numeric'
                            placeholder='Ej: 2023 o 95'
                            min={0}
                            max={currentYear}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={el => {
                              field.ref(el);
                              sancionInputRef.current = el;
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Texto */}
            <FormField
              control={form.control}
              name='texto'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1'>
                    Texto
                    <Popover>
                      <PopoverTrigger asChild>
                        <Info className='h-4 w-4 text-muted-foreground cursor-pointer' />
                      </PopoverTrigger>
                      <PopoverContent
                        side='right'
                        align='start'
                        className='bg-gray-900 text-white border border-card shadow-md rounded-md p-3 max-w-xs text-sm'
                      >
                        <div>
                          Refiná tu búsqueda usando operadores lógicos y frases
                          exactas.
                          <br />
                          <strong className='block mt-2'>
                            Frases exactas:
                          </strong>
                          Usá{' '}
                          <strong>
                            comillas dobles (<code>"</code>)
                          </strong>{' '}
                          para buscar frases, por ejemplo:{' '}
                          <code>"república argentina"</code>.
                          <br />
                          No uses comillas simples (<code>'</code>), ya que no
                          son interpretadas correctamente.
                          <strong className='block mt-2'>
                            Operadores lógicos:
                          </strong>
                          Podés usar <code>AND</code>, <code>OR</code>,{' '}
                          <code>NOT</code> y paréntesis para agrupar
                          condiciones.
                          <strong className='block mt-2'>Ejemplos:</strong>
                          <ul className='list-disc list-inside mt-1 space-y-1'>
                            <li>
                              <code>"de república argentina"</code>
                            </li>
                            <li>
                              <code>educación AND salud</code>
                            </li>
                            <li>
                              <code>salud OR medicina</code>
                            </li>
                            <li>
                              <code>salud NOT privada</code>
                            </li>
                            <li>
                              <code>"derechos humanos" AND constitución</code>
                            </li>
                            <li>
                              <code>(salud AND educación) OR justicia</code>
                            </li>
                          </ul>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      id='texto-area'
                      placeholder='Ej: "educación AND salud"'
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dependencia (Combobox) + Deselect X button */}
            <FormField
              control={form.control}
              name='dependencia'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Dependencia</FormLabel>
                  <div className='relative w-full'>
                    <Popover open={openDep} onOpenChange={setOpenDep}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            role='combobox'
                            aria-expanded={openDep}
                            className='w-full bg-card hover:bg-card cursor-pointer justify-between overflow-hidden relative pr-10 h-auto'
                          >
                            <div
                              className={cn(
                                'truncate text-left',
                                !field.value &&
                                  'text-muted-foreground font-normal',
                              )}
                            >
                              {field.value
                                ? dependencias.find(
                                    dep => dep === field.value,
                                  ) || field.value
                                : 'Seleccionar dependencia'}
                            </div>
                            <div className='absolute right-0 top-0 h-full flex items-center pr-3'>
                              {!field.value && (
                                <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                              )}
                            </div>
                          </Button>
                        </FormControl>
                      </PopoverTrigger>

                      <PopoverContent
                        className='min-w-[var(--radix-popover-trigger-width)] p-0 overflow-y-auto'
                        align='start'
                      >
                        <Command className='max-h-[300px]'>
                          <CommandInput
                            placeholder='Buscar dependencia...'
                            className='h-9'
                          />
                          <CommandEmpty>
                            No se encontraron resultados.
                          </CommandEmpty>
                          <CommandList className='max-h-[250px]'>
                            <CommandGroup>
                              {dependencias.map(dep => (
                                <CommandItem
                                  key={dep}
                                  value={dep}
                                  onSelect={() => {
                                    form.setValue('dependencia', dep, {
                                      shouldValidate: true,
                                    });
                                    setOpenDep(false);
                                  }}
                                  className='flex items-start cursor-pointer'
                                >
                                  <div className='flex items-center h-4 mr-2 mt-0.5'>
                                    <Check
                                      className={cn(
                                        'h-4 w-4 flex-shrink-0',
                                        field.value === dep
                                          ? 'opacity-100'
                                          : 'opacity-0',
                                      )}
                                    />
                                  </div>
                                  <div className='text-wrap line-clamp-2'>
                                    {dep}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {field.value && (
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        onClick={() => {
                          form.setValue('dependencia', '', {
                            shouldValidate: true,
                          });
                        }}
                        className='absolute right-0 top-0 h-full aspect-square rounded-l-none'
                        aria-label='Limpiar selección'
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='dateRange'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fechas de Publicación</FormLabel>
                  <FormControl>
                    <DateRangePicker
                      placeholder='Desde - Hasta'
                      initialDateFrom={field.value?.from}
                      initialDateTo={field.value?.to}
                      onUpdate={({ range }) => field.onChange(range)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botones */}
            <div className='flex gap-2'>
              <Button type='button' variant='outline' onClick={handleReset}>
                Limpiar
              </Button>
              <Button
                type='submit'
                className='flex-1 flex items-center justify-center'
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg
                      className='animate-spin h-5 w-5 mr-2'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      />
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
                      />
                    </svg>
                    Buscando…
                  </>
                ) : (
                  <>
                    <SearchIcon className='mr-2 h-4 w-4' /> Buscar
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
