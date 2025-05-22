import Hero from '@/features/welcome/Hero';
import FeaturesSection from '@/features/welcome/FeaturesSection';
import HowItWorksSection from '@/features/welcome/HowItWorksSection';
import TestimonialsSection from '@/features/welcome/TestimonialsSection';
import FAQSection from '@/features/welcome/FAQSection';
import CTASection from '@/features/welcome/CTASection';
import PricingSection from '@/features/welcome/PricingSection';

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
