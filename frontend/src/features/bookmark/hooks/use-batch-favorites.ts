'use client';

/**
 * Hook for components that display multiple normas
 * Efficiently batch-checks bookmark status for all normas
 */

import { useEffect } from 'react';
import { useBookmarksContext } from '../context/bookmark-context';
import { NormaItem } from '@/features/infoleg/utils/types';

interface UseBatchBookmarksResult {
  isBookmarked: (normaId: number) => boolean;
  loading: boolean;
  error: string | null;
  toggleBookmark: (normaId: number) => Promise<void>;
}

export function useBatchBookmarks(normas: NormaItem[]): UseBatchBookmarksResult {
  const { checkBookmarks, toggleBookmark, isBookmarked, loading, error } = useBookmarksContext();

  // Batch check all normas when they change
  useEffect(() => {
    if (normas.length > 0) {
      const normaIds = normas.map(norma => norma.id);
      checkBookmarks(normaIds);
    }
  }, [normas, checkBookmarks]);

  return {
    isBookmarked,
    loading,
    error,
    toggleBookmark,
  };
}
