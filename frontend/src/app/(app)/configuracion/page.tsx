'use client';

import { SettingsPage } from '@/features/settings/components/settings-page';
import { SubscriptionProvider } from '@/features/subscription/context/subscription-context';

export default function ConfiguracionPage() {
  return (
    <SubscriptionProvider>
      <SettingsPage />
    </SubscriptionProvider>
  );
}

