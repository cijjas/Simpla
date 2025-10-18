'use client';

/**
 * Hook for components that display multiple normas
 * Efficiently batch-checks bookmark status for all normas
 */

import { useEffect, useMemo } from 'react';
import { useBookmarksContext } from '../context/bookmark-context';

interface UseBatchBookmarksResult {
  isBookmarked: (normaId: number) => boolean;
  loading: boolean;
  error: string | null;
  toggleBookmark: (normaId: number) => Promise<void>;
}

interface NormaWithId {
  id?: number;
  infoleg_id?: number;
}

/**
 * Extract infoleg_id from norma object
 * Supports both old NormaItem (with id) and new NormaSummary (with infoleg_id)
 */
function extractInfolegId(norma: NormaWithId): number | null {
  // Prefer infoleg_id if present, otherwise fall back to id
  return norma.infoleg_id ?? norma.id ?? null;
}

export function useBatchBookmarks(normas: NormaWithId[]): UseBatchBookmarksResult {
  const { checkBookmarks, toggleBookmark, isBookmarked, loading, error } = useBookmarksContext();

  // Extract norma IDs (memoize to prevent unnecessary rechecks)
  const normaIds = useMemo(() => {
    return normas
      .map(extractInfolegId)
      .filter((id): id is number => id !== null);
  }, [normas]);

  // Batch check all normas when IDs change
  useEffect(() => {
    if (normaIds.length > 0) {
      checkBookmarks(normaIds);
    }
  }, [normaIds, checkBookmarks]);

  return {
    isBookmarked,
    loading,
    error,
    toggleBookmark,
  };
}
