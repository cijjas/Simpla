 'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Inbox, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useApi } from '@/features/auth/hooks/use-api';
import Link from 'next/link';

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string; // ISO date
  metadata?: any;
};

const TYPE_COLORS: Record<string, string> = {
  norm_update: 'bg-blue-500',
  subscription_warning: 'bg-orange-500',
  system: 'bg-red-500',
  free_tier_limit: 'bg-green-500',
  other: 'bg-gray-400',
};

export function NotificationInbox() {
  const api = useApi();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Notification[]>('/api/notifications/');
      // Sort by newest first and limit to 8
      const sortedData = (data || [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8);
      setNotifications(sortedData);
    } catch (err) {
      console.error('Error fetching notifications', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchNotifications();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchNotifications();
    };

    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);
    return () => {
      window.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markRead = async (id: string) => {
    try {
      await api.post(`/api/notifications/${id}/mark-read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Error marking notification read', err);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    await markRead(n.id);
    setOpen(false); // Close the dropdown
  };

  const markAllRead = async () => {
    try {
      await Promise.all(notifications.filter(n => !n.is_read).map(n => api.post(`/api/notifications/${n.id}/mark-read`)));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all notifications read', err);
    }
  };

  const renderNotification = (n: Notification) => {
    const color = TYPE_COLORS[n.type] || TYPE_COLORS['other'];
    const date = new Date(n.created_at);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;

    if (n.type === 'norm_update' && n.metadata) {
      // expect metadata.modifying_normas: [{ infoleg_id, id }]
      const modList = n.metadata.modifying_normas || [];
      // show first modifying norma and the saved norma id
      const first = modList[0] || {};
      const savedId = n.metadata?.saved_norma_id;

      return (
        <Link href={n.link || '#'} onClick={() => handleNotificationClick(n)} className='block'>
          <div className='flex items-center gap-3 py-2'>
            <div className={`w-1 rounded-l-full h-12 ${color}`} />
            <div className='flex-1 px-3'>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <div className='font-medium text-sm'>Modificación de Norma</div>
                    <div className='text-xs text-muted-foreground'>{formattedDate}</div>
                  </div>
                  <div className='mt-2 flex items-center gap-2'>
                    <div className='border rounded px-1.5 py-0.5 text-xs bg-white/50'>
                      {first.infoleg_id || first.id || '-'}
                    </div>
                    <div className='text-xs text-muted-foreground'>→</div>
                    <div className='border rounded px-1.5 py-0.5 text-xs bg-white/50'>
                      {savedId}
                    </div>
                  </div>
                </div>
                {!n.is_read && <div className='w-2 h-2 rounded-full bg-indigo-500 ml-2' />}
              </div>
            </div>
          </div>
        </Link>
      );
    }

    // generic notification slot
    return (
      <Link href={n.link || '#'} onClick={() => handleNotificationClick(n)} className='block'>
        <div className='flex items-center gap-3 py-2'>
          <div className={`w-1 rounded-l-full h-10 ${color}`} />
          <div className='flex-1 px-3'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <div className='flex items-center gap-2'>
                  <div className='font-medium text-sm'>{n.title}</div>
                  <div className='text-xs text-muted-foreground'>{formattedDate}</div>
                </div>
                <div className='text-xs text-muted-foreground mt-1 truncate'>{n.body}</div>
              </div>
              {!n.is_read && <div className='w-2 h-2 rounded-full bg-indigo-500 ml-2' />}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0 relative'>
          <Inbox className='h-4 w-4' />
          {unreadCount > 0 && (<span className='absolute -top-0.5 -right-0.5 inline-block w-2 h-2 rounded-full bg-indigo-500' />)}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-96'>
        <div className='flex items-center justify-between p-3 border-b'>
          <h4 className='font-medium'>Notificaciones</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size='sm' onClick={markAllRead} className='h-6 w-6 p-0'>
                  <CheckCheck className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Marcar todos como leídos</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className='max-h-80 overflow-auto'>
          {loading && (
            <div className='p-6 flex justify-center items-center'>
              <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className='p-6 text-center text-sm text-muted-foreground'>
              <Inbox className='mx-auto mb-2 h-6 w-6 text-muted-foreground' />
              No tienes notificaciones
            </div>
          )}

          {notifications.map(n => (
            <div key={n.id} className={`border-b last:border-b-0 ${n.is_read ? '' : 'bg-muted/5'}`}>
              {renderNotification(n)}
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationInbox;
