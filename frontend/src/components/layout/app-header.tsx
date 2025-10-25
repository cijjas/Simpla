'use client';

import Link from 'next/link';

import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { ThemeToggle } from '../ui/theme-toggle';
import SvgEstampa from '@/../public/svgs/estampa.svg';
import React from 'react';
import { Separator } from '../ui/separator';
import { FeedbackButton } from '@/features/feedback/components/feedback-button';
import { NotificationsPopover } from '@/features/notifications/notifications-popover';


export default function AppHeader() {
  const { state } = useSidebar();

  return (
    // ZINDEX 5 so that SIDEBAR 6 (over header) anything inset will be between header and sidebar 
    <header
      className='sticky top-0 z-5 flex h-14 shrink-0 items-center gap-2 px-4 border-b border-border bg-background transition-all duration-200 ease-linear'
      data-sidebar-state={state}
    >
      <SidebarTrigger className='-ml-1' />
      <Separator orientation='vertical' decorative className='mr-2 !h-4 ' />

      {/* Logo */}
      <div className='flex items-center gap-4 overflow-hidden'>
        <Link
          href='/inicio'
          className='flex items-center gap-3 hover:opacity-80 transition text-foreground'
        >
          <SvgEstampa 
          className='h-[1.8rem] w-auto '
          fill='currentColor'
            />
          <span className='font-serif text-xl font-bold whitespace-nowrap text-foreground'>
            SIMPLA
          </span>
        </Link>
      </div>

      {/* User actions */}
      <div className='ml-auto flex items-center gap-2'>
        <div className='mr-3'>
          <NotificationsPopover />
        </div>
        <FeedbackButton />
        <ThemeToggle />
      </div>
    </header>
  );
}