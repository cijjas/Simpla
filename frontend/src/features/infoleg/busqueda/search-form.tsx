'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
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
  SearchIcon,
  Info,
  X,
  HelpCircle,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PopoverInfoSearch from './popover-info-search';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  DEPENDENCIAS_HARDCODEADAS,
  TIPOS_HARDCODEADOS,
} from '../utils/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useRouter, useSearchParams } from 'next/navigation';

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

// Remove quotes from display text
function removeQuotes(text: string): string {
  return text.replace(/"/g, '');
}

// Simplified processSearchText function with just two methods
function processSearchText(text: string): string {
  if (!text.trim()) return '';

  // Define operators to check for
  const operators = ['AND', 'OR', 'NOT'];

  // Check if any operator is present (case insensitive)
  const hasOperator = operators.some(op =>
    new RegExp(`\\b${op}\\b`, 'i').test(text),
  );

  // Method 1: Plain Search - wrap entire text in quotes
  if (!hasOperator) {
    return `"${text.trim()}"`;
  }

  // Method 2: Advanced Boolean Search - send as is
  return text.trim();
}

// Query Builder Dialog Component
function QueryBuilderDialog({
  initialQuery,
  onApply,
}: {
  initialQuery: string;
  onApply: (query: string) => void;
}) {
  const [queryTerms, setQueryTerms] = useState<
    { term: string; operator: string }[]
  >([]);
  const [currentTerm, setCurrentTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Parse the texto field to populate the query builder when the dialog opens
  useEffect(() => {
    if (initialQuery && dialogOpen) {
      try {
        // Simple parser for AND, OR, NOT operators and quoted terms
        const operators = ['AND', 'OR', 'NOT'];
        const text = initialQuery;
        const terms: { term: string; operator: string }[] = [];

        // Check if there are any operators in the text
        const hasOperators = operators.some(op =>
          new RegExp(`\\b${op}\\b`, 'i').test(text),
        );

        // If no operators and no quotes, treat the entire text as a single term
        if (!hasOperators && !text.includes('"')) {
          terms.push({
            term: text.trim(),
            operator: '',
          });
        } else {
          // Handle quoted terms first
          const quotedRegex = /"([^"]*)"/g;
          let match;
          let lastIndex = 0;
          let foundQuotes = false;

          while ((match = quotedRegex.exec(text)) !== null) {
            foundQuotes = true;
            // Check if there's text before the quote
            if (match.index > lastIndex) {
              const beforeText = text.substring(lastIndex, match.index).trim();
              if (beforeText) {
                // Check if it starts with an operator
                let operator = '';
                for (const op of operators) {
                  if (beforeText.toUpperCase().startsWith(op)) {
                    operator = op;
                    break;
                  }
                }

                const term = operator
                  ? beforeText.substring(operator.length).trim()
                  : beforeText;
                if (term) {
                  terms.push({
                    term,
                    operator: terms.length === 0 ? '' : operator || 'OR',
                  });
                }
              }
            }

            // Add the term without quotes
            terms.push({
              term: match[1],
              operator: terms.length === 0 ? '' : 'OR',
            });

            lastIndex = match.index + match[0].length;
          }

          // If no quotes were found, split by operators
          if (!foundQuotes) {
            const remaining = text;

            for (const op of operators) {
              const parts = remaining.split(new RegExp(`\\s${op}\\s`, 'i'));
              if (parts.length > 1) {
                // First part
                if (terms.length === 0) {
                  terms.push({
                    term: parts[0].trim(),
                    operator: '',
                  });
                }

                // Remaining parts with operators
                for (let i = 1; i < parts.length; i++) {
                  terms.push({
                    term: parts[i].trim(),
                    operator: op,
                  });
                }

                break;
              }
            }

            // If no operators were found, just add the whole text as one term
            if (terms.length === 0 && remaining.trim()) {
              terms.push({
                term: remaining.trim(),
                operator: '',
              });
            }
          }
        }

        if (terms.length > 0) {
          setQueryTerms(terms);
        }
      } catch (error) {
        console.error('Error parsing query text:', error);
      }
    }
  }, [initialQuery, dialogOpen]);

  // Query Builder functions
  const addQueryTerm = () => {
    if (!currentTerm.trim()) return;

    const newTerm = {
      term: currentTerm.trim(),
      operator: queryTerms.length === 0 ? '' : 'OR',
    };

    setQueryTerms([...queryTerms, newTerm]);
    setCurrentTerm('');
  };

  const updateQueryText = () => {
    if (queryTerms.length === 0) {
      return '';
    }

    let queryText = '';
    queryTerms.forEach((item, index) => {
      if (index > 0) {
        queryText += ` ${item.operator} `;
      }

      // Add quotes to terms but don't show them in the UI
      queryText += item.term;
    });

    return queryText;
  };

  const changeOperator = (index: number, newOperator: string) => {
    const updatedTerms = [...queryTerms];
    updatedTerms[index].operator = newOperator;
    setQueryTerms(updatedTerms);
  };

  const removeTerm = (index: number) => {
    const updatedTerms = queryTerms.filter((_, i) => i !== index);
    setQueryTerms(updatedTerms);
  };

  const handleApplyQuery = () => {
    const queryText = updateQueryText();
    onApply(queryText);
    setDialogOpen(false);
  };

  const applyExample = (example: string) => {
    // Clear existing terms
    setQueryTerms([]);

    // Apply the example directly - remove any quotes for display
    onApply(removeQuotes(example));
    setDialogOpen(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant='ghost' size='sm' className='h-8 px-2 text-xs'>
          Busqueda avanzada
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Busqueda avanzada</DialogTitle>
        </DialogHeader>

        <div className='space-y-4 mt-4'>
          {/* Query Builder UI */}
          <div className='space-y-2'>
            {queryTerms.map((term, index) => (
              <div key={index} className='flex items-center gap-2'>
                {index > 0 && (
                  <Select
                    value={term.operator}
                    onValueChange={value => changeOperator(index, value)}
                  >
                    <SelectTrigger className='w-20 h-8'>
                      <SelectValue placeholder='OR' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='AND'>AND</SelectItem>
                      <SelectItem value='OR'>OR</SelectItem>
                      <SelectItem value='NOT'>NOT</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <div className='flex-1 bg-muted px-3 py-1 rounded-md text-sm'>
                  {term.term}
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8'
                  onClick={() => removeTerm(index)}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            ))}
          </div>

          {/* Add new term */}
          <div className='flex items-center gap-2'>
            <div className='flex-1'>
              <Input
                value={currentTerm}
                onChange={e => setCurrentTerm(e.target.value)}
                placeholder='Agregar término o frase...'
                className='flex-1'
              />
            </div>
            <Button
              type='button'
              variant='secondary'
              size='sm'
              onClick={addQueryTerm}
              disabled={!currentTerm.trim()}
            >
              <Plus className='h-4 w-4 mr-1' /> Agregar
            </Button>
          </div>

          {/* Preview of the generated query */}
          {queryTerms.length > 0 && (
            <div className='mt-2 text-sm border-t pt-2'>
              <div className='font-medium mb-1'>Consulta generada:</div>
              <code className='bg-muted p-2 rounded block overflow-x-auto whitespace-pre-wrap'>
                {updateQueryText()}
              </code>
            </div>
          )}

          {/* Help text */}
          <div className='text-sm text-muted-foreground mt-2'>
            <p className='font-medium mb-1'>Consejos:</p>
            <ul className='list-disc list-inside space-y-1 text-xs'>
              <li>AND: Ambos términos deben estar presentes</li>
              <li>OR: Al menos uno de los términos debe estar presente</li>
              <li>NOT: El término no debe estar presente</li>
            </ul>
          </div>

          {/* Examples */}
          <div className='border-t pt-3 mt-3'>
            <h3 className='font-medium text-sm mb-2'>Ejemplos de búsqueda:</h3>
            <div className='grid gap-2 text-sm'>
              <div className='grid grid-cols-[1fr_auto] gap-2'>
                <div className='text-muted-foreground text-xs'>
                  <code>ley de educación nacional</code>
                  <div className='text-xs text-gray-500 mt-0.5'>
                    Busca la frase exacta
                  </div>
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='h-6 px-2 text-xs'
                  onClick={() => applyExample('ley de educación nacional')}
                >
                  Usar
                </Button>
              </div>

              <div className='grid grid-cols-[1fr_auto] gap-2'>
                <div className='text-muted-foreground text-xs'>
                  <code>"ley 27.275" AND "transparencia"</code>
                  <div className='text-xs text-gray-500 mt-0.5'>
                    Busca documentos que contengan ambos términos
                  </div>
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='h-6 px-2 text-xs'
                  onClick={() =>
                    applyExample('"ley 27.275" AND "transparencia"')
                  }
                >
                  Usar
                </Button>
              </div>

              <div className='grid grid-cols-[1fr_auto] gap-2'>
                <div className='text-muted-foreground text-xs'>
                  <code>"educación" OR "enseñanza" OR "formación"</code>
                  <div className='text-xs text-gray-500 mt-0.5'>
                    Busca documentos con cualquiera de estos términos
                  </div>
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='h-6 px-2 text-xs'
                  onClick={() =>
                    applyExample('"educación" OR "enseñanza" OR "formación"')
                  }
                >
                  Usar
                </Button>
              </div>

              <div className='grid grid-cols-[1fr_auto] gap-2'>
                <div className='text-muted-foreground text-xs'>
                  <code>"educación" NOT "privada"</code>
                  <div className='text-xs text-gray-500 mt-0.5'>
                    Excluye documentos que contengan el segundo término
                  </div>
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='h-6 px-2 text-xs'
                  onClick={() => applyExample('"educación" NOT "privada"')}
                >
                  Usar
                </Button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className='flex justify-end gap-2 pt-2'>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleApplyQuery}
              disabled={queryTerms.length === 0}
            >
              Aplicar consulta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SearchForm({
  onSearch,
  loading,
  initialValues,
  onReset,
}: Props) {
  // ------------------------------------------------------------------
  // URL and state management for persistence
  // ------------------------------------------------------------------
  const router = useRouter();
  const searchParams = useSearchParams();

  // Function to update URL with current search params
  const updateUrlWithSearchParams = (params: Record<string, unknown>) => {
    const url = new URL(window.location.href);

    // Clear existing search params
    url.search = '';

    // Add new search params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    // Update URL without reloading the page
    window.history.pushState({}, '', url.toString());
  };

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
      tipo: initialValues?.tipo || searchParams.get('tipo') || '',
      numero: initialValues?.numero || searchParams.get('numero') || '',
      texto: initialValues?.texto
        ? removeQuotes(initialValues.texto)
        : searchParams.get('texto')
        ? removeQuotes(searchParams.get('texto') || '')
        : '',
      dependencia:
        initialValues?.dependencia || searchParams.get('dependencia') || '',
      dateRange:
        (initialValues?.publicacion_desde &&
          initialValues?.publicacion_hasta) ||
        (searchParams.get('publicacion_desde') &&
          searchParams.get('publicacion_hasta'))
          ? {
              from: initialValues?.publicacion_desde
                ? parseLocalDate(initialValues.publicacion_desde)
                : searchParams.get('publicacion_desde')
                ? parseLocalDate(searchParams.get('publicacion_desde') || '')
                : undefined,
              to: initialValues?.publicacion_hasta
                ? parseLocalDate(initialValues.publicacion_hasta)
                : searchParams.get('publicacion_hasta')
                ? parseLocalDate(searchParams.get('publicacion_hasta') || '')
                : undefined,
            }
          : undefined,
      sancion: initialValues?.sancion || searchParams.get('sancion') || '',
    },
  });

  /* ------------------------------------------------------------------ */
  /*  Smart numero → sancion UX                                          */
  /* ------------------------------------------------------------------ */
  const sancionInputRef = useRef<HTMLInputElement | null>(null);
  const watchNumero = form.watch('numero');
  const watchTexto = form.watch('texto');

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

  // Handle query from dialog
  const handleApplyQuery = (query: string) => {
    form.setValue('texto', query, { shouldValidate: true });
  };

  // Submit ------------------------------------------------------------
  const onSubmit = (values: FormValues) => {
    const { numero, texto, dependencia, tipo, sancion, dateRange } = values;

    // Process the search text to add quotes to terms
    const processedTexto = texto ? processSearchText(texto) : undefined;

    const params: Record<string, unknown> = {
      tipo,
      texto: processedTexto || undefined,
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

    // Update URL with search params for persistence
    updateUrlWithSearchParams(params);

    // Call the onSearch callback
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

    // Clear URL params
    updateUrlWithSearchParams({});

    // Call onReset if provided
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
    <div className='sticky top-6 '>
      <div className='bg-card rounded-2xl border p-6 shadow-sm'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-lg font-semibold '>Buscar Legislación</h2>
          <PopoverInfoSearch />
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
                          placeholder='Ej: 70'
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
                  <div className='flex items-center justify-between mb-1'>
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
                            <strong className='block mb-2'>
                              Dos formas de buscar:
                            </strong>
                            <strong className='block mt-2'>
                              1. Búsqueda simple:
                            </strong>
                            Escribe normalmente (ej: "servicios de radio") y se
                            buscará la frase exacta.
                            <strong className='block mt-2'>
                              2. Búsqueda avanzada:
                            </strong>
                            Usa operadores AND, OR, NOT y comillas para
                            búsquedas más precisas.
                            <strong className='block mt-2'>Ejemplos:</strong>
                            <ul className='list-disc list-inside mt-1 space-y-1'>
                              <li>
                                <code>"ley 27.275" AND "transparencia"</code>
                              </li>
                              <li>
                                <code>"educación" OR "enseñanza"</code>
                              </li>
                              <li>
                                <code>"salud" NOT "privada"</code>
                              </li>
                            </ul>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </FormLabel>
                    <QueryBuilderDialog
                      initialQuery={watchTexto || ''}
                      onApply={handleApplyQuery}
                    />
                  </div>

                  <FormControl>
                    <Textarea
                      id='texto-area'
                      placeholder='Ej: servicios de radio'
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
