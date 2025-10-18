'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useNormas } from '../contexts/normas-context';
import { useNormasUrlSync } from './use-normas-url-sync';

/**
 * Main hook for normas search functionality
 * Initializes from URL and triggers searches when URL changes
 */
export function useNormasSearch(options?: { autoSearch?: boolean }) {
  const { state, searchNormas, updateFilters } = useNormas();
  const { getFiltersFromUrl, setFiltersInUrl } = useNormasUrlSync();
  const searchParams = useSearchParams();
  const hasInitialized = useRef(false);
  const lastSearchKey = useRef<string | null>(null);

  // Initialize from URL on mount and search if autoSearch is enabled
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Get filters from URL (source of truth)
    const urlFilters = getFiltersFromUrl();
    
    // Update context state to match URL
    updateFilters(urlFilters);
    
    // Trigger search if autoSearch is enabled
    if (options?.autoSearch) {
      const searchKey = JSON.stringify(urlFilters);
      lastSearchKey.current = searchKey;
      searchNormas(urlFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch for URL changes and trigger search
  useEffect(() => {
    if (!hasInitialized.current) return;

    const urlFilters = getFiltersFromUrl();
    const searchKey = JSON.stringify(urlFilters);

    // Only search if filters actually changed from last search
    if (searchKey !== lastSearchKey.current) {
      lastSearchKey.current = searchKey;
      updateFilters(urlFilters);
      searchNormas(urlFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only depend on searchParams, not the functions

  /**
   * Change pagination offset (for page navigation)
   */
  const handlePageChange = useCallback(
    (offset: number) => {
      setFiltersInUrl({ offset }, false); // Don't reset pagination when changing pages
    },
    [setFiltersInUrl],
  );

  return {
    // State
    results: state.searchResults,
    loading: state.searchLoading,
    error: state.searchError,
    filters: state.filters,

    // Actions
    handlePageChange,

    // Computed values
    hasResults: !!state.searchResults?.normas?.length,
    totalCount: state.searchResults?.total_count || 0,
    hasMore: state.searchResults?.has_more || false,
    currentPage:
      Math.floor((state.filters.offset || 0) / (state.filters.limit || 12)) + 1,
    totalPages: Math.ceil(
      (state.searchResults?.total_count || 0) / (state.filters.limit || 12),
    ),
  };
}
