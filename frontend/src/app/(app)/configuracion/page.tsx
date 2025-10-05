'use client';

import { Suspense } from 'react';
import { SettingsPage } from '@/features/settings/components/settings-page';
import { SubscriptionProvider } from '@/features/subscription/context/subscription-context';

export default function ConfiguracionPage() {
  return (
    <SubscriptionProvider>
      <Suspense fallback={<div>Cargando configuración...</div>}>
        <SettingsPage />
      </Suspense>
    </SubscriptionProvider>
  );
}

