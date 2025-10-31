'use client';
import { useState } from 'react';
import { NormasFilter } from '../components/list/normas-filter';
import { NormasList } from '../components/list/normas-list';
import { useNormasSearch } from '../hooks/use-normas-search';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function NormasPage() {
  const { loading } = useNormasSearch({ autoSearch: true });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <div className='flex flex-col min-h-[calc(100vh-3.5rem)] h-[calc(100vh-3.5rem)] overflow-hidden'>
      {/* Header Section - Fixed */}
      <div className='flex-shrink-0 border-b bg-background'>
        <div className='px-4 md:px-6 py-3 md:py-4'>
          <div className='text-start space-y-2 md:space-y-1'>
            <h1 className='text-xl md:text-2xl lg:text-3xl font-bold font-serif'>
              Explorador de Normas
            </h1>
            <p className='text-muted-foreground text-xs md:text-sm hidden md:block'>
              Busca y explora la base de datos de normas legales argentinas
            </p>
          </div>
        </div>

        {/* Mobile: Search Bar at Top */}
        <div className='lg:hidden border-t bg-background px-4 py-3'>
          <div className='flex gap-2 items-stretch'>
            <div className='flex-1 min-w-0'>
              <NormasFilter 
                loading={loading} 
                mobileMode={true}
                onFilterApplied={() => setMobileFiltersOpen(false)}
              />
            </div>
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-10 px-3 flex-shrink-0'
                  aria-label='Filtros'
                >
                  <Filter className='h-4 w-4 mr-1.5' />
                  <span>Filtros</span>
                </Button>
              </SheetTrigger>
              <SheetContent side='bottom' className='h-[85vh] overflow-y-auto px-6'>
                <SheetHeader className='mb-6 px-0'>
                  <SheetTitle className='font-bold font-serif'>Filtros de búsqueda</SheetTitle>
                  <SheetDescription>
                    Ajusta los filtros para refinar tu búsqueda
                  </SheetDescription>
                </SheetHeader>
                <div className='px-2 pb-6'>
                  <NormasFilter 
                    loading={loading} 
                    mobileMode={false}
                    onFilterApplied={() => setMobileFiltersOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main Content - Different layouts for mobile vs desktop */}
      <div className='flex-1 flex flex-col lg:flex-row overflow-hidden'>
        {/* Filter Section - Desktop Sidebar Only */}
        <div className='hidden lg:block lg:w-80 lg:flex-shrink-0 lg:border-r bg-background overflow-y-auto'>
          <div className='p-6'>
            <NormasFilter loading={loading} mobileMode={false} />
          </div>
        </div>

        {/* Results Section - Fills remaining space */}
        <div className='flex-1 overflow-hidden bg-muted/30'>
          <NormasList />
        </div>
      </div>
    </div>
  );
}
