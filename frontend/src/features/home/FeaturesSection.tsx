'use client';

import { motion } from 'framer-motion';
import { FileText, Search, Shield, Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const features = [
  {
    icon: FileText,
    title: 'Documentos Simplificados',
    description:
      'Traducimos documentos legales complejos a un lenguaje claro y accesible.',
  },
  {
    icon: Search,
    title: 'Búsqueda Inteligente',
    description:
      'Encuentra rápidamente la información legal que necesitas con nuestra búsqueda avanzada.',
  },
  {
    icon: Shield,
    title: 'Información Confiable',
    description:
      'Contenido verificado por expertos legales para garantizar precisión y confiabilidad.',
  },
  {
    icon: Clock,
    title: 'Ahorra Tiempo',
    description:
      'Accede a resúmenes concisos de leyes y normativas sin tener que leer documentos extensos.',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function FeaturesSection() {
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
          Nuestros Servicios
        </h2>
        <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
          Simplificamos el acceso a la información legal para que puedas tomar
          decisiones informadas.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial='hidden'
        whileInView='show'
        viewport={{ once: true }}
        className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
      >
        {features.map((feature, index) => (
          <motion.div key={index} variants={item}>
            <Card className='h-full border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg'>
              <CardHeader>
                <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4'>
                  <feature.icon className='w-6 h-6 text-primary' />
                </div>
                <CardTitle className='text-xl'>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className='text-base'>
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
