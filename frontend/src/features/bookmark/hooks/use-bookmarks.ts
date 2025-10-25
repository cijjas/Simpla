'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useApi } from '@/features/auth/hooks/use-api';
import { normasAPI, type NormaSummary } from '@/features/normas/api/normas-api';

interface BookmarkResponse {
  id: string;
  user_id: string;
  norma_id: number;
  added_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at?: string;
}

interface BookmarksListResponse {
  bookmarks: BookmarkResponse[];
  total_count: number;
  has_more: boolean;
  limit: number;
  offset: number;
}

interface UseBookmarksOptions {
  /** Number of items to load per page */
  pageSize?: number;
  /** If true, skip the initial bookmark status check (optimization for bookmark page) */
  skipStatusCheck?: boolean;
}

export function useBookmarks(options: UseBookmarksOptions = {}) {
  const { pageSize = 12 } = options;
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [bookmarks, setBookmarks] = useState<NormaSummary[]>([]);
  const [bookmarkIds, setBookmarkIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const fetchingRef = useRef(false);
  const offsetRef = useRef(0);

  const fetchBookmarks = useCallback(
    async (append: boolean = false) => {
      if (!isAuthenticated || fetchingRef.current) {
        return;
      }

      try {
        fetchingRef.current = true;
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
          offsetRef.current = 0;
        }
        setError(null);

        const offset = append ? offsetRef.current : 0;
        console.log('Fetching bookmarks from API...', { limit: pageSize, offset });
        
        const data = await api.get<BookmarksListResponse>(
          `/api/bookmarks/?limit=${pageSize}&offset=${offset}`
        );
        
        console.log('Bookmarks API response:', data);

        const normaIds = data.bookmarks.map(bookmark => bookmark.norma_id);
        setHasMore(data.has_more);
        setTotalCount(data.total_count);

        // Fetch all norma data in a single batch request
        if (normaIds.length > 0) {
          console.log('Fetching norma data batch for IDs:', normaIds);

          try {
            const batchResponse = await normasAPI.getNormasBatch(normaIds);
            console.log('Fetched normas batch:', batchResponse);

            if (batchResponse.not_found_ids.length > 0) {
              console.warn('Some normas were not found:', batchResponse.not_found_ids);
            }

            // Sort normas to match the order of normaIds (bookmarks are ordered by added_at desc)
            const normasMap = new Map(
              batchResponse.normas.map(norma => [norma.infoleg_id, norma])
            );
            const orderedNormas = normaIds
              .map(id => normasMap.get(id))
              .filter((norma): norma is NormaSummary => norma !== undefined);

            if (append) {
              setBookmarks(prev => [...prev, ...orderedNormas]);
              setBookmarkIds(prev => [...prev, ...normaIds]);
            } else {
              setBookmarks(orderedNormas);
              setBookmarkIds(normaIds);
            }

            // Update offset for next fetch
            offsetRef.current = offset + orderedNormas.length;
          } catch (error) {
            console.error('Error fetching normas batch:', error);
            setError('Error al cargar las normas');
          }
        } else if (!append) {
          setBookmarks([]);
          setBookmarkIds([]);
        }
      } catch (err: unknown) {
        console.error('Bookmarks API error:', err);
        if (err && typeof err === 'object' && 'status' in err) {
          console.error('Error status:', (err as { status: unknown }).status);
        }
        if (err && typeof err === 'object' && 'message' in err) {
          console.error('Error message:', (err as { message: unknown }).message);
        }

        setError('Error al cargar los guardados');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        fetchingRef.current = false;
      }
    },
    [api, isAuthenticated, pageSize],
  );

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !fetchingRef.current) {
      fetchBookmarks(true);
    }
  }, [loadingMore, hasMore, fetchBookmarks]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookmarks();
    } else {
      // Clear bookmarks when not authenticated
      setBookmarks([]);
      setBookmarkIds([]);
      setLoading(false);
      setHasMore(false);
      setTotalCount(0);
      offsetRef.current = 0;
    }
  }, [isAuthenticated, fetchBookmarks]);

  const addToBookmarks = useCallback(
    async (norma: NormaSummary) => {
      if (!isAuthenticated) {
        setError('Debes iniciar sesión para guardar');
        return;
      }

      try {
        setError(null);
        await api.post('/api/bookmarks/toggle', { norma_id: norma.infoleg_id });
        // Refresh bookmarks list
        await fetchBookmarks();
      } catch (err) {
        setError('Error al guardar');
        console.error('Error adding to bookmarks:', err);
      }
    },
    [api, isAuthenticated, fetchBookmarks],
  );

  const removeFromBookmarks = useCallback(
    async (normaId: number) => {
      if (!isAuthenticated) {
        setError('Debes iniciar sesión para quitar guardados');
        return;
      }

      try {
        setError(null);
        await api.post('/api/bookmarks/toggle', { norma_id: normaId });
        // Refresh bookmarks list
        await fetchBookmarks();
      } catch (err) {
        setError('Error al quitar de guardados');
        console.error('Error removing from bookmarks:', err);
      }
    },
    [api, isAuthenticated, fetchBookmarks],
  );

  const isBookmarked = useCallback(
    (normaId: number) => {
      return bookmarkIds.includes(normaId);
    },
    [bookmarkIds],
  );

  return {
    bookmarks,
    loading,
    loadingMore,
    error,
    hasMore,
    totalCount,
    addToBookmarks,
    removeFromBookmarks,
    isBookmarked,
    loadMore,
    refetch: () => fetchBookmarks(false),
  };
}
