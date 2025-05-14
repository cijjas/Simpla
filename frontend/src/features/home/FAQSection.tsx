'use client';

import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: '¿Cómo puedo empezar a usar la plataforma?',
    answer:
      'Simplemente regístrate con tu correo electrónico y contraseña. Puedes comenzar a usar nuestras funciones básicas de forma gratuita inmediatamente después de confirmar tu cuenta.',
  },
  {
    question: '¿La información legal está actualizada?',
    answer:
      'Sí, nuestro equipo de expertos legales actualiza constantemente la información para asegurarse de que refleje las leyes y regulaciones más recientes.',
  },
  {
    question: '¿Puedo usar esta plataforma para reemplazar a un abogado?',
    answer:
      'Nuestra plataforma proporciona información legal general y simplificada, pero no sustituye el asesoramiento legal personalizado. Para casos específicos, siempre recomendamos consultar con un profesional legal calificado.',
  },
  {
    question: '¿Qué tipos de documentos legales puedo encontrar?',
    answer:
      'Ofrecemos una amplia gama de documentos legales, incluyendo contratos, acuerdos, formularios gubernamentales, leyes y regulaciones, organizados por categorías para facilitar su búsqueda.',
  },
];

export default function FAQSection() {
  return (
    <section className='py-20 relative'>
      <div className='absolute inset-0 pointer-events-none'></div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className='text-center mb-16'
      >
        <h2 className='text-4xl font-bold mb-4 font-serif tracking-tight'>
          Preguntas Frecuentes
        </h2>
        <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
          Respuestas a las dudas más comunes sobre nuestra plataforma.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className='max-w-3xl mx-auto'
      >
        <Accordion type='multiple' className='w-full'>
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className='text-left text-lg font-medium'>
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className='text-gray-600'>
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
}
