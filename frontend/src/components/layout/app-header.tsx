'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '../ui/theme-toggle';
import SvgEstampa from '../icons/Estampa';
import React from 'react';
import { Separator } from '../ui/separator';
import { FeedbackButton } from '@/features/feedback/components/feedback-button';

function renderBreadcrumb(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);

  if (pathname.startsWith('/norma/') && segments.length === 2) {
    return (
      <>
        <BreadcrumbItem key='busqueda'>
          <BreadcrumbLink asChild>
            <Link href='/busqueda'>Búsqueda</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator key='sep-norma' />
        <BreadcrumbItem key='norma'>
          <BreadcrumbLink className='text-muted-foreground cursor-default'>
            Norma {segments[1]}
          </BreadcrumbLink>
        </BreadcrumbItem>
      </>
    );
  }

  const segmentLabelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    busqueda: 'Búsqueda',
    norma: 'Norma',
    chat: 'Chat',
    constitucion: 'Constituciones',
    carpetas: 'Carpetas',
    folders: 'Carpetas',
    settings: 'Configuración',
  };

  return segments.reduce<React.ReactNode[]>((acc, segment, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/');
    const isLast = idx === segments.length - 1;
    const label = segmentLabelMap[segment] || segment;

    acc.push(
      <BreadcrumbItem key={`item-${href}`}>
        {isLast ? (
          <BreadcrumbLink className='text-muted-foreground cursor-default'>
            {label}
          </BreadcrumbLink>
        ) : (
          <BreadcrumbLink asChild>
            <Link href={href}>{label}</Link>
          </BreadcrumbLink>
        )}
      </BreadcrumbItem>,
    );

    if (!isLast) {
      acc.push(<BreadcrumbSeparator key={`sep-${href}`} />);
    }

    return acc;
  }, []);
}

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className='flex h-14 shrink-0 items-center gap-2 px-4'>
      <SidebarTrigger className='-ml-1' />

      <Separator orientation='vertical' decorative className='mr-2 !h-4 ' />

      {/* Logo + Breadcrumb */}
      <div className='flex items-center gap-4 overflow-hidden'>
        <Link
          href='/inicio'
          className='flex items-center gap-3 hover:opacity-80 transition'
        >
          <SvgEstampa className='h-[1.8rem] w-auto' />
          <span className='font-serif text-xl font-bold whitespace-nowrap'>
            SIMPLA
          </span>
        </Link>

        <Breadcrumb className='truncate hidden sm:flex'>
          <BreadcrumbList>{renderBreadcrumb(pathname)}</BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* User actions */}
      <div className='ml-auto flex items-center gap-2'>
        <FeedbackButton />

        <ThemeToggle />
        
      </div>
    </header>
  );
}
