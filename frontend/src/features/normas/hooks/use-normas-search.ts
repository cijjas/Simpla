'use client';

import { useCallback, useEffect } from 'react';
import { useNormas } from '../contexts/normas-context';
import { NormaFilters } from '../api/normas-api';

export function useNormasSearch() {
  const { 
    state, 
    searchNormas, 
    clearSearch, 
    updateFilters, 
    resetFilters 
  } = useNormas();

  // Auto-search when filters change
  useEffect(() => {
    if (state.filters && Object.keys(state.filters).length > 0) {
      searchNormas();
    }
  }, [state.filters, searchNormas]);

  const handleSearch = useCallback((filters?: NormaFilters) => {
    if (filters) {
      updateFilters(filters);
    } else {
      searchNormas();
    }
  }, [searchNormas, updateFilters]);

  const handlePageChange = useCallback((offset: number) => {
    updateFilters({ offset });
  }, [updateFilters]);

  const handleFilterChange = useCallback((key: keyof NormaFilters, value: string | undefined) => {
    updateFilters({ [key]: value, offset: 0 }); // Reset offset when filters change
  }, [updateFilters]);

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
    currentPage: Math.floor((state.filters.offset || 0) / (state.filters.limit || 50)) + 1,
    totalPages: Math.ceil((state.searchResults?.total_count || 0) / (state.filters.limit || 50)),
  };
}
