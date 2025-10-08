import { ReactNode } from 'react';
import { NormasProvider } from '@/features/normas/contexts/normas-context';

interface NormasLayoutProps {
  children: ReactNode;
}

export default function NormasLayout({ children }: NormasLayoutProps) {
  return (
    <NormasProvider>
      {children}
    </NormasProvider>
  );
}
