import type { RefObject } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageItem } from './message-item';
import { LoadingMessage } from './loading-message';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  formatTime: (date: Date) => string;
  scrollAreaRef: RefObject<HTMLDivElement | null>;
}

export function MessageList({
  messages,
  isLoading,
  formatTime,
  scrollAreaRef,
}: MessageListProps) {
  return (
    <ScrollArea ref={scrollAreaRef} className='h-full'>
      <div className='space-y-6 pt-6 pb-6 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'>
        {messages.map((msg, index) => (
          <MessageItem key={index} message={msg} formatTime={formatTime} />
        ))}
        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1]?.role === 'user' && <LoadingMessage />}
      </div>
    </ScrollArea>
  );
}
