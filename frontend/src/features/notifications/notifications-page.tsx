'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Clock, ExternalLink, AlertCircle, Loader2, Bell, FileText, CheckCheck, X, Trash2, ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

export function NotificationsPage() {
  const api = useApi();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<'bulk' | string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  const pageRef = useRef(1);
  const PAGE_SIZE = 20;

  const fetchNotifications = useCallback(async (pageNum: number, append = false) => {
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    if (!append) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const unreadParam = filter === 'unread' ? '&unread_only=true' : '';
      const data = await api.get<NotificationsResponse>(
        `/api/notifications/?page=${pageNum}&page_size=${PAGE_SIZE}${unreadParam}`
      );
      
      if (append) {
        setNotifications(prev => {
          const newNotifications = [...prev, ...(data.notifications || [])];
          console.log(`[Notifications] Appending page ${pageNum}: ${data.notifications?.length || 0} new, ${newNotifications.length} total`);
          return newNotifications;
        });
      } else {
        console.log(`[Notifications] Initial load page ${pageNum}: ${data.notifications?.length || 0} notifications`);
        setNotifications(data.notifications || []);
      }
      
      setTotalCount(data.total_count);
      setUnreadCount(data.unread_count);
      setHasMore(data.has_more);
      console.log(`[Notifications] hasMore: ${data.has_more}, total: ${data.total_count}`);
    } catch (err) {
      console.error('Error fetching notifications', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [api, filter]);

  useEffect(() => {
    setPage(1);
    pageRef.current = 1;
    setSelectedIds(new Set()); // Clear selection when filter changes
    fetchNotifications(1, false);
  }, [fetchNotifications, filter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const isIntersecting = entries[0].isIntersecting;
        console.log(`[Observer] Triggered - intersecting: ${isIntersecting}, hasMore: ${hasMore}, loading: ${loading}, loadingMore: ${loadingMore}, page: ${pageRef.current}`);
        
        if (isIntersecting && hasMore && !loadingMore && !loading && !isFetchingRef.current) {
          const nextPage = pageRef.current + 1;
          pageRef.current = nextPage;
          setPage(nextPage);
          console.log(`[Observer] Loading page ${nextPage}`);
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
  }, [hasMore, loadingMore, loading, fetchNotifications]);

  const markRead = async (id: string) => {
    try {
      await api.post(`/api/notifications/${id}/mark-read`);
      
      if (filter === 'unread') {
        // Remove from list when on unread filter
        setNotifications(prev => prev.filter(n => n.id !== id));
        setTotalCount(prev => Math.max(0, prev - 1));
      } else {
        // Mark as read but keep in list when on all filter
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification read', err);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      await markRead(n.id);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map(n => n.id)));
    }
  };

  const toggleSelectNotification = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const markSelectedAsRead = async () => {
    if (selectedIds.size === 0) return;
    
    setMarkingAsRead(true);
    try {
      // Mark each selected notification as read
      await Promise.all(
        Array.from(selectedIds).map(id => 
          api.post(`/api/notifications/${id}/mark-read`)
        )
      );
      
      // Update local state
      if (filter === 'unread') {
        // Remove from list when on unread filter
        setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
        setTotalCount(prev => Math.max(0, prev - selectedIds.size));
      } else {
        // Mark as read but keep in list when on all filter
        setNotifications(prev =>
          prev.map(n => selectedIds.has(n.id) ? { ...n, is_read: true } : n)
        );
      }
      
      // Update unread count
      const markedCount = notifications.filter(n => 
        selectedIds.has(n.id) && !n.is_read
      ).length;
      setUnreadCount(prev => Math.max(0, prev - markedCount));
      
      // Clear selection
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Error marking selected notifications as read', err);
    } finally {
      setMarkingAsRead(false);
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const openDeleteDialog = (target: 'bulk' | string) => {
    setDeleteTarget(target);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteDialogOpen(false);

    try {
      if (deleteTarget === 'bulk') {
        // Bulk delete
        await api.post('/api/notifications/bulk-delete', {
          notification_ids: Array.from(selectedIds)
        });
        
        // Update unread count
        const deletedUnreadCount = notifications.filter(n => 
          selectedIds.has(n.id) && !n.is_read
        ).length;
        setUnreadCount(prev => Math.max(0, prev - deletedUnreadCount));
        
        // Remove from local state
        setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
        setTotalCount(prev => Math.max(0, prev - selectedIds.size));
        
        // Clear selection
        setSelectedIds(new Set());
      } else {
        // Single delete
        await api.delete(`/api/notifications/${deleteTarget}`);
        
        // Remove from local state
        setNotifications(prev => prev.filter(n => n.id !== deleteTarget));
        setTotalCount(prev => Math.max(0, prev - 1));
        
        // Update unread count if notification was unread
        const notification = notifications.find(n => n.id === deleteTarget);
        if (notification && !notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Error deleting notification(s)', err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const allSelected = notifications.length > 0 && selectedIds.size === notifications.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < notifications.length;

  const formatRelativeTime = (dateString: string) => {
    const utcDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - utcDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;

    return utcDate.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires'
    });
  };


  const renderNotification = (n: Notification) => {
    const isSelected = selectedIds.has(n.id);

    return (
      <div className={cn(
        'group block transition-all hover:bg-accent/50 relative',
        !n.is_read && 'bg-notification/5',
        isSelected && 'bg-accent/30'
      )}>
        {!n.is_read && (
          <div className='absolute left-0 top-0 bottom-0 w-1 bg-notification' />
        )}

        <div className='flex gap-4 p-5 pl-6 group/notification'>
          <div className='flex-shrink-0 flex items-center'>
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleSelectNotification(n.id)}
              onClick={(e) => e.stopPropagation()}
              className='h-5 w-5'
            />
          </div>

          <div className='flex-1 min-w-0 flex gap-4'>
            {/* Left Side - Content */}
            <Link
              href={n.link || '#'}
              onClick={() => handleNotificationClick(n)}
              className='flex-1 min-w-0 space-y-3 cursor-pointer'
            >
              <h3 className={cn(
                'text-base font-semibold leading-tight',
                !n.is_read ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {n.title}
              </h3>

              {/* Body */}
              {n.body && (
                <p className='text-sm text-muted-foreground leading-relaxed'>
                  {n.body}
                </p>
              )}

              {/* Link indicator */}
              {n.link && (
                <div className='flex items-center gap-1.5 text-sm text-notification font-medium'>
                  <span>Ver detalles</span>
                  <ExternalLink className='h-3.5 w-3.5' />
                </div>
              )}
            </Link>

            {/* Right Side - Time and Actions */}
            <div className='flex-shrink-0 flex flex-col items-end justify-between gap-2'>
              {/* Time */}
              <div className='flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap'>
                {formatRelativeTime(n.created_at)}
              </div>
              
              {/* Actions */}
              <div className='flex items-center gap-2'>
                {!n.is_read && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      markRead(n.id);
                    }}
                    className='h-8 px-3 text-xs'
                  >
                    Marcar como leído
                  </Button>
                )}
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openDeleteDialog(n.id);
                  }}
                  className='h-8 w-8 text-muted-foreground hover:text-destructive'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden'>
      <div className='flex-shrink-0 border-b bg-background px-4 md:px-6 py-4'>
        <div className='text-start space-y-1'>
          <h1 className='text-2xl md:text-3xl font-bold font-serif'>
            Notificaciones
          </h1>
          <p className='text-muted-foreground text-xs md:text-sm'>
            Actualizaciones de tus normas guardadas
          </p>
        </div>
      </div>

      <div className='flex-shrink-0 border-b bg-background'>
        <div className='flex items-center justify-between px-6 py-4'>
          <div className='flex items-center gap-3'>
            {!loading && notifications.length > 0 && (
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
                className={cn('h-5 w-5', someSelected && '[&>span>svg]:opacity-50')}
                aria-label='Seleccionar todas las notificaciones'
              />
            )}
            
            {loading ? (
              <Skeleton className='h-5 w-40' />
            ) : selectedIds.size > 0 ? (
              <span className='text-sm font-medium'>
                {selectedIds.size} {selectedIds.size === 1 ? 'seleccionada' : 'seleccionadas'}
              </span>
            ) : (
              <>
                <span className='text-sm text-muted-foreground'>
                  {filter === 'unread' ? (
                    unreadCount === 0 ? 'Sin notificaciones no leídas' : 
                    unreadCount === 1 ? '1 notificación no leída' : 
                    `${unreadCount} notificaciones no leídas`
                  ) : (
                    totalCount === 0 ? 'Sin notificaciones' : 
                    totalCount === 1 ? '1 notificación' : 
                    `${totalCount} notificaciones`
                  )}
                </span>
                {filter === 'all' && unreadCount > 0 && (
                  <div className='flex items-center gap-1.5'>
                    <div className='w-1.5 h-1.5 rounded-full bg-notification' />
                    <span className='text-sm font-medium text-notification'>
                      {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          
          {selectedIds.size > 0 ? (
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={markSelectedAsRead}
                disabled={markingAsRead || deleting}
                className='h-9'
              >
                {markingAsRead ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-1 animate-spin' />
                    Marcando...
                  </>
                ) : (
                  <>
                    <ListChecks className='h-4 w-4 mr-1' />
                    Marcar como leídas
                  </>
                )}
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => openDeleteDialog('bulk')}
                disabled={deleting || markingAsRead}
                className='h-9 text-destructive hover:text-destructive'
              >
                {deleting ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-1 animate-spin' />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className='h-4 w-4 mr-1' />
                    Eliminar
                  </>
                )}
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={clearSelection}
                disabled={deleting || markingAsRead}
                className='h-9'
              >
                <X className='h-4 w-4 mr-1' />
                Cancelar
              </Button>
            </div>
          ) : (
            <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'unread')}>
              <TabsList>
                <TabsTrigger value='all'>Todas</TabsTrigger>
                <TabsTrigger value='unread'>No leídas</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>

      <div className='flex-1 overflow-y-auto'>
        {loading && notifications.length === 0 ? (
          <div className='divide-y'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='flex gap-4 p-5 pl-6'>
                <Skeleton className='w-11 h-11 rounded-xl flex-shrink-0' />
                <div className='flex-1 space-y-2.5'>
                  <div className='flex items-center justify-between'>
                    <Skeleton className='h-4 w-60' />
                    <Skeleton className='h-3 w-20' />
                  </div>
                  <Skeleton className='h-6 w-32' />
                  <Skeleton className='h-4 w-full' />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full px-4 py-16 text-center'>
            <div className='w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4'>
              <Bell className='h-8 w-8 text-muted-foreground/50' />
            </div>
            <h2 className='text-lg font-semibold mb-1'>
              {filter === 'unread' ? 'Todo al día' : 'No hay notificaciones'}
            </h2>
            <p className='text-sm text-muted-foreground max-w-sm'>
              {filter === 'unread' 
                ? 'Has leído todas tus notificaciones'
                : 'Te avisaremos cuando haya novedades en tus normas guardadas'
              }
            </p>
          </div>
        ) : (
          <>
            <div className='divide-y'>
              {notifications.map(n => (
                <div key={n.id}>{renderNotification(n)}</div>
              ))}
            </div>

            {loadingMore && (
              <div className='divide-y'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className='flex gap-4 p-5 pl-6'>
                    <Skeleton className='w-11 h-11 rounded-xl flex-shrink-0' />
                    <div className='flex-1 space-y-2.5'>
                      <div className='flex items-center justify-between'>
                        <Skeleton className='h-4 w-60' />
                        <Skeleton className='h-3 w-20' />
                      </div>
                      <Skeleton className='h-6 w-32' />
                      <Skeleton className='h-4 w-full' />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hasMore && <div ref={observerTarget} className='h-20 w-full' />}
          </>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
            <DialogDescription>
              {deleteTarget === 'bulk' 
                ? `Vas a eliminar ${selectedIds.size} notificación${selectedIds.size === 1 ? '' : 'es'}. Esta acción no se puede deshacer.`
                : 'Vas a eliminar esta notificación. Esta acción no se puede deshacer.'
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2'>
            <Button 
              variant='outline' 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant='destructive'
              onClick={handleConfirmDelete}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
