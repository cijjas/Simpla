import Link from 'next/link';
import { Mail, MessageCircle } from 'lucide-react';
import { CONTACT_EMAIL, WHATSAPP_LINK } from '../feedback/contact.config';

export function Footer() {
  return (
    <footer className='border-t py-6 text-sm text-muted-foreground'>
      <div className='mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row'>
        {/* Texto legal */}
        <div className='text-center sm:text-left text-xs space-y-1'>
          <div>
            © {new Date().getFullYear()} Simpla. Todos los derechos reservados.
          </div>
          <div>
            Parte del contenido proviene de{' '}
            <Link
              href='https://www.infoleg.gob.ar'
              target='_blank'
              rel='noopener noreferrer'
              className='underline underline-offset-4'
            >
              infoleg.gob.ar
            </Link>
            , bajo{' '}
            <Link
              href='https://creativecommons.org/licenses/by/2.5/ar/'
              target='_blank'
              rel='noopener noreferrer'
              className='underline underline-offset-4'
            >
              CC BY 2.5 AR
            </Link>
            .
          </div>
        </div>

        {/* Contacto */}
        <div className='flex items-center gap-4'>
          <Link
            href={`mailto:${CONTACT_EMAIL}`}
            aria-label='Enviar correo'
            className='hover:text-foreground transition-colors'
          >
            <Mail className='h-4 w-4' />
          </Link>

          <Link
            href={WHATSAPP_LINK}
            target='_blank'
            rel='noopener noreferrer'
            aria-label='Abrir WhatsApp'
            className='flex items-center gap-1 hover:text-foreground transition-colors'
          >
            <MessageCircle className='h-4 w-4' />
            <span className='hidden sm:inline'>WhatsApp</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
