'use client';

import { useState, useEffect, useRef } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LayoutGrid, List, Eye, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { NormaCard } from '@/features/normas/components/list/norma-card';
import { useBookmarks } from '../hooks/use-bookmarks';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SvgSearch from '@/components/icons/Search';
import Link from 'next/link';
import { Kbd } from '@/components/ui/kbd';

export function BookmarkPage() {
  const { bookmarks, loading, loadingMore, hasMore, totalCount, loadMore } =
    useBookmarks({ pageSize: 12, skipStatusCheck: true });
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const observerTarget = useRef<HTMLDivElement>(null);

  // Load view preference from memory
  useEffect(() => {
    const saved = sessionStorage.getItem('bookmarkViewPreference');
    if (saved === 'list' || saved === 'grid') {
      setView(saved);
    }
  }, []);

  // Save view preference to memory
  const handleViewChange = (newView: 'list' | 'grid') => {
    if (newView) {
      setView(newView);
      sessionStorage.setItem('bookmarkViewPreference', newView);
    }
  };

  // Infinite scroll implementation
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          console.log('Loading more bookmarks...');
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, loadMore]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificada';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <div className='flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden'>
      {/* Header Section - Fixed */}
      <div className='flex-shrink-0 border-b bg-background px-4 md:px-6 py-4'>
        <div className='text-start space-y-1'>
          <h1 className='text-2xl md:text-3xl font-bold font-serif'>
            Mis Guardados
          </h1>
          <p className='text-muted-foreground text-xs md:text-sm'>
            Accedé rápidamente a las normas que guardaste
          </p>
        </div>
      </div>

      {/* Results Content - Fills remaining space */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Results Header with View Toggle - Fixed */}
        <div className='flex-shrink-0 border-b bg-background'>
          {/* Mobile Layout */}
          <div className='lg:hidden'>
            <div className='flex items-center justify-between px-4 py-3'>
              <div className='flex flex-col gap-1'>
                {loading ? (
                  <Skeleton className='h-5 w-32' />
                ) : (
                  <>
                    <span className='text-sm font-medium'>
                      {totalCount} norma{totalCount !== 1 ? 's' : ''}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {totalCount === 1 ? 'guardada' : 'guardadas'}
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
                className='gap-1'
              >
                <ToggleGroupItem
                  value='grid'
                  aria-label='Vista en cuadrícula'
                  size='sm'
                >
                  <LayoutGrid className='size-4' />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value='list'
                  aria-label='Vista en lista'
                  size='sm'
                >
                  <List className='size-4' />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className='hidden lg:flex items-center justify-between px-6 py-3'>
            <div className='flex items-center gap-4'>
              {loading ? (
                <Skeleton className='h-5 w-40' />
              ) : (
                <span className='text-sm font-medium'>
                  {totalCount} norma{totalCount !== 1 ? 's' : ''}{' '}
                  {totalCount === 1 ? 'guardada' : 'guardadas'}
                </span>
              )}
            </div>

            {/* View Toggle - Desktop */}
            <ToggleGroup
              type='single'
              variant='outline'
              value={view}
              onValueChange={value => {
                if (value) handleViewChange(value as 'list' | 'grid');
              }}
            >
              <ToggleGroupItem value='grid' aria-label='Vista en cuadrícula'>
                <LayoutGrid className='size-4' />
              </ToggleGroupItem>
              <ToggleGroupItem value='list' aria-label='Vista en lista'>
                <List className='size-4' />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Results Container - Scrollable */}
        {loading && bookmarks.length === 0 ? (
          view === 'grid' ? (
            <div className='flex-1 overflow-y-auto px-4  py-4 bg-muted/30'>
              <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'>
                {Array.from({ length: 12 }).map((_, i) => (
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
              </div>
            </div>
          ) : (
            <div className='flex-1 overflow-hidden'>
              <div className='sticky top-0 z-10 bg-muted/50 backdrop-blur-sm border-b'>
                <div className='grid grid-cols-12 gap-4 px-4 py-3'>
                  <Skeleton className='h-4 w-20 col-span-5' />
                  <Skeleton className='h-4 w-16 col-span-2' />
                  <Skeleton className='h-4 w-16 col-span-2' />
                  <Skeleton className='h-4 w-16 col-span-2' />
                  <Skeleton className='h-4 w-16 col-span-1' />
                </div>
              </div>
              <div className='divide-y divide-border'>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className='grid grid-cols-12 gap-4 px-4 py-3'>
                    <div className='col-span-5 space-y-2'>
                      <Skeleton className='h-4 w-full' />
                      <Skeleton className='h-3 w-2/3' />
                    </div>
                    <div className='col-span-2 flex items-center gap-2'>
                      <Skeleton className='h-6 w-16' />
                    </div>
                    <Skeleton className='h-4 w-24 col-span-2' />
                    <Skeleton className='h-4 w-20 col-span-2' />
                    <div className='col-span-1 flex justify-end gap-1'>
                      <Skeleton className='h-8 w-8' />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : bookmarks.length === 0 ? (
          // Empty State
          <section className='relative flex flex-col items-center justify-center h-full overflow-hidden px-4 md:px-6 py-4'>
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
              <div className='flex flex-col items-center text-center space-y-6 bg-background/95 backdrop-blur-sm rounded-2xl p-8 border shadow-lg'>
                {/* Icon */}
                <SvgSearch className='size-56 text-muted-foreground/60' />
                {/* Text Content */}
                <div className='space-y-3 max-w-md'>
                  <h2 className='text-2xl sm:text-3xl font-serif font-bold tracking-tight'>
                    No tenés guardados
                  </h2>

                  <p className='text-sm sm:text-base leading-relaxed text-muted-foreground'>
                    Cuando guardes normas, aparecerán acá para que puedas
                    acceder a ellas rápidamente.
                  </p>

                  <p className='text-sm leading-relaxed text-muted-foreground pt-2'>
                    Busca normas en la sección{' '}
                    <Link
                      href='/normas'
                      className='text-primary dark:text-stone-100 hover:underline font-medium'
                    >
                      Búsqueda
                    </Link>{' '}
                    (o presiona <Kbd className='rounded border '>Cmd+K</Kbd>){' '}
                    y guárdalas para comenzar.
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : view === 'grid' ? (
          <div className='flex-1 overflow-y-auto px-4  py-4 bg-muted/30'>
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'>
              {bookmarks.map(norma => (
                <NormaCard
                  key={norma.infoleg_id}
                  norma={norma}
                  isBookmarked={true}
                />
              ))}
            </div>

            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className='h-10 w-full'>
              {loadingMore && (
                <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4'>
                  {Array.from({ length: 3 }).map((_, i) => (
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
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className='flex-1 overflow-y-auto'>
            {/* Table Header */}
            <div className='sticky top-0 z-10 bg-muted/50 backdrop-blur-sm border-b'>
              <div className='grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
                <div className='col-span-5'>Título</div>
                <div className='col-span-2'>Fecha Publicación</div>
                <div className='col-span-2'>Tipo</div>
                <div className='col-span-2'>Boletín Oficial</div>
                <div className='col-span-1 text-right'>Acciones</div>
              </div>
            </div>

            {/* Table Rows */}
            <div className='divide-y divide-border'>
              {bookmarks.map((norma, index) => (
                <div
                  key={norma.infoleg_id}
                  className={`grid grid-cols-12 gap-4 px-4 py-3 transition-colors cursor-pointer group ${
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/80'
                  } hover:bg-muted/50`}
                  onClick={() =>
                    (window.location.href = `/normas/${norma.infoleg_id}`)
                  }
                >
                  {/* Title Column */}
                  <div className='col-span-5 flex flex-col gap-1 min-w-0'>
                    <h3 className='text-sm font-serif font-bold text-foreground truncate group-hover:text-primary'>
                      {norma.titulo_resumido ||
                        norma.titulo_sumario ||
                        'Sin título'}
                    </h3>
                  </div>

                  {/* Date Column */}
                  <div className='col-span-2 flex items-center text-sm text-muted-foreground'>
                    {norma.publicacion ? (
                      <span>{formatDate(norma.publicacion)}</span>
                    ) : (
                      <span className='text-xs'>-</span>
                    )}
                  </div>

                  {/* Type Column */}
                  <div className='col-span-2 flex items-center text-sm text-muted-foreground'>
                    {norma.tipo_norma ? (
                      <span>{norma.tipo_norma}</span>
                    ) : (
                      <span className='text-xs'>-</span>
                    )}
                  </div>

                  {/* Boletín Column */}
                  <div className='col-span-2 flex items-center text-sm text-muted-foreground'>
                    {norma.nro_boletin ? (
                      <span className='truncate'>
                        B.O. {norma.nro_boletin}
                        {norma.pag_boletin ? ` • pág. ${norma.pag_boletin}` : ''}
                      </span>
                    ) : (
                      <span className='text-xs'>-</span>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className='col-span-1 flex items-center justify-end gap-1'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
                      onClick={e => {
                        e.stopPropagation();
                        window.location.href = `/normas/${norma.infoleg_id}`;
                      }}
                    >
                      <Eye className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
                      onClick={e => {
                        e.stopPropagation();
                        window.open(
                          `https://www.argentina.gob.ar/normativa/nacional/${norma.infoleg_id}`,
                          '_blank',
                        );
                      }}
                    >
                      <ExternalLink className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Infinite scroll trigger for list view */}
              <div ref={observerTarget} className='h-10 w-full py-4'>
                {loadingMore && (
                  <div className='divide-y divide-border'>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className='grid grid-cols-12 gap-4 px-4 py-3'>
                        <div className='col-span-5 space-y-2'>
                          <Skeleton className='h-4 w-full' />
                          <Skeleton className='h-3 w-2/3' />
                        </div>
                        <div className='col-span-2 flex items-center gap-2'>
                          <Skeleton className='h-6 w-16' />
                        </div>
                        <Skeleton className='h-4 w-24 col-span-2' />
                        <Skeleton className='h-4 w-20 col-span-2' />
                        <div className='col-span-1 flex justify-end gap-1'>
                          <Skeleton className='h-8 w-8' />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
