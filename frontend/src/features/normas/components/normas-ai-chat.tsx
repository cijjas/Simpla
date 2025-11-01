'use client';

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

// Extend Window interface for Speech Recognition API
interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: {
    transcript: string;
    confidence: number;
  };
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResult[];
}

interface SpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, ArrowUp, ChevronDown, Mic, X, Quote } from 'lucide-react';
import { useApi } from '@/features/auth/hooks/use-api';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import SvgEstampa from '@/../public/svgs/estampa.svg';
import { Kbd } from '@/components/ui/kbd';
import { getCommandById, getShortcutParts } from '@/features/command-center';
import { LoadingMessage } from '@/features/conversations/components/loading-message';
import { Loader } from '@/components/prompt-kit/loader';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sessionId?: string; // Add session ID to message interface
}

interface NormasAIChatProps {
  normaId: number;
  infolegId?: number;
}

export interface NormasAIChatRef {
  openWithContext: (text: string) => void;
}

export const NormasAIChat = forwardRef<NormasAIChatRef, NormasAIChatProps>(function NormasAIChat({ normaId, infolegId }, ref) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null); // Track session ID
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [interimText, setInterimText] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [contextQuote, setContextQuote] = useState<string | null>(null);
  
  // Resizable chat dimensions with viewport-aware limits (desktop only)
  const [chatDimensions, setChatDimensions] = useState(() => {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const mobile = viewportWidth < 768;
    
    if (mobile) {
      // Mobile: full width with margins, leave room for action buttons
      return {
        width: viewportWidth - 32, // 16px margin on each side
        height: viewportHeight - 160 // Leave room for navbar + action buttons + bottom spacing
      };
    }
    
    // Desktop: Calculate max dimensions considering navbar (~64px) and margins, plus table of contents space
    const maxHeight = viewportHeight - 140; // navbar + margins + padding
    const maxWidth = Math.min(viewportWidth * 0.35, 450); // max 35% of viewport or 450px (leaves room for table of contents)
    
    return { 
      width: Math.max(maxWidth * 0.75, 300), // minimum 75% of max width or 300px (more reasonable minimum)
      height: Math.max(maxHeight * 0.65, 350) // minimum 65% of max height or 350px (smaller initial size)
    };
  });
  const [isResizing, setIsResizing] = useState(false);
  
  const api = useApi();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  
  // Command center integration
  const toggleCommand = getCommandById('toggle-norma-chat');
  const toggleShortcut = toggleCommand ? getShortcutParts(toggleCommand) : [];

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    openWithContext: (text: string) => {
      setIsOpen(true);
      setContextQuote(text);
      // Focus input after a brief delay to ensure it's rendered
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    },
  }), []);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Resize handlers (desktop only)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return; // Disable resizing on mobile
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: chatDimensions.width,
      height: chatDimensions.height,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !resizeStartRef.current) return;
    
    // Calculate delta from initial drag start position
    const deltaX = resizeStartRef.current.x - e.clientX;
    const deltaY = resizeStartRef.current.y - e.clientY;
    
    // Calculate viewport-based limits
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const maxHeight = viewportHeight - 140; // considering navbar and margins
    const maxWidth = Math.min(viewportWidth * 0.35, 450); // max 35% of viewport width or 450px
    const minHeight = 350; // minimum height
    const minWidth = 300; // minimum width
    
    // Calculate new dimensions based on initial dimensions and delta
    // Dragging right (positive deltaX) decreases width, dragging left (negative deltaX) increases width
    // Dragging down (positive deltaY) decreases height, dragging up (negative deltaY) increases height
    const newWidth = Math.min(Math.max(minWidth, resizeStartRef.current.width + deltaX), maxWidth);
    const newHeight = Math.min(Math.max(minHeight, resizeStartRef.current.height + deltaY), maxHeight);
    
    setChatDimensions({
      width: newWidth,
      height: newHeight,
    });
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    resizeStartRef.current = null;
  };

  // Add global mouse events for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'nw-resize';
      document.body.style.userSelect = 'none';
      
      // Only disable pointer events on the resize handle area, not the whole chat
      // This allows scrolling to continue working during resize
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResizing]);

  // Reset session when norma changes
  useEffect(() => {
    setSessionId(null);
    setMessages([]);
  }, [normaId, infolegId]);

  // Handle window resize to adjust chat dimensions
  useEffect(() => {
    const handleWindowResize = () => {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const mobile = viewportWidth < 768;
      
      if (mobile) {
        // Mobile: full width with margins, leave room for action buttons
        setChatDimensions({
          width: viewportWidth - 32,
          height: viewportHeight - 160
        });
      } else {
        // Desktop: maintain resizable behavior
        const maxHeight = viewportHeight - 140;
        const maxWidth = Math.min(viewportWidth * 0.35, 450);
        const minHeight = Math.max(maxHeight * 0.65, 350);
        const minWidth = Math.max(maxWidth * 0.75, 300);
        
        setChatDimensions(prev => ({
          width: Math.min(Math.max(prev.width, minWidth), maxWidth),
          height: Math.min(Math.max(prev.height, minHeight), maxHeight)
        }));
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Register toggle command handler and ESC key handler
  useEffect(() => {
    // Register the toggle handler on the command
    if (toggleCommand) {
      toggleCommand.action = { 
        type: 'custom', 
        handler: () => setIsOpen(prev => !prev)
      };
    }

    // Handle ESC key to close chat when open
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, toggleCommand]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  // Stop microphone when loading starts
  useEffect(() => {
    if (isLoading && isListening) {
      stopDictation();
    }
  }, [isLoading, isListening]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Stop microphone if listening
    if (isListening) {
      stopDictation();
    }

    // Build the question with context if available
    const baseQuestion = inputValue.trim();
    const questionWithContext = contextQuote 
      ? `Estoy leyendo la siguiente parte de esta norma:\n\n"${contextQuote}"\n\nMi pregunta específica sobre este fragmento es: ${baseQuestion}`
      : baseQuestion;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: baseQuestion,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setContextQuote(null); // Clear context after sending
    setIsLoading(true);

    try {
      // Use the same endpoint as the old norma chat
      const response = await api.post<{ answer: string; norma_id: number; session_id: string }>('/api/norma-chat', {
        norma_id: infolegId || normaId, // Use infolegId if available, fallback to normaId
        question: questionWithContext,
        session_id: sessionId // Include existing session ID for conversation continuity
      });

      // Stop loading and start typing effect
      setIsLoading(false);

      // Update session ID if returned from backend (always update to ensure we have the latest session)
      if (response.session_id) {
        setSessionId(response.session_id);
      }

      // Create assistant message when we start typing
      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Simulate streaming by typing out the response
      const fullResponse = response.answer;
      const words = fullResponse.split(' ');
      
      for (let i = 0; i <= words.length; i++) {
        const partialContent = words.slice(0, i).join(' ');
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: partialContent }
            : msg
        ));
        
        // Small delay between words for typing effect
        if (i < words.length) {
          await new Promise(resolve => setTimeout(resolve, 30));
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar el mensaje');
      
      // Create error message only when error occurs
      const errorMessageId = `error-${Date.now()}`;
      const errorMessage: Message = {
        id: errorMessageId,
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu pregunta. Por favor, intenta nuevamente.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Speech Recognition Functions
  const startDictation = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('El navegador no soporta reconocimiento de voz');
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.lang = 'es-ES'; // Spanish
    recognition.continuous = true; // Keep listening
    recognition.interimResults = true; // Show real-time results
    
    recognition.onstart = () => {
      setIsListening(true);
      setInterimText('');
      toast.success('Escuchando...');
    };
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Show interim results in real-time
      if (interimTranscript) {
        setInterimText(interimTranscript);
      }
      
      // When we get final results, add them to the input
      if (finalTranscript) {
        setInputValue(prev => prev + finalTranscript + ' ');
        setInterimText(''); // Clear interim text
      }
      
      // Clear any existing timeout (no auto-stop)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    
    recognition.onerror = (event: { error: string }) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setInterimText('');
      
      switch (event.error) {
        case 'no-speech':
          toast.error('No se detectó voz. Intenta nuevamente.');
          break;
        case 'audio-capture':
          toast.error('No se pudo acceder al micrófono.');
          break;
        case 'not-allowed':
          toast.error('Permisos de micrófono denegados.');
          break;
        default:
          toast.error('Error en el reconocimiento de voz.');
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
      recognitionRef.current = null;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    
    recognition.start();
  };

  const stopDictation = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimText('');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  if (!isOpen) {
    return (
      <div className={`fixed z-50 ${isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6'}`}>
        <Button
          onClick={toggleChat}
          size="lg"
          className={`group relative flex items-center gap-1 rounded-lg overflow-hidden transition-all duration-300 ease-out ${
            isMobile ? '!h-14 !w-14 !p-0' : '!px-2'
          }`}
          aria-label="Abrir chat de AI sobre esta norma"
        >
          {/* Expanding text content - slides in on hover (desktop only) */}
          {!isMobile && (
            <div className="max-w-0 opacity-0 overflow-hidden transition-all duration-300 ease-out group-hover:max-w-xs group-hover:opacity-100 group-hover:mr-2">
              <span className="whitespace-nowrap">  
                Preguntale a {' '}
                <span className="font-serif font-thin italic">Themis</span>
              </span>
            </div>
          )}
          {/* Kbd shortcuts - desktop only */}
          {!isMobile && toggleShortcut.length > 0 && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              {toggleShortcut.map((key, idx) => (
                <Kbd key={idx} className="bg-primary-foreground/10 text-texts ">{key}</Kbd>
              ))}
            </span>
          )}
          {/* Icon - always visible */}
          <MessageCircle className={`flex-shrink-0 ${isMobile ? 'h-7 w-7' : 'h-6 w-6'}`} />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 ${
      isMobile 
        ? 'inset-x-4 bottom-4 top-32' // Mobile: full width with margins, leave room for action buttons
        : 'bottom-6 right-6' // Desktop: bottom right corner
    }`}>
      {/* frosted glass effect */}
      <Card 
        ref={chatRef}
        className={`relative shadow-sm pb-0 rounded-2xl backdrop-blur-sm bg-background/80 p-2 ${
          isMobile ? 'h-full' : ''
        }`}
        style={!isMobile ? { 
          width: `${chatDimensions.width}px`, 
          height: `${chatDimensions.height}px` 
        } : undefined}
      >
        {/* Resize handle - top left corner (desktop only) */}
        {!isMobile && (
          <div 
            className="absolute top-1 left-1 w-6 h-6 cursor-nw-resize z-20 flex items-center justify-center group rounded-br-lg transition-colors"
            onMouseDown={handleMouseDown}
            title="Arrastra para redimensionar"
          >
            <div className="relative">
              {/* Create diagonal grip pattern with dots */}
              <div className="flex flex-col gap-0.5">
                <div className="flex gap-0.5">
                  <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground/60 group-hover:bg-muted-foreground transition-colors" />
                  <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground/60 group-hover:bg-muted-foreground transition-colors" />
                </div>
                <div className="flex gap-0.5 pl-1">
                  <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground/60 group-hover:bg-muted-foreground transition-colors" />
                  <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground/60 group-hover:bg-muted-foreground transition-colors" />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <CardContent className="p-0 h-full flex flex-col">
          {/* Collapse button in top right */}
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
            {!isMobile && <Kbd className="text-xs">Esc</Kbd>}
            <Button
              onClick={handleClose}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              aria-label="Cerrar chat"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-hidden pt-8 min-h-0">
            {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center p-4">
                <div className="text-center text-muted-foreground">
                    <div className="mx-auto pb-6 flex items-center justify-center ">
                      <SvgEstampa className="size-26 " fill='currentColor'/>
                    </div>
                    <p className="text-md font-serif text-muted-foreground ">
                    Pregunta sobre esta norma
                    </p>
                </div>
                </div>
            ) : (
                <div className="h-full flex flex-col">
                {/* Scrollable Messages */}
                <div className="flex-1 px-3 overflow-y-auto scroll-smooth">
                    <div className="space-y-3 pb-3">
                    {messages.map((message) => (
                        <div
                        key={message.id}
                        className={`flex gap-2 ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                        >
                        <div
                            className={`max-w-[80%] p-2 rounded-lg ${
                            message.role === 'user'
                                ? 'bg-muted text-muted-foreground/70'
                                : ''
                            }`}
                        >
                            <div className="prose-chat text-sm break-words">
                            {message.role === 'assistant' ? (
                                <ReactMarkdown 
                                components={{
                                    p: ({ children }) => <p className="whitespace-pre-wrap text-card-foreground/90">{children}</p>,
                                    strong: ({ children }) => <strong className="text-card-foreground">{children}</strong>,
                                    em: ({ children }) => <em>{children}</em>,
                                    code: ({ children }) => <code className="bg-muted-foreground/20 px-1 rounded">{children}</code>,
                                    pre: ({ children }) => <pre className="bg-muted-foreground/20 p-2 rounded overflow-x-auto">{children}</pre>,
                                    ul: ({ children }) => <ul className="list-disc list-inside">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal list-inside">{children}</ol>,
                                    li: ({ children }) => <li className="text-card-foreground/85">{children}</li>,
                                }}
                                >
                                {message.content}
                                </ReactMarkdown>
                            ) : (
                                <p className="whitespace-pre-wrap text-card-foreground/90">{message.content}</p>
                            )}
                            </div>
                            <p className="text-xs opacity-70 mt-1">
                            {formatTime(message.timestamp)}
                            </p>
                        </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Loading Indicator */}
                {isLoading && <LoadingMessage />}
                </div>
            )}
            </div>

          {/* Context Quote */}
          {contextQuote && (
            <div className="px-3 pb-2 flex-shrink-0 animate-in slide-in-from-bottom-2 duration-200">
              <div className="relative bg-muted/50 border border-border rounded-lg p-3 pr-8">
                <div className="flex items-start gap-2">
                  <Quote className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Contexto</p>
                    <p className="text-sm text-foreground/90 line-clamp-3 break-words">
                      {contextQuote}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-background"
                  onClick={() => setContextQuote(null)}
                  title="Remover contexto"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="px-3 pb-4 flex-shrink-0">
            <InputGroup className="rounded-xl pr-0 bg-card border border-border ">
              <InputGroupTextarea
                ref={inputRef}
                data-slot="input-group-control"
                value={inputValue + (interimText ? interimText : '')}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? "Escuchando..." : "Que pregunta tenés?"}
                className="  max-h-[120px] min-h-[40px] "
                disabled={isLoading}
                maxLength={500}
                rows={1}
              />
              
              <InputGroupAddon align="inline-end" className="self-end">
                  {/* Microphone Button */}
                  <InputGroupButton
                    className="h-8 w-8 p-0 rounded-lg relative"
                    size="sm"
                    variant="ghost"
                    onClick={isListening ? stopDictation : startDictation}
                    disabled={isLoading}
                    title={isListening ? "Detener dictado" : "Iniciar dictado"}
                  >
                    {isListening ? <Loader variant="wave" size="md" /> : <Mic className="h-4 w-4" />}
                  </InputGroupButton>
                  
                  {/* Send Button */}
                  <InputGroupButton
                    className="h-8 w-8 p-0 rounded-lg"
                    size="sm"
                    variant="default"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                  >
                      <ArrowUp className="h-4 w-4" />
                  </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});