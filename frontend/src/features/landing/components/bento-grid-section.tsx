'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

interface BentoCard {
  id: string;
  title: string;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
  className?: string; // For custom grid positioning
}

interface BentoGridSectionProps {
  title?: string;
  subtitle?: string;
  cards: BentoCard[];
}

export function BentoGridSection({
  title = 'Our Services',
  subtitle = 'Comprehensive solutions for your business needs',
  cards = [],
}: BentoGridSectionProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  return (
    <section className='py-20 bg-gray-50 dark:bg-gray-900'>
      <div className='mx-auto max-w-7xl px-4'>
        {/* Header */}
        <div className='text-center mb-16'>
          <h2 className='text-4xl font-bold text-gray-900 dark:text-white mb-4'>
            {title}
          </h2>
          <p className='text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
            {subtitle}
          </p>
        </div>

        {/* Bento Grid */}
        <motion.div
          className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6'
          variants={containerVariants}
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true, margin: '-100px' }}
        >
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              className={`
                ${index === 3 ? 'md:col-span-2 lg:col-span-2' : ''}
              `}
              variants={cardVariants}
            >
              <Card className='h-[280px] rounded-lg shadow-none'>
                <CardContent className='p-6 h-full flex flex-col'>
                  {/* Image/Icon Container */}
                  <div className='mb-4 flex-shrink-0'>
                    {card.imageSrc ? (
                      <div className='w-12 h-12 relative'>
                        <Image
                          src={card.imageSrc}
                          alt={card.imageAlt || card.title}
                          fill
                          className='object-contain'
                        />
                      </div>
                    ) : (
                      <div className='w-12 h-12 bg-muted rounded-md flex items-center justify-center'>
                        <div className='w-6 h-6 bg-muted-foreground/20 rounded'></div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className='flex-1 flex flex-col'>
                    <h3 className='text-lg font-semibold mb-2 leading-tight'>
                      {card.title}
                    </h3>
                    <p className='text-muted-foreground text-sm leading-relaxed line-clamp-6'>
                      {card.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Default cards data for the services grid
export const defaultServicesCards: BentoCard[] = [
  {
    id: 'intelligent-search',
    title: 'Búsqueda Inteligente de Normas',
    description:
      'Encuentra la norma exacta en segundos. IA que busca entre 50K+ normas indexadas de legislación argentina.',
    className: '',
  },
  {
    id: 'legal-chat',
    title: 'Chat Legal con IA',
    description:
      'Consulta sobre legislación y recibe respuestas precisas basadas en normativa vigente.',
    className: '',
  },
  {
    id: 'document-management',
    title: 'Gestión de Documentos',
    description:
      'Organiza tus investigaciones en carpetas personalizadas. Mantén tu trabajo legal estructurado y accesible.',
    className: '',
  },
  {
    id: 'complete-legislation',
    title: 'Legislación Argentina Completa',
    description:
      '50K+ normas actualizadas. Cobertura completa de la legislación nacional y provincial.',
    className: 'md:col-span-2 lg:col-span-2',
  },
  {
    id: 'favorites-history',
    title: 'Guardados y Historial',
    description:
      'Guarda las normas importantes para acceso rápido. Revisa tu historial de búsquedas y consultas.',
    className: '',
  },
];
