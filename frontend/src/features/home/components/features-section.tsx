'use client';

import Link from 'next/link';
import { Search, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function FeaturesSection() {
  return (
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
  );
}
