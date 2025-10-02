'use client';

import { useRef, useEffect, useState } from 'react';
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
import { Send, Bot, User, Plus, Archive, Trash2, Loader2, MoreHorizontal, Pencil } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { 
  useConversations,
  type Conversation,
  formatTime,
  formatDate 
} from './index';

export default function ConversacionesPage() {
  // Use conversations context
  const {
    state,
    loadConversation,
    selectEmptyConversation,
    sendMessage,
    archiveConversation,
    deleteConversation,
    startRenameConversation,
    saveRenameConversation,
    cancelRenameConversation,
    setChatType,
    setTempTitle,
  } = useConversations();

  // Local state for UI
  const [inputMessage, setInputMessage] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

  // Destructure state for easier access
  const {
    conversations,
    currentConversation,
    messages,
    currentSessionId,
    chatType,
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
    
    await deleteConversation(conversationToDelete);
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isStreaming) return;

    const messageContent = inputMessage;
    setInputMessage('');
    await sendMessage(messageContent);
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
      <div className="w-80 border-r bg-background flex flex-col h-full">
        {/* Fixed Header */}
        <div className="p-4 border-b bg-background flex-shrink-0">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground mb-3">Conversaciones</h2>
            <Button 
              onClick={selectEmptyConversation} 
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
                            <h3 className="font-medium text-sm truncate text-foreground">
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
        {/* Chat Header - only show if there's a current conversation */}
        {currentConversation && (
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
            </div>
          </div>
        )}

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
                        ? 'bg-primary'
                        : ''
                    }`}
                  >
                    <div className={`prose-chat ${message.role === 'user' ? 'text-primary-foreground' : 'tracking-wide leading-relaxed'}`}>
                      <ReactMarkdown 
                        components={{
                          p: ({ children }) => <p className={message.role === 'user' ? 'text-primary-foreground' : ''}>{children}</p>,
                          strong: ({ children }) => <strong className={message.role === 'user' ? 'text-primary-foreground' : ''}>{children}</strong>,
                          em: ({ children }) => <em className={message.role === 'user' ? 'text-primary-foreground' : ''}>{children}</em>,
                          code: ({ children }) => <code className={message.role === 'user' ? 'text-primary-foreground bg-primary-foreground/20' : 'bg-muted-foreground/20'}>{children}</code>,
                          pre: ({ children }) => <pre className={message.role === 'user' ? 'text-primary-foreground bg-primary-foreground/20' : 'bg-muted-foreground/20'}>{children}</pre>,
                          ul: ({ children }) => <ul className={message.role === 'user' ? 'text-primary-foreground' : ''}>{children}</ul>,
                          ol: ({ children }) => <ol className={message.role === 'user' ? 'text-primary-foreground' : ''}>{children}</ol>,
                          li: ({ children }) => <li className={message.role === 'user' ? 'text-primary-foreground' : ''}>{children}</li>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <p className={`text-xs opacity-70 mt-1 ${message.role === 'user' ? 'text-primary-foreground' : ''}`}>
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
                  <div className="rounded-lg p-3">
                    <div className="prose-chat tracking-wide leading-relaxed">
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
        </div>

        {/* Input Area - always visible */}
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