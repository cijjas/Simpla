'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Archive, Trash2, MoreHorizontal, Pencil } from 'lucide-react';
import {
  useConversations,
  type Conversation,
  formatDate,
} from '../index';

interface ConversationsSidebarProps {
  currentConversationId: string | null;
  onDeleteClick: (conv: Conversation) => void;
}

export function ConversationsSidebar({
  currentConversationId,
  onDeleteClick,
}: ConversationsSidebarProps) {
  const router = useRouter();
  const {
    state,
    archiveConversation,
    updateConversationTitle,
    loadMoreConversations,
  } = useConversations();

  const { conversations, isLoadingConversations } = state;
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const convScrollRootRef = useRef<HTMLDivElement>(null);

  // Infinite scroll for conversations list
  useEffect(() => {
    const rootEl = convScrollRootRef.current;
    if (!rootEl) return;
    const viewport = rootEl.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null;
    if (!viewport) return;

    const onScroll = () => {
      if (loadingMore || isLoadingConversations) return;
      const threshold = 80;
      const atBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - threshold;
      if (atBottom) {
        setLoadingMore(true);
        loadMoreConversations().finally(() => setLoadingMore(false));
      }
    };

    viewport.addEventListener('scroll', onScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', onScroll);
  }, [isLoadingConversations, loadMoreConversations, loadingMore]);

  const handleNewConversation = () => {
    router.push('/conversaciones/new');
  };

  const handleLoadConversation = (id: string) => {
    router.push(`/conversaciones/${id}`);
  };

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

  return (
    <div className="w-80 border-r flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b bg-background px-4 md:px-6 py-4">
        <div className="text-start space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold font-serif">Themis</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Tu asistente legal.</p>
        </div>
      </div>

      {/* New Conversation Button */}
      <div className="p-4 border-b bg-muted">
        <Button
          onClick={handleNewConversation}
          size="sm"
          disabled={state.isLoading}
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
            {!isLoadingConversations &&
              conversations
                .filter((conv) => conv.chat_type !== 'norma_chat')
                .map((conv) => (
                  <div
                    key={conv.id}
                    className={`cursor-pointer transition-colors duration-150 border-b border-border/60 last:border-b-0 ${
                      currentConversationId === conv.id
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
                                onDeleteClick(conv);
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
                ))}
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
            <div className="h-4" />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
