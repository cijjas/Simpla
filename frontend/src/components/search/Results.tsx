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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDatePretty } from '@/lib/utils';

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------
interface Norma {
  id: number;
  tipoNorma: string;
  claseNorma?: string;
  publicacion?: string;
  tituloSumario?: string;
  tituloResumido?: string;
  textoResumido?: string;
  dependencia?: string;
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
  const ResultCard = ({ norma }: { norma: Norma }) => (
    <Link
      href={`/search/${norma.id}`}
      className='group block h-full rounded-xl border bg-card transition hover:bg-accent hover:shadow-md'
    >
      <Card className='p-0 h-full border-none bg-transparent shadow-none flex flex-col'>
        <CardContent className='flex flex-col gap-2 p-4 grow'>
          <div className='flex flex-wrap items-start justify-between text-xs text-muted-foreground gap-2'>
            <div className='flex gap-2'>
              <Badge variant='outline'>{norma.tipoNorma}</Badge>
              <Badge variant='outline'>{`N° ${norma.id}`}</Badge>
            </div>

            {norma.publicacion && (
              <span className='whitespace-nowrap'>
                {formatDatePretty(new Date(norma.publicacion))}
              </span>
            )}
          </div>
          <div className='text-base font-extrabold font-serif line-clamp-2'>
            {norma.tituloResumido || norma.tituloSumario || 'Sin título'}
          </div>
          {norma.dependencia && (
            <div className='text-xs text-muted-foreground'>
              {norma.dependencia}
            </div>
          )}

          {norma.textoResumido && (
            <div className='relative h-24 overflow-hidden'>
              <p className='text-sm text-muted-foreground h-full overflow-hidden text-ellipsis line-clamp-5'>
                {norma.textoResumido}
              </p>
              {/* fade bottom */}
              <div className='pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card via-card/80 to-transparent group-hover:opacity-0 transition-opacity' />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );

  const ResultListItem = ({ norma }: { norma: Norma }) => (
    <Link
      href={`/search/${norma.id}`}
      className='group block rounded-xl border bg-card transition hover:bg-accent hover:shadow-md'
    >
      <Card className='border-none bg-transparent p-0'>
        <div className='flex flex-col gap-2 p-3'>
          <div className='flex items-center justify-between text-sm text-muted-foreground'>
            <div className='flex gap-2'>
              <Badge variant='outline'>{norma.tipoNorma}</Badge>
              <Badge variant='outline'>{`N° ${norma.id}`}</Badge>
            </div>
            {norma.publicacion && (
              <span>{formatDatePretty(new Date(norma.publicacion))}</span>
            )}
          </div>

          <div className='text-base font-extrabold font-serif line-clamp-2'>
            {norma.tituloResumido || norma.tituloSumario || 'Sin título'}
          </div>

          {norma.dependencia && (
            <div className='text-sm text-muted-foreground'>
              <strong>Dependencia:</strong> {norma.dependencia}
            </div>
          )}

          {norma.textoResumido && (
            <div className='relative h-20 overflow-hidden'>
              <p className='text-sm text-muted-foreground h-full overflow-hidden text-ellipsis line-clamp-4'>
                {norma.textoResumido}
              </p>
              {/* fade bottom */}
              <div className='pointer-events-none absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-card via-card/80 to-transparent group-hover:opacity-0 transition-opacity' />
            </div>
          )}
        </div>
      </Card>
    </Link>
  );

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
