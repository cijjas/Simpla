'use client';

import React from 'react';
import { UsageManager } from '@/features/subscription/components/usage-manager';

export function UsageSection() {
  return (
    <div className="space-y-6">
      <UsageManager />
    </div>
  );
}
