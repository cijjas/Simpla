'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, Mail, MessageCircle} from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import SvgEstampa from '@/components/icons/Estampa';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function LandHeader() {
  const [activeSection, setActiveSection] = useState('hero');

  // Track which section is currently in view
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['features', 'how-it-works', 'about-us', 'testimonials', 'faq', 'contact'];
      const scrollPosition = window.scrollY + 100; // Offset for header height

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const sections = [
    { id: 'features', label: 'Características', href: '/#features' },
    { id: 'how-it-works', label: 'Cómo Funciona', href: '/#how-it-works' },
    { id: 'about-us', label: 'Acerca de Nosotros', href: '/#about-us' },
    { id: 'testimonials', label: 'Testimonios', href: '/#testimonials' },
    { id: 'faq', label: 'FAQ', href: '/#faq' },
    { id: 'contact', label: 'Contacto', href: '/#contact' },
  ];

  return (
    <header className='w-full pt-6 bg-background backdrop-blur-lg sticky top-0 z-50'>
      <div className='mx-auto flex max-w-7xl items-center justify-between px-4  pb-6'>
        {/* Logo */}
        <Link
          href='/'
          className='flex items-center gap-3 hover:opacity-80 transition'
        >
          <SvgEstampa className='h-[2.3rem] w-auto' />
          <span className='font-serif text-3xl font-bold'>SIMPLA</span>
        </Link>

        {/* Desktop nav - Section outline */}
        <nav className='hidden lg:flex space-x-8'>
          {sections.map((section) => (
            <Link
              key={section.id}
              href={section.href}
              className={cn(
                'text-sm font-medium transition-colors duration-200',
                activeSection === section.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {section.label}
            </Link>
          ))}
        </nav>

        {/* Desktop controls */}
        <div className='hidden md:flex items-center space-x-4'>
          <ThemeToggle />
          <Link href='/iniciar-sesion'>
            <Button size="sm">Iniciar sesión</Button>
          </Link>
        </div>

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger aria-label='Abrir menú' className='md:hidden'>
            <Menu className='h-6 w-6 text-navy-900' />
          </SheetTrigger>
          <SheetContent
            side='left'
            className='w-64 border-r px-0 py-0 bg-background/95 backdrop-blur-lg'
          >
            <SheetHeader className='sr-only'>
              <SheetTitle>Menú principal</SheetTitle>
            </SheetHeader>

            <div className='flex h-full flex-col'>
              {/* Sheet header */}
              <div className='flex items-center justify-between border-b px-6 py-4'>
                <Link
                  href='/'
                  className='font-serif text-2xl font-bold'
                  onClick={() =>
                    (document.activeElement as HTMLElement | null)?.blur()
                  }
                >
                  SIMPLA
                </Link>
                <SheetClose aria-label='Cerrar menú'></SheetClose>
              </div>

              {/* Sheet nav - Section outline */}
              <nav className='flex flex-col gap-2 px-6 py-6'>
                {sections.map((section) => (
                  <SheetClose key={section.id} asChild>
                    <Link
                      href={section.href}
                      className={cn(
                        'text-sm font-medium transition-colors duration-200 py-2 px-3',
                        activeSection === section.id
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {section.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>

              {/* Sheet footer */}
              <div className='mt-auto flex flex-col gap-6 border-t px-6 py-6'>
                <ThemeToggle />

                {/* Contact */}
                <div className='flex items-center gap-6'>
                  <Link
                    href='mailto:contacto@simpla.com'
                    aria-label='Enviar correo'
                    className='transition hover:text-foreground'
                  >
                    <Mail className='h-5 w-5' />
                  </Link>
                  <Link
                    href='https://wa.me/5491100000000'
                    target='_blank'
                    rel='noopener noreferrer'
                    aria-label='Abrir WhatsApp'
                    className='transition hover:text-foreground'
                  >
                    <MessageCircle className='h-5 w-5' />
                  </Link>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
