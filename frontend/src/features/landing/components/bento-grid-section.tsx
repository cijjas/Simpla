'use client';

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

  return (
    <section className='py-20'>
      <div className='mx-auto max-w-6xl px-6'>
        {/* Header */}
        <div className='text-center mb-16'>
          <h2 className='text-4xl font-bold font-serif mb-4'>{title}</h2>
          <p className='text-xl  font-sans max-w-2xl mx-auto'>{subtitle}</p>
        </div>

        {/* Bento Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-3'>
          {cards.map((card, index) => (
            <div
              key={card.id}
              className={`
                ${index === 3 ? 'md:col-span-2 lg:col-span-2' : ''}
              `}
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Default cards data for the services grid
export const defaultServicesCards: BentoCard[] = [
  {
    id: 'legal-chat',
    title: 'Chat Legal',
    description:
      'Themis asistente legal con acceso a todas las normativas. Consulta sobre legislación y recibe respuestas precisas basadas en normativa vigente.',
    className: '',
  },
  {
    id: 'intelligent-search',
    title: 'Búsqueda Inteligente',
    description:
      'Motor de búsqueda con 700k normas. Encuentra la norma exacta en segundos con nuestra IA avanzada.',
    className: '',
  },
  {
    id: 'document-management',
    title: 'Gestión de Documentos',
    description:
      'Carpetas para organizar normas. Mantén tu trabajo legal estructurado y accesible con nuestro sistema de organización.',
    className: '',
  },
  {
    id: 'favorites-notifications',
    title: 'Guardados y Notificaciones',
    description:
      'Alertas de modificación y seguimiento de normas particulares. Mantente actualizado con los cambios en la legislación que te interesa.',
    className: '',
  },
  {
    id: 'real-time',
    title: 'Tiempo Real',
    description:
      'Actualizaciones en tiempo real de toda la normativa. Acceso inmediato a las últimas modificaciones y nuevas regulaciones.',
    className: 'md:col-span-2 lg:col-span-2',
  },
];
