'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { NormasFilter } from '../components/normas-filter';
import { NormasList } from '../components/normas-list';
import { useNormasSearch } from '../hooks/use-normas-search';

export function NormasPage() {
  const { loading, error } = useNormasSearch({ autoSearch: true }); // Only this component triggers initial search

  return (
    <div className='h-[calc(100vh-4rem)] flex flex-col overflow-hidden'>
      {/* Header Section - Fixed */}
      <div className='flex-shrink-0 border-b bg-background px-4 md:px-6 py-4'>
        <div className='text-start space-y-1'>
          <h1 className='text-2xl md:text-3xl font-bold font-serif'>
            Explorador de Normas
          </h1>
          <p className='text-muted-foreground text-xs md:text-sm'>
            Busca y explora la base de datos de normas legales argentinas
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant='destructive' className='mt-3'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2'>
              <span className='text-sm'>{error}</span>
              <Button
                variant='outline'
                size='sm'
                onClick={() => window.location.reload()}
                className='w-full sm:w-auto'
              >
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Content - Different layouts for mobile vs desktop */}
      <div className='flex-1 flex flex-col lg:flex-row overflow-hidden'>
        {/* Filter Section - Top on mobile, Sidebar on desktop */}
        <div className='lg:w-80 lg:flex-shrink-0 lg:border-r bg-muted'>
          {/* Mobile: Collapsible at top */}
          <div className='lg:hidden border-b'>
            <div className='p-4'>
              <NormasFilter loading={loading} />
            </div>
          </div>

          {/* Desktop: Sticky sidebar */}
          <div className='hidden lg:block overflow-y-auto h-full'>
            <div className='p-6'>
              <NormasFilter loading={loading} />
            </div>
          </div>
        </div>

        {/* Results Section - Fills remaining space */}
        <div className='flex-1 overflow-hidden'>
          <NormasList />
        </div>
      </div>
    </div>
  );
}
