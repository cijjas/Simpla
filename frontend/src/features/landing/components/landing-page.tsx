'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { HeroSection } from './hero-section';
import { FeaturesSection } from './features-section';
import { HowItWorksSection } from './how-it-works-section';
import { AboutUsSection } from './about-us-section';
import { TestimonialsSection } from './testimonials-section';


export default function LandingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Auto-reset form after success
  useEffect(() => {
    if (submitStatus === 'success') {
      const timer = setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000); // 3 seconds

      return () => clearTimeout(timer);
    }
  }, [submitStatus]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      message: formData.get('message') as string,
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await response.json();
        setSubmitStatus('success');
        (e.target as HTMLFormElement).reset();
      } else {
        // Parse backend validation errors
        try {
          const errorData = await response.json();
          if (errorData.detail && Array.isArray(errorData.detail)) {
            // Handle validation errors
            const validationErrors = errorData.detail.map((err: { loc?: string[]; msg?: string }) => {
              if (err.loc && err.loc.length > 1) {
                const field = err.loc[1]; // Get the field name
                const message = err.msg;
                
                // Translate field names and messages to Spanish
                const fieldTranslations: { [key: string]: string } = {
                  'name': 'Nombre',
                  'email': 'Email',
                  'phone': 'Teléfono',
                  'message': 'Mensaje'
                };
                
                const messageTranslations: { [key: string]: string } = {
                  'String should have at least 10 characters': 'debe tener al menos 10 caracteres',
                  'String should have at least 2 characters': 'debe tener al menos 2 caracteres',
                  'String should have at most 100 characters': 'debe tener máximo 100 caracteres',
                  'String should have at most 20 characters': 'debe tener máximo 20 caracteres',
                  'String should have at most 2000 characters': 'debe tener máximo 2000 caracteres',
                  'Invalid email format': 'formato de email inválido'
                };
                
                const translatedField = field ? fieldTranslations[field] || field : 'Campo';
                const translatedMessage = message ? messageTranslations[message] || message : 'Error de validación';
                
                return `${translatedField} ${translatedMessage}`;
              }
              return err.msg || 'Error de validación';
            });
            setErrorMessage(validationErrors.join('. '));
          } else {
            setErrorMessage(errorData.detail || 'Error al enviar el mensaje');
          }
        } catch {
          setErrorMessage('Error al enviar el mensaje');
        }
        setSubmitStatus('error');
      }
    } catch {
      setErrorMessage('Error de conexión. Por favor, intentá nuevamente.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className='relative overflow-hidden'>
      {/* Hero Section */}
      <section id="hero">
        <HeroSection />
      </section>

      {/* Features Section */}
      <section id="features">
        <FeaturesSection />
      </section>

      {/* How It Works Section */}
      <section id="how-it-works">
        <HowItWorksSection />
      </section>

      {/* About Us Section */}
      <section id="about-us">
        <AboutUsSection />
      </section>

      {/* Testimonials Section */}
      <section id="testimonials">
        <TestimonialsSection />
      </section>

      {/* FAQ Section */}
      <section id="faq" className='py-40 bg-background'>
        <div className='mx-auto max-w-7xl px-4'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-gray-900 dark:text-white mb-4'>
              Preguntas Frecuentes
            </h2>
            <p className='text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
              Encontrá respuestas a las preguntas más comunes sobre Simpla.
            </p>
          </div>
          
          <div className='max-w-4xl mx-auto space-y-4'>
            <Collapsible className='border rounded-lg'>
              <CollapsibleTrigger className='flex w-full items-center justify-between p-6 text-left hover:bg-muted/50 transition-colors'>
                <span className='text-lg font-semibold text-gray-900 dark:text-white'>
                  ¿Cómo funciona el chatbot de investigación legal?
                </span>
                <span className='text-gray-500'>+</span>
              </CollapsibleTrigger>
              <CollapsibleContent className='px-6 pb-6'>
                <p className='text-gray-600 dark:text-gray-300'>
                  Nuestro chatbot utiliza tecnología RAG (Retrieval-Augmented Generation) entrenado 
                  específicamente en normativa argentina. Podés hacer preguntas en lenguaje natural 
                  y el chatbot buscará en nuestra base de datos de normas para darte respuestas precisas 
                  con referencias a las leyes correspondientes.
                </p>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible className='border rounded-lg'>
              <CollapsibleTrigger className='flex w-full items-center justify-between p-6 text-left hover:bg-muted/50 transition-colors'>
                <span className='text-lg font-semibold text-gray-900 dark:text-white'>
                  ¿Cómo funciona el almacenamiento de normas en carpetas?
                </span>
                <span className='text-gray-500'>+</span>
              </CollapsibleTrigger>
              <CollapsibleContent className='px-6 pb-6'>
                <p className='text-gray-600 dark:text-gray-300'>
                  Podés crear carpetas para organizar las normas que encontrás. Guardá normas por área 
                  de práctica, por cliente, o por cualquier criterio que te sirva. Esto te permite 
                  acceder rápidamente a las normas más relevantes para tu trabajo y mantener tus 
                  investigaciones organizadas.
                </p>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible className='border rounded-lg'>
              <CollapsibleTrigger className='flex w-full items-center justify-between p-6 text-left hover:bg-muted/50 transition-colors'>
                <span className='text-lg font-semibold text-gray-900 dark:text-white'>
                  ¿De dónde proviene la información legal?
                </span>
                <span className='text-gray-500'>+</span>
              </CollapsibleTrigger>
              <CollapsibleContent className='px-6 pb-6'>
                <p className='text-gray-600 dark:text-gray-300'>
                  Toda la información proviene de fuentes oficiales como InfoLeg.gob.ar, bajo licencia 
                  Creative Commons CC BY 2.5 AR. Nuestra base de datos se mantiene actualizada con 
                  las últimas modificaciones normativas para asegurar la precisión de las respuestas.
                </p>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible className='border rounded-lg'>
              <CollapsibleTrigger className='flex w-full items-center justify-between p-6 text-left hover:bg-muted/50 transition-colors'>
                <span className='text-lg font-semibold text-gray-900 dark:text-white'>
                  ¿Es gratis usar Simpla?
                </span>
                <span className='text-gray-500'>+</span>
              </CollapsibleTrigger>
              <CollapsibleContent className='px-6 pb-6'>
                <p className='text-gray-600 dark:text-gray-300'>
                  Sí, Simpla es gratuito pero con límites. Podés hacer un número limitado de consultas 
                  al chatbot y crear carpetas básicas. Para uso intensivo en estudios jurídicos, 
                  contactanos para conocer nuestros planes profesionales.
                </p>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className='py-40 bg-background'>
        <div className='mx-auto max-w-2xl px-4'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-gray-900 dark:text-white mb-4'>
              ¿Listo para transformar tu estudio jurídico?
            </h2>
            <p className='text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
              Contactanos para una demostración personalizada o resolvé tus dudas.
            </p>
          </div>
          
          <AnimatePresence mode='wait'>
            {submitStatus === 'success' ? (
              <motion.div
                key='success'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className='flex flex-col items-center justify-center gap-6 text-center min-h-[400px]'
              >
                <CheckCircle2 className='h-16 w-16 text-green-600' />
                <div className='space-y-2'>
                  <h3 className='text-2xl font-semibold text-gray-900 dark:text-white'>
                    ¡Mensaje enviado correctamente!
                  </h3>
                  <p className='text-lg text-gray-600 dark:text-gray-300'>
                    Te responderemos pronto.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key='form'
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className='space-y-6 min-h-[400px]'
              >
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>Nombre completo</Label>
                    <Input 
                      id='name' 
                      name='name'
                      type='text' 
                      placeholder='Dr. Juan Pérez'
                      required 
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email profesional</Label>
                    <Input 
                      id='email' 
                      name='email'
                      type='email' 
                      placeholder='juan@estudio.com'
                      required 
                    />
                  </div>
                </div>
                
                <div className='space-y-2'>
                  <Label htmlFor='phone'>Teléfono (opcional)</Label>
                  <Input 
                    id='phone' 
                    name='phone'
                    type='tel' 
                    placeholder='+54 11 1234-5678'
                  />
                </div>
                
                <div className='space-y-2'>
                  <Label htmlFor='message'>¿Cómo podemos ayudarte?</Label>
                  <Textarea 
                    id='message'
                    name='message'
                    placeholder='Contanos sobre tu consulta, qué tipo de información necesitás o cómo podemos ayudarte...'
                    rows={4}
                    required
                  />
                </div>
                
                <div className='text-center pt-4 space-y-4'>
                  <Button size='lg' type='submit' className='w-full md:w-auto' disabled={isSubmitting}>
                    {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                  </Button>
                  
                  {submitStatus === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className='flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'
                    >
                      <AlertCircle className='h-5 w-5 text-destructive dark:text-red-400 flex-shrink-0' />
                      <p className='text-red-700 dark:text-red-300 text-sm font-medium'>
                        {errorMessage || 'Hubo un error al enviar el mensaje. Por favor, intentá nuevamente.'}
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>

    </main>
  );
}
