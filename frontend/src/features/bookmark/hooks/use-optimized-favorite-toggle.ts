'use client';

/**
 * Optimized bookmark toggle hook using context
 */

import { useEffect, useRef } from 'react';
import { useBookmarksContext } from '../context/bookmark-context';

interface UseOptimizedBookmarkToggleResult {
  isBookmarked: boolean;
  loading: boolean;
  error: string | null;
  toggleBookmark: () => Promise<void>;
}

export function useOptimizedBookmarkToggle(normaId: number): UseOptimizedBookmarkToggleResult {
  const { checkBookmarks, toggleBookmark: contextToggle, isBookmarked: contextIsBookmarked, loading, error } = useBookmarksContext();
  const hasChecked = useRef(false);

  // Check this norma's bookmark status when the hook is used
  useEffect(() => {
    if (normaId && !hasChecked.current) {
      hasChecked.current = true;
      checkBookmarks([normaId]);
    }
  }, [normaId]); // Remove checkBookmarks from dependencies

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
