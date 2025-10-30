'use client';

import { useParams } from 'next/navigation';
import { ConversationsPage } from '@/features/conversations/conversations-page';

export default function Page() {
  const params = useParams();
  const conversationId = params?.id as string;

  return <ConversationsPage conversationId={conversationId} />;
}