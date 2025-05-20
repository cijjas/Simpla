'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useSession, signOut } from 'next-auth/react';
import { Laptop, Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SvgEstampa from '../icons/Estampa';
import { ThemeToggle } from '../theme-toggle';

export default function AppHeader() {
  const { data: session } = useSession();

  return (
    <header className='flex h-14 items-center gap-x-4  bg-background px-4 md:px-6'>
      <Link
        href='/dashboard'
        className='flex items-center gap-3 hover:opacity-80 transition'
      >
        <SvgEstampa className='h-[1.8rem] w-auto' />
        <span className='font-serif text-xl font-bold'>SIMPLA</span>
      </Link>

      <div className='ml-auto flex items-center gap-2'>
        {/* Theme toggle */}
        <ThemeToggle />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className='h-8 w-8 cursor-pointer'>
              <AvatarImage src={session?.user?.image ?? ''} />
              <AvatarFallback>{session?.user?.name?.[0] ?? 'U'}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem asChild>
              <Link href='/settings'>Configuración</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
