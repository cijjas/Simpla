'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import LandModified from '@/../public/svgs/land-modified.svg';

export function HeroSection() {
  return (
    <section className='relative h-screen flex items-center overflow-hidden'>
      {/* Background Image */}
      <div className='absolute inset-0 z-0'>
        <LandModified
          className='absolute inset-0 w-full h-full'
          preserveAspectRatio='xMidYMid slice'
          style={{ fill: 'currentColor' }} // or any color you want
        />
        <div className='absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent' />
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
      <div className='relative z-10 mx-auto max-w-7xl px-4 w-full flex items-end justify-center h-screen'>
        <div className='text-center max-w-4xl mb-20'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1 className='text-5xl md:text-7xl font-bold mb-6 font-serif tracking-tight '>
              Claridad y Precisión en la Búsqueda Normativa.
            </h1>
            <p className='text-xl mb-8 max-w-2xl mx-auto drop-shadow-sm'>
              Una herramienta impulsada por inteligencia artificial para acceder
              fácilmente a la legislación
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
            className='flex justify-center'
          >
            <Button size='lg' asChild className='drop-shadow-lg'>
              <Link href='/iniciar-sesion'>Comenzar</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
