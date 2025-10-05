'use client';

import React from 'react';
import { PlansManager } from '@/features/subscription/components/plans-manager';

export function PlansSection() {
  return (
    <div className="space-y-6">
      <PlansManager />
    </div>
  );
}
