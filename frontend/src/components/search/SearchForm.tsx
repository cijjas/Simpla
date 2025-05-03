'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';

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
  FormDescription,
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
import {
  Check,
  ChevronsUpDown,
  Search as SearchIcon,
  Info,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import InfoSearch from './InfoSearch';
import { DateRangePicker } from '../ui/date-range-picker';
import { Calendar } from '../ui/calendar';

interface Props {
  onSearch: (params: Record<string, unknown>) => void;
  loading?: boolean;
  initialValues?: Record<string, string>;
  onReset?: () => void;
}

const TIPOS_HARDCODEADOS = [
  { detalle: 'Ley', route: 'leyes' },
  { detalle: 'Decreto', route: 'decretos' },
  { detalle: 'Decisión Administrativa', route: 'decisiones_administrativas' },
  { detalle: 'Resolución', route: 'resoluciones' },
  { detalle: 'Disposición', route: 'disposiciones' },
  { detalle: 'Acordada', route: 'acordadas' },
  { detalle: 'Acta', route: 'actas' },
  { detalle: 'Actuacion', route: 'actuaciones' },
];

const DEPENDENCIAS_HARDCODEADAS = [
  'ADMINISTRACION FEDERAL DE INGRESOS PUBLICOS',
  'MINISTERIO DE JUSTICIA Y DERECHOS HUMANOS',
  'PODER EJECUTIVO NACIONAL (P.E.N.)',
  'CORTE SUPREMA DE JUSTICIA DE LA NACION',
];

// --------------------------------------------------
// Zod schema & types
// --------------------------------------------------
const schema = z.object({
  tipo: z.string().min(1, 'Seleccioná un tipo de norma'),
  numero: z
    .string()
    .optional()
    .refine(val => !val || /^[0-9]+(\/[0-9]{2,4})?$/.test(val.trim()), {
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

    fetch('/api/infoleg/dependencies')
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
    },
  });

  // Submit ------------------------------------------------------------
  const onSubmit = (values: FormValues) => {
    let numero = values.numero?.trim();

    const params: Record<string, unknown> = {
      texto: values.texto || undefined,
      dependencia: values.dependencia || undefined,
      tipo: values.tipo,
      limit: 12,
      offset: 1,
    };

    console.log(params);

    if (values.dateRange?.from && values.dateRange?.to) {
      params['publicacion_desde'] = format(values.dateRange.from, 'yyyy-MM-dd');
      params['publicacion_hasta'] = format(values.dateRange.to, 'yyyy-MM-dd');
    }

    if (numero && numero.includes('/')) {
      const [rawNro, rawYear] = numero.split('/');
      const nro = rawNro.trim();
      const y = rawYear.trim();

      // Build a list of candidate years ≤ today
      const currentYear = new Date().getFullYear();
      const years: number[] = [];
      if (/^\d{2}$/.test(y)) {
        const two = parseInt(y, 10);
        [1800 + two, 1900 + two, 2000 + two].forEach(yy => {
          if (yy <= currentYear) years.push(yy);
        });
      } else if (/^\d{4}$/.test(y)) {
        const full = parseInt(y, 10);
        if (full <= currentYear) years.push(full);
      }

      params['numero'] = nro;
      params['anios'] = years;

      console.log(params['numero']);
      console.log(params['anios']);
    } else if (numero) {
      params['numero'] = Number(numero);
    }

    if (values.tipo) params['tipo'] = values.tipo;

    onSearch(params);
  };

  const handleReset = () => {
    form.reset({
      tipo: '',
      numero: '',
      texto: '',
      dependencia: '',
      dateRange: { from: undefined, to: undefined },
    });
  };

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
                        {tipos.map(t => (
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

            {/* Número */}
            <FormField
              control={form.control}
              name='numero'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input
                      type='text' // ← was 'number'
                      inputMode='numeric'
                      pattern='[0-9]+(/[0-9]{1,4})?'
                      placeholder='Ej: 70 o 70/23'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Texto */}
            <FormField
              control={form.control}
              name='texto'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1'>
                    Texto
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className='h-4 w-4 text-muted-foreground cursor-pointer' />
                        </TooltipTrigger>
                        <TooltipContent side='right'>
                          <div className='max-w-xs text-sm'>
                            Usá operadores lógicos para refinar tu búsqueda.
                            <br />
                            Podés usar paréntesis para agrupar condiciones.
                            <br />
                            <strong>Ejemplos</strong>
                            <ul className='list-disc list-inside mt-1 space-y-1'>
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
                                <code>'derechos humanos' AND constitución</code>
                              </li>
                              <li>
                                <code>(salud AND educación) OR justicia</code>
                              </li>
                            </ul>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
            {/* Dependencia (Combobox) */}
            <Controller
              control={form.control}
              name='dependencia'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dependencia</FormLabel>
                  <Popover open={openDep} onOpenChange={setOpenDep}>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        role='combobox'
                        aria-expanded={openDep}
                        className='bg-card cursor-pointer hover:bg-card w-full justify-between truncate'
                      >
                        <span
                          className={cn(
                            'truncate max-w-full',
                            !field.value && 'text-muted-foreground font-normal',
                          )}
                          title={field.value || 'Seleccionar dependencia'}
                        >
                          {field.value || 'Seleccionar dependencia'}
                        </span>
                        <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='min-w-[var(--radix-popover-trigger-width)] p-0 max-h-64 overflow-y-auto'>
                      <Command>
                        <CommandInput
                          placeholder='Buscar dependencia...'
                          className='h-9'
                        />
                        <CommandList>
                          <CommandEmpty>
                            No se encontraron dependencias.
                          </CommandEmpty>
                          <CommandGroup>
                            {dependencias.map(dep => (
                              <CommandItem
                                key={dep}
                                value={dep}
                                onSelect={currentValue => {
                                  field.onChange(
                                    currentValue === field.value
                                      ? ''
                                      : currentValue,
                                  );
                                  setOpenDep(false);
                                }}
                              >
                                {dep}
                                <Check
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    field.value === dep
                                      ? 'opacity-100'
                                      : 'opacity-0',
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
