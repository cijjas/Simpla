'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, X, User, Loader2, ArrowUp } from 'lucide-react';
import { useApi } from '@/features/auth/hooks/use-api';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import SvgEstampa from '@/components/icons/Estampa';

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

export function NormasAIChat({ normaId, infolegId }: NormasAIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null); // Track session ID
  
  // Resizable chat dimensions with viewport-aware limits
  const [chatDimensions, setChatDimensions] = useState(() => {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    // Calculate max dimensions considering navbar (~64px) and margins, plus table of contents space
    const maxHeight = viewportHeight - 140; // navbar + margins + padding
    const maxWidth = Math.min(viewportWidth * 0.35, 450); // max 35% of viewport or 450px (leaves room for table of contents)
    
    return { 
      width: Math.max(maxWidth * 0.75, 300), // minimum 75% of max width or 300px (more reasonable minimum)
      height: Math.max(maxHeight * 0.65, 350) // minimum 65% of max height or 350px (smaller initial size)
    };
  });
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const api = useApi();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Resize handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = dragStart.x - e.clientX;
    const deltaY = dragStart.y - e.clientY;
    
    // Calculate viewport-based limits
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const maxHeight = viewportHeight - 140; // considering navbar and margins
    const maxWidth = Math.min(viewportWidth * 0.35, 450); // max 35% of viewport width or 450px
    const minHeight = Math.max(maxHeight * 0.65, 350); // minimum 65% of max height or 350px
    const minWidth = Math.max(maxWidth * 0.75, 300); // minimum 75% of max width or 300px
    
    setChatDimensions(prev => ({
      width: Math.min(Math.max(minWidth, prev.width + deltaX), maxWidth),
      height: Math.min(Math.max(minHeight, prev.height + deltaY), maxHeight)
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsResizing(false);
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
  }, [isResizing, dragStart]);

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
      const maxHeight = viewportHeight - 140;
      const maxWidth = Math.min(viewportWidth * 0.35, 450);
      const minHeight = Math.max(maxHeight * 0.65, 350);
      const minWidth = Math.max(maxWidth * 0.75, 300);
      
      setChatDimensions(prev => ({
        width: Math.min(Math.max(prev.width, minWidth), maxWidth),
        height: Math.min(Math.max(prev.height, minHeight), maxHeight)
      }));
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

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      // Use the same endpoint as the old norma chat
      const response = await api.post<{ answer: string; session_id?: string }>('/api/norma-chat', {
        norma_id: infolegId || normaId, // Use infolegId if available, fallback to normaId
        question: currentInput,
        session_id: sessionId // Include existing session ID for conversation continuity
      });

      // Stop loading and start typing effect
      setIsLoading(false);

      // Update session ID if returned from backend
      if (response.session_id && !sessionId) {
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse-slow bg-primary hover:bg-primary/90"
          aria-label="Abrir chat de AI sobre esta norma"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card 
        ref={chatRef}
        className="shadow-xl border-2 relative" 
        style={{ 
          width: `${chatDimensions.width}px`, 
          height: `${chatDimensions.height}px` 
        }}
      >
        {/* Invisible resize handle - top left corner */}
        <div 
          className={`absolute top-0 left-0 w-5 h-5 cursor-nw-resize z-20 ${
            isResizing ? 'bg-primary/10' : ''
          }`}
          onMouseDown={handleMouseDown}
          title="Arrastra para redimensionar"
        />
        
        <CardContent className="p-0 h-full flex flex-col">
          {/* Close button in top right */}
          <Button
            onClick={handleClose}
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 h-6 w-6 p-0 z-10"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Messages Area */}
          <div className="flex-1 overflow-hidden pt-3 min-h-0">
            {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <img 
                        src="/images/estampa.png" 
                        alt="Simpla" 
                        className="w-8 h-8 object-contain brightness-0 invert"
                    />
                    </div>
                    <p className="text-sm text-muted-foreground">
                    Pregúntame sobre esta norma
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
                        {message.role === 'assistant' && (
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                            <img 
                                src="/images/estampa.png" 
                                alt="Simpla" 
                                className="h-3 w-3 object-contain brightness-0 invert opacity-70"
                            />
                            </div>
                        )}
                        
                        <div
                            className={`max-w-[80%] p-2 rounded-lg ${
                            message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                        >
                            <div className="prose-chat text-sm break-words">
                            {message.role === 'assistant' ? (
                                <ReactMarkdown 
                                components={{
                                    p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
                                    strong: ({ children }) => <strong>{children}</strong>,
                                    em: ({ children }) => <em>{children}</em>,
                                    code: ({ children }) => <code className="bg-muted-foreground/20 px-1 rounded">{children}</code>,
                                    pre: ({ children }) => <pre className="bg-muted-foreground/20 p-2 rounded overflow-x-auto">{children}</pre>,
                                    ul: ({ children }) => <ul className="list-disc list-inside">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal list-inside">{children}</ol>,
                                    li: ({ children }) => <li>{children}</li>,
                                }}
                                >
                                {message.content}
                                </ReactMarkdown>
                            ) : (
                                <p className="whitespace-pre-wrap">{message.content}</p>
                            )}
                            </div>
                            <p className="text-xs opacity-70 mt-1">
                            {formatTime(message.timestamp)}
                            </p>
                        </div>

                        {message.role === 'user' && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                            <User className="h-3 w-3 text-primary-foreground" />
                            </div>
                        )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Loading Indicator - Fixed position below ScrollArea */}
                {isLoading && (
                    <div className="px-3 py-2">
                    <div className="flex justify-start">
                        <div className="text-sm">
                        <div className="flex items-center mb-1 gap-2 text-xs text-muted-foreground">
                            <SvgEstampa className="h-4 w-4" />
                            <span className="font-medium">Simpla</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Pensando...</span>
                        </div>
                        </div>
                    </div>
                    </div>
                )}
                </div>
            )}
            </div>

          {/* Input Area */}
          <div className="p-4 flex-shrink-0">
            <InputGroup className="rounded-3xl bg-card border border-border focus-visible:ring-transparent">
              <InputGroupTextarea
                ref={inputRef}
                data-slot="input-group-control"
                value={inputValue}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregunta sobre esta norma..."
                className="py-3 px-4 pr-12 max-h-[120px] min-h-[40px]"
                disabled={isLoading}
                maxLength={500}
                rows={1}
              />
              
              <InputGroupAddon align="inline-end">
                <Button
                  className="h-8 w-8 rounded-full p-0"
                  size="sm"
                  variant="default"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}