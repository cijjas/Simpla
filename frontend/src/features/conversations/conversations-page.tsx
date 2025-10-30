'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
  InputGroupButton,
} from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Archive, Trash2, Loader2, MoreHorizontal, Pencil, ArrowUp, Copy, ThumbsUp, ThumbsDown, Check, Mic, MicOff } from 'lucide-react';
import SvgEstampa from '@/../public/svgs/estampa.svg';
import ReactMarkdown from 'react-markdown';
import { LoadingMessage } from '@/features/conversations/components/loading-message';
import { 
  useConversations,
  type Conversation,
  formatDate 
} from './index';
import { ConversationNormasDisplay, ToneSelector } from './components';

interface ConversacionesPageProps {
  conversationId: string;
}

export default function ConversacionesPage({ conversationId }: ConversacionesPageProps) {
  const router = useRouter();

  // Use conversations context
  const {
    state,
    sendMessage,
    archiveConversation,
    deleteConversation,
    updateConversationTitle,
    setTone,
    submitFeedback,
    removeFeedback,
    loadMoreConversations,
  } = useConversations();

  // Local state for UI
  const [inputMessage, setInputMessage] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);

  // Local state for editing conversation title (moved from Context)
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');

  // Destructure state for easier access
  const {
    conversations,
    messages,
    tone,
    isLoading,
    isStreaming,
    streamingMessage,
    isLoadingConversations,
  } = state;

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const convScrollRootRef = useRef<HTMLDivElement>(null);

  // Infinite scroll for conversations list (sidebar)
  useEffect(() => {
    const rootEl = convScrollRootRef.current;
    if (!rootEl) return;
    const viewport = rootEl.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null;
    if (!viewport) return;

    const triggerLoadMore = () => {
      if (loadingMore || state.isLoadingConversations) return;
      setLoadingMore(true);
      loadMoreConversations().finally(() => setLoadingMore(false));
    };

    const onScroll = () => {
      const threshold = 80; // px from bottom
      const atBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - threshold;
      if (atBottom && !state.isLoadingConversations) {
        triggerLoadMore();
      }
    };

    viewport.addEventListener('scroll', onScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', onScroll);
  }, [state.isLoadingConversations, loadMoreConversations, loadingMore]);

  // Auto-scroll to bottom when messages change (throttled during streaming)
  useEffect(() => {
    if (messagesEndRef.current) {
      const now = Date.now();
      // Throttle scroll during streaming to every 100ms, always scroll for new messages
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

  // (moved): Stop microphone when streaming starts

  const handleDeleteClick = (conv: Conversation) => {
    setConversationToDelete(conv);
    setDeleteDialogOpen(true);
  };

  // Handle renaming conversation (local state management)
  const handleStartRename = (conv: Conversation) => {
    setEditingConversationId(conv.id);
    setTempTitle(conv.title);
  };

  const handleSaveRename = async (conversationId: string) => {
    if (!tempTitle.trim()) {
      setEditingConversationId(null);
      setTempTitle('');
      return;
    }

    await updateConversationTitle(conversationId, tempTitle.trim());
    setEditingConversationId(null);
    setTempTitle('');
  };

  const handleCancelRename = () => {
    setEditingConversationId(null);
    setTempTitle('');
  };

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete) return;
    
    const wasCurrentConversation = conversationToDelete.id === conversationId;
    await deleteConversation(conversationToDelete);
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
    
    // If we deleted the current conversation, navigate to new conversation
    if (wasCurrentConversation) {
      router.push('/conversaciones/new');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isStreaming) return;

    // Stop microphone if listening
    if (isListening) {
      stopDictation();
    }

    const messageContent = inputMessage;
    setInputMessage('');

    // Pass current conversationId and navigation callback
    await sendMessage(
      messageContent,
      conversationId, // Pass 'new' as-is, let Context handle the logic
      (newSessionId) => {
        // Navigate to new conversation when created
        router.replace(`/conversaciones/${newSessionId}`);
      }
    );
  };

  // Speech Recognition Functions
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
      // Browser not supported
      return;
    }

    // Stop any existing recognition
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
        setInputMessage(prev => (prev + finalTranscript + ' '));
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

  // Stop microphone when streaming starts
  useEffect(() => {
    if (isStreaming && isListening) {
      stopDictation();
    }
  }, [isStreaming, isListening]);

  // Handle conversation selection - navigate to conversation URL
  const handleLoadConversation = (id: string) => {
    router.push(`/conversaciones/${id}`);
  };

  // Handle new conversation - navigate to 'new' URL
  const handleNewConversation = () => {
    router.push('/conversaciones/new');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
      // If already liked, remove the feedback
      await removeFeedback(messageId);
    } else {
      // Otherwise, submit like feedback
      await submitFeedback(messageId, 'like');
    }
  };

  const handleDislikeMessage = async (messageId: string, currentFeedback?: string) => {
    if (currentFeedback === 'dislike') {
      // If already disliked, remove the feedback
      await removeFeedback(messageId);
    } else {
      // Otherwise, submit dislike feedback
      await submitFeedback(messageId, 'dislike');
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r  flex flex-col h-full">
        {/* Fixed Header */}
        <div className='flex-shrink-0 border-b bg-background px-4 md:px-6 py-4'>
          <div className='text-start space-y-1'>
            <h1 className='text-2xl md:text-3xl font-bold font-serif'>
              Themis
            </h1>
            <p className='text-muted-foreground text-xs md:text-sm'>
              Tu asistente legal.
            </p>
          </div>
          </div>
        <div className="p-4 border-b bg-muted">
        <Button
              onClick={handleNewConversation}
              size="sm"
              disabled={isLoading}
              className="w-full cursor-pointer"
            >
              <Plus className="size-4 mr-2" />
              Nueva conversación
            </Button>
        </div>

        {/* Scrollable Conversations List */}
        <div className="flex-1 overflow-hidden" ref={convScrollRootRef}>
          <ScrollArea className="h-full">
            <div className="p-0">
              {isLoadingConversations ? null : (
                conversations
                  .filter((conv) => conv.chat_type !== 'norma_chat')
                  .map((conv) => (
                <div
                  key={conv.id}
                  className={`cursor-pointer transition-colors duration-150 border-b border-border/60 last:border-b-0 ${
                    conversationId === conv.id 
                      ? 'bg-primary/10 border-l-4 border-l-primary' 
                      : 'hover:bg-muted/30'
                  }`}
                  onClick={() => handleLoadConversation(conv.id)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {editingConversationId === conv.id ? (
                            <input
                              type="text"
                              value={tempTitle}
                              onChange={(e) => setTempTitle(e.target.value)}
                              onBlur={() => handleSaveRename(conv.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveRename(conv.id);
                                } else if (e.key === 'Escape') {
                                  handleCancelRename();
                                }
                              }}
                              className="w-full border-none bg-transparent p-0 text-sm font-medium text-foreground focus:ring-0 focus:outline-none"
                              autoFocus
                              onFocus={(e) => e.target.select()}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <h3 className="font-medium text-sm text-foreground line-clamp-1 leading-snug">
                              {conv.title}
                            </h3>
                          )}
                          {/* <Badge 
                            variant="outline" 
                            className="text-xs px-2 py-0.5 h-5 shrink-0"
                          >
                            {conv.chat_type === 'normativa_nacional' ? 'Normativa' : 'Constituciones'}
                          </Badge> */}
                        </div>
                        <span className="text-xs text-muted-foreground/70">
                          {formatDate(conv.update_time || (conv as Conversation & { updated_at?: string }).updated_at || '')}
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground shrink-0"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename(conv);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveConversation(conv);
                            }}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archivar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(conv);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
                ))
              )}
              {loadingMore && (
                <>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={`skeleton-${i}`}
                      className="cursor-pointer transition-colors duration-150 border-b border-border/60 last:border-b-0"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                            </div>
                            <span className="block h-3 w-24 bg-muted/80 rounded animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {/* Sentinel spacing at the bottom for easier reach */}
              <div className="h-4" />
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-muted/30">

        {/* Messages */}
        <div className="flex-1 min-h-0 p-0">
          {isLoading ? (
            /* Skeleton state when switching conversations */
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
            /* Welcome message when no messages - full height centering */
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="max-w-md space-y-4">
                <div className="flex justify-center">
                  <SvgEstampa className="h-24 w-24 " fill="currentColor"/>
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-3xl font-bold text-foreground">
                    Bienvenido
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Puedes preguntarme sobre normativa nacional o constituciones. 
                    Empieza escribiendo tu pregunta abajo.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Messages area with scroll */
            <ScrollArea className="h-full">
              <div className="max-w-4xl mx-auto space-y-4 p-4">
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row items-start'
                  }`}
                >
                  <div
                    className={`rounded-lg p-3 group ${
                      message.role === 'user'
                        ? 'bg-accent dark:bg-muted'
                        : ''
                    }`}
                  >
                    <div className={`prose-chat text-md ${message.role === 'user' ? 'text-accent-foreground' : 'tracking-wide leading-relaxed'}`}>
                      <ReactMarkdown 
                        components={{
                          p: ({ children }) => <p className={message.role === 'user' ? 'text-accent-foreground' : ''}>{children}</p>,
                          strong: ({ children }) => <strong className={message.role === 'user' ? 'text-accent-foreground' : ''}>{children}</strong>,
                          em: ({ children }) => <em className={message.role === 'user' ? 'text-accent-foreground' : ''}>{children}</em>,
                          code: ({ children }) => <code className={message.role === 'user' ? 'text-accent-foreground bg-accent-foreground/20' : 'bg-muted-foreground/20'}>{children}</code>,
                          pre: ({ children }) => <pre className={message.role === 'user' ? 'text-accent-foreground bg-accent-foreground/20' : 'bg-muted-foreground/20'}>{children}</pre>,
                          ul: ({ children }) => <ul className={message.role === 'user' ? 'text-accent-foreground' : ''}>{children}</ul>,
                          ol: ({ children }) => <ol className={message.role === 'user' ? 'text-accent-foreground' : ''}>{children}</ol>,
                          li: ({ children }) => <li className={message.role === 'user' ? 'text-accent-foreground' : ''}>{children}</li>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                      
                      {/* Display normas used as context if available */}
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
                          className={`h-7 w-7 p-1 ${
                            message.feedback === 'like' 
                              ? 'bg-muted' 
                              : ''
                          }`}
                        >
                          <ThumbsUp className={`h-3 w-3 ${message.feedback === 'like' ? 'fill-current' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDislikeMessage(message.id, message.feedback)}
                          className={`h-7 w-7 p-1 ${
                            message.feedback === 'dislike' 
                              ? 'bg-muted' 
                              : ''
                          }`}
                        >
                          <ThumbsDown className={`h-3 w-3 ${message.feedback === 'dislike' ? 'fill-current' : ''}`} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator when streaming starts but no content yet */}
            {isStreaming && !streamingMessage && (
              <LoadingMessage />
            )}
            
            {/* Streaming message */}
            {isStreaming && streamingMessage && (
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

        {/* Input Area - always visible */}
        <div className="p-4 pt-0 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <InputGroup className="rounded-3xl  bg-card border border-border focus-visible:ring-transparent">
                <InputGroupTextarea
                  ref={textareaRef}
                  data-slot="input-group-control"
                  value={inputMessage + (interimText ? interimText : '')}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? "Escuchando..." : "Cómo puedo ayudarte?"}
                  className="p-4 max-h-[220px] placeholder:text-muted-foreground/70 text-sm leading-6  "
                  disabled={isStreaming}
                />
              
              <InputGroupAddon align="block-end">
                <div className="flex items-center justify-between w-full">
                  <ToneSelector
                    selectedTone={tone}
                    onToneChange={setTone}
                    disabled={isStreaming}
                  />
                  <div className="flex items-center gap-2">
                    <InputGroupButton
                      className="h-8 w-8 p-0 rounded-full"
                      size="sm"
                      variant={isListening ? "default" : "ghost"}
                      onClick={isListening ? stopDictation : startDictation}
                      disabled={isStreaming}
                      title={isListening ? "Detener dictado" : "Iniciar dictado"}
                    >
                      {isListening ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </InputGroupButton>
                    <Button
                      className="h-8 w-8 rounded-full p-0 ml-2"
                      size="sm"
                      variant="default"
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isStreaming}
                    >
                      {isStreaming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUp className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </InputGroupAddon>
            </InputGroup>
            
            {/* Disclaimer text */}
            <div className="flex justify-center mt-2">
              <p className="text-xs text-muted-foreground text-center">
                La IA puede cometer errores. Verifica la información importante.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete chat?</DialogTitle>
            <DialogDescription>
              This will delete <strong>{conversationToDelete?.title}</strong>.
              <br />
              <span className="text-xs text-muted-foreground mt-2 block">
                Visit settings to delete any memories saved during this chat.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteConversation}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}