'use client';

import Hero from '@/features/welcome/Hero';

export default function LandingPage() {
  return (
    <main className='relative overflow-hidden'>
      <div className='mx-auto max-w-7xl px-4 py-8'>
        {/* Hero Section */}
        <section id="hero">
          <Hero />
        </section>

        {/* Features Section - Ready for content */}
        <section id="features" className='py-20'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-navy-900 dark:text-white mb-4'>
              Características
            </h2>
            <p className='text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
              Descubrí todas las funcionalidades que hacen de Simpla la mejor herramienta para navegar las leyes argentinas.
            </p>
          </div>
          {/* Content will be added here */}
        </section>

        {/* How It Works Section - Ready for content */}
        <section id="how-it-works" className='py-20 bg-gray-50 dark:bg-gray-900'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-navy-900 dark:text-white mb-4'>
              Cómo Funciona
            </h2>
            <p className='text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
              Aprendé cómo usar Simpla en simples pasos para encontrar la información legal que necesitás.
            </p>
          </div>
          {/* Content will be added here */}
        </section>

        {/* Testimonials Section - Ready for content */}
        <section id="testimonials" className='py-20'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-navy-900 dark:text-white mb-4'>
              Testimonios
            </h2>
            <p className='text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
              Conocé las experiencias de nuestros usuarios y cómo Simpla les ha ayudado en su trabajo.
            </p>
          </div>
          {/* Content will be added here */}
        </section>

        {/* FAQ Section - Ready for content */}
        <section id="faq" className='py-20 bg-gray-50 dark:bg-gray-900'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-navy-900 dark:text-white mb-4'>
              Preguntas Frecuentes
            </h2>
            <p className='text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
              Encontrá respuestas a las preguntas más comunes sobre Simpla.
            </p>
          </div>
          {/* Content will be added here */}
        </section>

        {/* Contact Section - Ready for content */}
        <section id="contact" className='py-20'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-navy-900 dark:text-white mb-4'>
              Contacto
            </h2>
            <p className='text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
              ¿Tenés alguna pregunta? No dudes en contactarnos.
            </p>
          </div>
          {/* Content will be added here */}
        </section>
      </div>
    </main>
  );
}
