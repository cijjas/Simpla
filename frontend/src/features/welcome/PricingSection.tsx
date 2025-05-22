'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Básico',
    price: 'Gratis',
    description: 'Acceso a información legal básica',
    features: [
      'Búsqueda de documentos',
      'Resúmenes simplificados',
      'Acceso a leyes comunes',
      'Actualizaciones mensuales',
    ],
    buttonText: 'Comenzar Gratis',
    popular: false,
  },
  {
    name: 'Profesional',
    price: '$19.99',
    period: '/mes',
    description: 'Para profesionales y pequeñas empresas',
    features: [
      'Todo lo del plan Básico',
      'Documentos personalizados',
      'Alertas de cambios legales',
      'Consultas ilimitadas',
      'Actualizaciones semanales',
    ],
    buttonText: 'Probar 14 días gratis',
    popular: true,
  },
  {
    name: 'Empresarial',
    price: '$49.99',
    period: '/mes',
    description: 'Para empresas con necesidades avanzadas',
    features: [
      'Todo lo del plan Profesional',
      'API de acceso',
      'Soporte prioritario',
      'Análisis legal personalizado',
      'Actualizaciones en tiempo real',
    ],
    buttonText: 'Contactar Ventas',
    popular: false,
  },
];

export default function PricingSection() {
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
          Planes Simples y Transparentes
        </h2>
        <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
          Elige el plan que mejor se adapte a tus necesidades legales.
        </p>
      </motion.div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto'>
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            className='flex'
          >
            <Card
              className={`flex flex-col h-full border-2 ${
                plan.popular
                  ? 'border-primary shadow-lg relative'
                  : 'hover:border-primary/20'
              } transition-all duration-300`}
            >
              {plan.popular && (
                <div className='absolute top-0 right-0 transform translate-x-2 -translate-y-2'>
                  <span className='bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full'>
                    Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className='text-2xl'>{plan.name}</CardTitle>
                <div className='flex items-baseline mt-2'>
                  <span className='text-3xl font-bold'>{plan.price}</span>
                  {plan.period && (
                    <span className='text-gray-500 ml-1'>{plan.period}</span>
                  )}
                </div>
                <CardDescription className='mt-2'>
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className='flex-grow'>
                <ul className='space-y-3'>
                  {plan.features.map((feature, i) => (
                    <li key={i} className='flex items-center'>
                      <Check className='w-5 h-5 text-primary mr-2 flex-shrink-0' />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className={`w-full ${plan.popular ? '' : 'variant-outline'}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
