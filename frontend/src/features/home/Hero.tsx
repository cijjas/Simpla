'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className='text-center mb-16'>
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className='mb-10'
      >
        <Image
          src='/images/logo_completo_light.png'
          alt='SIMPLA logo claro'
          width={300}
          height={300}
          className='mx-auto dark:hidden'
          style={{ width: 'auto', height: 'auto' }}
          priority
        />
        <Image
          src='/images/logo_completo_dark.png'
          alt='SIMPLA logo oscuro'
          width={300}
          height={300}
          className='mx-auto hidden dark:block'
          style={{ width: 'auto', height: 'auto' }}
          priority
        />
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
        className='text-2xl text-gray-700 mb-10 font-sans'
      >
        Encontrá info legal y accedé a datos útiles
      </motion.p>
    </section>
  );
}
