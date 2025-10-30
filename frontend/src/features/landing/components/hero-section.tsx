'use client';

import Link from 'next/link';
import { memo, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import LandModified from '@/../public/svgs/land-modified.svg';
import { AnimatedText } from './animated-text';

export const HeroSection = memo(function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Force animation to trigger when component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
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
          <div>
            <AnimatedText
              className='text-5xl md:text-7xl font-bold mb-6 font-serif tracking-tight'
              delay={0.1}
              stagger={0.05}
              isVisible={isVisible}
            >
              Claridad y Precisión en la Búsqueda Normativa.
            </AnimatedText>
            <AnimatedText
              className='text-xl mb-8 max-w-2xl mx-auto drop-shadow-sm'
              delay={0.3}
              stagger={0.03}
              isVisible={isVisible}
            >
              Una herramienta impulsada por inteligencia artificial para acceder
              fácilmente a la legislación
            </AnimatedText>
          </div>

          <div className='flex justify-center'>
            <Button size='lg' asChild className=''>
              <Link href='/iniciar-sesion'>Comenzar</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
});
