'use client';

import SvgEstampa from '@/components/icons/Estampa';
import { motion } from 'framer-motion';

export function WelcomeScreen() {
  return (
    <div className='flex items-center justify-center h-full'>
      <motion.div
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: -200 }}
        transition={{ duration: 0.3 }}
        className='text-center flex flex-col items-center'
      >
        <SvgEstampa className='h-24 w-24 mb-4 text-slate-600 dark:text-slate-400 flex-shrink-0' />
        <h1 className='text-2xl font-semibold text-slate-700 dark:text-slate-200'>
          Simpla
        </h1>
        <p className='text-sm text-slate-500 dark:text-slate-400'>
          Comienza una conversación.
        </p>
      </motion.div>
    </div>
  );
}
