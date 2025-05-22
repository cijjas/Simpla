import Link from 'next/link';
import { Mail, MessageCircle } from 'lucide-react';
import {
  CONTACT_EMAIL,
  WHATSAPP_LINK,
} from '@/features/feedback/utils/contact.config';

export function AppFooter() {
  return (
    <footer className='border-t px-4 py-6 sm:px-6 text-sm text-muted-foreground'>
      <div className='flex flex-col items-center justify-between gap-4 md:flex-row'>
        <p>
          © {new Date().getFullYear()} Simpla. Todos los derechos reservados.
        </p>
        <div className='flex flex-wrap items-center gap-4'>
          <Link
            href='https://www.infoleg.gob.ar'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-foreground hover:underline'
          >
            Fuente: infoleg.gob.ar
          </Link>
          <Link
            href='https://creativecommons.org/licenses/by/2.5/ar/'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-foreground hover:underline'
          >
            Licencia CC BY 2.5 AR
          </Link>
          <Link
            href={`mailto:${CONTACT_EMAIL}`}
            className='flex items-center gap-1 hover:text-foreground hover:underline'
          >
            <Mail className='h-4 w-4' />
            <span>Correo</span>
          </Link>
          <Link
            href={WHATSAPP_LINK}
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-1 hover:text-foreground hover:underline'
          >
            <MessageCircle className='h-4 w-4' />
            <span>WhatsApp</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
