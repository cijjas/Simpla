'use client';

import { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/fetch';
import type { Message, RagScope } from '../types'; // Ensure RagScope is imported

export function useChat() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  // const [popoverOpen, setPopoverOpen] = useState(false); // Old
  const [dialogOpen, setDialogOpen] = useState(false); // New for Dialog
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleProvince = (province: string) => {
    setSelectedProvinces(prev =>
      prev.includes(province)
        ? prev.filter(p => p !== province)
        : [...prev, province],
    );
  };

  const clearProvinces = () => {
    setSelectedProvinces([]);
  };

  const send = async () => {
    if (!question.trim() || isLoading) return;
    const q = question;
    // Capture the current scope for this message exchange
    const currentScope: RagScope = { provinces: [...selectedProvinces] };

    const newUserMessage: Message = {
      role: 'user',
      text: q,
      timestamp: new Date(),
      // User messages could also have scope if desired, but less critical
    };
    setMessages(m => [...m, newUserMessage]);
    setQuestion('');
    setIsLoading(true);

    requestAnimationFrame(() => {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    });

    try {
      const { answer } = await apiClient.post<{ answer: string }>('/api/chat', {
        question: q,
        provinces: currentScope.provinces, // Send current scope to API
      });
      setMessages(m => [
        ...m,
        {
          role: 'bot',
          text: answer,
          timestamp: new Date(),
          isTyping: true,
          displayedText: '',
          scope: currentScope, // Attach the scope used for this bot's answer
        },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(m => [
        ...m,
        {
          role: 'bot',
          text: 'Hubo un error generando la respuesta.',
          timestamp: new Date(),
          isTyping: false,
          displayedText: 'Hubo un error generando la respuesta.',
          scope: currentScope, // Also attach scope to error messages for context
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle typing animation (remains the same)
  useEffect(() => {
    const typingMessages = messages.filter(m => m.isTyping && m.role === 'bot');
    if (typingMessages.length === 0) return;

    const currentMessageIndex = messages.findIndex(
      m => m.isTyping && m.role === 'bot',
    );
    if (currentMessageIndex === -1) return;

    const currentMessage = messages[currentMessageIndex];
    const fullText = currentMessage.text;
    const currentDisplayedText = currentMessage.displayedText || '';

    if (currentDisplayedText.length < fullText.length) {
      const timeoutId = setTimeout(() => {
        setMessages(prevMessages =>
          prevMessages.map((m, index) =>
            index === currentMessageIndex
              ? {
                  ...m,
                  displayedText: fullText.substring(
                    0,
                    currentDisplayedText.length + 1,
                  ),
                  isTyping: currentDisplayedText.length + 1 < fullText.length,
                }
              : m,
          ),
        );
      }, 20); // Adjust typing speed if needed
      return () => clearTimeout(timeoutId);
    } else if (currentMessage.isTyping) {
      setMessages(prevMessages =>
        prevMessages.map((m, index) =>
          index === currentMessageIndex ? { ...m, isTyping: false } : m,
        ),
      );
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0 && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [messages.length]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return {
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
  };
}
