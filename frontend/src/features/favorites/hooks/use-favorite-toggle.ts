'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useApi } from '@/features/auth/hooks/use-api';

interface UseFavoriteToggleResult {
  isFavorite: boolean;
  loading: boolean;
  error: string | null;
  toggleFavorite: () => Promise<void>;
}

// Global cache to prevent duplicate API calls
const favoriteCache = new Map<number, boolean>();
const pendingChecks = new Set<number>();

export function useFavoriteToggle(normaId: number): UseFavoriteToggleResult {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [isFavorite, setIsFavorite] = useState(favoriteCache.get(normaId) || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasChecked = useRef(false);

  // Check if norma is favorited
  const checkFavoriteStatus = useCallback(async () => {
    if (!isAuthenticated || !normaId || hasChecked.current || pendingChecks.has(normaId)) {
      return;
    }

    // Check cache first
    if (favoriteCache.has(normaId)) {
      setIsFavorite(favoriteCache.get(normaId) || false);
      hasChecked.current = true;
      return;
    }

    try {
      pendingChecks.add(normaId);
      setError(null);
      
      const response = await api.get<{ is_favorite: boolean }>(`/api/favorites/check/${normaId}`);
      
      // Update cache and state
      favoriteCache.set(normaId, response.is_favorite);
      setIsFavorite(response.is_favorite);
      hasChecked.current = true;
    } catch (err) {
      console.error('Error checking favorite status:', err);
      setError('Error al verificar favoritos');
      setIsFavorite(false);
    } finally {
      pendingChecks.delete(normaId);
    }
  }, [api, isAuthenticated, normaId]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para agregar favoritos');
      return;
    }

    if (loading) return; // Prevent multiple simultaneous requests

    try {
      setLoading(true);
      setError(null);

      await api.post('/api/favorites/toggle', { norma_id: normaId });
      
      // Update cache and state immediately for better UX
      const newFavoriteStatus = !isFavorite;
      favoriteCache.set(normaId, newFavoriteStatus);
      setIsFavorite(newFavoriteStatus);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Error al actualizar favoritos');
      // Revert optimistic update on error
      await checkFavoriteStatus();
    } finally {
      setLoading(false);
    }
  }, [api, isAuthenticated, normaId, loading, isFavorite, checkFavoriteStatus]);

  // Check favorite status on mount and when normaId/auth changes
  useEffect(() => {
    if (isAuthenticated && normaId) {
      checkFavoriteStatus();
    } else {
      setIsFavorite(false);
      hasChecked.current = false;
    }
  }, [isAuthenticated, normaId, checkFavoriteStatus]);

  // Reset when auth changes
  useEffect(() => {
    if (!isAuthenticated) {
      favoriteCache.clear();
      pendingChecks.clear();
      hasChecked.current = false;
    }
  }, [isAuthenticated]);

  return {
    isFavorite,
    loading,
    error,
    toggleFavorite
  };
}
