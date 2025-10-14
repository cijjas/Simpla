'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LayoutGrid, List, Bookmark } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import ResultCard from '@/features/infoleg/busqueda/norma-card';
import ResultListItem from '@/features/infoleg/busqueda/norma-list-item';
import type { NormaItem } from '@/features/infoleg/utils/types';

interface BookmarkResultsProps {
  bookmarks: NormaItem[];
  view: 'list' | 'grid';
  onViewChange: (view: 'list' | 'grid') => void;
  loading?: boolean;
  error?: string | null;
}

export function BookmarkResults({
  bookmarks,
  view,
  onViewChange,
  loading,
  error,
}: BookmarkResultsProps) {
  // Loading state
  if (loading) {
    return (
      <div className='space-y-4'>
        <div className='flex justify-between items-center'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-10 w-24' />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className='h-48 w-full' />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (bookmarks.length === 0) {
    return (
      <Card className='border-dashed'>
        <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
          <div className='p-4 rounded-full bg-muted mb-4'>
            <Bookmark className='h-8 w-8 text-muted-foreground' />
          </div>
          <h3 className='text-lg font-semibold mb-2'>No tienes guardados</h3>
          <p className='text-muted-foreground max-w-md'>
            Cuando guardes normas, aparecerán acá para que puedas acceder a
            ellas rápidamente.
          </p>
          <p className='text-sm text-muted-foreground mt-2'>
            Busca normas en la sección{' '}
            <a href='/busqueda' className='text-primary hover:underline'>
              Búsqueda
            </a>{' '}
            y guárdalas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header with count and view toggle */}
      <div className='flex justify-between items-center'>
        <p className='text-sm text-muted-foreground'>
          {bookmarks.length}{' '}
          {bookmarks.length === 1 ? 'norma guardada' : 'normas guardadas'}
        </p>

        <ToggleGroup
          type='single'
          value={view}
          onValueChange={(value: 'list' | 'grid') => {
            if (value) onViewChange(value);
          }}
          className='border rounded-md'
        >
          <ToggleGroupItem value='grid' aria-label='Vista en grilla'>
            <LayoutGrid className='h-4 w-4' />
          </ToggleGroupItem>
          <ToggleGroupItem value='list' aria-label='Vista en lista'>
            <List className='h-4 w-4' />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Results */}
      {view === 'grid' ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {bookmarks.map(norma => (
            <ResultCard key={norma.id} norma={norma} />
          ))}
        </div>
      ) : (
        <div className='space-y-2'>
          {bookmarks.map(norma => (
            <ResultListItem key={norma.id} norma={norma} />
          ))}
        </div>
      )}
    </div>
  );
}
