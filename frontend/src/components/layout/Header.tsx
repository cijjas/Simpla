// components/layout/Header.tsx
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className='flex justify-between items-center mb-12'>
      <div className='flex items-center'>
        <Image
          src='/logo_simple.png'
          alt='SIMPLA Logo'
          width={150}
          height={50}
          className='mr-4'
        />
      </div>
      <nav className='hidden md:flex space-x-12'>
        <a href='#' className='text-navy-900 text-lg font-medium'>
          Inicio
        </a>
        <a href='#' className='text-navy-900 text-lg font-medium'>
          Dashboard
        </a>
      </nav>
      <Button variant='outline' className='rounded-md border-slate-300'>
        Sign In
      </Button>
    </header>
  );
}
