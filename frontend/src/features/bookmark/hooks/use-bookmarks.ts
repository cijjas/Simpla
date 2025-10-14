'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useApi } from '@/features/auth/hooks/use-api';
import { getNormaDetalladaResumen } from '@/features/infoleg/utils/api';
import type { NormaItem } from '@/features/infoleg/utils/types';

interface BookmarkResponse {
  id: string;
  user_id: string;
  norma_id: number;
  added_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at?: string;
}

export function useBookmarks() {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [bookmarks, setBookmarks] = useState<NormaItem[]>([]);
  const [bookmarkIds, setBookmarkIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchBookmarks = useCallback(async () => {
    if (!isAuthenticated || fetchingRef.current) {
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      console.log('Fetching bookmarks from API...');
      const data = await api.get<BookmarkResponse[]>('/api/favorites/');
      console.log('Bookmarks API response:', data);

      const normaIds = data.map(bookmark => bookmark.norma_id);
      setBookmarkIds(normaIds);

      // Now fetch the actual norma data for each ID using the infoleg API
      if (normaIds.length > 0) {
        console.log('Fetching norma data for IDs:', normaIds);

        const normaPromises = normaIds.map(async normaId => {
          try {
            const normaData = await getNormaDetalladaResumen(normaId);
            return normaData;
          } catch (error) {
            console.error(`Error fetching norma ${normaId}:`, error);
            return null; // Skip failed normas
          }
        });

        const normaResults = await Promise.all(normaPromises);
        // Filter out null results (failed fetches)
        const validNormas = normaResults.filter(
          (norma): norma is NormaItem => norma !== null,
        );

        console.log('Fetched normas:', validNormas);
        setBookmarks(validNormas);
      } else {
        setBookmarks([]);
      }
    } catch (err: unknown) {
      console.error('Favorites API error:', err);
      if (err && typeof err === 'object' && 'status' in err) {
        console.error('Error status:', (err as { status: unknown }).status);
      }
      if (err && typeof err === 'object' && 'message' in err) {
        console.error('Error message:', (err as { message: unknown }).message);
      }

      setError('Error al cargar los guardados');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [api, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookmarks();
    } else {
      // Clear bookmarks when not authenticated
      setBookmarks([]);
      setBookmarkIds([]);
      setLoading(false);
    }
  }, [fetchBookmarks, isAuthenticated]);

  const addToBookmarks = useCallback(
    async (norma: NormaItem) => {
      if (!isAuthenticated) {
        setError('Debes iniciar sesión para guardar');
        return;
      }

      try {
        setError(null);
        await api.post('/api/favorites/toggle', { norma_id: norma.id });
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
        await api.post('/api/favorites/toggle', { norma_id: normaId });
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
    error,
    addToBookmarks,
    removeFromBookmarks,
    isBookmarked,
  };
}
