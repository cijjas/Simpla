// app/(app)/layout.tsx
import { redirect } from 'next/navigation';
import { Toaster } from '@/components/ui/sonner';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';
import { auth } from '@/lib/auth';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className='flex min-h-screen'>
      <AppSidebar />
      <div className='flex flex-1 flex-col min-h-0'>
        <AppHeader />
        <main className='flex-1 p-0 min-h-0'>{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
