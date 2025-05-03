'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Sun, Moon, Laptop } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils'; // make sure this exists

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className='w-full py-6 border-b'>
      <div className='max-w-7xl mx-auto px-4 flex justify-between items-center'>
        <div className='flex items-center'>
          <Link
            href='/'
            className='text-3xl font-serif font-bold text-navy-900 hover:opacity-80 transition'
          >
            SIMPLA
          </Link>
        </div>

        <nav className='hidden md:flex space-x-12'>
          <Link
            href='/'
            className={cn(
              'text-lg font-medium transition-colors',
              pathname === '/'
                ? 'text-navy-900 font-bold lunderine underline-offset-4'
                : 'text-navy-900 hover:opacity-70',
            )}
          >
            Inicio
          </Link>
          <Link
            href='/search'
            className={cn(
              'text-lg font-medium transition-colors',
              pathname === '/search' || pathname.startsWith('/busqueda')
                ? 'text-navy-900 font-bold underline underline-offset-4'
                : 'text-navy-900 hover:opacity-70',
            )}
          >
            Búsqueda
          </Link>
        </nav>

        <div className='flex items-center space-x-4'>
          {mounted && (
            <Select
              defaultValue='system'
              value={theme}
              onValueChange={value => setTheme(value)}
            >
              <SelectTrigger className='w-36'>
                <SelectValue placeholder='Theme' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='light'>
                  <div className='flex items-center gap-2'>
                    <Sun className='w-4 h-4' /> Light
                  </div>
                </SelectItem>
                <SelectItem value='dark'>
                  <div className='flex items-center gap-2'>
                    <Moon className='w-4 h-4' /> Dark
                  </div>
                </SelectItem>
                <SelectItem value='system'>
                  <div className='flex items-center gap-2'>
                    <Laptop className='w-4 h-4' /> System
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </header>
  );
}
