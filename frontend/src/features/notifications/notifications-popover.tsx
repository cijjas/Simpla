'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck, Loader2, ExternalLink, Clock, AlertCircle, Check, ListCheck, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApi } from '@/features/auth/hooks/use-api';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Estampa from '@/components/icons/Estampa';

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  metadata?: any;
};

type NotificationsResponse = {
  notifications: Notification[];
  total_count: number;
  unread_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
};

const TYPE_CONFIG: Record<string, { label: string; icon?: React.ComponentType<{ className?: string }> }> = {
  norm_update: {
    label: 'Actualización',
    icon: Estampa,
  },
  subscription_warning: {
    label: 'Suscripción',
    icon: AlertCircle,
  },
  system: {
    label: 'Sistema',
    icon: AlertCircle,
  },
  free_tier_limit: {
    label: 'Límite',
    icon: AlertCircle,
  },
  other: {
    label: 'General',
  },
};

export function NotificationsPopover() {
  const api = useApi();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [markAllSuccess, setMarkAllSuccess] = useState(false);
  const isFetchingRef = React.useRef(false);
  const hasFetchedRef = React.useRef(false);

  const fetchNotifications = useCallback(async (isBackgroundRefresh = false) => {
    // Prevent duplicate fetches
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    // Only show loading spinner on initial load, not on background refreshes
    if (!isBackgroundRefresh && !hasFetchedRef.current) {
      setInitialLoading(true);
    }
    try {
      // Get only unread notifications (up to 10)
      const data = await api.get<NotificationsResponse>('/api/notifications/?page=1&page_size=10&unread_only=true');
      
      // Store the total unread count from the API
      setTotalUnreadCount(data.unread_count || 0);
      
      if (!isBackgroundRefresh) {
        // Initial load - just set the notifications
        setNotifications(data.notifications || []);
      } else {
        // Background refresh - merge with existing to keep marked-as-read visible
        setNotifications(prev => {
          const newNotifications = data.notifications || [];
          const newIds = new Set(newNotifications.map(n => n.id));
          
          // Keep existing notifications that were marked as read (not in new fetch)
          const readNotifications = prev.filter(n => n.is_read && !newIds.has(n.id));
          
          // Combine: new unread + existing read, limit to 10 total
          return [...newNotifications, ...readNotifications].slice(0, 10);
        });
      }
      
      hasFetchedRef.current = true;
    } catch (err) {
      console.error('Error fetching notifications', err);
    } finally {
      setInitialLoading(false);
      isFetchingRef.current = false;
    }
  }, [api]);

  // Fetch on mount and when tab becomes visible
  useEffect(() => {
    // Initial fetch
    if (!hasFetchedRef.current) {
      fetchNotifications(false);
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && hasFetchedRef.current) {
        // Background refresh - don't show loading spinner
        fetchNotifications(true);
      }
    };

    window.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchNotifications]);

  const markRead = async (id: string) => {
    try {
      await api.post(`/api/notifications/${id}/mark-read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      // Decrement the total unread count
      setTotalUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification read', err);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    // Mark as read but keep it visible in the list
    if (!n.is_read) {
      await markRead(n.id);
    }
    // Close popover when navigating to link
    if (n.link) {
      setOpen(false);
    }
  };

  const markAllRead = async () => {
    try {
      // Use the new mark-all-read endpoint for better performance
      await api.post('/api/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      // Reset the total unread count to 0
      setTotalUnreadCount(0);
      
      // Show success feedback
      setMarkAllSuccess(true);
      setTimeout(() => {
        setMarkAllSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error marking all notifications read', err);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    // Parse UTC date and convert to Argentina time (UTC-3)
    const utcDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - utcDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    
    // After 24 hours, show the actual date in Argentina timezone
    return utcDate.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: 'short',
      timeZone: 'America/Argentina/Buenos_Aires'
    });
  };

  const renderNotification = (n: Notification) => {
    return (
      <Link 
        href={n.link || '#'} 
        onClick={() => handleNotificationClick(n)} 
        className={cn(
          'block transition-colors hover:bg-accent/50',
          !n.is_read ? 'bg-notification/5' : 'opacity-60'
        )}
      >
        <div className='flex gap-3 p-3'>
          <div className='w-1 rounded-full flex-shrink-0 bg-notification' />
          
          <div className='flex-1 min-w-0 space-y-2'>
            <div className='flex items-start justify-between gap-2'>
              <div className='flex items-center gap-2 flex-1 min-w-0'>
                <span className='font-semibold text-sm truncate'>{n.title}</span>
                {!n.is_read && (
                  <div className='w-1.5 h-1.5 rounded-full flex-shrink-0 bg-notification' />
                )}
              </div>
              <div className='flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0'>
                <Clock className='h-3 w-3' />
                {formatRelativeTime(n.created_at)}
              </div>
            </div>

            {n.body && (
              <p className='text-xs text-muted-foreground line-clamp-2'>{n.body}</p>
            )}

            {n.link && (
              <div className='flex items-center gap-1 text-xs font-medium text-notification'>
                <span>Ver detalles</span>
                <ExternalLink className='h-3 w-3' />
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='h-8 w-8 relative group'>
          <Bell className='h-4 w-4 group-hover:animate-[shake_0.5s_ease-in-out]' />
          {totalUnreadCount > 0 && (
            <span className='absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] text-notification-foreground bg-notification rounded-full'>
              {totalUnreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-[420px] p-0'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 pb-3'>
          <div className='flex items-center gap-2'>
            <h4 className='font-bold font-serif'>Notificaciones</h4>
            {totalUnreadCount > 0 && (
              <div className='flex items-center gap-1.5'>
                <div className='w-1.5 h-1.5 rounded-full bg-notification' />
                <span className='text-sm font-medium text-notification'>
                  {totalUnreadCount} nueva{totalUnreadCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          
          {totalUnreadCount > 0 && !markAllSuccess && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant='ghost' 
                    size='icon' 
                    onClick={markAllRead}
                    className='h-8 w-8'
                  >
                    <ListChecks className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Marcar todas como leídas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {markAllSuccess && (
            <div className='flex items-center gap-1.5 text-notification animate-in fade-in duration-200'>
              <Check className='h-4 w-4' />
              <span className='text-xs font-medium'>Marcadas como leídas</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Notifications List */}
        <ScrollArea className='h-[480px]'>
          {initialLoading && (
            <div className='flex flex-col items-center justify-center py-12 px-4'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground mb-3' />
              <p className='text-sm text-muted-foreground'>Cargando notificaciones...</p>
            </div>
          )}

          {!initialLoading && notifications.length === 0 && (
            <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
              <div className='w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4'>
                <Bell className='h-8 w-8 text-muted-foreground' />
              </div>
              <h5 className='font-medium mb-1'>No hay notificaciones</h5>
              <p className='text-sm text-muted-foreground'>
                Te notificaremos cuando haya novedades
              </p>
            </div>
          )}

          {!initialLoading && notifications.length > 0 && (
            <div className='divide-y'>
              {notifications.map(n => (
                <div key={n.id}>
                  {renderNotification(n)}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {!initialLoading && notifications.length > 0 && (
          <>
            <Separator />
            <div className='p-2'>
              <Button variant='ghost' className='w-full justify-center text-sm font-medium' asChild>
                <Link href='/notificaciones'>
                  Ver todas las notificaciones
                </Link>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationsPopover;