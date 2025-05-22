'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function Hero() {
  return (
    <section className='relative min-h-screen flex flex-col items-center text-center pt-10'>
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className='mb-10'
      >
        <div className='relative w-full max-w-md aspect-[10/11] mx-auto mb-10'>
          <Image
            src='/images/logo_completo_light.png'
            alt='SIMPLA logo claro'
            width={320}
            height={460}
            className='w-full h-auto dark:hidden'
            priority
          />
          <Image
            src='/images/logo_completo_dark.png'
            alt='SIMPLA logo oscuro'
            width={320}
            height={460}
            className='w-full h-auto hidden dark:block'
            priority
          />
        </div>
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
        className='text-5xl font-bold text-navy-900 mb-6 font-serif tracking-tightest'
        style={{ letterSpacing: '-0.03em' }}
      >
        La manera más simple <br /> de entender las leyes
      </motion.h1>

      {/* Paragraph */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
        className='text-2xl text-gray-700 mb-6 font-sans max-w-2xl mx-auto'
      >
        Encontrá info legal y accedé a datos útiles
      </motion.p>

      {/* Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease: 'easeOut' }}
        className='mb-10'
      >
        <Link href='/busqueda'>
          <Button size='lg'>
            <Search className='mr-2 h-4 w-4' />
            Comenzar a Buscar
          </Button>
        </Link>
      </motion.div>

      {/* Fading Line at Bottom */}
      <div className='absolute bottom-0 left-1/2 w-full max-w-xl -translate-x-1/2 h-px'>
        <div className='h-full bg-gradient-to-r from-transparent via-gray-400 to-transparent' />
      </div>
    </section>
  );
}
