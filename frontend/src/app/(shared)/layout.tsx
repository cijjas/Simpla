'use client';

import { useEffect, useState } from 'react';
import AppLayout from '../(app)/layout';
import PublicLayout from '../(public)/layout';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show loading during hydration and auth check
  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <AppLayout>{children}</AppLayout>;
  }

  return <PublicLayout>{children}</PublicLayout>;
}
