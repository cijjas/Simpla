'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useApi } from '@/features/auth/hooks/use-api';

interface UseBookmarkToggleResult {
  isBookmarked: boolean;
  loading: boolean;
  error: string | null;
  toggleBookmark: () => Promise<void>;
}

interface UseBookmarkToggleOptions {
  /** If provided, skip the API check and use this value directly */
  initialBookmarkedState?: boolean;
}

// Global cache to prevent duplicate API calls
const bookmarkCache = new Map<number, boolean>();
const pendingChecks = new Set<number>();

export function useBookmarkToggle(
  normaId: number,
  options: UseBookmarkToggleOptions = {}
): UseBookmarkToggleResult {
  const { initialBookmarkedState } = options;
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [isBookmarked, setIsBookmarked] = useState(
    initialBookmarkedState ?? bookmarkCache.get(normaId) ?? false,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasChecked = useRef(false);

  // Check if norma is bookmarked
  const checkBookmarkStatus = useCallback(async () => {
    // Skip check if we have an initial state or already checked
    if (
      initialBookmarkedState !== undefined ||
      !isAuthenticated ||
      !normaId ||
      hasChecked.current ||
      pendingChecks.has(normaId)
    ) {
      if (initialBookmarkedState !== undefined) {
        hasChecked.current = true;
      }
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

      const response = await api.get<{ is_bookmarked: boolean }>(
        `/api/bookmarks/check/${normaId}`,
      );

      console.log(
        '[useBookmarkToggle] Check response for normaId',
        normaId,
        ':',
        response,
      );

      // Update cache and state
      bookmarkCache.set(normaId, response.is_bookmarked);
      setIsBookmarked(response.is_bookmarked);
      hasChecked.current = true;
    } catch (err) {
      console.error('Error checking bookmark status:', err);
      setError('Error al verificar guardados');
      setIsBookmarked(false);
    } finally {
      pendingChecks.delete(normaId);
    }
  }, [api, isAuthenticated, normaId, initialBookmarkedState]);

  // Toggle bookmark status
  const toggleBookmark = useCallback(async () => {
    if (!isAuthenticated) {
      const errorMsg = 'Debes iniciar sesión para guardar';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (loading) return; // Prevent multiple simultaneous requests

    // Store the current state for potential rollback
    const previousBookmarkStatus = isBookmarked;

    try {
      // Optimistic update - update UI immediately
      const newBookmarkStatus = !isBookmarked;
      setIsBookmarked(newBookmarkStatus);
      bookmarkCache.set(normaId, newBookmarkStatus);

      // Set loading to true for tracking, but don't block UI
      setLoading(true);
      setError(null);

      // Make the API call in the background
      await api.post('/api/bookmarks/toggle', { norma_id: normaId });

      // Show success toast
      toast.success(
        newBookmarkStatus
          ? 'Norma agregada a guardados'
          : 'Norma removida de guardados',
      );
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      const errorMsg = 'Error al actualizar guardados';
      setError(errorMsg);

      // Revert optimistic update on error
      setIsBookmarked(previousBookmarkStatus);
      bookmarkCache.set(normaId, previousBookmarkStatus);

      // Show error toast
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [api, isAuthenticated, normaId, loading, isBookmarked]);

  // Check bookmark status on mount and when normaId/auth changes
  useEffect(() => {
    if (isAuthenticated && normaId) {
      checkBookmarkStatus();
    } else {
      setIsBookmarked(initialBookmarkedState ?? false);
      hasChecked.current = initialBookmarkedState !== undefined;
    }
  }, [isAuthenticated, normaId, checkBookmarkStatus, initialBookmarkedState]);

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
