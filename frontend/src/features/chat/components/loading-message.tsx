import { Loader2Icon } from 'lucide-react';
import SvgEstampa from '@/components/icons/Estampa';

export function LoadingMessage() {
  return (
    <div className='flex justify-start px-2 sm:px-0'>
      <div className='max-w-[85%] sm:max-w-[70%] md:max-w-[60%] text-slate-800 dark:text-slate-200 text-sm'>
        <div className='flex items-center mb-1 gap-2 text-xs text-slate-500 dark:text-slate-400'>
          <SvgEstampa className='h-4 w-4' />
          <span className='font-medium'>Simpla</span>
        </div>
        <div className='flex items-center gap-2'>
          <Loader2Icon className='h-4 w-4 animate-spin text-slate-600 dark:text-slate-400' />
          <span>Simpla está generando una respuesta...</span>
        </div>
      </div>
    </div>
  );
}
