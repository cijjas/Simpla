'use client';

import { ReactNode } from 'react';
import { NormasProvider } from '../../contexts/normas-context';

interface NormasLayoutProps {
  children: ReactNode;
}

export function NormasLayout({ children }: NormasLayoutProps) {
  return (
    <NormasProvider>
      {children}
    </NormasProvider>
  );
}
