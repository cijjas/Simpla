'use client';

import { useCallback, useEffect } from 'react';
import { useNormas } from '../contexts/normas-context';

export function useNormasStats() {
  const { state, loadStats } = useNormas();

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refreshStats = useCallback(() => {
    loadStats();
  }, [loadStats]);

  return {
    // State
    stats: state.stats,
    loading: state.statsLoading,
    error: state.statsError,
    
    // Actions
    refreshStats,
    
    // Computed values
    hasStats: !!state.stats,
    totalNormas: state.stats?.total_normas || 0,
    totalDivisions: state.stats?.total_divisions || 0,
    totalArticles: state.stats?.total_articles || 0,
    normasByJurisdiction: state.stats?.normas_by_jurisdiction || {},
    normasByType: state.stats?.normas_by_type || {},
    normasByStatus: state.stats?.normas_by_status || {},
  };
}
