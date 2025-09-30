'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Send, Bot, User, MessageSquare, Plus, Archive, Trash2, Loader2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { 
  ConversationsAPI, 
  type Message, 
  type Conversation, 
  type ConversationDetail,
  formatTime,
  formatDate 
} from '@/lib/conversations-api';

export default function ConversacionesPage() {
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatType, setChatType] = useState<'normativa_nacional' | 'constituciones'>('normativa_nacional');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

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

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const data = await ConversationsAPI.getConversations();
      setConversations(data.items);
    } catch (error) {
      toast.error('Error loading conversations');
      console.error(error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      setIsLoading(true);
      const conversation = await ConversationsAPI.getConversation(id);
      setCurrentConversation(conversation);
      setMessages(conversation.messages);
      setCurrentSessionId(id);
      setChatType(conversation.chat_type);
    } catch (error) {
      toast.error('Error loading conversation');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      setIsLoading(true);
      const conversation = await ConversationsAPI.createConversation({
        chat_type: chatType,
        title: 'Nueva conversación',
      });
      setCurrentConversation(conversation);
      setMessages([]);
      setCurrentSessionId(conversation.id);
      await loadConversations();
      toast.success('Nueva conversación creada');
    } catch (error) {
      toast.error('Error creating conversation');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (conv: Conversation) => {
    setConversationToDelete(conv);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete) return;
    
    try {
      await ConversationsAPI.deleteConversation(conversationToDelete.id);
      if (currentSessionId === conversationToDelete.id) {
        setCurrentConversation(null);
        setMessages([]);
        setCurrentSessionId(null);
      }
      await loadConversations();
      toast.success('Conversación eliminada');
    } catch (error) {
      toast.error('Error deleting conversation');
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isStreaming) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      tokens_used: 0,
      created_at: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      await ConversationsAPI.sendMessage(
        {
          content: inputMessage,
          session_id: currentSessionId || undefined,
          chat_type: chatType,
        },
        (chunk) => {
          if (chunk.content) {
            setStreamingMessage(prev => prev + chunk.content);
          }
        },
        (sessionId) => {
          setCurrentSessionId(sessionId);
          setIsStreaming(false);
          setStreamingMessage('');
          // Reload conversation to get the complete messages
          if (sessionId) {
            loadConversation(sessionId);
          }
          loadConversations();
        },
        (error) => {
          toast.error('Error sending message');
          console.error(error);
          setIsStreaming(false);
          setStreamingMessage('');
        }
      );
    } catch (error) {
      toast.error('Error sending message');
      console.error(error);
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r bg-background flex flex-col">
        <div className="p-4 border-b bg-background">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground mb-3">Conversaciones</h2>
            <Button 
              onClick={createNewConversation} 
              size="sm" 
              disabled={isLoading}
              className="w-full rounded-md bg-primary hover:bg-primary/90 shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva conversación
            </Button>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tipo de chat</label>
            <Select value={chatType} onValueChange={(value: 'normativa_nacional' | 'constituciones') => setChatType(value)}>
              <SelectTrigger className="rounded-lg border-border/50 bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="normativa_nacional">Normativa Nacional</SelectItem>
                <SelectItem value="constituciones">Constituciones</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1">
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
                className={`cursor-pointer transition-colors duration-150 border-b border-border/30 last:border-b-0 ${
                  currentSessionId === conv.id 
                    ? 'bg-primary/10 border-l-4 border-l-primary' 
                    : 'hover:bg-muted/30'
                }`}
                onClick={() => loadConversation(conv.id)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate text-foreground">
                          {conv.title}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className="text-xs px-2 py-0.5 h-5 shrink-0"
                        >
                          {conv.chat_type === 'normativa_nacional' ? 'Normativa' : 'Constituciones'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                        {conv.snippet}
                      </p>
                      <span className="text-xs text-muted-foreground/70">
                        {formatDate(conv.update_time)}
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold">{currentConversation.title}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">
                      {currentConversation.chat_type === 'normativa_nacional' ? 'Normativa Nacional' : 'Constituciones'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {currentConversation.total_tokens} tokens
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Archive className="h-4 w-4 mr-2" />
                    Archivar
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 p-4">
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
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {message.role === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                      <div
                        className={`rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Streaming message */}
                {isStreaming && streamingMessage && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex gap-3 max-w-[80%]">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                          <Bot className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="rounded-lg p-3 bg-muted">
                        <p className="text-sm whitespace-pre-wrap">
                          {streamingMessage}
                          <span className="animate-pulse">|</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Input Area */}
            <div className="border-t p-4 flex-shrink-0">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-2">
                  <Textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu mensaje..."
                    className="min-h-[60px] max-h-[120px] resize-none"
                    disabled={isStreaming}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isStreaming}
                    size="lg"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="text-center space-y-4">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto" />
              <div>
                <h2 className="text-2xl font-semibold">Selecciona una conversación</h2>
                <p className="text-muted-foreground mt-2">
                  Elige una conversación existente o crea una nueva para comenzar
                </p>
              </div>
              <Button onClick={createNewConversation} disabled={isLoading}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva conversación
              </Button>
            </div>
          </div>
        )}
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
