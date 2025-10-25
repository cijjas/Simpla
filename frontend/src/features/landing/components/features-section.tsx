'use client';

import { TrendingUp, Shield, Minus } from 'lucide-react';
import { NumberTicker } from '@/components/ui/number-ticker';
import { ProgressiveText } from '@/components/ui/progressive-text';

export function FeaturesSection() {
  const kpis = [
    {
      value: '700K+',
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
    <section className='py-40 bg-background light'>
      <div className='mx-auto max-w-6xl px-6'>
        {/* KPIs Section */}
        <div className='mb-20'>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl'>
            {kpis.map((kpi, index) => (
              <div key={index} className='relative text-center sm:text-left'>
                <div className='text-3xl sm:text-4xl font-serif font-bold leading-tight tracking-tight md:text-6xl mb-2'>
                  <NumberTicker 
                    value={kpi.value} 
                    duration={2.5}
                    className='text-foreground'
                  />
                </div>
                <div className='text-sm md:text-base'>
                  {kpi.description}
                </div>
                {index < kpis.length - 1 && (
                  <div className='hidden md:block absolute top-1/2 right-0 w-px h-16 bg-gray-200 transform -translate-y-1/2' />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Headline */}
        <div className='mb-20'>
          <ProgressiveText
            className='text-4xl font-serif font-bold md:text-5xl'
            delay={0.1}
            stagger={0.04}
          >
            Hecho para la complejidad legal. Simple por diseño.
          </ProgressiveText>
        </div>

        {/* Features Section */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl'>
          {features.map((feature, index) => (
            <div key={feature.title}>
              <div className='mb-6'>
                <feature.icon className='size-8 mb-4' />
              </div>
              <ProgressiveText
                className='text-xl font-bold mb-4'
                delay={0.2 + index * 0.1}
                stagger={0.03}
              >
                {feature.title}
              </ProgressiveText>
              <ProgressiveText
                className='leading-relaxed'
                delay={0.3 + index * 0.1}
                stagger={0.02}
              >
                {feature.description}
              </ProgressiveText>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
