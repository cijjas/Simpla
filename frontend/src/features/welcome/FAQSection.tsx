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
    question: '¿Cómo empiezo a usar la plataforma?',
    answer:
      'Registrate con tu correo y una contraseña. Una vez que confirmás tu cuenta, podés empezar a usar las funciones sin costo.',
  },
  {
    question: '¿La información legal está actualizada?',
    answer:
      'Sí, mantenemos la información actualizada de forma constante para reflejar las normas y regulaciones más recientes.',
  },
  {
    question: '¿La plataforma reemplaza a un abogado?',
    answer:
      'No. Ofrecemos información legal general y simplificada, pero no reemplaza el asesoramiento legal profesional. Si tenés un caso específico, lo mejor es consultar con un abogado matriculado.',
  },
  {
    question: '¿Qué tipo de documentos puedo consultar?',
    answer:
      'Vas a encontrar leyes, resoluciones, decretos y otros textos normativos organizados por temas, para que puedas acceder a lo que necesitás más fácil.',
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
          Preguntas frecuentes
        </h2>
        <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
          Respondemos las dudas más comunes sobre el uso de la plataforma.
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
