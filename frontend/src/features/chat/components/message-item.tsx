import SvgEstampa from '@/components/icons/Estampa';
import type { Message } from '../types';

interface MessageItemProps {
  message: Message;
  formatTime?: (date: Date) => string;
}

export function MessageItem({ message, formatTime: _formatTime }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} `}>
      {isUser ? (
        <div className='max-w-[85%] sm:max-w-[70%] md:max-w-[60%] bg-slate-700 text-white px-4 py-2 rounded-3xl text-base leading-relaxed'>
          <div className='whitespace-pre-wrap'>
            {message.displayedText ?? message.text}
          </div>
        </div>
      ) : (
        <div className='max-w-[100%] sm:max-w-[100%] md:max-w-[100%] text-slate-800 dark:text-slate-200 text-sm'>
          <div className='flex items-center mb-1 gap-2 text-xs text-slate-500 dark:text-slate-400'>
            <SvgEstampa className='h-4 w-4' />
            <span className='font-medium'>Simpla</span>
          </div>
          <div className='flex items-center gap-2 whitespace-pre-wrap'>
            {message.displayedText ?? message.text}
          </div>
        </div>
      )}
    </div>
  );
}
