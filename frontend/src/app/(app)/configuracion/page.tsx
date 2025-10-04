import { Suspense } from 'react';
import { SettingsPage } from '@/features/settings/components/settings-page';

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={<div>Cargando configuración...</div>}>
      <SettingsPage />
    </Suspense>
  );
}

