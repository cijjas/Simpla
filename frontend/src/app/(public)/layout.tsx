'use client';

// app/(public)/layout.tsx
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LandHeader } from '@/features/landing';
import { Footer } from '@/features/landing/components/footer';
import { FeedbackFloater } from '@/features/feedback/components/feedback-floater';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { LightThemeProvider } from '@/features/landing/components/light-theme-provider';
import { ProgressiveText } from '@/components/ui/progressive-text';
import LandModified from '@/../public/svgs/land-modified.svg';

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

  // Check if this is a legal page (terminos or privacidad)
  const isLegalPage = pathname === '/terminos' || pathname === '/privacidad';
  
  // Get page title based on pathname
  const getPageTitle = () => {
    if (pathname === '/terminos') return 'Términos y Condiciones';
    if (pathname === '/privacidad') return 'Política de Privacidad';
    return '';
  };

  return (
    <LightThemeProvider>
      <main className='relative overflow-hidden light'>
        {/* Header */}
        <LandHeader />
        
        {/* Hero Section for legal pages */}
        {isLegalPage && (
          <section className='relative h-screen flex items-center overflow-hidden light'>
            {/* Background Image */}
            <div className='absolute inset-0 z-0'>
              <LandModified
                className='absolute inset-0 w-full h-full object-cover'
                preserveAspectRatio='xMidYMid slice'
                style={{ fill: 'currentColor' }} 
              />
              <div
                className='absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent'
                style={{ top: '80%' }}
              />
              <div
                className='absolute top-0 left-0 right-0 bg-gradient-to-b from-background to-transparent'
                style={{ height: '40%' }}
              />
            </div>

            {/* Content */}
            <div className='relative z-10 mx-auto max-w-6xl px-6 w-full flex items-end justify-center h-screen'>
              <div className='text-center max-w-4xl mb-20'>
                <ProgressiveText
                  className='text-5xl md:text-7xl font-bold mb-6 font-serif tracking-tight'
                  delay={0.1}
                  stagger={0.05}
                >
                  {getPageTitle()}
                </ProgressiveText>
                <ProgressiveText
                  className='text-xl mb-8 max-w-2xl mx-auto drop-shadow-sm'
                  delay={0.3}
                  stagger={0.03}
                >
                  Última actualización: Agosto 2024
                </ProgressiveText>
              </div>
            </div>
          </section>
        )}
        
        {/* Main Content */}
        <main className='flex-1'>{children}</main>
        
        {/* Footer */}
        <Footer />
        
        {/* Feedback Floater */}
        <FeedbackFloater />
      </main>
    </LightThemeProvider>
  );
}
