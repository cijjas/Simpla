'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { ProgressiveText } from '@/components/ui/progressive-text';
import SvgEstampa from '@/../public/svgs/estampa.svg';

export const ValuePropositionSection = memo(function ValuePropositionSection() {
  return (
    <section className='py-40 bg-background light'>
      <div className='mx-auto max-w-6xl px-6'>
        <div className='flex flex-row gap-8 lg:gap-16 items-center'>
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
            className='flex-1 space-y-6 flex flex-col justify-center'
          >
            <ProgressiveText
              className='text-4xl md:text-5xl font-bold leading-tight font-serif tracking-tight'
              delay={0.1}
              stagger={0.04}
            >
              La manera más simple<br />
              de entender las leyes.
            </ProgressiveText>
            <ProgressiveText
              className='text-lg leading-relaxed tracking-tight'
              delay={0.2}
              stagger={0.03}
            >
              Busca normas, regulaciones, y artículos de<br />
              forma clara. Ideal para ciudadanos,<br />
              emprendedores y empresas.
            </ProgressiveText>
          </motion.div>

          {/* Estampa SVG */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
            className='flex-shrink-0 flex justify-center lg:justify-end'
          >
            <div className='relative w-60 h-auto lg:w-72'>
              <SvgEstampa 
                className='w-full h-auto max-h-60 lg:max-h-72 text-muted' 
                fill='currentColor'
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});
