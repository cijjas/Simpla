'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { Card, CardContent } from '@/components/ui/card'; // Assuming CardFooter is not directly used for this new layout
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  SendIcon,
  Loader2Icon,
  PlusCircle,
  Search as SearchIconLucide,
  Zap,
  ImageIcon as ImageIconLucide,
  MoreHorizontal,
  Mic,
  ArrowUp,
  SearchIcon,
  ImageIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatInputProps {
  question: string;
  setQuestion: (question: string) => void;
  send: () => void;
  isLoading: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  // Props for ProvinceSelector are kept in interface if ChatInput still manages their state
  selectedProvinces: string[];
  toggleProvince: (province: string) => void;
  clearProvinces: () => void;
  popoverOpen: boolean;
  setPopoverOpen: (open: boolean) => void;
  hasMessages: boolean; // Kept, assuming it might be used elsewhere or by parent
}

export function ChatInput({
  question,
  setQuestion,
  send,
  isLoading,
  textareaRef,
  selectedProvinces, // These ProvinceSelector props are unused in this specific render
  toggleProvince, // but kept in the interface for completeness if the component
  clearProvinces, // still handles this logic.
  popoverOpen,
  setPopoverOpen,
  hasMessages,
}: ChatInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [question]);

  return (
    <motion.div
      initial={false}
      animate={{
        position: 'absolute',
        bottom: hasMessages ? '0rem' : 'auto',
        top: hasMessages ? 'auto' : 'calc(50% - 80px)', // a bit below WelcomeScreen
        left: 0,
        right: 0,
      }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className='z-20 w-full'
    >
      <div className='max-w-4xl mx-auto px-4 pointer-events-auto'>
        <div className='max-w-4xl mx-auto pb-4 px-4'>
          <div className='relative flex flex-col rounded-2xl border border-border bg-card shadow-sm dark:shadow-none'>
            {/* Textarea */}
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
                  className='
                w-full resize-none overflow-hidden
                bg-transparent border-none outline-none ring-0
                text-foreground placeholder:text-muted-foreground
                text-base leading-relaxed
                max-h-[240px] min-h-[1.5rem]
              '
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex items-center justify-between px-4 pb-3 pt-1 gap-2 '>
              <div className='flex items-center gap-2 overflow-x-auto'>
                <Button variant='ghost' size='icon' className='w-8 h-8'>
                  <PlusCircle size={18} />
                </Button>
              </div>

              {/* Submit */}
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

          {hasMessages && (
            <div className='text-center mt-3 px-4'>
              <p className='text-xs text-muted-foreground'>
                Simpla puede equivocarse, recomendamos verificar la información.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
