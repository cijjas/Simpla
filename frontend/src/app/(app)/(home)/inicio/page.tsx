// app/(public)/inicio/page.tsx
import { HeroSection } from '@/features/home/components/hero-section';
import { LatestNormasSection } from '@/features/home/components/latest-normas-section';
import { FeaturesSection } from '@/features/home/components/features-section';
import { Footer } from '@/components/layout/Footer';

export default function InicioPage() {
  return (
    <div className='flex min-h-screen flex-col bg-white dark:bg-background'>
      <main className='flex-1'>
        <HeroSection />
        <LatestNormasSection /> {/* No props passed */}
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
