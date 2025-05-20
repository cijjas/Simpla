'use client';

import { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';

export function useChat() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
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
    const newUserMessage: Message = {
      role: 'user',
      text: q,
      timestamp: new Date(),
    };
    setMessages(m => [...m, newUserMessage]);
    setQuestion('');
    setIsLoading(true);

    requestAnimationFrame(() => {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100); // small delay gives layout time to settle
    });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          provinces: selectedProvinces,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }
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
      console.error('Error sending message:', error);
      setMessages(m => [
        ...m,
        {
          role: 'bot',
          text: 'Hubo un error generando la respuesta.',
          timestamp: new Date(),
          isTyping: false,
          displayedText: 'Hubo un error generando la respuesta.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle typing animation for bot messages
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
      }, 20);
      return () => clearTimeout(timeoutId);
    } else if (currentMessage.isTyping) {
      setMessages(prevMessages =>
        prevMessages.map((m, index) =>
          index === currentMessageIndex ? { ...m, isTyping: false } : m,
        ),
      );
    }
  }, [messages]);

  // Focus textarea when there are no messages
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
    popoverOpen,
    setPopoverOpen,
    isLoading,
    textareaRef,
    toggleProvince,
    clearProvinces,
    send,
    formatTime,
  };
}
