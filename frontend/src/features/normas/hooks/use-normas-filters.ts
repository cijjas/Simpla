'use client';

import { useCallback, useEffect } from 'react';
import { useNormas } from '../contexts/normas-context';

export function useNormasFilters() {
  const {
    state,
    loadFilterOptions,
    updateFilters,
    resetFilters,
    searchNormas,
  } = useNormas();

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  const handleFilterChange = useCallback(
    (key: string, value: unknown) => {
      const newFilters = { [key]: value, offset: 0 };
      updateFilters(newFilters);
      // Trigger search with updated filters
      searchNormas({ ...state.filters, ...newFilters });
    },
    [updateFilters, searchNormas, state.filters],
  );

  const handleDateRangeChange = useCallback(
    (key: string, value: string | undefined) => {
      const newFilters = { [key]: value, offset: 0 };
      updateFilters(newFilters);
      // Trigger search with updated filters
      searchNormas({ ...state.filters, ...newFilters });
    },
    [updateFilters, searchNormas, state.filters],
  );

  const handleSearchTermChange = useCallback(
    (searchTerm: string) => {
      const newFilters = { search_term: searchTerm || undefined, offset: 0 };
      updateFilters(newFilters);
      // Trigger search with updated filters
      searchNormas({ ...state.filters, ...newFilters });
    },
    [updateFilters, searchNormas, state.filters],
  );

  const handlePaginationChange = useCallback(
    (limit: number, offset: number) => {
      updateFilters({ limit, offset });
    },
    [updateFilters],
  );

  const clearAllFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  const clearSpecificFilter = useCallback(
    (key: string) => {
      updateFilters({ [key]: undefined, offset: 0 });
    },
    [updateFilters],
  );

  return {
    // State
    filterOptions: state.filterOptions,
    filterOptionsLoading: state.filterOptionsLoading,
    filterOptionsError: state.filterOptionsError,
    currentFilters: state.filters,

    // Actions
    handleFilterChange,
    handleDateRangeChange,
    handleSearchTermChange,
    handlePaginationChange,
    clearAllFilters,
    clearSpecificFilter,
    resetFilters,

    // Computed values
    hasActiveFilters: Object.entries(state.filters).some(
      ([key, value]) =>
        key !== 'limit' &&
        key !== 'offset' &&
        value !== undefined &&
        value !== '',
    ),
    activeFilterCount: Object.entries(state.filters).filter(
      ([key, value]) =>
        key !== 'limit' &&
        key !== 'offset' &&
        value !== undefined &&
        value !== '',
    ).length,
  };
}
