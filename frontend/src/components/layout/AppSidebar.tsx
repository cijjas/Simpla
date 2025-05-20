'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, MessageCircle } from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/busqueda', label: 'Búsqueda', icon: Search },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className='hidden w-56 border-r bg-background md:block'>
      <ScrollArea className='h-screen py-6'>
        <nav className='grid items-start gap-2 px-4'>
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
                pathname.startsWith(href)
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              <Icon className='h-4 w-4' />
              {label}
            </Link>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
