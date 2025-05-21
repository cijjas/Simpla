import Image from 'next/image';
import Link from 'next/link';
import { Search, MessageSquare, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getUltimasNNormas } from '@/lib/infoleg/api';
import NormaCard from '@/features/busqueda/norma-card';
import { FeedbackContact } from '@/features/feedback/feedback-contact';
import { Footer } from '@/components/layout/Footer';

export default async function HomePage() {
  // Fetch the latest 6 normas
  const ultimasNormas = await getUltimasNNormas(6);

  return (
    <div className='flex min-h-screen flex-col bg-white dark:bg-background'>
      <main className='flex-1'>
        {/* Hero Section */}
        <section className='relative bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-background py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8'>
          <div className='mx-auto max-w-7xl'>
            <div className='flex flex-col items-center text-center'>
              <div className='mb-10 w-56 sm:w-72'>
                <Image
                  src='/images/logo_completo_dark.png'
                  alt='Logo InfoLeg Alternativo'
                  width={320}
                  height={100}
                  className='hidden dark:block'
                  priority
                />
                <Image
                  src='/images/logo_completo_light.png'
                  alt='Logo InfoLeg Alternativo'
                  width={320}
                  height={100}
                  className='block dark:hidden'
                  priority
                />
              </div>

              <h1 className='text-3xl font-bold tracking-tight sm:text-3xl md:text-6xl mb-6 text-slate-900 dark:text-slate-50 '>
                Portal de Legislación Argentina
              </h1>
              <p className='max-w-3xl text-lg sm:text-xl text-muted-foreground mb-10 sm:mb-12'>
                Accedé a toda la normativa actualizada y navegá fácilmente por
                leyes, decretos, resoluciones y más.
              </p>

              <div className='flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-md'>
                <Button
                  asChild
                  size='lg'
                  className='flex-1 shadow-sm hover:shadow-md transition-shadow'
                >
                  <Link
                    href='/busqueda'
                    className='flex items-center justify-center'
                  >
                    <Search className='mr-2 h-5 w-5' />
                    Buscar Normas
                  </Link>
                </Button>
                <Button
                  asChild
                  size='lg'
                  variant='outline'
                  className='flex-1 shadow-sm hover:shadow-md transition-shadow'
                >
                  <Link
                    href='/chat'
                    className='flex items-center justify-center'
                  >
                    <MessageSquare className='mr-2 h-5 w-5' />
                    Chat Legal
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Latest Normas Section */}
        <section className='py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-background'>
          <div className='mx-auto max-w-7xl'>
            <div className='flex flex-col sm:flex-row items-center justify-between mb-10 sm:mb-12'>
              <h2 className='text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-200 mb-4 sm:mb-0'>
                <Clock className='inline-block mr-3 h-7 w-7 text-primary' />
                Últimas Normas Publicadas
              </h2>
              <Button
                variant='link'
                asChild
                className='text-primary hover:text-primary/80'
              >
                <Link href='/busqueda' className='flex items-center'>
                  Ver todas
                  <ArrowRight className='ml-2 h-5 w-5' />
                </Link>
              </Button>
            </div>
            {ultimasNormas.length > 0 ? (
              <div className='grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3'>
                {ultimasNormas.map(norma => (
                  <NormaCard key={norma.id} norma={norma} />
                ))}
              </div>
            ) : (
              <Card className='border-slate-200 dark:border-slate-700'>
                <CardContent className='py-12 text-center'>
                  <p className='text-muted-foreground'>
                    No hay normas recientes disponibles.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className='py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900'>
          <div className='mx-auto max-w-7xl'>
            <h2 className='text-3xl font-semibold tracking-tight text-center mb-12 sm:mb-16 text-slate-800 dark:text-slate-200'>
              Funcionalidades Principales
            </h2>

            <div className='grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-2'>
              <Card className='border border-slate-200 dark:border-slate-700 bg-white dark:bg-background transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary/50 dark:hover:border-primary/30'>
                <CardHeader>
                  <CardTitle className='flex items-center text-xl font-semibold text-slate-700 dark:text-slate-300'>
                    <Search className='mr-3 h-6 w-6 text-primary' />
                    Buscador Avanzado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground leading-relaxed'>
                    Encontrá rápidamente cualquier norma utilizando filtros
                    avanzados por tipo, fecha, número y palabras clave.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    asChild
                    variant='outline'
                    className='w-full border-primary/50 text-primary hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10'
                  >
                    <Link href='/busqueda'>Ir al Buscador</Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className='border border-slate-200 dark:border-slate-700 bg-white dark:bg-background transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary/50 dark:hover:border-primary/30'>
                <CardHeader>
                  <CardTitle className='flex items-center text-xl font-semibold text-slate-700 dark:text-slate-300'>
                    <MessageSquare className='mr-3 h-6 w-6 text-primary' />
                    Chat Legal Inteligente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground leading-relaxed'>
                    Consulta directamente sobre normativa y recibe respuestas
                    precisas basadas en la legislación vigente.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    asChild
                    variant='outline'
                    className='w-full border-primary/50 text-primary hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10'
                  >
                    <Link href='/chat'>Iniciar Chat</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Feedback Component */}
      <Footer />
    </div>
  );
}
