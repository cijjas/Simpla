import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <section className='container mx-auto max-w-4xl py-10 space-y-10'>
      {/* Header */}
      <div className='space-y-6'>
        {/* Title and Actions */}
        <div className='flex items-center justify-between flex-wrap gap-4'>
          <Skeleton className='h-8 w-3/4' />
          <div className='flex gap-2'>
            <Skeleton className='h-10 w-10 rounded-md' />
            <Skeleton className='h-10 w-10 rounded-md' />
            <Skeleton className='h-10 w-10 rounded-md' />
          </div>
        </div>

        {/* Metadata */}
        <div className='flex flex-wrap items-center gap-4'>
          <Skeleton className='h-5 w-20 rounded-full' />
          <Skeleton className='h-5 w-24 rounded-full' />
          <Skeleton className='h-5 w-36' />
          <Skeleton className='h-5 w-32' />
          <Skeleton className='h-5 w-28' />
          <Skeleton className='h-5 w-40' />
        </div>

        {/* Accordion + Summary */}
        <div className='space-y-4'>
          {/* Accordion headers */}
          <Skeleton className='h-6 w-40' />
          <Skeleton className='h-6 w-40' />

          {/* Summary quote */}
          <div className='border-l-4 border-primary pl-4 space-y-2'>
            <Skeleton className='h-5 w-3/4' />
            <Skeleton className='h-5 w-2/3' />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className='space-y-4'>
        <Skeleton className='h-5 w-full' />
        <Skeleton className='h-5 w-[90%]' />
        <Skeleton className='h-5 w-[95%]' />
        <Skeleton className='h-5 w-[85%]' />
        <Skeleton className='h-5 w-[70%]' />
        <Skeleton className='h-5 w-full' />
        <Skeleton className='h-5 w-[90%]' />
      </div>
    </section>
  );
}
