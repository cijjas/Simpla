import { Loader } from '@/components/prompt-kit/loader';

export function LoadingMessage() {
  return (
    <div className='flex justify-start p-3 '>
      <div className='max-w-[85%] sm:max-w-[70%] md:max-w-[60%] text-foreground text-sm'>
        <div className='flex items-center gap-2'>
          <Loader variant='pulse-dot' size='md' />
          <Loader variant='text-shimmer' size='md' text='Pensando...' />
        </div>
      </div>
    </div>
  );
}
