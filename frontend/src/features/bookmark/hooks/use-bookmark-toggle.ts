'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useApi } from '@/features/auth/hooks/use-api';

interface UseBookmarkToggleResult {
  isBookmarked: boolean;
  loading: boolean;
  error: string | null;
  toggleBookmark: () => Promise<void>;
}

// Global cache to prevent duplicate API calls
const bookmarkCache = new Map<number, boolean>();
const pendingChecks = new Set<number>();

export function useBookmarkToggle(normaId: number): UseBookmarkToggleResult {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [isBookmarked, setIsBookmarked] = useState(
    bookmarkCache.get(normaId) || false,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasChecked = useRef(false);

  // Check if norma is bookmarked
  const checkBookmarkStatus = useCallback(async () => {
    if (
      !isAuthenticated ||
      !normaId ||
      hasChecked.current ||
      pendingChecks.has(normaId)
    ) {
      return;
    }

    // Check cache first
    if (bookmarkCache.has(normaId)) {
      setIsBookmarked(bookmarkCache.get(normaId) || false);
      hasChecked.current = true;
      return;
    }

    try {
      pendingChecks.add(normaId);
      setError(null);

      const response = await api.get<{ is_favorite: boolean }>(
        `/api/favorites/check/${normaId}`,
      );

      console.log(
        '[useBookmarkToggle] Check response for normaId',
        normaId,
        ':',
        response,
      );

      // Update cache and state
      bookmarkCache.set(normaId, response.is_favorite);
      setIsBookmarked(response.is_favorite);
      hasChecked.current = true;
    } catch (err) {
      console.error('Error checking bookmark status:', err);
      setError('Error al verificar guardados');
      setIsBookmarked(false);
    } finally {
      pendingChecks.delete(normaId);
    }
  }, [api, isAuthenticated, normaId]);

  // Toggle bookmark status
  const toggleBookmark = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para guardar');
      return;
    }

    if (loading) return; // Prevent multiple simultaneous requests

    try {
      setLoading(true);
      setError(null);

      await api.post('/api/favorites/toggle', { norma_id: normaId });

      // Update cache and state immediately for better UX
      const newBookmarkStatus = !isBookmarked;
      bookmarkCache.set(normaId, newBookmarkStatus);
      setIsBookmarked(newBookmarkStatus);
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      setError('Error al actualizar guardados');
      // Revert optimistic update on error
      await checkBookmarkStatus();
    } finally {
      setLoading(false);
    }
  }, [
    api,
    isAuthenticated,
    normaId,
    loading,
    isBookmarked,
    checkBookmarkStatus,
  ]);

  // Check bookmark status on mount and when normaId/auth changes
  useEffect(() => {
    if (isAuthenticated && normaId) {
      checkBookmarkStatus();
    } else {
      setIsBookmarked(false);
      hasChecked.current = false;
    }
  }, [isAuthenticated, normaId, checkBookmarkStatus]);

  // Reset when auth changes
  useEffect(() => {
    if (!isAuthenticated) {
      bookmarkCache.clear();
      pendingChecks.clear();
      hasChecked.current = false;
    }
  }, [isAuthenticated]);

  return {
    isBookmarked,
    loading,
    error,
    toggleBookmark,
  };
}
