'use client';

// app/(public)/layout.tsx
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import { LandHeader } from '@/features/landing';
import { Footer } from '@/components/layout/Footer';
import { FeedbackFloater } from '@/features/feedback/components/feedback-floater';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/inicio');
    }
  }, [isAuthenticated, isLoading, router]);

 

  if (isAuthenticated) {
    return null;
  }

  // Use LandHeader and LandFooter for home page, regular Header and Footer for other routes
  const isHomePage = pathname === '/';
  const HeaderComponent = isHomePage ? LandHeader : Header;
 

  return (
    <>
      <HeaderComponent />
      <main className='flex-1'>{children}</main>
      <FeedbackFloater />
    </>
  );
}
