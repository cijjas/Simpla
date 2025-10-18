'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className='relative h-screen flex items-center overflow-hidden'>
      {/* Background Image */}
      <div className='absolute inset-0 z-0'>
        <Image
          src='/images/land-modified.png'
          alt='Paisaje argentino - naturaleza y tradición'
          fill
          className='object-cover'
          priority
        />
        <div className='absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent' />
        <div className='absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent' style={{ top: '80%' }} />
        <div className='absolute top-0 left-0 right-0 bg-gradient-to-b from-background to-transparent' style={{ height: '40%' }} />
      </div>

      {/* Content */}
      <div className='relative z-10 mx-auto max-w-7xl px-4 w-full flex items-end justify-center h-screen'>
        <div className='text-center max-w-4xl mb-20'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1 className='text-5xl md:text-7xl font-bold mb-6 font-serif tracking-tight drop-shadow-lg'>
              Donde buscar legislación se vuelve simple
            </h1>
            <p className='text-xl mb-8 max-w-2xl mx-auto drop-shadow-sm'>
              IA que entiende tu consulta legal y encuentra la norma exacta en la legislación argentina
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
            className='flex justify-center'
          >
            <Button size='lg' asChild className='drop-shadow-lg'>
              <Link href='/iniciar-sesion'>
                Comenzar
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

    </section>
  );
}
