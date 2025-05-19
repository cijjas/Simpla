'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import { Footer } from './Footer';
import { FeedbackContact } from '@/features/feedback/FeedbackContact';
import { Toaster } from '@/components/ui/sonner';

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const authRoutes = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/chat',
  ];
  const hideLayout = authRoutes.some(route => pathname.startsWith(route));

  return (
    <>
      {!hideLayout && <Header />}
      <main className='flex-1'>{children}</main>
      {!hideLayout && (
        <>
          <Footer />
          <FeedbackContact />
          <Toaster />
        </>
      )}
    </>
  );
}
