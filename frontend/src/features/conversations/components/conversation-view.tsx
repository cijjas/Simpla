'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  PromptInput,
  PromptInputActions,
  PromptInputAction,
  PromptInputTextarea,
} from '@/components/prompt-kit/prompt-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUp, Copy, ThumbsUp, ThumbsDown, Check, Mic, Paperclip, X, Square } from 'lucide-react';
import SvgEstampa from '@/../public/svgs/estampa.svg';
import ReactMarkdown from 'react-markdown';
import { LoadingMessage } from './loading-message';
import { ConversationNormasDisplay, ToneSelector } from './index';
import {
  useConversations,
} from '../index';
import { Loader } from '@/components/prompt-kit/loader';

interface ConversationViewProps {
  conversationId: string | null;
}

export function ConversationView({ conversationId }: ConversationViewProps) {
  const {
    state,
    sendMessage,
    stopStreaming,
    submitFeedback,
    removeFeedback,
    setTone,
  } = useConversations();

  const { messages, tone, isLoading, isStreaming, streamingMessage } = state;

  // Local UI state
  const [inputMessage, setInputMessage] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastScrollTimeRef = useRef<number>(0);

  // Auto-scroll to bottom when messages change (throttled during streaming)
  useEffect(() => {
    if (messagesEndRef.current) {
      const now = Date.now();
      const shouldScroll = !isStreaming || (now - lastScrollTimeRef.current > 100);

      if (shouldScroll) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        lastScrollTimeRef.current = now;
      }
    }
  }, [messages, streamingMessage, isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputMessage]);

  // Handle global keyboard input to focus textarea
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ignore modifier keys alone (Cmd, Ctrl, Alt, Shift, etc.)
      if (e.key === 'Meta' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift') {
        return;
      }

      // Ignore special keys like Escape, Tab, Arrow keys
      if (e.key.startsWith('Arrow') || e.key === 'Escape' || e.key === 'Tab' || e.key === 'Enter') {
        return;
      }

      // Just focus the textarea - let the browser handle the key input
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  

  // Speech Recognition Types
  type RecognitionResult = { 0: { transcript: string }; isFinal: boolean };
  type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
  type MinimalSpeechRecognition = {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onstart: (() => void) | null;
    onresult: ((e: RecognitionEvent) => void) | null;
    onerror: ((e: unknown) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
  };
  type SpeechRecoCtor = new () => MinimalSpeechRecognition;

  const getSpeechRecognitionCtor = (): SpeechRecoCtor | null => {
    const w = window as unknown as Record<string, unknown>;
    const candidate = (w['SpeechRecognition'] ?? w['webkitSpeechRecognition']) as unknown;
    return typeof candidate === 'function' ? (candidate as SpeechRecoCtor) : null;
  };

  const startDictation = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) return;
    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;

    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimText('');
    };

    recognition.onresult = (event: RecognitionEvent) => {
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

      if (interimTranscript) {
        setInterimText(interimTranscript);
      }

      if (finalTranscript) {
        setInputMessage((prev) => prev + finalTranscript + ' ');
        setInterimText('');
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
      recognitionRef.current = null;
    };

    recognition.start();
  };

  const stopDictation = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimText('');
  };

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && files.length === 0) || isStreaming) return;

    if (isListening) {
      stopDictation();
    }

    const messageContent = inputMessage;
    const filesToSend = files;
    setInputMessage('');
    setFiles([]);

    await sendMessage(
      messageContent,
      conversationId === 'new' ? null : conversationId,
      filesToSend
      // Navigation is handled by page component via useEffect watching state.currentSessionId
    );
  };

  

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleLikeMessage = async (messageId: string, currentFeedback?: string) => {
    if (currentFeedback === 'like') {
      await removeFeedback(messageId);
    } else {
      await submitFeedback(messageId, 'like');
    }
  };

  const handleDislikeMessage = async (messageId: string, currentFeedback?: string) => {
    if (currentFeedback === 'dislike') {
      await removeFeedback(messageId);
    } else {
      await submitFeedback(messageId, 'dislike');
    }
  };

  // Stop microphone when streaming starts
  // Stop microphone when streaming starts, but avoid direct setState call in effect body
  useEffect(() => {
    if (isStreaming && isListening) {
      // Use a microtask to avoid React's cascading render warning
      Promise.resolve().then(() => stopDictation());
    }
  }, [isStreaming, isListening]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-muted/30">
      {/* Messages */}
      <div className="flex-1 min-h-0 p-0">
        {isLoading ? (
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto space-y-4 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`chat-skel-${i}`} className={`flex gap-3 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className={`flex gap-3 max-w-[80%] ${i % 2 === 0 ? 'flex-row items-start' : 'flex-row-reverse'}`}>
                    <div className={`rounded-lg p-3 ${i % 2 === 0 ? '' : 'bg-accent'}`}>
                      <div className="space-y-2">
                        <div className="h-3 w-56 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-40 bg-muted/80 rounded animate-pulse" />
                        {i % 3 === 0 && <div className="h-3 w-24 bg-muted/60 rounded animate-pulse" />}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : messages.length === 0 && !isStreaming ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="max-w-md space-y-4">
              <div className="flex justify-center">
                <SvgEstampa className="h-24 w-24" fill="currentColor" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-3xl font-bold text-foreground">Bienvenido</h3>
                <p className="text-muted-foreground text-sm">
                  Puedes preguntarme sobre normativa nacional o constituciones. Empieza escribiendo tu pregunta abajo.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto space-y-4 p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex gap-3 max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row items-start'
                    }`}
                  >
                    <div
                      className={`rounded-lg p-3  group ${
                        message.role === 'user' ? 'bg-accent dark:bg-muted' : ''
                      }`}
                    >
                      <div
                        className={`prose-chat text-md ${
                          message.role === 'user' ? 'text-accent-foreground' : 'tracking-wide leading-relaxed'
                        }`}
                      >
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <p className={message.role === 'user' ? 'text-accent-foreground' : ''}>{children}</p>
                            ),
                            strong: ({ children }) => (
                              <strong className={message.role === 'user' ? 'text-accent-foreground' : ''}>
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className={message.role === 'user' ? 'text-accent-foreground' : ''}>{children}</em>
                            ),
                            code: ({ children }) => (
                              <code
                                className={
                                  message.role === 'user'
                                    ? 'text-accent-foreground bg-accent-foreground/20'
                                    : 'bg-muted-foreground/20'
                                }
                              >
                                {children}
                              </code>
                            ),
                            pre: ({ children }) => (
                              <pre
                                className={
                                  message.role === 'user'
                                    ? 'text-accent-foreground bg-accent-foreground/20'
                                    : 'bg-muted-foreground/20'
                                }
                              >
                                {children}
                              </pre>
                            ),
                            ul: ({ children }) => (
                              <ul className={message.role === 'user' ? 'text-accent-foreground' : ''}>{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className={message.role === 'user' ? 'text-accent-foreground' : ''}>{children}</ol>
                            ),
                            li: ({ children }) => (
                              <li className={message.role === 'user' ? 'text-accent-foreground' : ''}>{children}</li>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>

                        {message.attached_file_names && message.attached_file_names.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {message.attached_file_names.map((fileName, idx) => (
                              <div
                                key={idx}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-muted/50 border border-muted-foreground/20 rounded text-[10px] text-muted-foreground/80"
                                title={fileName}
                              >
                                <Paperclip className="h-2.5 w-2.5" />
                                <span className="max-w-[120px] truncate">{fileName}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {message.role === 'assistant' && message.relevant_docs && message.relevant_docs.length > 0 && (
                          <ConversationNormasDisplay normaIds={message.relevant_docs} />
                        )}
                      </div>
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-1 mt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyMessage(message.content, message.id)}
                            className="h-7 w-7 p-1"
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLikeMessage(message.id, message.feedback)}
                            className={`h-7 w-7 p-1 ${message.feedback === 'like' ? 'bg-muted' : ''}`}
                          >
                            <ThumbsUp className={`h-3 w-3 ${message.feedback === 'like' ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDislikeMessage(message.id, message.feedback)}
                            className={`h-7 w-7 p-1 ${message.feedback === 'dislike' ? 'bg-muted' : ''}`}
                          >
                            <ThumbsDown className={`h-3 w-3 ${message.feedback === 'dislike' ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* {isStreaming && streamingMessage.trim().length === 0 && <LoadingMessage />} */}
              {isStreaming && streamingMessage.trim().length === 0 && <LoadingMessage />}

              {isStreaming && streamingMessage.trim().length > 0 && (
                <div className="flex gap-3 justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="rounded-lg p-3">
                      <div className="prose-chat text-md tracking-wide leading-relaxed">
                        <ReactMarkdown>{streamingMessage}</ReactMarkdown>
                        <span className="animate-pulse inline-block ml-1">|</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 pt-0 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <PromptInput
            value={inputMessage + (interimText ? interimText : '')}
            onValueChange={(v) => setInputMessage(v)}
            isLoading={false}
            onSubmit={handleSendMessage}
            className="bg-card "
          >
            {files.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-2" onClick={(e) => e.stopPropagation()}>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="bg-muted/50 border border-muted-foreground/20 flex items-center gap-1.5 rounded-full px-3 py-1.5"
                  >
                    <Paperclip className="h-3 w-3 text-muted-foreground/70" />
                    <span className="max-w-[140px] truncate text-xs text-muted-foreground/80">{file.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter((_, i) => i !== index)); if (uploadInputRef?.current) uploadInputRef.current.value = ''; }}
                      className="hover:bg-muted-foreground/20 rounded-full p-0.5 cursor-pointer transition-colors"
                      type="button"
                    >
                      <X className="h-3 w-3 text-muted-foreground/70" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <PromptInputTextarea
              ref={textareaRef}
              placeholder={isListening ? 'Escuchando...' : 'Cómo puedo ayudarte?'}
              className=" max-h-[220px] placeholder:text-muted-foreground/70 text-sm leading-6 dark:bg-card"
            />

            <PromptInputActions className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <PromptInputAction tooltip={'Adjuntar archivos'}>
                  <label htmlFor="file-upload" onClick={(e) => e.stopPropagation()}>
                    <input
                      ref={uploadInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                      onChange={(event) => {
                        if (event.target.files) {
                          const newFiles = Array.from(event.target.files);
                          // Validate file types
                          const validFiles = newFiles.filter(file => {
                            const validTypes = [
                              'application/pdf',
                              'image/png',
                              'image/jpeg',
                              'image/jpg',
                              'image/gif',
                              'image/webp'
                            ];
                            return validTypes.includes(file.type) || 
                                   file.name.toLowerCase().endsWith('.pdf') ||
                                   file.name.toLowerCase().endsWith('.png') ||
                                   file.name.toLowerCase().endsWith('.jpg') ||
                                   file.name.toLowerCase().endsWith('.jpeg') ||
                                   file.name.toLowerCase().endsWith('.gif') ||
                                   file.name.toLowerCase().endsWith('.webp');
                          });
                          setFiles(prev => [...prev, ...validFiles]);
                          if (validFiles.length < newFiles.length) {
                            alert('Algunos archivos fueron rechazados. Solo se permiten PDFs e imágenes (PNG, JPG, GIF, WebP).');
                          }
                        }
                      }}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      asChild
                      className="h-8 w-8 p-0 rounded-full cursor-pointer"
                      size="sm"
                      variant='ghost'
                    >
                      <span>
                        <Paperclip className="h-4 w-4" />
                      </span>
                    </Button>
                  </label>
                </PromptInputAction>
                <PromptInputAction tooltip={isListening ? 'Detener dictado' : 'Iniciar dictado'}>
                  <Button
                    className="h-8 w-8 p-0 rounded-full cursor-pointer"
                    size="sm"
                    variant='ghost'
                    onClick={isListening ? stopDictation : startDictation}
                  >
                    {isListening ? <Loader variant="wave" size="md"  /> : <Mic className="h-4 w-4" />}
                  </Button>
                </PromptInputAction>
                <ToneSelector selectedTone={tone} onToneChange={setTone} disabled={isStreaming} />
              </div>
              <div className="flex items-center">
                {isStreaming ? (
                  <Button
                    className="h-8 w-8 rounded-full p-0 ml-2"
                    size="sm"
                    variant="default"
                    onClick={stopStreaming}
                  >
                    <Square className="h-4 w-4 fill-current" />
                  </Button>
                ) : (
                  <Button
                    className="h-8 w-8 rounded-full p-0 ml-2"
                    size="sm"
                    variant="default"
                    onClick={handleSendMessage}
                    disabled={(!inputMessage.trim() && files.length === 0)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </PromptInputActions>
          </PromptInput>

          <div className="flex justify-center mt-2">
            <p className="text-xs text-muted-foreground text-center">
              La IA puede cometer errores. Verifica la información importante.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
