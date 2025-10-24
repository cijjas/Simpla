'use client';

import Link from 'next/link';

import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { ThemeToggle } from '../ui/theme-toggle';
import SvgEstampa from '../icons/Estampa';
import React from 'react';
import { Separator } from '../ui/separator';
import { FeedbackButton } from '@/features/feedback/components/feedback-button';
import { NotificationsPopover } from '@/features/notifications/notifications-popover';


export default function AppHeader() {
  const { state } = useSidebar();

  return (
    <header
      className='sticky top-0 z-2 flex h-14 shrink-0 items-center gap-2 px-4 border-b border-border bg-background transition-all duration-200 ease-linear'
      data-sidebar-state={state}
    >
      <SidebarTrigger className='-ml-1' />

      <Separator orientation='vertical' decorative className='mr-2 !h-4 ' />

      {/* Logo */}
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