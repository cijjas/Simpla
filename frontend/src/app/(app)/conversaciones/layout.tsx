'use client';

import { ConversationsProvider } from '@/features/conversations';

export default function ConversacionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConversationsProvider>
      {children}
    </ConversationsProvider>
  );
}


