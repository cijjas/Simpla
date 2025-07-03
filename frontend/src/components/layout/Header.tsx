'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Mail, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import SvgEstampa from '../icons/Estampa';
import { Button } from '../ui/button';
import { ThemeToggle } from '../ui/theme-toggle';

export default function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <header className='w-full border-b py-6'>
      <div className='mx-auto flex max-w-7xl items-center justify-between px-4'>
        {/* Logo */}
        <Link
          href='/'
          className='flex items-center gap-3 hover:opacity-80 transition'
        >
          <SvgEstampa className='h-[2.3rem] w-auto' />
          {/* <Arrow className='h-[2rem] w-auto text-navy-900 dark:text-white' /> */}

          <span className='font-serif text-3xl font-bold'>SIMPLA</span>
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
          <ThemeToggle />

          {status === 'loading' && <span>Cargando…</span>}

          {status === 'authenticated' && (
            <>
              <span className='text-sm text-muted-foreground'>
                Sesión hasta: {new Date(session.expires).toLocaleString()}
              </span>
              <Button onClick={() => signOut({ callbackUrl: '/' })}>
                Cerrar sesión
              </Button>
            </>
          )}

          {status === 'unauthenticated' && (
            <Link href='/iniciar-sesion'>
              <Button>Iniciar sesión</Button>
            </Link>
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
