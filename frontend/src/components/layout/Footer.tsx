import Link from 'next/link';
import { Mail, MessageCircle } from 'lucide-react';
import {
  CONTACT_EMAIL,
  WHATSAPP_LINK,
} from '@/features/feedback/utils/contact.config';

export function Footer() {
  return (
    <footer className='border-t bg-background py-8 text-sm text-muted-foreground'>
      <div className='mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:items-start'>
        {/* Legal text */}
        <div className='text-center sm:text-left space-y-1 text-xs'>
          <p>
            © {new Date().getFullYear()} <strong>Simpla</strong>. Todos los
            derechos reservados.
          </p>
          <p>
            Parte del contenido proviene de{' '}
            <Link
              href='https://www.infoleg.gob.ar'
              target='_blank'
              rel='noopener noreferrer'
              className='underline underline-offset-4 hover:text-foreground transition-colors'
            >
              infoleg.gob.ar
            </Link>
            , bajo licencia{' '}
            <Link
              href='https://creativecommons.org/licenses/by/2.5/ar/'
              target='_blank'
              rel='noopener noreferrer'
              className='underline underline-offset-4 hover:text-foreground transition-colors'
            >
              CC BY 2.5 AR
            </Link>
            .
          </p>
        </div>

        {/* Contact icons */}
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
