'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ConversacionesPage from '@/features/conversations/conversations-page';
import { useConversations } from '@/features/conversations';

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params?.id as string;
  const { loadConversation, state, selectEmptyConversation } = useConversations();

  useEffect(() => {
    if (conversationId === 'new') {
      // For new conversations, clear the current state if needed
      if (state.currentSessionId !== null) {
        selectEmptyConversation();
      }
    } else if (conversationId) {
      // Load the conversation only if it's different from current
      if (state.currentSessionId !== conversationId) {
        loadConversation(conversationId).catch((error) => {
          console.error('Failed to load conversation:', error);
          router.push('/conversaciones/new');
        });
      }
    }
  }, [conversationId, state.currentSessionId, loadConversation, router, selectEmptyConversation]);

  return <ConversacionesPage />;
}

