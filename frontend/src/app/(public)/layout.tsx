// app/(public)/layout.tsx
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FeedbackFloater } from '@/features/feedback/components/feedback-floater';
import { auth } from '@/features/auth/utils';
import { redirect } from 'next/navigation';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session) redirect('/inicio');

  return (
    <>
      <Header />
      <main className='flex-1'>{children}</main>
      <Footer />
      <FeedbackFloater />
    </>
  );
}
