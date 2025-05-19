'use client';

import type React from 'react';

import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar } from '@/components/ui/avatar';
import {
  SendIcon,
  XIcon,
  CheckIcon,
  Loader2Icon,
  FilterIcon,
  Quote,
} from 'lucide-react';
import Image from 'next/image';
import SvgEstampa from '@/components/icons/Estampa';
import Logo from '@/components/icons/Logo';

type Message = {
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
  isTyping?: boolean;
  displayedText?: string;
};

const ALL_PROVINCES = [
  'Jujuy',
  'La Nación Argentina',
  'La Rioja',
  'La Provincia Del Chubut',
  'Entre Rios',
  'Corrientes',
  'Neuquen',
  'Tucumán',
  'Santiago Del Estero',
  'Formosa',
  'Cordoba',
  'Santa Cruz',
  'Buenos Aires',
  'La Pampa',
  'La Provincia Del Chaco',
  'Tierra Del Fuego Antártida E Islas Del Atlántico Sur',
  'Rio Negro',
  'Catamarca',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Fe',
  'Misiones',
  'Mendoza',
];

export default function ChatPage() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const toggleProvince = (province: string) => {
    setSelectedProvinces(prev =>
      prev.includes(province)
        ? prev.filter(p => p !== province)
        : [...prev, province],
    );
  };

  const send = async () => {
    if (!question.trim() || isLoading) return;

    const q = question;
    const newUserMessage: Message = {
      role: 'user',
      text: q,
      timestamp: new Date(),
    };
    setMessages(m => [...m, newUserMessage]);
    setQuestion('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          provinces: selectedProvinces,
        }),
      });

      const { answer } = await res.json();
      setMessages(m => [
        ...m,
        {
          role: 'bot',
          text: answer,
          timestamp: new Date(),
          isTyping: true,
          displayedText: '',
        },
      ]);
    } catch (error) {
      setMessages(m => [
        ...m,
        {
          role: 'bot',
          text: 'Hubo un error generando la respuesta. Por favor, intenta nuevamente.',
          timestamp: new Date(),
          isTyping: true,
          displayedText: '',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]',
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Typing animation effect
  useEffect(() => {
    const typingMessages = messages.filter(m => m.isTyping && m.role === 'bot');

    if (typingMessages.length === 0) return;

    const currentMessage = typingMessages[0];
    const fullText = currentMessage.text;
    const currentText = currentMessage.displayedText || '';

    if (currentText.length < fullText.length) {
      const timeoutId = setTimeout(() => {
        setMessages(prevMessages =>
          prevMessages.map(m =>
            m === currentMessage
              ? {
                  ...m,
                  displayedText: fullText.substring(0, currentText.length + 1),
                  isTyping: currentText.length + 1 < fullText.length,
                }
              : m,
          ),
        );
      }, 15); // Speed of typing

      return () => clearTimeout(timeoutId);
    }
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='flex h-screen flex-col'>
      {/* Header with logo */}
      <header className='border-b bg-background px-4 py-3 shadow-sm'>
        <div className='mx-auto flex max-w-screen-xl items-center justify-between'>
          <div className='flex items-center gap-3'>
            <SvgEstampa className='h-[1.5rem] w-auto' />

            <h1 className='text-xl font-semibold font-serif'>SIMPRAG</h1>
          </div>
        </div>
      </header>

      {/* Chat messages area */}
      <div className='flex-1 overflow-hidden'>
        <ScrollArea className='h-full' ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div>
              {messages.map((message, index) => (
                <MessageRow
                  key={index}
                  message={message}
                  formatTime={formatTime}
                />
              ))}

              {isLoading && (
                <div className='border-b bg-muted/20 py-8'>
                  <div className='mx-auto flex max-w-screen-xl items-start gap-4 px-4'>
                    <SvgEstampa className='h-[1.5rem] w-auto' />

                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-2'>
                        <Loader2Icon className='h-4 w-4 animate-spin' />
                        <span>Generando respuesta...</span>
                      </div>
                      <span className='text-xs text-muted-foreground'>
                        {formatTime(new Date())}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Input area with province selector above */}
      <div className='border-t bg-background px-4 py-4 shadow-md'>
        <div className='mx-auto flex max-w-screen-xl flex-col gap-3'>
          {/* Province selector */}
          <ProvinceSelector
            selectedProvinces={selectedProvinces}
            setSelectedProvinces={setSelectedProvinces}
            toggleProvince={toggleProvince}
            popoverOpen={popoverOpen}
            setPopoverOpen={setPopoverOpen}
          />

          {/* Input and send button */}
          <div className='flex items-center gap-2'>
            <Input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder='Escribe tu pregunta…'
              className='flex-1'
              disabled={isLoading}
            />
            <Button
              onClick={send}
              disabled={!question.trim() || isLoading}
              size='icon'
            >
              <SendIcon className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for displaying message rows with alternating backgrounds
function MessageRow({
  message,
  formatTime,
}: {
  message: Message;
  formatTime: (date: Date) => string;
}) {
  const isUser = message.role === 'user';
  const displayText =
    message.role === 'bot' ? message.displayedText || '' : message.text;

  return (
    <div className={`border-b py-8 ${isUser ? 'bg-muted/10' : 'bg-muted/20'}`}>
      <div className='mx-auto flex max-w-screen-xl items-start gap-4 px-4'>
        {isUser ? (
          <Quote className='w-5 h-5 text-primary/50 mt-1' />
        ) : (
          <SvgEstampa className='w-6 h-6 text-muted-foreground mt-1' />
        )}

        <div className='flex flex-col gap-1 max-w-[90%]'>
          <div className='whitespace-pre-wrap text-sm'>
            {displayText}
            {message.isTyping && (
              <span className='inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5'></span>
            )}
          </div>
          <span className='text-xs text-muted-foreground'>
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Component for the province selector
function ProvinceSelector({
  selectedProvinces,
  setSelectedProvinces,
  toggleProvince,
  popoverOpen,
  setPopoverOpen,
}: {
  selectedProvinces: string[];
  setSelectedProvinces: React.Dispatch<React.SetStateAction<string[]>>;
  toggleProvince: (province: string) => void;
  popoverOpen: boolean;
  setPopoverOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant='outline' size='sm' className='gap-2'>
            <FilterIcon className='h-4 w-4' />
            <span>
              {selectedProvinces.length > 0
                ? `${selectedProvinces.length} provincias seleccionadas`
                : 'Seleccionar provincias'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[320px] p-0' align='start'>
          <Command>
            <CommandGroup heading='Provincias'>
              <div className='max-h-[300px] overflow-y-auto'>
                {ALL_PROVINCES.map(province => (
                  <CommandItem
                    key={province}
                    onSelect={() => toggleProvince(province)}
                    className='flex cursor-pointer items-center justify-between'
                  >
                    <span>{province}</span>
                    {selectedProvinces.includes(province) ? (
                      <CheckIcon className='h-4 w-4 text-primary' />
                    ) : null}
                  </CommandItem>
                ))}
              </div>
            </CommandGroup>
            <Separator />
            <div className='p-2'>
              <Button
                variant='ghost'
                size='sm'
                className='w-full text-xs'
                onClick={() => {
                  setSelectedProvinces([]);
                  setPopoverOpen(false);
                }}
              >
                Limpiar selección
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedProvinces.length > 0 && (
        <div className='flex flex-wrap gap-1 items-center'>
          {selectedProvinces.map(province => (
            <Badge
              key={province}
              variant='secondary'
              className='flex items-center gap-1'
            >
              {province}
              <XIcon
                className='h-3 w-3 cursor-pointer'
                onClick={() => toggleProvince(province)}
              />
            </Badge>
          ))}
          {selectedProvinces.length > 0 && (
            <Button
              variant='ghost'
              size='sm'
              className='h-6 px-2 text-xs'
              onClick={() => setSelectedProvinces([])}
            >
              Limpiar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <div className='flex h-[calc(100vh-180px)] flex-col items-center justify-center text-center p-4'>
      <div className='rounded-full bg-primary/10 p-3 mb-4'>
        <SendIcon className='h-6 w-6 text-primary' />
      </div>
      <h3 className='text-lg font-medium mb-2'>
        Averiguá sobre las constituciones
      </h3>
      <p className='text-sm text-muted-foreground max-w-md'>
        Selecciona las provincias de interés y hacé una pregunta para comenzar a
        chatear con el asistente.
      </p>
    </div>
  );
}
