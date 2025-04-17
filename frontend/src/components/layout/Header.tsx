import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Header() {
  return (
    <header className='w-full py-6 border-b'>
      <div className='max-w-7xl mx-auto px-4 flex justify-between items-center'>
        <div className='flex items-center'>
          <Link href='/'>
            <Image
              src='/logo_simple.png'
              alt='SIMPLA Logo'
              width={150}
              height={50}
              className='mr-4 cursor-pointer'
            />
          </Link>
        </div>

        <nav className='hidden md:flex space-x-12'>
          <Link href='/' className='text-navy-900 text-lg font-medium'>
            Inicio
          </Link>
          <Link href='/dashboard' className='text-navy-900 text-lg font-medium'>
            Dashboard
          </Link>
          <Link href='/busqueda' className='text-navy-900 text-lg font-medium'>
            Búsqueda
          </Link>
        </nav>

        <Button variant='outline' className='rounded-md border-slate-300'>
          Sign In
        </Button>
      </div>
    </header>
  );
}
