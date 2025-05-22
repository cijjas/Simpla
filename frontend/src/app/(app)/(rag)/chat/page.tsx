'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@/features/chat/hooks/use-chat';
import { WelcomeScreen } from '@/features/chat/components/welcome-screen';
import { ChatInput } from '@/features/chat/components/chat-input';
import { MessageItem } from '@/features/chat/components/message-item';
import { LoadingMessage } from '@/features/chat/components/loading-message';

export default function ChatPage() {
  const {
    question,
    setQuestion,
    messages,
    selectedProvinces,
    // popoverOpen, // Old
    // setPopoverOpen, // Old
    dialogOpen, // New
    setDialogOpen, // New
    isLoading,
    textareaRef,
    toggleProvince,
    clearProvinces,
    send,
    formatTime,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const hasMessages = messages.length > 0;

  return (
    <div className='relative h-full w-full overflow-hidden'>
      <div className='absolute inset-0 overflow-y-auto z-0'>
        {hasMessages && (
          <div className='space-y-6 pt-6 pb-[300px] max-w-4xl mx-auto sm:px-6 lg:px-8'>
            {messages.map((msg, index) => (
              <MessageItem key={index} message={msg} formatTime={formatTime} />
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <LoadingMessage />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput
        question={question}
        setQuestion={setQuestion}
        send={send}
        isLoading={isLoading}
        textareaRef={textareaRef}
        selectedProvinces={selectedProvinces}
        toggleProvince={toggleProvince}
        clearProvinces={clearProvinces}
        // popoverOpen={popoverOpen} // Old
        // setPopoverOpen={setPopoverOpen} // Old
        dialogOpen={dialogOpen} // New
        setDialogOpen={setDialogOpen} // New
        hasMessages={hasMessages}
      />
    </div>
  );
}
