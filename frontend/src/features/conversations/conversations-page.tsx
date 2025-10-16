'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { Badge } from '@/components/ui/badge';
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
import { User, Plus, Archive, Trash2, Loader2, MoreHorizontal, Pencil, ArrowUp, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import SvgEstampa from '@/components/icons/Estampa';
import ReactMarkdown from 'react-markdown';
import { LoadingMessage } from '@/features/conversations/components/loading-message';
import { 
  useConversations,
  type Conversation,
  formatDate 
} from './index';
import { ConversationNormasDisplay, ToneSelector } from './components';

export default function ConversacionesPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.id as string;

  // Use conversations context
  const {
    state,
    sendMessage,
    archiveConversation,
    deleteConversation,
    startRenameConversation,
    saveRenameConversation,
    cancelRenameConversation,
    setTone,
    setTempTitle,
    submitFeedback,
    removeFeedback,
  } = useConversations();

  // Local state for UI
  const [inputMessage, setInputMessage] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Destructure state for easier access
  const {
    conversations,
    messages,
    tone,
    isLoading,
    isStreaming,
    streamingMessage,
    isLoadingConversations,
    editingConversationId,
    tempTitle,
  } = state;

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingMessage]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputMessage]);

  const handleDeleteClick = (conv: Conversation) => {
    setConversationToDelete(conv);
    setDeleteDialogOpen(true);
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

    const messageContent = inputMessage;
    setInputMessage('');
    await sendMessage(messageContent);
  };

  // Navigate to new conversation ID after it's created
  useEffect(() => {
    if (state.currentSessionId && conversationId === 'new' && !isStreaming) {
      // Navigate to the new conversation URL
      router.replace(`/conversaciones/${state.currentSessionId}`);
    }
  }, [state.currentSessionId, conversationId, isStreaming, router]);

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
        <div className="p-4 border-b flex-shrink-0 ">
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-foreground  ">Conversaciones</h2>
        </div>
        <div className="p-4 border-b bg-muted">
        <Button 
              onClick={handleNewConversation} 
              size="sm" 
              disabled={isLoading}
              className="w-full "
            >
              <Plus className="size-4 mr-2" />
              Nueva conversación
            </Button>
        </div>

        {/* Scrollable Conversations List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-0">
              {isLoadingConversations ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Cargando conversaciones...</p>
                </div>
              ) : (
                conversations.map((conv) => (
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
                              onBlur={() => saveRenameConversation(conv.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveRenameConversation(conv.id);
                                } else if (e.key === 'Escape') {
                                  cancelRenameConversation();
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
                          <Badge 
                            variant="outline" 
                            className="text-xs px-2 py-0.5 h-5 shrink-0"
                          >
                            {conv.chat_type === 'normativa_nacional' ? 'Normativa' : 'Constituciones'}
                          </Badge>
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
                              startRenameConversation(conv);
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
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* Messages */}
        <div className="flex-1 min-h-0 p-4">
          {isLoading ? (
            /* Loading state when switching conversations */
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="max-w-md space-y-4">
                <div className="flex justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Cargando conversación...
                  </p>
                </div>
              </div>
            </div>
          ) : messages.length === 0 && !isStreaming ? (
            /* Welcome message when no messages - full height centering */
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="max-w-md space-y-4">
                <div className="flex justify-center">
                  <SvgEstampa className="h-24 w-24 text-primary dark:text-foreground" />
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
              <div className="max-w-4xl mx-auto space-y-4">
            
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
                  <div className={`flex-shrink-0 ${message.role === 'user' ? '' : 'pt-4'}`}>
                    {message.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                        <User className="h-4 w-4" />
                      </div>
                    ) : (
                      <SvgEstampa className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-3 group ${
                      message.role === 'user'
                        ? 'bg-accent'
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
                            <div className="h-3 w-3 rounded-full bg-green-500" />
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
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                      <SvgEstampa className="h-4 w-4" />
                    </div>
                  </div>
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
        <div className="p-4  flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <InputGroup className="rounded-3xl  bg-card border border-border focus-visible:ring-transparent">
                <InputGroupTextarea
                  ref={textareaRef}
                  data-slot="input-group-control"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje..."
                  className="p-4 max-h-[220px]   "
                  disabled={isStreaming}
                />
              
              <InputGroupAddon align="block-end">
                <div className="flex items-center justify-between w-full">
                  <ToneSelector
                    selectedTone={tone}
                    onToneChange={setTone}
                    disabled={isStreaming}
                  />
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