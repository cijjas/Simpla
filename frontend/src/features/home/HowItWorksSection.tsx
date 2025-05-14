'use client';

import { motion } from 'framer-motion';
import { Search, FileText, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Busca',
    description: 'Ingresa el tema legal o norma que necesitas entender.',
  },
  {
    icon: FileText,
    title: 'Explora',
    description:
      'Navega por nuestros documentos simplificados y explicaciones claras.',
  },
  {
    icon: CheckCircle,
    title: 'Preguntá',
    description:
      'Entiende fácilmente conceptos legales complejos usando AI avanzada.',
  },
];

export default function HowItWorksSection() {
  return (
    <section className='py-20 relative'>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className='text-center mb-16'
      >
        <h2 className='text-4xl font-bold mb-4 font-serif tracking-tight'>
          Cómo Funciona
        </h2>
        <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
          Un proceso simple para acceder a información legal de manera clara y
          eficiente.
        </p>
      </motion.div>

      <div className='flex flex-col md:flex-row justify-between items-center max-w-5xl mx-auto'>
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2, duration: 0.6 }}
            className='flex flex-col items-center text-center mb-10 md:mb-0 px-4'
          >
            <div className='relative'>
              <div className='w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6'>
                <step.icon className='w-10 h-10 text-primary' />
              </div>
            </div>
            <h3 className='text-2xl font-bold mb-3'>{step.title}</h3>
            <p className='text-gray-600'>{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
