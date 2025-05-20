'use client';

import { useChat } from '@/features/chat/hooks/use-chat';
import { MessageList } from '@/features/chat/components/message-list';
import { WelcomeScreen } from '@/features/chat/components/welcome-screen';
import { ChatInput } from '@/features/chat/components/chat-input';

export default function ChatPage() {
  const {
    question,
    setQuestion,
    messages,
    selectedProvinces,
    popoverOpen,
    setPopoverOpen,
    isLoading,
    scrollAreaRef,
    textareaRef,
    toggleProvince,
    clearProvinces,
    send,
    formatTime,
  } = useChat();

  return (
    <div className='flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900'>
      <div className='flex flex-col h-full relative'>
        <div className='flex-1 overflow-hidden'>
          {messages.length > 0 ? (
            <MessageList
              messages={messages}
              isLoading={isLoading}
              formatTime={formatTime}
              scrollAreaRef={scrollAreaRef}
            />
          ) : (
            <WelcomeScreen />
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
          popoverOpen={popoverOpen}
          setPopoverOpen={setPopoverOpen}
          hasMessages={messages.length > 0}
        />
      </div>
    </div>
  );
}
