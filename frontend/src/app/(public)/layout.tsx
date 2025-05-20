// app/(public)/layout.tsx
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FeedbackContact } from '@/features/feedback/FeedbackContact';
import { Toaster } from '@/components/ui/sonner';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
