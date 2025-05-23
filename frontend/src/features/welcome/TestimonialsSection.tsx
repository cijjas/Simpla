'use client';

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote:
      'La plataforma me ayudó a entender mis derechos como inquilino sin tener que recurrir a un abogado.',
    author: 'Martín Rodríguez',
    role: 'Trabajador independiente',
    avatar: '/placeholder.svg?height=40&width=40',
  },
  {
    quote:
      'Como emprendedora, necesitaba entender las regulaciones impositivas. Esta herramienta me ahorró tiempo y dolores de cabeza.',
    author: 'Laura Méndez',
    role: 'Dueña de un negocio',
    avatar: '/placeholder.svg?height=40&width=40',
  },
  {
    quote:
      'Los documentos claros me permitieron entender el proceso de divorcio sin tener que lidiar con términos complicados.',
    author: 'Carlos Vega',
    role: 'Usuario particular',
    avatar: '/placeholder.svg?height=40&width=40',
  },
];

export default function TestimonialsSection() {
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
          Lo que dicen quienes ya usan la plataforma
        </h2>
        <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
          Personas reales que encontraron una forma más simple de entender lo
          legal.
        </p>
      </motion.div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
          >
            <Card className='h-full border-2 hover:border-primary/20 transition-all duration-300'>
              <CardContent className='pt-6'>
                <Quote className='w-10 h-10 text-primary/30 mb-4' />
                <p className='text-lg italic'>{testimonial.quote}</p>
              </CardContent>
              <CardFooter className='flex items-center gap-4'>
                <Avatar>
                  <AvatarImage
                    src={testimonial.avatar || '/placeholder.svg'}
                    alt={testimonial.author}
                  />
                  <AvatarFallback>
                    {testimonial.author
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className='font-semibold'>{testimonial.author}</p>
                  <p className='text-sm text-gray-500'>{testimonial.role}</p>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
