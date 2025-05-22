'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CTASection() {
  return (
    <section className='py-20 relative'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className='max-w-4xl mx-auto text-center bg-gradient-to-r from-primary/5 to-primary/10 p-12 rounded-2xl border border-primary/20 relative overflow-hidden'
      >
        {/* Fondo animado */}
        <motion.div
          className='absolute inset-0 opacity-10 z-0'
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'reverse',
          }}
          style={{
            backgroundImage:
              'radial-gradient(circle at center, currentColor 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Contenido */}
        <div className='relative z-10'>
          <h2 className='text-4xl font-bold mb-6 font-serif tracking-tight'>
            Empezá a simplificar tus trámites legales hoy
          </h2>
          <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto'>
            Sumate a miles de personas que ya están accediendo a sus normas y
            documentos legales de forma clara y sin vueltas.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link href='/login'>
              <Button size='lg' className='group w-full sm:w-auto'>
                Empezar ahora
                <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
              </Button>
            </Link>
            {/* <Link href='/busqueda'>
              <Button size='lg' variant='outline' className='w-full sm:w-auto'>
                Ver demostración
              </Button>
            </Link> */}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
