'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

export function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Dr. Carlos Mendoza',
      role: 'Abogado',
      company: 'Estudio Mendoza & Asociados',
      content: 'El chatbot RAG de Simpla me ayuda a encontrar normas específicas rápidamente. Es muy útil para mi investigación diaria.',
      rating: 5
    },
    {
      name: 'Dra. Laura Fernández',
      role: 'Abogada',
      company: 'Estudio Jurídico Fernández',
      content: 'Me gusta poder organizar las normas en carpetas por área de práctica. Es una herramienta práctica para mi trabajo.',
      rating: 5
    },
    {
      name: 'Dr. Roberto Silva',
      role: 'Abogado',
      company: 'Silva & Abogados',
      content: 'Simpla es una herramienta útil para acceder a la normativa argentina. La búsqueda por lenguaje natural funciona bien.',
      rating: 5
    }
  ];

  return (
    <section className='relative pt-80 pb-20 overflow-hidden'>
      {/* Background Image */}
      <div className='absolute inset-0 z-0'>
        <Image
          src='/images/patagonia.png'
          alt='Patagonia argentina - paisajes únicos'
          fill
          className='object-cover'
        />
        <div className='absolute inset-0 bg-slate-900/70' />
      </div>

      {/* Content */}
      <div className='relative z-10 mx-auto max-w-7xl px-4'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className='text-center mb-16'
        >
          <h2 className='text-4xl md:text-5xl font-bold text-white mb-6'>
            Lo que dicen nuestros usuarios
          </h2>
          <p className='text-xl text-white/80 max-w-3xl mx-auto'>
            Conocé las experiencias de profesionales del derecho que usan Simpla 
            para su investigación legal diaria
          </p>
        </motion.div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              className='bg-background rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300'
            >
              <Quote className='h-8 w-8 text-gray-400 mb-6' />
              
              <div className='flex mb-4'>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className='h-4 w-4 text-blue-600 dark:text-blue-400 fill-current' />
                ))}
              </div>

              <p className='text-gray-700 dark:text-gray-300 mb-6 leading-relaxed'>
                &ldquo;{testimonial.content}&rdquo;
              </p>

              <div>
                <div className='font-semibold text-gray-900 dark:text-white text-lg'>
                  {testimonial.name}
                </div>
                <div className='text-gray-600 dark:text-gray-400 text-sm'>
                  {testimonial.role}
                </div>
                <div className='text-gray-500 dark:text-gray-500 text-sm'>
                  {testimonial.company}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
