'use client';

import Image from 'next/image';
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
import { Button } from '@/components/ui/button';
import { Sun, Moon, Laptop } from 'lucide-react';

export default function Header() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const logoSrc =
    currentTheme === 'dark' ? '/logo_simple_dark.png' : '/logo_simple.png';

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
          <Link href='/' className='text-navy-900 text-lg font-medium'>
            Inicio
          </Link>
          {/* <Link href='/dashboard' className='text-navy-900 text-lg font-medium'>
            Dashboard
          </Link> */}
          <Link href='/search' className='text-navy-900 text-lg font-medium'>
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

          {/* <Button variant='outline' className='rounded-md border-slate-300'>
            Sign In
          </Button> */}
        </div>
      </div>
    </header>
  );
}
