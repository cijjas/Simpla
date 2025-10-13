'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Shield, Minus } from 'lucide-react';

export function FeaturesSection() {
  const kpis = [
    {
      value: '50K+',
      description: 'Normas indexadas'
    },
    {
      value: '10x',
      description: 'Más rápido que búsqueda tradicional'
    },
    {
      value: '95%',
      description: 'De precisión en resultados relevantes'
    }
  ];

  const features = [
    {
      icon: TrendingUp,
      title: 'Optimiza investigación',
      description: 'Simpla está diseñado para estudios jurídicos que buscan eficiencia. Elimina la fricción de búsquedas manuales y entrega resultados precisos instantáneamente.'
    },
    {
      icon: Shield,
      title: 'Precisión legal garantizada',
      description: 'Nuestra IA especializada en derecho argentino traduce consultas complejas en código — habilitando las auditorías legales más detalladas del mercado.'
    },
    {
      icon: Minus,
      title: 'Reduce costos operativos',
      description: 'Elimina búsquedas manuales, emails interminables y revisiones extensas — automatizando tareas de investigación y flujos de trabajo legal.'
    }
  ];

  return (
    <section className='py-40 bg-background'>
      <div className='mx-auto max-w-7xl px-4'>
        {/* KPIs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
          className='mb-20'
        >
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl'>
            {kpis.map((kpi, index) => (
              <div key={index} className='relative'>
                <div className='text-4xl font-serif font-bold leading-tight tracking-tight md:text-6xl mb-2'>
                  {kpi.value}
                </div>
                <div className='text-sm md:text-base'>
                  {kpi.description}
                </div>
                {index < kpis.length - 1 && (
                  <div className='hidden md:block absolute top-1/2 right-0 w-px h-16 bg-gray-200 dark:bg-gray-700 transform -translate-y-1/2' />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          viewport={{ once: true }}
          className='mb-20'
        >
          <h2 className='text-4xl font-serif font-bold md:text-5xl'>
            Hecho para la complejidad legal. Simple por diseño.
          </h2>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
          viewport={{ once: true }}
          className='grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl'
        >
          {features.map((feature, index) => (
            <div key={feature.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className='mb-6'
              >
                <feature.icon className='size-8 mb-4' />
              </motion.div>
              <h3 className='text-xl font-bold mb-4'>
                {feature.title}
              </h3>
              <p className='leading-relaxed'>
                {feature.description}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
