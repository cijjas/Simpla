'use client';

import { useEffect, type RefObject } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowUp,
  Loader2Icon,
  // Ensure other icons like PlusCircle, SearchIconLucide, etc., are re-added if used elsewhere
  // For this specific layout, they weren't in the immediate structure.
} from 'lucide-react';
import { motion } from 'framer-motion';
import { RagScopeDialog } from './rag-scope-dialog';
import { WelcomeScreen } from './welcome-screen'; // WelcomeScreen will be used here

interface ChatInputProps {
  question: string;
  setQuestion: (question: string) => void;
  send: () => void;
  isLoading: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  selectedProvinces: string[];
  toggleProvince: (province: string) => void;
  clearProvinces: () => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  hasMessages: boolean; // This prop determines WelcomeScreen visibility and ChatInput position
}

export function ChatInput({
  question,
  setQuestion,
  send,
  isLoading,
  textareaRef,
  selectedProvinces,
  toggleProvince,
  clearProvinces,
  dialogOpen,
  setDialogOpen,
  hasMessages,
}: ChatInputProps) {
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [question, textareaRef]);

  return (
    <motion.div
      initial={false}
      animate={{
        position: 'absolute',
        bottom: hasMessages ? '0rem' : 'auto',
        top: hasMessages ? 'auto' : 'calc(50% - 80px)',
        // Center vertically when no messages
        left: 0,
        right: 0,
      }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      // pointer-events-none on the motion.div allows clicks to pass through
      // to messages when it's at the bottom but spans full width.
      // pointer-events-auto will be set on the actual content.
      className='z-20 w-full pointer-events-none'
    >
      {/* This inner div handles the actual content and re-enables pointer events */}
      <div className='max-w-4xl mx-auto px-4 pointer-events-auto'>
        {/* Flex container to stack WelcomeScreen and InputArea */}
        <div className='flex flex-col items-center'>
          {!hasMessages && <WelcomeScreen />}

          {/* Input Area Wrapper - apply w-full to this if you want it to span */}
          <div
            className={`w-full max-w-4xl mx-auto ${
              hasMessages ? 'pb-4' : 'pb-0'
            }`}
          >
            <div className='relative flex flex-col rounded-2xl border border-border bg-card shadow-sm dark:shadow-none'>
              <div className='flex w-full items-end px-4 py-3'>
                <div className='flex flex-col w-full'>
                  <textarea
                    ref={textareaRef}
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder='Pregunta algo...'
                    rows={1}
                    disabled={isLoading}
                    className='w-full resize-none overflow-hidden bg-transparent border-none outline-none ring-0 text-foreground placeholder:text-muted-foreground text-base leading-relaxed max-h-[240px] min-h-[1.5rem]'
                  />
                </div>
              </div>

              <div className='flex items-center justify-between px-4 pb-3 pt-1 gap-2 '>
                <div className='flex items-center gap-2 overflow-x-auto'>
                  <RagScopeDialog
                    selectedProvinces={selectedProvinces}
                    toggleProvince={toggleProvince}
                    clearProvinces={clearProvinces}
                    dialogOpen={dialogOpen}
                    setDialogOpen={setDialogOpen}
                  />
                </div>

                <div className='ms-3 flex-shrink-0'>
                  <Button
                    onClick={send}
                    disabled={isLoading || !question.trim()}
                    size='icon'
                    className='h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90'
                    aria-label='Enviar mensaje'
                  >
                    {isLoading ? (
                      <Loader2Icon className='h-4 w-4 animate-spin' />
                    ) : (
                      <ArrowUp className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Disclaimer message - only shown when messages exist and input is at the bottom */}
            {hasMessages && (
              <div className='text-center mt-3 px-4'>
                <p className='text-xs text-muted-foreground'>
                  Simpla puede equivocarse, recomendamos verificar la
                  información.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
