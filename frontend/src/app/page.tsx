import Hero from '@/features/home/Hero';
import FeaturesSection from '@/features/home/FeaturesSection';
import HowItWorksSection from '@/features/home/HowItWorksSection';
import TestimonialsSection from '@/features/home/TestimonialsSection';
import FAQSection from '@/features/home/FAQSection';
import CTASection from '@/features/home/CTASection';
import PricingSection from '@/features/home/PricingSection';

export default function Home() {
  return (
    <main className='relative overflow-hidden'>
      <div className='container mx-auto px-4 py-8'>
        <Hero />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        {/* <PricingSection /> */}
        <FAQSection />
        <CTASection />
      </div>
    </main>
  );
}
