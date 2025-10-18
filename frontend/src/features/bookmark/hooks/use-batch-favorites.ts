'use client';

/**
 * Hook for components that display multiple normas
 * Efficiently batch-checks favorite status for all normas
 */

import { useEffect } from 'react';
import { useFavoritesContext } from '../context/bookmark-context';
import { NormaItem } from '@/features/infoleg/utils/types';

interface UseBatchFavoritesResult {
  isFavorite: (normaId: number) => boolean;
  loading: boolean;
  error: string | null;
  toggleFavorite: (normaId: number) => Promise<void>;
}

export function useBatchFavorites(normas: NormaItem[]): UseBatchFavoritesResult {
  const { checkFavorites, toggleFavorite, isFavorite, loading, error } = useFavoritesContext();

  // Batch check all normas when they change
  useEffect(() => {
    if (normas.length > 0) {
      const normaIds = normas.map(norma => norma.id);
      checkFavorites(normaIds);
    }
  }, [normas, checkFavorites]);

  return {
    isFavorite,
    loading,
    error,
    toggleFavorite,
  };
}
