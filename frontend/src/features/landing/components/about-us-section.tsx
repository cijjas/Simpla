'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { MessageSquare, Search, Bookmark, Users, Target, Lightbulb } from 'lucide-react';

export function AboutUsSection() {
  const values = [
    {
      icon: Target,
      title: 'Nuestra Misión',
      description: 'Hacer accesible la normativa legal argentina para todos los profesionales, estudiantes y ciudadanos que la necesiten.'
    },
    {
      icon: Lightbulb,
      title: 'Nuestra Visión',
      description: 'Ser la plataforma de referencia para la investigación y consulta de leyes argentinas, facilitando el acceso al conocimiento legal.'
    },
    {
      icon: Users,
      title: 'Nuestro Equipo',
      description: 'Profesionales apasionados por la tecnología y el derecho, trabajando para democratizar el acceso a la información legal.'
    }
  ];

  const features = [
    {
      icon: MessageSquare,
      title: 'Chatbot Inteligente',
      description: 'Conversá con nuestra IA especializada que entiende el contexto legal y te ayuda a encontrar las respuestas que necesitás.'
    },
    {
      icon: Search,
      title: 'Búsqueda Avanzada',
      description: 'Encontrá normas específicas usando filtros inteligentes, palabras clave o consultas en lenguaje natural.'
    },
    {
      icon: Bookmark,
      title: 'Favoritos y Organización',
      description: 'Guardá las normas que más usás, organizalas en carpetas y accedé a ellas rápidamente desde cualquier lugar.'
    }
  ];

  return (
    <section className='pt-40 pb-80 bg-background'>
      <div className='mx-auto max-w-7xl px-4'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className='text-center mb-20'
        >
          <h2 className='text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6'>
            Acerca de Simpla
          </h2>
          <p className='text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed'>
            Nacimos con la convicción de que navegar la normativa legal argentina debería ser 
            <span className='font-semibold text-blue-600 dark:text-blue-400'> simple, rápido y accesible</span> 
            para todos.
          </p>
        </motion.div>

        {/* Mission, Vision, Team */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-20'>
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              className='text-center p-8 rounded-xl bg-background border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow'
            >
              <value.icon className='h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-6' />
              <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-4'>
                {value.title}
              </h3>
              <p className='text-gray-600 dark:text-gray-300 leading-relaxed'>
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
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
              <h3 className='text-3xl font-bold text-gray-900 dark:text-white mb-6'>
                ¿Por qué Simpla?
              </h3>
              <p className='text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed'>
                La normativa legal argentina es vasta y compleja. Durante años, profesionales del derecho, 
                contadores, consultores y estudiantes han enfrentado el desafío de encontrar información 
                legal precisa y actualizada de manera eficiente.
              </p>
              <p className='text-lg text-gray-600 dark:text-gray-300 leading-relaxed'>
                Simpla surge como la solución a este problema, combinando la potencia de la inteligencia 
                artificial con una interfaz intuitiva para hacer que navegar las leyes argentinas sea 
                <span className='font-semibold text-blue-600 dark:text-blue-400'> realmente simple</span>.
              </p>
            </div>

            <div className='space-y-6'>
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  className='flex gap-4 p-4 rounded-lg bg-background border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow'
                >
                  <feature.icon className='h-8 w-8 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1' />
                  <div>
                    <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                      {feature.title}
                    </h4>
                    <p className='text-gray-600 dark:text-gray-300 text-sm'>
                      {feature.description}
                    </p>
                  </div>
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
                src='/images/patagonia.png'
                alt='Patagonia argentina - paisajes únicos'
                fill
                className='object-cover'
              />
              <div className='absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent' />
            </div>
            
            {/* Floating card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              viewport={{ once: true }}
              className='absolute -bottom-8 -right-8 bg-background p-6 rounded-xl shadow-xl max-w-xs border border-gray-200 dark:border-gray-700'
            >
              <div className='flex items-center gap-3 mb-3'>
                <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse' />
                <span className='text-sm font-medium text-gray-900 dark:text-white'>
                  Siempre actualizado
                </span>
              </div>
              <p className='text-sm text-gray-600 dark:text-gray-300'>
                Nuestra base de datos se actualiza constantemente con las últimas modificaciones normativas
              </p>
            </motion.div>
          </motion.div>
        </div>

        
      </div>
    </section>
  );
}
