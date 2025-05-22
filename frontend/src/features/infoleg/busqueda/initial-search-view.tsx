'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import SvgSearch from '@/components/icons/Search';

export default function InitialSearchView() {
  return (
    <section className='relative flex flex-col items-center justify-center  h-full '>
      {/* Background grid cards */}
      <div
        className='absolute inset-0 grid grid-cols-2 sm:grid-cols-3 gap-4 pointer-events-none'
        style={{
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 10%, transparent 70%)',
          maskImage:
            'radial-gradient(ellipse at center, black 10%, transparent 70%)',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
        }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <Card
            key={i}
            className='rounded-3xl bg-card shadow-sm'
            style={{ aspectRatio: '1 / 1' }}
          />
        ))}
      </div>

      {/* Floating Card */}
      <motion.div
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className='relative z-10 w-full max-w-4xl mx-auto px-4'
      >
        <Card className='flex flex-col lg:flex-row items-center gap-4 sm:gap-8 p-6 sm:px-10 sm:py-10 shadow-sm bg-card'>
          <SvgSearch className='w-32 h-auto sm:w-48 text-slate-600 dark:text-slate-300' />

          <div className='text-center lg:text-left max-w-md'>
            <h2 className='text-xl sm:text-2xl font-semibold tracking-tight mb-4'>
              Empecemos
            </h2>
            <p className='text-sm sm:text-base leading-relaxed text-muted-foreground'>
              Ingresá palabras clave o seleccioná filtros. Luego presioná el
              botón de
              <kbd className='ml-1 rounded border px-1.5 py-0.5 text-xs'>
                Buscar
              </kbd>
              para comenzar.
            </p>
          </div>
        </Card>
      </motion.div>
    </section>
  );
}
