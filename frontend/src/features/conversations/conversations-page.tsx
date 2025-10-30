'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ConversationsSidebar } from './components/conversations-sidebar';
import { ConversationView } from './components/conversation-view';
import { useConversations, type Conversation } from './index';

interface ConversationsPageProps {
  conversationId: string | null;
}

export function ConversationsPage({ conversationId }: ConversationsPageProps) {
  const router = useRouter();
  const { state, loadConversation, selectEmptyConversation, deleteConversation } = useConversations();

  // Dialog state for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

  // Load conversation when ID changes
  useEffect(() => {
    if (conversationId === 'new') {
      selectEmptyConversation();
    } else if (conversationId) {
      loadConversation(conversationId).catch((error) => {
        console.error('Failed to load conversation:', error);
        router.push('/conversaciones/new');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]); // Only depend on conversationId - functions are stable

  // Navigate to new conversation when session ID is created (for new conversations)
  useEffect(() => {
    if (
      state.currentSessionId &&
      conversationId === 'new' &&
      state.messages.length > 0 &&
      state.currentSessionId !== conversationId
    ) {
      router.replace(`/conversaciones/${state.currentSessionId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentSessionId, conversationId, state.messages.length]); // Navigate when new session is created

  const handleDeleteClick = (conv: Conversation) => {
    setConversationToDelete(conv);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;

    const wasCurrentConversation = conversationToDelete.id === conversationId;
    await deleteConversation(conversationToDelete);
    setDeleteDialogOpen(false);
    setConversationToDelete(null);

    if (wasCurrentConversation) {
      router.push('/conversaciones/new');
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background">
      <ConversationsSidebar
        currentConversationId={conversationId === 'new' ? null : conversationId}
        onDeleteClick={handleDeleteClick}
      />
      <ConversationView conversationId={conversationId === 'new' ? null : conversationId} />

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
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
