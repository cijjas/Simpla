'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

// Helper function to temporarily disable transitions during theme change
function withoutTransition(action: () => void) {
  const style = document.createElement('style');
  style.innerHTML = `* {
    -webkit-transition: none !important;
    -moz-transition: none !important;
    -o-transition: none !important;
    -ms-transition: none !important;
    transition: none !important;
  }`;
  document.head.appendChild(style);

  action();

  // Remove the style element after the browser has painted
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.head.removeChild(style);
    });
  });
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  const icon =
    theme === 'light' ? (
      <Sun className='h-4 w-4' />
    ) : theme === 'dark' ? (
      <Moon className='h-4 w-4' />
    ) : (
      <Laptop className='h-4 w-4' />
    );

  /* while we're on the server just render a blank square */
  if (!mounted) {
    return <div className='h-10 w-10 rounded-md bg-muted opacity-40' />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' aria-label='Cambiar tema'>
          {icon}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={() => withoutTransition(() => setTheme('light'))}>
          <Sun className='mr-2 h-4 w-4' /> Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => withoutTransition(() => setTheme('dark'))}>
          <Moon className='mr-2 h-4 w-4' /> Oscuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => withoutTransition(() => setTheme('system'))}>
          <Laptop className='mr-2 h-4 w-4' /> Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
