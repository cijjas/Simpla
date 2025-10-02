'use client';

/**
 * Optimized favorite toggle hook using context
 */

import { useEffect } from 'react';
import { useFavoritesContext } from '../context/favorites-context';

interface UseOptimizedFavoriteToggleResult {
  isFavorite: boolean;
  loading: boolean;
  error: string | null;
  toggleFavorite: () => Promise<void>;
}

export function useOptimizedFavoriteToggle(normaId: number): UseOptimizedFavoriteToggleResult {
  const { checkFavorites, toggleFavorite: contextToggle, isFavorite: contextIsFavorite, loading, error } = useFavoritesContext();

  // Check this norma's favorite status when the hook is used
  useEffect(() => {
    if (normaId) {
      checkFavorites([normaId]);
    }
  }, [normaId, checkFavorites]);

  const toggleFavorite = async () => {
    await contextToggle(normaId);
  };

  return {
    isFavorite: contextIsFavorite(normaId),
    loading,
    error,
    toggleFavorite,
  };
}
