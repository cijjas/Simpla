'use client';

/**
 * Optimized bookmark toggle hook using context
 */

import { useEffect } from 'react';
import { useBookmarksContext } from '../context/bookmark-context';

interface UseOptimizedBookmarkToggleResult {
  isBookmarked: boolean;
  loading: boolean;
  error: string | null;
  toggleBookmark: () => Promise<void>;
}

export function useOptimizedBookmarkToggle(normaId: number): UseOptimizedBookmarkToggleResult {
  const { checkBookmarks, toggleBookmark: contextToggle, isBookmarked: contextIsBookmarked, loading, error } = useBookmarksContext();

  // Check this norma's bookmark status when the hook is used
  useEffect(() => {
    if (normaId) {
      checkBookmarks([normaId]);
    }
  }, [normaId, checkBookmarks]);

  const toggleBookmark = async () => {
    await contextToggle(normaId);
  };

  return {
    isBookmarked: contextIsBookmarked(normaId),
    loading,
    error,
    toggleBookmark,
  };
}
