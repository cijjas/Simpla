'use client';

import { motion } from 'framer-motion';
// Import SvgEstampa if you decide to use it again
// import SvgEstampa from '@/components/icons/Estampa';

export function WelcomeScreen() {
  return (
    // This div will be a flex item in ChatInput.
    // Added margin-bottom for spacing from the input box.
    // Ensure it allows pointer events if it had interactive elements.
    <motion.div
      initial={{ opacity: 0, y: 20 }} // Start slightly lower and transparent
      animate={{ opacity: 1, y: 0 }} // Animate to final position and opaque
      transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }} // Optional delay
      className='text-center flex flex-col items-center mb-6 w-full max-w-4xl px-4 pointer-events-auto'
    >
      {/* Example: Re-add icon if desired */}
      {/* <SvgEstampa className='h-20 w-20 mb-3 text-slate-500 dark:text-slate-400 flex-shrink-0' /> */}
      <h1 className='text-2xl font-semibold text-slate-700 dark:text-slate-200 font-serif'>
        Constituciones
      </h1>
      <p className='text-sm text-slate-500 dark:text-slate-400 max-w-md mt-2'>
        {' '}
        {/* Adjusted max-w for potentially narrower look */}
        Pregunta sobre la Constitución Nacional o la de cualquier provincia de
        Argentina. Estamos probando esta funcionalidad, no dudes en enviarnos
        tus comentarios.
      </p>
    </motion.div>
  );
}
