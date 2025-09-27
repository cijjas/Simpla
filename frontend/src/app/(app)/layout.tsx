import type React from 'react';
import { redirect } from 'next/navigation';
import { Toaster } from '@/components/ui/sonner';
import { auth } from '@/features/auth/utils';
import { AppSidebar } from '@/components/layout/app-sidebar';
import AppHeader from '@/components/layout/app-header';
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { cookies } from 'next/headers';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect('/iniciar-sesion');

  // Read the sidebar state from cookies
  const cookieStore = cookies();
  const sidebarState = (await cookieStore).get('sidebar_state');
  const defaultOpen = sidebarState ? sidebarState.value === 'true' : true;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
