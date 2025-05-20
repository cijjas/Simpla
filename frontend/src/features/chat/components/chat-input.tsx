'use client';

import type { RefObject } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SendIcon, Loader2Icon } from 'lucide-react';
import { ProvinceSelector } from './province-selector';

interface ChatInputProps {
  question: string;
  setQuestion: (question: string) => void;
  send: () => void;
  isLoading: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  selectedProvinces: string[];
  toggleProvince: (province: string) => void;
  clearProvinces: () => void;
  popoverOpen: boolean;
  setPopoverOpen: (open: boolean) => void;
  hasMessages: boolean;
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
  popoverOpen,
  setPopoverOpen,
  hasMessages,
}: ChatInputProps) {
  return (
    <div
      className={`absolute inset-x-0 ${
        !hasMessages ? 'top-1/2 -translate-y-1/2' : 'bottom-0'
      } transition-all duration-500 ease-in-out`}
    >
      <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'>
        <Card className='mb-4'>
          <CardContent className='py-0 px-4'>
            <div className='relative flex items-end gap-2'>
              <ProvinceSelector
                selectedProvinces={selectedProvinces}
                toggleProvince={toggleProvince}
                clearProvinces={clearProvinces}
                popoverOpen={popoverOpen}
                setPopoverOpen={setPopoverOpen}
              />

              <Textarea
                ref={textareaRef}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={
                  !hasMessages
                    ? 'Escribe tu consulta aquí...'
                    : 'Escribe tu mensaje...'
                }
                className='flex-1 resize-none min-h-[40px] sm:min-h-[44px] max-h-[150px] sm:max-h-[200px] overflow-y-auto rounded-lg border-input bg-white dark:bg-slate-700/50 px-3 py-2.5 text-sm focus-visible:ring-slate-500'
                rows={1}
                disabled={isLoading}
              />
              <Button
                onClick={send}
                disabled={isLoading || !question.trim()}
                size='icon'
                className='flex-shrink-0 h-10 w-10 sm:h-11 sm:w-11 bg-slate-700 hover:bg-slate-800'
                aria-label='Enviar mensaje'
              >
                {isLoading ? (
                  <Loader2Icon className='h-4 w-4 sm:h-5 sm:w-5 animate-spin' />
                ) : (
                  <SendIcon className='h-4 w-4 sm:h-5 sm:w-5' />
                )}
              </Button>
            </div>
          </CardContent>
          <CardFooter className='px-4 py-2 text-center'>
            <p className='text-xs text-muted-foreground w-full'>
              Simpla puede cometer errores, revisa información importante.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
