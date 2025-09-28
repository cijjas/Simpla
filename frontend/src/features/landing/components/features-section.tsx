'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Search, Users, Zap, Shield } from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: Search,
      title: 'Búsqueda Inteligente de Normas',
      description: 'Encontrá cualquier norma legal usando lenguaje natural y filtros especializados para estudios jurídicos.'
    },
    {
      icon: Zap,
      title: 'IA Especializada en Derecho',
      description: 'Chatbot entrenado específicamente en normativa argentina que entiende contexto legal y sugiere precedentes relevantes.'
    },
    {
      icon: Users,
      title: 'Colaboración en Equipo',
      description: 'Plataforma multi-usuario para estudios de abogados con gestión de casos, compartir investigaciones y organización por cliente.'
    },
    {
      icon: Shield,
      title: 'Base de Datos Oficial',
      description: 'Acceso directo a más de 50,000 normas actualizadas diariamente desde InfoLeg.gob.ar y fuentes oficiales garantizadas.'
    }
  ];

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
            className='space-y-8'
          >
            <div>
              <h2 className='text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6'>
                Optimizá la investigación legal de tu estudio
              </h2>
              <p className='text-xl text-gray-600 dark:text-gray-300 mb-8'>
                Simpla está diseñado específicamente para estudios de abogados que buscan 
                eficiencia, precisión y acceso instantáneo a la normativa argentina más actualizada.
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  className='p-6 rounded-lg bg-background hover:bg-muted transition-colors'
                >
                  <feature.icon className='h-8 w-8 text-blue-600 dark:text-blue-400 mb-4' />
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                    {feature.title}
                  </h3>
                  <p className='text-gray-600 dark:text-gray-300 text-sm'>
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
            className='relative'
          >
            <div className='relative h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl'>
              <Image
                src='/images/carros.png'
                alt='Carros argentinos tradicionales'
                fill
                className='object-cover'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent' />
            </div>
            
            {/* Floating card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              viewport={{ once: true }}
              className='absolute -bottom-8 -left-8 bg-background p-6 rounded-xl shadow-xl max-w-xs'
            >
              <div className='flex items-center gap-3 mb-3'>
                <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse' />
                <span className='text-sm font-medium text-gray-900 dark:text-white'>
                  Base de datos actualizada
                </span>
              </div>
              <p className='text-sm text-gray-600 dark:text-gray-300'>
                Más de 50,000 normas legales disponibles y actualizadas diariamente
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
