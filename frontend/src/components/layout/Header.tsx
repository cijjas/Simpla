'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { Menu, Sun, Moon, Laptop, Mail, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Logo from '@/components/icons/Logo';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  return (
    <header className='w-full border-b py-6'>
      <div className='mx-auto flex max-w-7xl items-center justify-between px-4'>
        {/* Logo */}
        <Link
          href='/'
          className='flex items-center gap-3 hover:opacity-80 transition'
        >
          <Logo className='h-[1.375rem] w-auto text-navy-900 dark:text-white' />
          {/* <Arrow className='w-10 h-auto text-black dark:text-white' /> */}

          <span className='font-serif text-3xl font-bold text-navy-900 dark:text-white'>
            SIMPLA
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className='hidden md:flex space-x-12'>
          <Link
            href='/'
            className={cn(
              'text-lg font-medium transition-colors',
              pathname === '/' ? 'font-bold ' : 'hover:opacity-70',
            )}
          >
            Inicio
          </Link>
          <Link
            href='/busqueda'
            className={cn(
              'text-lg font-medium transition-colors',
              pathname === '/busqueda' || pathname.startsWith('/busqueda')
                ? 'font-bold '
                : 'hover:opacity-70',
            )}
          >
            Búsqueda
          </Link>
        </nav>

        {/* Desktop controls */}
        <div className='hidden md:flex items-center space-x-4'>
          {mounted ? (
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className='w-36'>
                <SelectValue placeholder='Tema' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='light'>
                  <div className='flex items-center gap-2'>
                    <Sun className='h-4 w-4' /> Claro
                  </div>
                </SelectItem>
                <SelectItem value='dark'>
                  <div className='flex items-center gap-2'>
                    <Moon className='h-4 w-4' /> Oscuro
                  </div>
                </SelectItem>
                <SelectItem value='system'>
                  <div className='flex items-center gap-2'>
                    <Laptop className='h-4 w-4' /> Sistema
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className='w-36 h-10 rounded-md bg-muted opacity-50 animate-pulse' />
          )}
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

              {/* Sheet nav */}
              <nav className='flex flex-col gap-4 px-6 py-6 text-lg font-medium'>
                <SheetClose asChild>
                  <Link
                    href='/'
                    className={cn(
                      pathname === '/' ? 'underline' : 'opacity-80',
                    )}
                  >
                    Inicio
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href='/busqueda'
                    className={cn(
                      pathname === '/busqueda' ||
                        pathname.startsWith('/busqueda')
                        ? 'underline'
                        : 'opacity-80',
                    )}
                  >
                    Búsqueda
                  </Link>
                </SheetClose>
              </nav>

              {/* Sheet footer */}
              <div className='mt-auto flex flex-col gap-6 border-t px-6 py-6'>
                {mounted ? (
                  <Select
                    value={mounted ? theme : 'system'}
                    onValueChange={setTheme}
                    disabled={!mounted}
                  >
                    <SelectTrigger className='w-36'>
                      <SelectValue placeholder='Tema' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='light'>
                        <div className='flex items-center gap-2'>
                          <Sun className='h-4 w-4' /> Claro
                        </div>
                      </SelectItem>
                      <SelectItem value='dark'>
                        <div className='flex items-center gap-2'>
                          <Moon className='h-4 w-4' /> Oscuro
                        </div>
                      </SelectItem>
                      <SelectItem value='system'>
                        <div className='flex items-center gap-2'>
                          <Laptop className='h-4 w-4' /> Sistema
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className='w-full h-10 rounded-md bg-muted opacity-50 animate-pulse' />
                )}

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
