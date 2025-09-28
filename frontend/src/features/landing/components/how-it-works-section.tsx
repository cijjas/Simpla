'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Search, FileText, CheckCircle, ArrowRight } from 'lucide-react';

export function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Configurá tu perfil profesional',
      description: 'Definí tus áreas de práctica para recibir alertas personalizadas y sugerencias relevantes.',
      icon: Search
    },
    {
      number: '02',
      title: 'Investigá con IA especializada',
      description: 'Conversá con nuestro chatbot jurídico que entiende contexto legal y sugiere precedentes relevantes.',
      icon: FileText
    },
    {
      number: '03',
      title: 'Organizá y colaborá',
      description: 'Guardá investigaciones en casos específicos, compartí con tu equipo y mantené todo actualizado.',
      icon: CheckCircle
    }
  ];

  return (
    <section className='py-40 bg-background'>
      <div className='mx-auto max-w-7xl px-4'>
        <div className='text-center mb-16'>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className='text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6'
          >
            Cómo Simpla transforma tu estudio jurídico
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
            className='text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto'
          >
            Una plataforma integral diseñada para optimizar la investigación legal profesional
          </motion.p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
            className='relative order-2 lg:order-1'
          >
            <div className='relative h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl'>
              <Image
                src='/images/gaucho.png'
                alt='Gaucho argentino - tradición y sabiduría'
                fill
                className='object-cover'
              />
              <div className='absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent' />
            </div>
            
            {/* Floating stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              viewport={{ once: true }}
              className='absolute -top-6 -right-6 bg-background p-4 rounded-xl shadow-xl'
            >
              <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>RAG</div>
              <div className='text-sm text-gray-600 dark:text-gray-300'>Tecnología</div>
            </motion.div>
          </motion.div>

          {/* Steps */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
            className='space-y-8 order-1 lg:order-2'
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                className='flex gap-6 group'
              >
                <div className='flex-shrink-0'>
                  <div className='w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg'>
                    {step.number}
                  </div>
                </div>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-3'>
                    <step.icon className='h-6 w-6 text-blue-600 dark:text-blue-400' />
                    <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
                      {step.title}
                    </h3>
                  </div>
                  <p className='text-gray-600 dark:text-gray-300 leading-relaxed'>
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className='h-5 w-5 text-gray-400 mt-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors' />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
