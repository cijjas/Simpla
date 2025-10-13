'use client';

import { motion } from 'framer-motion';
import SvgEstampa from '@/components/icons/Estampa';

export function AboutUsSection() {
  return (
    <section className='py-40 bg-background'>
      <div className='mx-auto max-w-7xl px-4'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
            className='space-y-6'
          >
            <h2 className='text-4xl md:text-5xl font-bold leading-tight font-serif tracking-tight'>
              La manera más simple<br />
              de entender las leyes.
            </h2>
            <p className='text-lg leading-relaxed tracking-tight'>
              Busca normas, regulaciones, y artículos de<br />
              forma clara. Ideal para ciudadanos,<br />
              emprendedores y empresas.
            </p>
          </motion.div>

          {/* Estampa SVG */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
            className='flex justify-center lg:justify-end'
          >
            <div className='relative w-60 h-auto lg:w-72'>
              <SvgEstampa 
                className='w-full h-auto max-h-60 lg:max-h-72' 
                style={{ color: '#F1F2F3' }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
