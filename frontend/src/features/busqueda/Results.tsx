'use client';

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
import { LayoutGrid, List, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ResultCard from './norma-card';
import ResultListItem from './norma-list-item';
import { useTheme } from 'next-themes';
import InitialSearchView from './initial-search-view';
import SvgSearch from '@/components/icons/Search';
import { NormaItem } from '@/lib/infoleg/types';

interface Meta {
  count: number;
  limit: number;
  offset: number;
}

interface ResultsProps {
  results: NormaItem[];
  meta: Meta | null;
  view: 'list' | 'grid';
  onViewChange: (v: 'list' | 'grid') => void;
  onPageChange: (page: number) => void;
  loading?: boolean;
  onReset?: () => void;
}

/**
 * ------------------------------------------------------------------------
 *  RESULTS COMPONENT
 *  – Purely presentational (no URL / network work)
 * ------------------------------------------------------------------------
 */
export default function Results({
  results,
  meta,
  view,
  onViewChange,
  onPageChange,
  loading,
  onReset,
}: ResultsProps) {
  /* keep view in LocalStorage for next visit */
  const handleViewChange = (val: 'list' | 'grid') => {
    localStorage.setItem('resultsViewPreference', val);
    onViewChange(val);
  };

  /* quick flags ---------------------------------------------------------- */
  const isInitial = !loading && meta === null;
  const isEmptyResults = !loading && meta !== null && results.length === 0;
  const currentPage = meta ? meta.offset : 1; // API is 1‑based
  const totalPages = meta ? Math.ceil(meta.count / meta.limit) : 0;
  /* --------------------------------------------------------------------- *
   *  1. SKELETONS                                                          *
   * --------------------------------------------------------------------- */
  if (loading) {
    if (view === 'grid') {
      return (
        <section
          className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
          style={{
            WebkitMaskImage:
              'linear-gradient(to bottom, black 70%, transparent 100%)',
            maskImage:
              'linear-gradient(to bottom, black 70%, transparent 100%)',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className='flex h-full flex-col bg-card rounded-xl animate-pulse'
            >
              <CardContent className='flex grow flex-col gap-3'>
                <div className='h-36 w-full bg-muted rounded-lg mt-auto' />
                <div className='flex-1' />
                <div className='h-7 w-3/4 mb-2 bg-muted rounded' />
                <div className='h-4 w-1/2 bg-muted rounded' />
              </CardContent>
            </Card>
          ))}
        </section>
      );
    }

    /* list skeleton */
    return (
      <div
        className='space-y-4'
        style={{
          WebkitMaskImage:
            'linear-gradient(to bottom, black 70%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <Card
            key={i}
            className='py-0 bg-card rounded-xl animate-pulse border-none'
          >
            <div className='flex flex-col gap-3 p-4'>
              <div className='h-6 w-2/3 bg-muted rounded' />
              <div className='relative h-20 w-full bg-muted rounded-lg' />
              <div className='flex flex-wrap justify-between items-start gap-4 border-t pt-2 text-xs'>
                <div className='space-y-2 w-1/2'>
                  <div className='h-4 w-3/4 bg-muted rounded' />
                  <div className='h-4 w-1/2 bg-muted rounded' />
                </div>
                <div className='flex flex-col items-end gap-2'>
                  <div className='h-4 w-24 bg-muted rounded' />
                  <div className='h-4 w-12 bg-muted rounded' />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  /* --------------------------------------------------------------------- *
   *  2. EMPTY & FIRST‑TIME SCREENS                                         *
   * --------------------------------------------------------------------- */
  if (isInitial) {
    return <InitialSearchView></InitialSearchView>;
  }

  if (isEmptyResults) {
    return (
      <section className='w-full flex flex-col items-center justify-center gap-6 px-4 py-12 text-center'>
        <div className='max-w-md mx-auto'>
          <SvgSearch className='w-[300px] h-[300px] text-black dark:text-white' />
        </div>
        <h2 className='text-2xl font-semibold tracking-tight'>
          No encontramos resultados
        </h2>
        <p className='text-sm text-muted-foreground max-w-md'>
          Probá ajustar tus filtros, ampliar las palabras clave o revisar la
          ortografía.
        </p>
        {onReset && (
          <Button variant='outline' size='sm' onClick={onReset}>
            <RotateCcw className='mr-2 h-4 w-4' />
            Limpiar filtros
          </Button>
        )}
      </section>
    );
  }

  /* --------------------------------------------------------------------- *
   *  3. CARD + LIST RENDERERS (unchanged)                                  *
   * --------------------------------------------------------------------- */
  /* in‑place, omitted for brevity – identical to your last version */

  /* --------------------------------------------------------------------- *
   *  4. PAGINATION                                                         *
   * --------------------------------------------------------------------- */
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

          {/* first page */}
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

          {/* sliding window around current page */}
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

          {/* last page */}
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

  /* --------------------------------------------------------------------- *
   *  5. MAIN VIEW                                                          *
   * --------------------------------------------------------------------- */
  return (
    <section className='flex flex-col gap-4'>
      {/* top bar */}
      <header className='flex items-center justify-between'>
        {meta && (
          <p className='text-sm text-muted-foreground'>
            Mostrando {results.length} de {meta.count} resultados
          </p>
        )}
        <ToggleGroup
          type='single'
          value={view}
          onValueChange={val => val && handleViewChange(val as 'list' | 'grid')}
        >
          <ToggleGroupItem value='list' aria-label='Vista de lista'>
            <List className='h-4 w-4' />
          </ToggleGroupItem>
          <ToggleGroupItem value='grid' aria-label='Vista de tarjetas'>
            <LayoutGrid className='h-4 w-4' />
          </ToggleGroupItem>
        </ToggleGroup>
      </header>

      {/* results */}
      <div
        className={
          view === 'grid'
            ? 'grid auto-rows-[1fr] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
            : 'space-y-4'
        }
      >
        {results.map(n =>
          view === 'grid' ? (
            <ResultCard key={n.id} norma={n} />
          ) : (
            <ResultListItem key={n.id} norma={n} />
          ),
        )}
      </div>

      {/* pagination */}
      {renderPagination()}
    </section>
  );
}
