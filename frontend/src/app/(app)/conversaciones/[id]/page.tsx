'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ConversacionesPage from '@/features/conversations/conversations-page';
import { useConversations } from '@/features/conversations';

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params?.id as string;
  const { loadConversation, selectEmptyConversation } = useConversations();

  useEffect(() => {
    if (conversationId === 'new') {
      // For new conversations, clear the current state
      selectEmptyConversation();
    } else if (conversationId) {
      // Load the conversation
      loadConversation(conversationId).catch((error) => {
        console.error('Failed to load conversation:', error);
        router.push('/conversaciones/new');
      });
    }
    // Only depend on conversationId changes - functions are stable via useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return <ConversacionesPage conversationId={conversationId} />;
}

