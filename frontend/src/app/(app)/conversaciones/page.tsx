import ConversacionesPage from '@/features/conversations/conversations-page';
import { ConversationsProvider } from '@/features/conversations';

export default function Page() {
  return (
    <ConversationsProvider>
      <ConversacionesPage />
    </ConversationsProvider>
  );
}
