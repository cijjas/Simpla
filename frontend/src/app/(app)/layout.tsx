'use client';

import type React from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { AppSidebar } from '@/components/layout/app-sidebar';
import AppHeader from '@/components/layout/app-header';
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { BookmarksProvider } from '@/features/bookmark';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're done loading AND not authenticated
    // This prevents premature redirects during auth initialization
    if (!isLoading && !isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      router.push('/iniciar-sesion');
    }
  }, [isAuthenticated, isLoading, router]);


  if (!isAuthenticated) {
    return null;
  }

  return (
    <BookmarksProvider>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader />
          <SidebarInset>
            <div className="flex flex-1 flex-col gap-4">
              {children}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </BookmarksProvider>
  );
}
