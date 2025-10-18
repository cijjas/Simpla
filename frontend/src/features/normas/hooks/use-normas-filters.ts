'use client';

import { useCallback, useEffect } from 'react';
import { useNormas } from '../contexts/normas-context';
import { useNormasUrlSync } from './use-normas-url-sync';
import { NormaFilters } from '../api/normas-api';

/**
 * Hook for managing filter state and options
 * All filter changes are immediately reflected in the URL
 */
export function useNormasFilters() {
  const { state, loadFilterOptions } = useNormas();
  const { currentFilters, setFiltersInUrl, clearFilters } = useNormasUrlSync();

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  /**
   * Update a single filter value
   */
  const setFilter = useCallback(
    (key: keyof NormaFilters, value: string | number | undefined) => {
      setFiltersInUrl({ [key]: value });
    },
    [setFiltersInUrl],
  );

  /**
   * Update multiple filters at once
   */
  const setFilters = useCallback(
    (filters: Partial<NormaFilters>) => {
      setFiltersInUrl(filters);
    },
    [setFiltersInUrl],
  );

  /**
   * Clear all filters (reset to defaults)
   */
  const clearAllFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  /**
   * Clear a specific filter
   */
  const clearFilter = useCallback(
    (key: keyof NormaFilters) => {
      setFiltersInUrl({ [key]: undefined });
    },
    [setFiltersInUrl],
  );

  // Computed values
  const hasActiveFilters = Object.entries(currentFilters).some(
    ([key, value]) =>
      key !== 'limit' &&
      key !== 'offset' &&
      value !== undefined &&
      value !== '',
  );

  const activeFilterCount = Object.entries(currentFilters).filter(
    ([key, value]) =>
      key !== 'limit' &&
      key !== 'offset' &&
      value !== undefined &&
      value !== '',
  ).length;

  return {
    // State
    filterOptions: state.filterOptions,
    filterOptionsLoading: state.filterOptionsLoading,
    filterOptionsError: state.filterOptionsError,
    currentFilters,

    // Actions
    setFilter,
    setFilters,
    clearAllFilters,
    clearFilter,

    // Computed values
    hasActiveFilters,
    activeFilterCount,
  };
}
