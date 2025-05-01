'use client';

import Link from 'next/link';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  LayoutGrid,
  List,
  Search as SearchIcon,
  RotateCcw,
  CalendarIcon,
  FileTextIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDatePretty } from '@/lib/utils';

import { Copy, CheckIcon } from 'lucide-react';
import { useState } from 'react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------
interface Norma {
  id: number;
  tipoNorma: string;
  claseNorma?: string;
  idNormas?: {
    numero: string;
    dependencia: string;
    ramaDigesto: string;
  }[];
  numeroBoletin?: number;
  numeroPagina?: number;
  publicacion?: string;
  sancion?: string;
  tituloSumario?: string;
  tituloResumido?: string;
  textoResumido?: string;
  estado?: string;
  jurisdiccion?: string;
  nombreNorma: string;
  esNumerada: boolean;
}

interface Meta {
  count: number;
  limit: number;
  offset: number;
}

interface ResultsProps {
  results: Norma[];
  meta: Meta | null;
  view: 'list' | 'grid';
  onViewChange: (v: 'list' | 'grid') => void;
  onPageChange: (page: number) => void;
  onReset?: () => void;
}

export default function Results({
  results,
  meta,
  view,
  onViewChange,
  onPageChange,
  onReset,
}: ResultsProps) {
  const currentPage = meta ? Math.ceil(meta.offset / meta.limit) : 1;
  const totalPages = meta ? Math.ceil(meta.count / meta.limit) : 0;

  // ---------------------------------------------------------------------------
  // EMPTY STATES
  // ---------------------------------------------------------------------------
  if (!results || results.length === 0) {
    return (
      <section className='flex flex-col items-center justify-center gap-6 py-20 text-center'>
        <div className='flex flex-col items-center gap-4'>
          <SearchIcon className='h-16 w-16 text-muted-foreground' />
          <h2 className='text-2xl font-semibold tracking-tight'>
            No encontramos resultados
          </h2>
          <p className='max-w-md text-sm text-muted-foreground'>
            Probá ajustar tus filtros, ampliar las palabras clave o revisar la
            ortografía.
          </p>
        </div>
        {onReset && (
          <Button variant='outline' size='sm' onClick={onReset}>
            <RotateCcw className='mr-2 h-4 w-4' /> Limpiar filtros
          </Button>
        )}
      </section>
    );
  }

  // ---------------------------------------------------------------------------
  // componentes internos
  // ---------------------------------------------------------------------------
  const ResultCard = ({ norma }: { norma: Norma }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      const { nombreNorma, esNumerada, ...cleanNorma } = norma;
      const rawJson = JSON.stringify(cleanNorma, null, 2);
      navigator.clipboard
        .writeText(rawJson)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Error copiando al portapapeles:', err);
        });
    };

    return (
      <Link
        href={`/search/${norma.id}`}
        className='group block h-full rounded-xl border bg-card transition hover:bg-accent hover:shadow-md relative'
      >
        {/* Copy button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='outline'
              size='icon'
              onClick={e => {
                e.preventDefault();
                handleCopy();
              }}
              className='absolute top-3 right-3 z-10 h-8 w-8 border border-white/30 bg-white/10 backdrop-blur-xs shadow-sm'
            >
              {copied ? (
                <CheckIcon className='h-4 w-4 text-green-600' />
              ) : (
                <Copy className='h-4 w-4' />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side='top' align='center'>
            Copiar
          </TooltipContent>
        </Tooltip>

        {/* rest of your card content below */}
        <Card className='flex h-full flex-col border-none bg-transparent p-0 shadow-none'>
          <CardContent className='flex grow flex-col gap-3 p-4'>
            {/* ---------- TOP SECTION : title & summary ---------- */}
            <div className='flex flex-col gap-2'>
              <h3 className='text-base font-extrabold font-serif leading-snug line-clamp-2'>
                {norma.tituloSumario || norma.tituloResumido || 'Sin título'}
              </h3>

              {norma.textoResumido && (
                <div className='relative h-24 overflow-hidden'>
                  <p className='text-sm text-muted-foreground line-clamp-5'>
                    {norma.textoResumido}
                  </p>
                  {/* fade */}
                  <div className='pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card via-card/80 to-transparent group-hover:opacity-0 transition-opacity' />
                </div>
              )}
            </div>

            {/* visual divider */}
            <hr className='border-muted/90' />

            {/* ---------- META SECTION ---------- */}
            <div className='mt-auto flex flex-col gap-3 pt-4 text-xs text-muted-foreground leading-tight'>
              {/* Top line with tipo + número */}
              <div className='flex flex-wrap items-center justify-between w-full'>
                <div className='font-serif font-bold text-base leading-tight text-foreground'>
                  {norma.nombreNorma}
                </div>
                <Badge className='font-semibold rounded-full' variant='default'>
                  {norma.jurisdiccion}
                </Badge>
              </div>

              {/* Dependencia */}
              {norma.idNormas?.[0]?.dependencia && (
                <div className='whitespace-normal break-words'>
                  {norma.idNormas[0].dependencia}
                </div>
              )}

              {/* Bottom info line */}
              <div className='flex flex-wrap items-center justify-between w-full pt-2 text-muted-foreground text-xs'>
                {norma.publicacion && (
                  <div className='flex items-center gap-1'>
                    <CalendarIcon className='h-4 w-4' />
                    <span>{formatDatePretty(new Date(norma.publicacion))}</span>
                  </div>
                )}
                {norma.numeroBoletin && (
                  <div className='flex items-center gap-1'>
                    <FileTextIcon className='h-4 w-4' />
                    <span>Boletín {norma.numeroBoletin}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  /* ---------------------------------------------------------------------- */
  /*  List view                                                             */
  /* ---------------------------------------------------------------------- */
  const ResultListItem = ({ norma }: { norma: Norma }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      const { nombreNorma, esNumerada, ...cleanNorma } = norma;
      const rawJson = JSON.stringify(cleanNorma, null, 2);
      navigator.clipboard
        .writeText(rawJson)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Error copiando al portapapeles:', err);
        });
    };

    const tituloVisible =
      norma.tituloResumido?.toUpperCase() !== 'DISPOSICIONES'
        ? norma.tituloResumido
        : norma.tituloSumario || 'Sin título';

    return (
      <Link
        href={`/search/${norma.id}`}
        className='group relative block rounded-xl border bg-card transition hover:bg-accent hover:shadow-md'
      >
        {/* Copy button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='outline'
              size='icon'
              onClick={e => {
                e.preventDefault();
                handleCopy();
              }}
              className='absolute top-3 right-3 z-10 h-8 w-8 border border-white/30 bg-white/10 backdrop-blur-xs shadow-sm'
            >
              {copied ? (
                <CheckIcon className='h-4 w-4 text-green-600' />
              ) : (
                <Copy className='h-4 w-4' />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side='top' align='center'>
            Copiar
          </TooltipContent>
        </Tooltip>

        {/* Main layout */}
        <Card className='border-none bg-transparent p-0'>
          <div className='flex flex-col gap-3 p-4'>
            {/* Title */}
            <h3 className='text-base font-extrabold font-serif leading-snug line-clamp-2'>
              {tituloVisible}
            </h3>

            {/* Summary */}
            {norma.textoResumido && (
              <div className='relative h-20 overflow-hidden'>
                <p className='text-sm text-muted-foreground line-clamp-4'>
                  {norma.textoResumido}
                </p>
                <div className='pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-card via-card/80 to-transparent group-hover:opacity-0 transition-opacity' />
              </div>
            )}

            {/* Meta Info */}
            <div className='flex flex-wrap justify-between items-start gap-4 border-t pt-2 text-xs text-muted-foreground leading-tight'>
              {/* Left block */}
              <div className='flex flex-col gap-1 min-w-0'>
                <div className='flex items-center gap-4'>
                  <div className='font-serif font-bold text-base leading-tight text-foreground'>
                    {norma.nombreNorma}
                  </div>
                  {norma.jurisdiccion && (
                    <Badge
                      className='font-semibold rounded-full'
                      variant='default'
                    >
                      {norma.jurisdiccion}
                    </Badge>
                  )}
                </div>

                {norma.idNormas?.[0]?.dependencia && (
                  <span className='whitespace-normal break-words'>
                    {norma.idNormas[0].dependencia}
                  </span>
                )}
              </div>

              {/* Right block */}
              <div className='flex flex-col items-end gap-1 whitespace-nowrap'>
                {norma.publicacion && (
                  <div className='flex items-center gap-1'>
                    <CalendarIcon className='h-4 w-4' />
                    <span>{formatDatePretty(new Date(norma.publicacion))}</span>
                  </div>
                )}
                {norma.numeroBoletin && (
                  <div className='flex items-center gap-1 text-[11px]'>
                    <FileTextIcon className='h-4 w-4' />
                    <span>Boletín {norma.numeroBoletin}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  // ---------------------------------------------------------------------------
  // paginación
  // ---------------------------------------------------------------------------
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <Pagination className='mt-4'>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href='#'
              onClick={e => {
                e.preventDefault();
                onPageChange(Math.max(currentPage - 1, 1));
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href='#'
              isActive={currentPage === 1}
              onClick={e => {
                e.preventDefault();
                onPageChange(1);
              }}
            >
              1
            </PaginationLink>
          </PaginationItem>
          {currentPage > 3 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          {Array.from({ length: 3 }).map((_, idx) => {
            const page = currentPage - 1 + idx;
            if (page <= 1 || page >= totalPages) return null;
            return (
              <PaginationItem key={page}>
                <PaginationLink
                  href='#'
                  isActive={currentPage === page}
                  onClick={e => {
                    e.preventDefault();
                    onPageChange(page);
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          {currentPage < totalPages - 2 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          {totalPages !== 1 && (
            <PaginationItem>
              <PaginationLink
                href='#'
                isActive={currentPage === totalPages}
                onClick={e => {
                  e.preventDefault();
                  onPageChange(totalPages);
                }}
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          )}
          <PaginationItem>
            <PaginationNext
              href='#'
              onClick={e => {
                e.preventDefault();
                onPageChange(Math.min(currentPage + 1, totalPages));
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <section className='flex flex-col gap-4'>
      {/* Barra superior */}
      <header className='flex items-center justify-between'>
        {meta && (
          <p className='text-sm text-muted-foreground'>
            Mostrando {results.length} de {meta.count} resultados
          </p>
        )}
        <ToggleGroup
          type='single'
          value={view}
          onValueChange={val => val && onViewChange(val as 'list' | 'grid')}
        >
          <ToggleGroupItem value='list' aria-label='Vista de lista'>
            <List className='h-4 w-4' />
          </ToggleGroupItem>
          <ToggleGroupItem value='grid' aria-label='Vista de tarjetas'>
            <LayoutGrid className='h-4 w-4' />
          </ToggleGroupItem>
        </ToggleGroup>
      </header>

      {/* Resultados */}
      <div
        className={
          view === 'grid'
            ? 'grid auto-rows-[1fr] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
            : 'space-y-4'
        }
      >
        {results.map(norma =>
          view === 'grid' ? (
            <ResultCard key={norma.id} norma={norma} />
          ) : (
            <ResultListItem key={norma.id} norma={norma} />
          ),
        )}
      </div>

      {/* Paginación */}
      {renderPagination()}
    </section>
  );
}
