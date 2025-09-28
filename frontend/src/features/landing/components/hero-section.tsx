'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Mail } from 'lucide-react';

export function HeroSection() {
  return (
    <section className='relative min-h-screen flex items-center overflow-hidden'>
      {/* Background Image */}
      <div className='absolute inset-0 z-0'>
        <Image
          src='/images/forest.png'
          alt='Bosque argentino - naturaleza y tradición'
          fill
          className='object-cover'
          priority
        />
        <div className='absolute inset-0 bg-slate-800/80' />
      </div>

      {/* Content */}
      <div className='relative z-10 mx-auto max-w-7xl px-4 py-20 w-full'>
        <div className='max-w-4xl'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1 className='text-5xl md:text-7xl font-bold text-white mb-6 font-serif tracking-tight'>
              Simpla
            </h1>
            <h2 className='text-2xl md:text-3xl font-semibold text-white/90 mb-4'>
              La plataforma legal que revoluciona la investigación jurídica
            </h2>
            <p className='text-xl text-white/80 mb-8 max-w-2xl'>
              Optimizá la investigación legal en tu estudio de abogados con IA especializada, 
              búsquedas inteligentes y acceso instantáneo a toda la normativa argentina.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
            className='flex flex-col sm:flex-row gap-4 mb-12'
          >
            <Button size='lg' asChild >
              <Link href='/iniciar-sesion' className='bg-white text-slate-900 hover:bg-white/90 dark:bg-white dark:text-slate-900 dark:hover:bg-white/90'>
                Iniciar Sesión
                <ArrowRight className='ml-2 h-5 w-5' />
              </Link>
            </Button>
            <Button size='lg' variant='outline' asChild className='bg-white/10 text-white hover:bg-white/90  dark:bg-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:text-white'>
              <Link href='#contact'>
                <Mail className='mr-2 h-5 w-5' />
                Contactanos
              </Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
            className='grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto'
          >
            <div className='text-center'>
              <div className='text-3xl font-bold text-white mb-2'>50K+</div>
              <div className='text-white/70'>Normas en Base de Datos</div>
            </div>
            <div className='text-center'>
              <div className='text-3xl font-bold text-white mb-2'>24/7</div>
              <div className='text-white/70'>Disponible</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className='absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10'
      >
        <div className='w-6 h-10 border-2 border-white/50 rounded-full flex justify-center'>
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className='w-1 h-3 bg-white/70 rounded-full mt-2'
          />
        </div>
      </motion.div>
    </section>
  );
}
