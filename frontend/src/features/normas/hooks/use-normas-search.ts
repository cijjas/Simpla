'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useNormas } from '../contexts/normas-context';
import { NormaFilters } from '../api/normas-api';

export function useNormasSearch(options?: { autoSearch?: boolean }) {
  const {
    state,
    searchNormas,
    triggerInitialSearch,
    clearSearch,
    updateFilters,
    resetFilters,
  } = useNormas();

  const hasTriggeredInitialSearch = useRef(false);

  // Only trigger initial search ONCE from the first component that mounts with autoSearch enabled
  useEffect(() => {
    if (options?.autoSearch && !hasTriggeredInitialSearch.current) {
      hasTriggeredInitialSearch.current = true;
      triggerInitialSearch();
    }
  }, [options?.autoSearch, triggerInitialSearch]);

  const handleSearch = useCallback(
    (filters?: NormaFilters) => {
      if (filters) {
        updateFilters(filters);
      }
      // Always trigger search explicitly
      searchNormas(filters);
    },
    [searchNormas, updateFilters],
  );

  const handlePageChange = useCallback(
    (offset: number) => {
      updateFilters({ offset });
      // Trigger search after updating filters
      searchNormas({ ...state.filters, offset });
    },
    [updateFilters, searchNormas, state.filters],
  );

  const handleFilterChange = useCallback(
    (key: keyof NormaFilters, value: string | undefined) => {
      const newFilters = { [key]: value, offset: 0 };
      updateFilters(newFilters);
      // Trigger search after updating filters
      searchNormas({ ...state.filters, ...newFilters });
    },
    [updateFilters, searchNormas, state.filters],
  );

  return {
    // State
    results: state.searchResults,
    loading: state.searchLoading,
    error: state.searchError,
    filters: state.filters,

    // Actions
    search: handleSearch,
    clearSearch,
    updateFilters,
    resetFilters,
    handlePageChange,
    handleFilterChange,

    // Computed values
    hasResults: !!state.searchResults?.normas?.length,
    totalCount: state.searchResults?.total_count || 0,
    hasMore: state.searchResults?.has_more || false,
    currentPage:
      Math.floor((state.filters.offset || 0) / (state.filters.limit || 50)) + 1,
    totalPages: Math.ceil(
      (state.searchResults?.total_count || 0) / (state.filters.limit || 50),
    ),
  };
}
