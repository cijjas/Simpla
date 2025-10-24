'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { HeroSection } from './hero-section';
import { FeaturesSection } from './features-section';
import { AboutUsSection } from './about-us-section';
import { BentoGridSection, defaultServicesCards } from './bento-grid-section';
import { Footer } from './footer';
import { ProgressiveText } from '@/components/ui/progressive-text';
import Image from 'next/image';

export default function LandingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/contact`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        },
      );

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
            const validationErrors = errorData.detail.map(
              (err: { loc?: string[]; msg?: string }) => {
                if (err.loc && err.loc.length > 1) {
                  const field = err.loc[1]; // Get the field name
                  const message = err.msg;

                  // Translate field names and messages to Spanish
                  const fieldTranslations: { [key: string]: string } = {
                    name: 'Nombre',
                    email: 'Email',
                    phone: 'Teléfono',
                    message: 'Mensaje',
                  };

                  const messageTranslations: { [key: string]: string } = {
                    'String should have at least 10 characters':
                      'debe tener al menos 10 caracteres',
                    'String should have at least 2 characters':
                      'debe tener al menos 2 caracteres',
                    'String should have at most 100 characters':
                      'debe tener máximo 100 caracteres',
                    'String should have at most 20 characters':
                      'debe tener máximo 20 caracteres',
                    'String should have at most 2000 characters':
                      'debe tener máximo 2000 caracteres',
                    'Invalid email format': 'formato de email inválido',
                  };

                  const translatedField = field
                    ? fieldTranslations[field] || field
                    : 'Campo';
                  const translatedMessage = message
                    ? messageTranslations[message] || message
                    : 'Error de validación';

                  return `${translatedField} ${translatedMessage}`;
                }
                return err.msg || 'Error de validación';
              },
            );
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
      <section id='hero'>
        <HeroSection />
      </section>

      {/* Features Section */}
      <section id='features'>
        <FeaturesSection />
      </section>

      {/* Logo Section */}
      <section className='py-20 bg-background'>
        <div className='mx-auto max-w-6xl px-6 flex justify-center'>
          <Image
            src='/images/logo_completo_light.png'
            alt='Simpla Logo'
            width={1700}
            height={567}
            className='h-104 w-auto'
          />
        </div>
      </section>

      {/* Bento Grid Section */}
      <section id='services'>
        <BentoGridSection
          title='¿Qué ofrece Simpla?'
          subtitle='Todo lo que necesitás para investigación legal moderna'
          cards={defaultServicesCards}
        />
      </section>

      {/* About Us Section */}
      <section id='about-us'>
        <AboutUsSection />
      </section>

      {/* Contact Section */}
      <section id='contact' className='py-40 bg-background'>
        <div className='mx-auto max-w-6xl px-6'>
          <div className='max-w-3xl mx-auto'>
          <div className='text-center mb-16'>
            <ProgressiveText
              className='text-4xl font-bold font-serif'
              delay={0.1}
              stagger={0.04}
            >
              ¿Listo para transformar tu estudio jurídico?
            </ProgressiveText>
            <ProgressiveText
              className='text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'
              delay={0.2}
              stagger={0.03}
            >
              Contactanos para una demostración personalizada o resolvé tus
              dudas.
            </ProgressiveText>
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
                  <Button
                    size='lg'
                    type='submit'
                    className='w-full md:w-auto'
                    disabled={isSubmitting}
                  >
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
                        {errorMessage ||
                          'Hubo un error al enviar el mensaje. Por favor, intentá nuevamente.'}
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
