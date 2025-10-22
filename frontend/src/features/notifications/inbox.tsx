'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck, Loader2, ExternalLink, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApi } from '@/features/auth/hooks/use-api';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  metadata?: any;
};

const TYPE_CONFIG: Record<string, { color: string; bgColor: string; label: string; icon?: React.ComponentType<{ className?: string }> }> = {
  norm_update: {
    color: 'bg-primary',
    bgColor: 'bg-primary/5',
    label: 'Actualización',
    icon: Bell,
  },
  subscription_warning: {
    color: 'bg-orange-500',
    bgColor: 'bg-orange-500/5',
    label: 'Suscripción',
    icon: AlertCircle,
  },
  system: {
    color: 'bg-destructive',
    bgColor: 'bg-destructive/5',
    label: 'Sistema',
    icon: AlertCircle,
  },
  free_tier_limit: {
    color: 'bg-green-500',
    bgColor: 'bg-green-500/5',
    label: 'Límite',
    icon: AlertCircle,
  },
  other: {
    color: 'bg-muted-foreground',
    bgColor: 'bg-muted/30',
    label: 'General',
  },
};

export function NotificationInbox() {
  const api = useApi();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [open, setOpen] = useState(false);
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
      const data = await api.get<Notification[]>('/api/notifications/');
      const sortedData = (data || [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 12);
      setNotifications(sortedData);
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
    if (!n.is_read) {
      await markRead(n.id);
    }
    setOpen(false);
  };

  const markAllRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => !n.is_read).map(n => api.post(`/api/notifications/${n.id}/mark-read`))
      );
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all notifications read', err);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  };

  const renderNotification = (n: Notification) => {
    const config = TYPE_CONFIG[n.type] || TYPE_CONFIG['other'];
    const Icon = config.icon;

    if (n.type === 'norm_update' && n.metadata) {
      const modList = n.metadata.modifying_normas || [];
      const first = modList[0] || {};
      const savedId = n.metadata?.saved_norma_id;
      const hasMoreMods = modList.length > 1;

      return (
        <Link 
          href={n.link || '#'} 
          onClick={() => handleNotificationClick(n)} 
          className={cn(
            'block transition-colors hover:bg-accent/50',
            !n.is_read && config.bgColor
          )}
        >
          <div className='flex gap-3 p-3'>
            <div className={cn('w-1 rounded-full flex-shrink-0', config.color)} />
            
            <div className='flex-1 min-w-0 space-y-2'>
              <div className='flex items-start justify-between gap-2'>
                <div className='flex items-center gap-2'>
                  {Icon && <Icon className='h-3.5 w-3.5 text-primary flex-shrink-0' />}
                  <span className='font-semibold text-sm'>Modificación de Norma</span>
                  {!n.is_read && (
                    <div className='w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0' />
                  )}
                </div>
                <div className='flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0'>
                  <Clock className='h-3 w-3' />
                  {formatRelativeTime(n.created_at)}
                </div>
              </div>

              <div className='space-y-1.5'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <Badge variant='outline' className='font-mono text-xs'>
                    {first.infoleg_id || first.id || '-'}
                  </Badge>
                  <span className='text-muted-foreground'>→</span>
                  <Badge variant='outline' className='font-mono text-xs bg-primary/10'>
                    {savedId}
                  </Badge>
                  {hasMoreMods && (
                    <Badge variant='secondary' className='text-xs'>
                      +{modList.length - 1} más
                    </Badge>
                  )}
                </div>
                
                {n.body && (
                  <p className='text-xs text-muted-foreground line-clamp-2'>{n.body}</p>
                )}
              </div>

              {n.link && (
                <div className='flex items-center gap-1 text-xs text-primary font-medium'>
                  <span>Ver detalles</span>
                  <ExternalLink className='h-3 w-3' />
                </div>
              )}
            </div>
          </div>
        </Link>
      );
    }

    // Generic notification
    return (
      <Link 
        href={n.link || '#'} 
        onClick={() => handleNotificationClick(n)} 
        className={cn(
          'block transition-colors hover:bg-accent/50',
          !n.is_read && config.bgColor
        )}
      >
        <div className='flex gap-3 p-3'>
          <div className={cn('w-1 rounded-full flex-shrink-0', config.color)} />
          
          <div className='flex-1 min-w-0 space-y-2'>
            <div className='flex items-start justify-between gap-2'>
              <div className='flex items-center gap-2 flex-1 min-w-0'>
                {Icon && <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', config.color.replace('bg-', 'text-'))} />}
                <span className='font-semibold text-sm truncate'>{n.title}</span>
                {!n.is_read && (
                  <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.color)} />
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
              <div className={cn('flex items-center gap-1 text-xs font-medium', config.color.replace('bg-', 'text-'))}>
                <span>Ver más</span>
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
          {unreadCount > 0 && (
            <span className='absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] text-primary-foreground bg-destructive rounded-full'>
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-[420px] p-0'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 pb-3'>
          <div className='flex items-center gap-2'>
            <h4 className='font-bold font-serif'>Notificaciones</h4>
            {unreadCount > 0 && (
              <Badge variant='secondary' className='text-xs'>
                {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          {unreadCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant='ghost' 
                    size='sm' 
                    onClick={markAllRead}
                    className='h-8 px-2 hover:bg-accent'
                  >
                    <CheckCheck className='h-4 w-4 mr-1' />
                    <span className='text-xs'>Marcar todas</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Marcar todas como leídas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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

export default NotificationInbox;