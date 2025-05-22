import type React from 'react';
import { redirect } from 'next/navigation';
import { Toaster } from '@/components/ui/sonner';
import { auth } from '@/features/auth/utils';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import AppHeader from '@/components/layout/app-header';
import { cookies } from 'next/headers';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  // Read the sidebar state from cookies
  const cookieStore = cookies();
  const sidebarState = (await cookieStore).get('sidebar_state');
  const defaultOpen = sidebarState ? sidebarState.value === 'true' : true;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <div className='flex-1 flex flex-col w-0 min-w-0 relative'>
        <SidebarInset>
          <AppHeader />
          <main className='flex-1'>{children}</main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
