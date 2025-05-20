import SvgEstampa from '@/components/icons/Estampa';
import type { Message } from '../types';

interface MessageItemProps {
  message: Message;
  formatTime: (date: Date) => string;
}

export function MessageItem({ message, formatTime }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${
        isUser ? 'justify-end' : 'justify-start'
      } px-3 sm:px-4`}
    >
      {isUser ? (
        <div className='max-w-[85%] sm:max-w-[70%] md:max-w-[60%] bg-slate-700 text-white px-4 py-2 rounded-3xl text-base leading-relaxed'>
          <div className='whitespace-pre-wrap'>
            {message.displayedText ?? message.text}
          </div>
        </div>
      ) : (
        <div className='max-w-[85%] sm:max-w-[70%] md:max-w-[60%] text-slate-800 dark:text-slate-200 text-base leading-relaxed'>
          <div className='flex items-center mb-2 gap-2 text-sm text-slate-500 dark:text-slate-400'>
            <SvgEstampa className='h-5 w-5' />
            <span className='font-semibold'>Simpla</span>
          </div>
          <div className='whitespace-pre-wrap'>
            {message.displayedText ?? message.text}
          </div>
        </div>
      )}
    </div>
  );
}
