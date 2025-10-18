'use client';
import { NormasFilter } from '../components/list/normas-filter';
import { NormasList } from '../components/list/normas-list';
import { useNormasSearch } from '../hooks/use-normas-search';

export function NormasPage() {
  const { loading } = useNormasSearch({ autoSearch: true }); // Only this component triggers initial search

  return (
    <div className='flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden'>
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
