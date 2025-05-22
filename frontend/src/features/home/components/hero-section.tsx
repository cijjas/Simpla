'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Search, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
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

          <h2 className='text-4xl font-bold tracking-tight sm:text-5xl md:text-5xl mb-6 text-slate-900 dark:text-slate-50 '>
            Portal de Legislación Argentina
          </h2>
          <p className='max-w-3xl text-lg sm:text-xl text-muted-foreground mb-10 sm:mb-12'>
            Accedé a toda la normativa actualizada y navegá fácilmente por
            leyes, decretos, resoluciones y más.
          </p>

          <div className='flex flex-row gap-4 sm:gap-6 w-full max-w-md'>
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
              <Link href='/chat' className='flex items-center justify-center'>
                <MessageSquare className='mr-2 h-5 w-5' />
                Chat Legal
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
