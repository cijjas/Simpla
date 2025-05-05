import Hero from '@/features/home/Hero';
import { StatsSection } from '@/features/dashboard/StatsSection';

export default function Home() {
  return (
    <main className='container mx-auto px-4 py-8'>
      <Hero />
      <StatsSection />
    </main>
  );
}
