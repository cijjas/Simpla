'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Send, X, Bot, User } from 'lucide-react';
import { useApi } from '@/features/auth/hooks/use-api';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface NormaAIChatProps {
  normaId: number;
}

export function NormaAIChat({ normaId }: NormaAIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const api = useApi();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Calculate dynamic height based on messages
  const calculateChatHeight = () => {
    const baseHeight = 400; // minimum height
    const maxHeight = 600; // maximum height
    const messageCount = messages.length;
    
    if (messageCount === 0) return baseHeight;
    
    // Increase height by ~40px per message, with a max limit
    const dynamicHeight = Math.min(baseHeight + (messageCount * 40), maxHeight);
    return dynamicHeight;
  };

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

    // Don't create assistant message yet - wait until we start typing

    try {
      const response = await api.post<{ answer: string }>('/api/norma-chat', {
        norma_id: normaId,
        question: currentInput
      });

      // Now that we have the response, stop loading and start typing effect
      setIsLoading(false);

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
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse bg-primary hover:bg-primary/90"
          aria-label="Abrir chat de AI sobre esta norma"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-80 shadow-xl border-2 relative" style={{ height: `${calculateChatHeight()}px` }}>
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
          <div className="flex-1 overflow-hidden pt-3">
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
              <ScrollArea className="h-full p-3">
                <div className="space-y-3">
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
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
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
                  
                  {isLoading && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <img 
                          src="/images/estampa.png" 
                          alt="Simpla" 
                          className="h-3 w-3 object-contain brightness-0 invert opacity-70"
                        />
                      </div>
                      <div className="bg-muted p-2 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t p-3">
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregunta sobre esta norma..."
                className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                disabled={isLoading}
                maxLength={500}
                rows={1}
              />
              <Button
                onClick={handleSendMessage}
                size="sm"
                disabled={!inputValue.trim() || isLoading}
                className="px-3 h-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
