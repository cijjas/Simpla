// components/hero/Hero.tsx
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function Hero() {
  return (
    <section className='text-center mb-16'>
      <div className='mb-10'>
        <Image
          src='/logo_completo.png'
          alt='SIMPLA Full Logo'
          width={300}
          height={300}
          className='mx-auto'
        />
      </div>
      <h1
        className='text-5xl font-bold text-navy-900 mb-6 font-serif tracking-tightest'
        style={{ letterSpacing: '-0.03em' }}
      >
        La manera más simple <br /> de entender las leyes
      </h1>
      <p className='text-2xl text-gray-700 mb-10 font-sans'>
        Encontrá info legal y accedé a datos útiles
      </p>
      <div className='relative max-w-3xl mx-auto'>
        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
          <Search className='h-5 w-5 text-gray-500' />
        </div>
        <Input
          type='search'
          placeholder='Buscar leyes, normas, artículos...'
          className='pl-10 py-6 text-xl rounded-lg border border-gray-300'
        />
      </div>
    </section>
  );
}
