'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useNormasSearch } from '../../hooks/use-normas-search';
import { NormaCard } from './norma-card';
import { NormaListItem } from './norma-list-item';
import SvgSearch from '@/../public/svgs/search.svg';
import { useBatchBookmarks } from '@/features/bookmark';
import type { NormaSummary } from '@/features/normas/api/normas-api';

// List view container component
interface NormasListViewProps {
  normas: NormaSummary[];
  isBookmarked: (infolegId: number) => boolean;
}

function NormasListView({ normas, isBookmarked }: NormasListViewProps) {
  return (
    <div className='flex-1 overflow-hidden'>
      <div className='h-full overflow-y-auto'>
        {/* Table Header */}
        <div className='sticky top-0 z-10 bg-muted/50 backdrop-blur-sm border-b'>
          <div className='grid grid-cols-12 gap-3 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
            <div className='col-span-3'>Norma</div>
            <div className='col-span-4'>Descripción</div>
            <div className='col-span-2'>Detalles</div>
            <div className='col-span-2'>Publicación</div>
            <div className='col-span-1 text-right'>Acciones</div>
          </div>
        </div>

        {/* Table Rows */}
        <div className='divide-y divide-border'>
          {normas.map((norma, index) => (
            <NormaListItem
              key={norma.id}
              norma={norma}
              isBookmarked={isBookmarked(norma.infoleg_id)}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function NormasList() {
  const {
    results: data,
    loading,
    handlePageChange: onPageChange,
    hasResults: _hasResults,
    totalCount,
    hasMore,
    currentPage,
    totalPages,
  } = useNormasSearch(); // No autoSearch - just consumes state

  // Batch check bookmarks for all normas on this page
  const { isBookmarked } = useBatchBookmarks(data?.normas || []);

  // Debug: Log when we check bookmarks
  useEffect(() => {
    if (data?.normas && data.normas.length > 0) {
      console.log('[NormasList] Checking bookmarks for normas:', data.normas.map(n => n.infoleg_id));
      data.normas.forEach(norma => {
        console.log(`[NormasList] Norma ${norma.infoleg_id} isBookmarked:`, isBookmarked(norma.infoleg_id));
      });
    }
  }, [data?.normas, isBookmarked]);

  // View state management with localStorage persistence
  const STORAGE_KEY = 'normasViewPreference';
  const [view, setView] = useState<'list' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'list' || saved === 'grid') {
        return saved;
      }
    }
    return 'grid';
  });

  const handleViewChange = (v: 'list' | 'grid') => {
    setView(v);
    localStorage.setItem(STORAGE_KEY, v);
  };

  const _getStatusColor = (estado?: string) => {
    switch (estado?.toLowerCase()) {
      case 'vigente':
        return 'bg-green-100 text-green-800';
      case 'derogada':
        return 'bg-red-100 text-red-800';
      case 'modificada':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const _getTypeColor = (tipo?: string) => {
    switch (tipo?.toLowerCase()) {
      case 'ley':
        return 'bg-blue-100 text-blue-800';
      case 'decreto':
        return 'bg-purple-100 text-purple-800';
      case 'resolución':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Empty state (only when not loading and no data)
  if (!loading && (!data || data.normas.length === 0)) {
    return (
      <section className='relative flex flex-col items-center justify-start md:justify-center h-full overflow-hidden px-4 md:px-6 py-4 md:py-4 pt-8'>
        {/* Background grid cards - realistic layout */}
        <div className='absolute inset-0 px-4 md:px-6 py-4 pointer-events-none'>
          <div 
            className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 h-full'
            style={{
              WebkitMaskImage:
                'radial-gradient(ellipse at center, transparent 20%, black 50%, transparent 80%)',
              maskImage:
                'radial-gradient(ellipse at center, transparent 20%, black 50%, transparent 80%)',
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <Card
                key={i}
                className='flex h-full flex-col bg-card rounded-xl shadow-none border '
              >
                <CardContent className='flex grow flex-col gap-3 p-4'>
                  <div className='h-32 w-full bg-muted/0 rounded-lg' />
                  <div className='space-y-2'>
                    <div className='h-4 w-3/4 bg-muted/00 rounded' />
                    <div className='h-3 w-1/2 bg-muted/00 rounded' />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className='relative z-10 w-full max-w-xl mx-auto'>
          <div className='flex flex-col items-center text-center space-y-6 bg-background rounded-2xl p-6 md:p-8 border shadow-sm'>
            {/* Icon */}

            <SvgSearch  
              className='size-48 md:size-60'
              fill='currentColor'
              />
            {/* Text Content */}
            <div className='space-y-3 max-w-md'>
              <h2 className='text-xl md:text-2xl lg:text-3xl font-serif font-bold tracking-tight'>
                No se encontraron normas
              </h2>
              
              <p className='text-sm sm:text-base leading-relaxed text-muted-foreground'>
                Intenta ajustar los filtros de búsqueda para encontrar más resultados.
              </p>

              <p className='text-sm leading-relaxed text-muted-foreground pt-2'>
                Modifica los filtros en la barra lateral o limpia todos los filtros para ver todas las normas disponibles.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const hasNextPage = hasMore;
  const hasPrevPage = (data?.offset || 0) > 0;

  // Render loading skeletons for content
  const renderLoadingContent = () => {
    if (view === 'grid') {
      return (
        <div className='flex-1 overflow-y-auto px-4  py-4 bg-muted/30'>
          <section
            className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'
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
                <CardContent className='flex grow flex-col gap-3 p-4'>
                  <div className='h-36 w-full bg-muted rounded-lg mt-auto' />
                  <div className='flex-1' />
                  <div className='h-7 w-3/4 mb-2 bg-muted rounded' />
                  <div className='h-4 w-1/2 bg-muted rounded' />
                </CardContent>
              </Card>
            ))}
          </section>
        </div>
      );
    }

    // List skeleton - table rows
    return (
      <div className='flex-1 overflow-hidden'>
        <div className='h-full overflow-y-auto'>
          {/* Table Header */}
          <div className='sticky top-0 z-10 bg-muted/50 backdrop-blur-sm border-b'>
            <div className='grid grid-cols-12 gap-3 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
              <div className='col-span-3'>Norma</div>
              <div className='col-span-4'>Descripción</div>
              <div className='col-span-2'>Detalles</div>
              <div className='col-span-2'>Publicación</div>
              <div className='col-span-1 text-right'>Acciones</div>
            </div>
          </div>

          {/* Row skeletons */}
          <div className='divide-y divide-border'>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className='grid grid-cols-12 gap-3 px-6 py-4'>
                <div className='col-span-3 space-y-2'>
                  <Skeleton className='h-5 w-3/4' />
                  <Skeleton className='h-3 w-1/2' />
                </div>
                <div className='col-span-4 space-y-2'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-3 w-5/6' />
                  <Skeleton className='h-3 w-4/6' />
                </div>
                <div className='col-span-2 space-y-2'>
                  <Skeleton className='h-6 w-20' />
                  <Skeleton className='h-3 w-24' />
                </div>
                <div className='col-span-2 space-y-1'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-3 w-20' />
                </div>
                <div className='col-span-1 flex justify-end gap-1'>
                  <Skeleton className='h-8 w-8' />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='h-full flex flex-col'>
      {/* Results Header with View Toggle and Pagination - Fixed */}
      <div className='flex-shrink-0 border-b bg-background'>
        {/* Mobile Layout - Stack items */}
        <div className='lg:hidden'>
          <div className='flex items-center justify-between px-4 py-3'>
            <div className='flex flex-col gap-1'>
              {loading ? (
                <>
                  <Skeleton className='h-5 w-32' />
                  <Skeleton className='h-4 w-24' />
                </>
              ) : (
                <>
                  <span className='text-sm font-medium'>
                    {totalCount.toLocaleString()} norma{totalCount !== 1 ? 's' : ''}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    Página {currentPage} de {totalPages}
                  </span>
                </>
              )}
            </div>

            {/* View Toggle - Mobile */}
            <ToggleGroup
              type='single'
              variant='outline'
              value={view}
              onValueChange={value => {
                if (value) handleViewChange(value as 'list' | 'grid');
              }}
              className='gap-0'
            >
              <ToggleGroupItem
                value='grid'
                aria-label='Vista en cuadrícula'
                size='sm'
                className='rounded-r-none border-r-0'
              >
                <LayoutGrid className='h-4 w-4' />
              </ToggleGroupItem>
              <ToggleGroupItem
                value='list'
                aria-label='Vista en lista'
                size='sm'
                className='rounded-l-none'
              >
                <List className='h-4 w-4' />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Pagination Controls - Mobile (Full Width) */}
          <div className='flex items-center justify-center gap-1 px-4 pb-3'>
            <Button
              variant='outline'
              size='sm'
              className='h-8 w-8 p-0'
              disabled={loading || !hasPrevPage}
              onClick={() => onPageChange(0)}
              title='Primera página'
            >
              <ChevronsLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='h-8 w-8 p-0'
              disabled={loading || !hasPrevPage}
              onClick={() =>
                onPageChange(
                  Math.max(0, (data?.offset || 0) - (data?.limit || 12)),
                )
              }
              title='Página anterior'
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='h-8 w-8 p-0'
              disabled={loading || !hasNextPage}
              onClick={() =>
                onPageChange((data?.offset || 0) + (data?.limit || 12))
              }
              title='Página siguiente'
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='h-8 w-8 p-0'
              disabled={loading || !hasNextPage}
              onClick={() =>
                onPageChange((totalPages - 1) * (data?.limit || 12))
              }
              title='Última página'
            >
              <ChevronsRight className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {/* Desktop Layout - Single Row */}
        <div className='hidden lg:flex items-center justify-between px-6 py-3'>
          <div className='flex items-center gap-4'>
            {loading ? (
              <>
                <Skeleton className='h-5 w-32' />
                <Skeleton className='h-4 w-24' />
              </>
            ) : (
              <>
                <div>
                  <span className='text-sm font-medium'>
                    {totalCount.toLocaleString()} norma{totalCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className='text-xs text-muted-foreground'>
                  Página {currentPage} de {totalPages}
                </div>
              </>
            )}
          </div>

          <div className='flex items-center gap-4'>
            {/* Pagination Controls - Desktop */}
            <div className='flex items-center gap-1'>
              <Button
                variant='outline'
                size='sm'
                className='h-8 w-8 p-0'
                disabled={loading || !hasPrevPage}
                onClick={() => onPageChange(0)}
                title='Primera página'
              >
                <ChevronsLeft className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='h-8 w-8 p-0'
                disabled={loading || !hasPrevPage}
                onClick={() =>
                  onPageChange(
                    Math.max(0, (data?.offset || 0) - (data?.limit || 12)),
                  )
                }
                title='Página anterior'
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='h-8 w-8 p-0'
                disabled={loading || !hasNextPage}
                onClick={() =>
                  onPageChange((data?.offset || 0) + (data?.limit || 12))
                }
                title='Página siguiente'
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='h-8 w-8 p-0'
                disabled={loading || !hasNextPage}
                onClick={() =>
                  onPageChange((totalPages - 1) * (data?.limit || 12))
                }
                title='Última página'
              >
                <ChevronsRight className='h-4 w-4' />
              </Button>
            </div>

            {/* View Toggle - Desktop */}
            <ToggleGroup
              type='single'
              variant='outline'
              value={view}
              onValueChange={value => {
                if (value) handleViewChange(value as 'list' | 'grid');
              }}
              className='gap-0'
            >
              <ToggleGroupItem value='grid' aria-label='Vista en cuadrícula' className='rounded-r-none border-r-0'>
                <LayoutGrid className='size-4' />
              </ToggleGroupItem>
              <ToggleGroupItem value='list' aria-label='Vista en lista' className='rounded-l-none'>
                <List className='size-4' />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      {/* Results Container - Fills space */}
      {loading ? (
        renderLoadingContent()
      ) : view === 'grid' ? (
        <div className='flex-1 overflow-y-auto px-4  py-4 bg-muted/30'>
          <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'>
            {data?.normas.map(norma => (
              <NormaCard 
                key={norma.id} 
                norma={norma} 
                isBookmarked={isBookmarked(norma.infoleg_id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <NormasListView normas={data?.normas || []} isBookmarked={isBookmarked} />
      )}

      {/* Pagination - Fixed at bottom */}
      {totalPages > 1 && (
        <div className='flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3 border-t bg-background'>
          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              onPageChange(Math.max(0, (data?.offset || 0) - (data?.limit || 12)))
            }
            disabled={loading || !hasPrevPage}
          >
            <ChevronLeft className='h-4 w-4 mr-1' />
            Anterior
          </Button>

          <div className='flex items-center gap-1'>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum =
                Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? 'default' : 'outline'}
                  size='sm'
                  onClick={() =>
                    onPageChange((pageNum - 1) * (data?.limit || 12))
                  }
                  className='w-8 h-8 p-0'
                  disabled={loading}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              onPageChange((data?.offset || 0) + (data?.limit || 12))
            }
            disabled={loading || !hasNextPage}
          >
            Siguiente
            <ChevronRight className='h-4 w-4 ml-1' />
          </Button>
        </div>
      )}
    </div>
  );
}
