import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='container mx-auto px-4 sm:px-6 md:px-0 grid grid-cols-1 gap-6 py-6 md:grid-cols-3'>
      {/* Sidebar skeleton (SearchForm) */}
      <aside className='md:col-span-1 space-y-4'>
        <Skeleton className='h-6 w-2/3' /> {/* Form title */}
        <div className='space-y-3'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className='h-10 w-full rounded-md' />
          ))}
        </div>
        <div className='flex gap-2'>
          <Skeleton className='h-10 w-24 rounded-md' />
          <Skeleton className='h-10 flex-1 rounded-md' />
        </div>
      </aside>

      {/* Main content skeleton (Results) */}
      <main className='md:col-span-2 space-y-4'>
        <div className='flex justify-between items-center'>
          <Skeleton className='h-5 w-1/3' /> {/* Result count */}
          <div className='flex gap-2'>
            <Skeleton className='h-8 w-8 rounded-md' />
            <Skeleton className='h-8 w-8 rounded-md' />
          </div>
        </div>

        {/* Results grid or list */}
        <section className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className='rounded-xl border bg-card p-4 shadow animate-pulse flex flex-col gap-4'
            >
              <Skeleton className='h-36 w-full rounded-md' />
              <Skeleton className='h-6 w-3/4' />
              <Skeleton className='h-4 w-1/2' />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
