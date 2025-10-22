'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Clock, ExternalLink, AlertCircle, Loader2, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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

export function NotificationsPage() {
  const api = useApi();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(async (pageNum: number, append = false) => {
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    if (!append) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const data = await api.get<Notification[]>('/api/notifications/');
      const sortedData = (data || []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // For now, we'll get all and simulate pagination client-side
      const pageSize = 20;
      const start = (pageNum - 1) * pageSize;
      const end = start + pageSize;
      const paginatedData = sortedData.slice(start, end);
      
      if (append) {
        setNotifications(prev => [...prev, ...paginatedData]);
      } else {
        setNotifications(paginatedData);
      }
      
      setHasMore(end < sortedData.length);
    } catch (err) {
      console.error('Error fetching notifications', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [api]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications(1, false);
  }, [fetchNotifications]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchNotifications(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, page, fetchNotifications]);

  const markRead = async (id: string) => {
    try {
      await api.post(`/api/notifications/${id}/mark-read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification read', err);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      await markRead(n.id);
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

    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderNotification = (n: Notification) => {
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
            'block transition-colors hover:bg-accent/50 border-l-4',
            !n.is_read ? 'border-l-primary bg-primary/5' : 'border-l-transparent'
          )}
        >
          <div className='flex gap-4 p-4'>
            <div className='flex-shrink-0 pt-1'>
              <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
                <Bell className='h-5 w-5 text-primary' />
              </div>
            </div>

            <div className='flex-1 min-w-0 space-y-3'>
              <div className='flex items-start justify-between gap-4'>
                <div className='flex items-center gap-2'>
                  <span className='font-semibold text-base'>
                    Modificación de Norma
                  </span>
                  {!n.is_read && (
                    <div className='w-2 h-2 rounded-full bg-primary flex-shrink-0' />
                  )}
                </div>
                <div className='flex items-center gap-1.5 text-sm text-muted-foreground flex-shrink-0'>
                  <Clock className='h-3.5 w-3.5' />
                  {formatRelativeTime(n.created_at)}
                </div>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <Badge variant='outline' className='font-mono text-sm'>
                    {first.infoleg_id || first.id || '-'}
                  </Badge>
                  <span className='text-muted-foreground'>→</span>
                  <Badge variant='outline' className='font-mono text-sm bg-primary/10'>
                    {savedId}
                  </Badge>
                  {hasMoreMods && (
                    <Badge variant='secondary' className='text-sm'>
                      +{modList.length - 1} más
                    </Badge>
                  )}
                </div>

                {n.body && (
                  <p className='text-sm text-muted-foreground leading-relaxed'>
                    {n.body}
                  </p>
                )}
              </div>

              {n.link && (
                <div className='flex items-center gap-1.5 text-sm text-primary font-medium'>
                  <span>Ver detalles de la norma</span>
                  <ExternalLink className='h-3.5 w-3.5' />
                </div>
              )}
            </div>
          </div>
        </Link>
      );
    }

    // Fallback for other notification types (shouldn't happen for now)
    return null;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className='flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden'>
      {/* Header Section - Fixed */}
      <div className='flex-shrink-0 border-b bg-background px-4 md:px-6 py-4'>
        <div className='text-start space-y-1'>
          <h1 className='text-2xl md:text-3xl font-bold font-serif'>
            Notificaciones
          </h1>
          <p className='text-muted-foreground text-xs md:text-sm'>
            Mantente al día con las actualizaciones de tus normas guardadas
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className='flex-shrink-0 border-b bg-background'>
        <div className='flex items-center justify-between px-4 md:px-6 py-3'>
          <div className='flex items-center gap-3'>
            {loading ? (
              <Skeleton className='h-5 w-40' />
            ) : (
              <>
                <span className='text-sm font-medium'>
                  {notifications.length} notificacion{notifications.length !== 1 ? 'es' : ''}
                </span>
                {unreadCount > 0 && (
                  <Badge variant='secondary' className='text-xs'>
                    {unreadCount} sin leer
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List - Scrollable */}
      <div className='flex-1 overflow-y-auto'>
        {loading && notifications.length === 0 ? (
          <div className='divide-y'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='flex gap-4 p-4'>
                <Skeleton className='w-10 h-10 rounded-full flex-shrink-0' />
                <div className='flex-1 space-y-3'>
                  <div className='flex items-center justify-between'>
                    <Skeleton className='h-5 w-48' />
                    <Skeleton className='h-4 w-20' />
                  </div>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-6 w-24' />
                    <Skeleton className='h-6 w-8' />
                    <Skeleton className='h-6 w-24' />
                  </div>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-3/4' />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full px-4 py-12 text-center'>
            <div className='w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4'>
              <Bell className='h-10 w-10 text-muted-foreground' />
            </div>
            <h2 className='text-xl font-semibold mb-2'>No hay notificaciones</h2>
            <p className='text-sm text-muted-foreground max-w-md'>
              Te notificaremos cuando haya actualizaciones en las normas que guardaste.
            </p>
          </div>
        ) : (
          <>
            <div className='divide-y'>
              {notifications.map(n => (
                <div key={n.id}>{renderNotification(n)}</div>
              ))}
            </div>

            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className='h-10 w-full'>
              {loadingMore && (
                <div className='divide-y'>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className='flex gap-4 p-4'>
                      <Skeleton className='w-10 h-10 rounded-full flex-shrink-0' />
                      <div className='flex-1 space-y-3'>
                        <div className='flex items-center justify-between'>
                          <Skeleton className='h-5 w-48' />
                          <Skeleton className='h-4 w-20' />
                        </div>
                        <div className='flex items-center gap-2'>
                          <Skeleton className='h-6 w-24' />
                          <Skeleton className='h-6 w-8' />
                          <Skeleton className='h-6 w-24' />
                        </div>
                        <Skeleton className='h-4 w-full' />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

