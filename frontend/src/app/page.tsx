import Header from '@/components/layout/Header';
import Hero from '@/components/hero/Hero';
import StatsSection from '@/components/dashboard/StatsSection';

export default function Home() {
  return (
    <main className='container mx-auto px-4 py-8'>
      <Hero />
      <StatsSection />
    </main>
  );
}
