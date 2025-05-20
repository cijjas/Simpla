// app/(public)/layout.tsx
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FeedbackContact } from '@/features/feedback/FeedbackContact';
import { Toaster } from '@/components/ui/sonner';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session) redirect('/dashboard');

  return (
    <>
      <Header />
      <main className='flex-1'>{children}</main>
      <Footer />
      <FeedbackContact />
      <Toaster />
    </>
  );
}
