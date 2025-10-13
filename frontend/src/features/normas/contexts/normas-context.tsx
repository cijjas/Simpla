'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { 
  NormaSummary, 
  NormaDetail, 
  NormaSearchResponse, 
  NormaFilters, 
  NormaFilterOptions,
  NormaStats,
  normasAPI 
} from '../api/normas-api';

// State interfaces
interface NormasState {
  // Search and listing
  searchResults: NormaSearchResponse | null;
  searchLoading: boolean;
  searchError: string | null;
  filters: NormaFilters;
  
  // Filter options
  filterOptions: NormaFilterOptions | null;
  filterOptionsLoading: boolean;
  filterOptionsError: string | null;
  
  // Statistics
  stats: NormaStats | null;
  statsLoading: boolean;
  statsError: string | null;
  
  // Cache for individual normas
  normaCache: Map<number, NormaDetail>;
  normaSummaryCache: Map<number, NormaSummary>;
  
  // UI state
  selectedNormaId: number | null;
  viewMode: 'grid' | 'list';
}

// Action types
type NormasAction =
  | { type: 'SET_SEARCH_LOADING'; payload: boolean }
  | { type: 'SET_SEARCH_RESULTS'; payload: NormaSearchResponse | null }
  | { type: 'SET_SEARCH_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: NormaFilters }
  | { type: 'SET_FILTER_OPTIONS_LOADING'; payload: boolean }
  | { type: 'SET_FILTER_OPTIONS'; payload: NormaFilterOptions | null }
  | { type: 'SET_FILTER_OPTIONS_ERROR'; payload: string | null }
  | { type: 'SET_STATS_LOADING'; payload: boolean }
  | { type: 'SET_STATS'; payload: NormaStats | null }
  | { type: 'SET_STATS_ERROR'; payload: string | null }
  | { type: 'CACHE_NORMA'; payload: { id: number; norma: NormaDetail } }
  | { type: 'CACHE_NORMA_SUMMARY'; payload: { id: number; summary: NormaSummary } }
  | { type: 'SET_SELECTED_NORMA'; payload: number | null }
  | { type: 'SET_VIEW_MODE'; payload: 'grid' | 'list' }
  | { type: 'CLEAR_CACHE' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: NormasState = {
  searchResults: null,
  searchLoading: false,
  searchError: null,
  filters: {
    limit: 12,
    offset: 0,
  },
  filterOptions: null,
  filterOptionsLoading: false,
  filterOptionsError: null,
  stats: null,
  statsLoading: false,
  statsError: null,
  normaCache: new Map(),
  normaSummaryCache: new Map(),
  selectedNormaId: null,
  viewMode: 'grid',
};

// Reducer
function normasReducer(state: NormasState, action: NormasAction): NormasState {
  switch (action.type) {
    case 'SET_SEARCH_LOADING':
      return { ...state, searchLoading: action.payload, searchError: null };
    
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload, searchLoading: false };
    
    case 'SET_SEARCH_ERROR':
      return { ...state, searchError: action.payload, searchLoading: false };
    
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    
    case 'SET_FILTER_OPTIONS_LOADING':
      return { ...state, filterOptionsLoading: action.payload, filterOptionsError: null };
    
    case 'SET_FILTER_OPTIONS':
      return { ...state, filterOptions: action.payload, filterOptionsLoading: false };
    
    case 'SET_FILTER_OPTIONS_ERROR':
      return { ...state, filterOptionsError: action.payload, filterOptionsLoading: false };
    
    case 'SET_STATS_LOADING':
      return { ...state, statsLoading: action.payload, statsError: null };
    
    case 'SET_STATS':
      return { ...state, stats: action.payload, statsLoading: false };
    
    case 'SET_STATS_ERROR':
      return { ...state, statsError: action.payload, statsLoading: false };
    
    case 'CACHE_NORMA':
      const newNormaCache = new Map(state.normaCache);
      newNormaCache.set(action.payload.id, action.payload.norma);
      return { ...state, normaCache: newNormaCache };
    
    case 'CACHE_NORMA_SUMMARY':
      const newSummaryCache = new Map(state.normaSummaryCache);
      newSummaryCache.set(action.payload.id, action.payload.summary);
      return { ...state, normaSummaryCache: newSummaryCache };
    
    case 'SET_SELECTED_NORMA':
      return { ...state, selectedNormaId: action.payload };
    
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    
    case 'CLEAR_CACHE':
      return { 
        ...state, 
        normaCache: new Map(), 
        normaSummaryCache: new Map() 
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Context interface
interface NormasContextType {
  // State
  state: NormasState;
  
  // Search actions
  searchNormas: (filters?: NormaFilters) => Promise<void>;
  clearSearch: () => void;
  
  // Filter actions
  updateFilters: (filters: Partial<NormaFilters>) => void;
  resetFilters: () => void;
  
  // Filter options actions
  loadFilterOptions: () => Promise<void>;
  
  // Stats actions
  loadStats: () => Promise<void>;
  
  // Norma actions (all use infoleg_id)
  getNorma: (infolegId: number) => Promise<NormaDetail | null>;
  getNormaSummary: (infolegId: number) => Promise<NormaSummary | null>;
  
  // Cache actions
  clearCache: () => void;
  
  // UI actions
  setSelectedNorma: (infolegId: number | null) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  
  // Utility functions
  isNormaCached: (infolegId: number) => boolean;
  isNormaSummaryCached: (infolegId: number) => boolean;
}

// Create context
const NormasContext = createContext<NormasContextType | undefined>(undefined);

// Provider component
interface NormasProviderProps {
  children: ReactNode;
}

export function NormasProvider({ children }: NormasProviderProps) {
  const [state, dispatch] = useReducer(normasReducer, initialState);

  // Search actions
  const searchNormas = useCallback(async (filters?: NormaFilters) => {
    const searchFilters = filters || state.filters;
    dispatch({ type: 'SET_SEARCH_LOADING', payload: true });
    
    try {
      const results = await normasAPI.listNormas(searchFilters);
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al buscar normas';
      dispatch({ type: 'SET_SEARCH_ERROR', payload: errorMessage });
    }
  }, [state.filters]);

  const clearSearch = useCallback(() => {
    dispatch({ type: 'SET_SEARCH_RESULTS', payload: null });
    dispatch({ type: 'SET_SEARCH_ERROR', payload: null });
  }, []);

  // Filter actions
  const updateFilters = useCallback((newFilters: Partial<NormaFilters>) => {
    const updatedFilters = { ...state.filters, ...newFilters };
    dispatch({ type: 'SET_FILTERS', payload: updatedFilters });
  }, [state.filters]);

  const resetFilters = useCallback(() => {
    dispatch({ type: 'SET_FILTERS', payload: { limit: 12, offset: 0 } });
  }, []);

  // Filter options actions
  const loadFilterOptions = useCallback(async () => {
    if (state.filterOptions) return; // Already loaded
    
    dispatch({ type: 'SET_FILTER_OPTIONS_LOADING', payload: true });
    
    try {
      const options = await normasAPI.getFilterOptions();
      dispatch({ type: 'SET_FILTER_OPTIONS', payload: options });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar opciones de filtro';
      dispatch({ type: 'SET_FILTER_OPTIONS_ERROR', payload: errorMessage });
    }
  }, [state.filterOptions]);

  // Stats actions
  const loadStats = useCallback(async () => {
    if (state.stats) return; // Already loaded
    
    dispatch({ type: 'SET_STATS_LOADING', payload: true });
    
    try {
      const stats = await normasAPI.getStats();
      dispatch({ type: 'SET_STATS', payload: stats });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar estadísticas';
      dispatch({ type: 'SET_STATS_ERROR', payload: errorMessage });
    }
  }, [state.stats]);

  // Norma actions (all use infoleg_id)
  const getNorma = useCallback(async (infolegId: number): Promise<NormaDetail | null> => {
    // Check cache first (cache by infoleg_id)
    if (state.normaCache.has(infolegId)) {
      return state.normaCache.get(infolegId)!;
    }
    
    try {
      const norma = await normasAPI.getNorma(infolegId);
      dispatch({ type: 'CACHE_NORMA', payload: { id: infolegId, norma } });
      return norma;
    } catch (error) {
      console.error(`Error loading norma ${infolegId}:`, error);
      return null;
    }
  }, [state.normaCache]);

  const getNormaSummary = useCallback(async (infolegId: number): Promise<NormaSummary | null> => {
    // Check cache first (cache by infoleg_id)
    if (state.normaSummaryCache.has(infolegId)) {
      return state.normaSummaryCache.get(infolegId)!;
    }
    
    try {
      const summary = await normasAPI.getNormaSummary(infolegId);
      dispatch({ type: 'CACHE_NORMA_SUMMARY', payload: { id: infolegId, summary } });
      return summary;
    } catch (error) {
      console.error(`Error loading norma summary ${infolegId}:`, error);
      return null;
    }
  }, [state.normaSummaryCache]);

  // Cache actions
  const clearCache = useCallback(() => {
    dispatch({ type: 'CLEAR_CACHE' });
  }, []);

  // UI actions
  const setSelectedNorma = useCallback((infolegId: number | null) => {
    dispatch({ type: 'SET_SELECTED_NORMA', payload: infolegId });
  }, []);

  const setViewMode = useCallback((mode: 'grid' | 'list') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  }, []);

  // Utility functions
  const isNormaCached = useCallback((infolegId: number) => {
    return state.normaCache.has(infolegId);
  }, [state.normaCache]);

  const isNormaSummaryCached = useCallback((infolegId: number) => {
    return state.normaSummaryCache.has(infolegId);
  }, [state.normaSummaryCache]);

  const contextValue: NormasContextType = {
    state,
    searchNormas,
    clearSearch,
    updateFilters,
    resetFilters,
    loadFilterOptions,
    loadStats,
    getNorma,
    getNormaSummary,
    clearCache,
    setSelectedNorma,
    setViewMode,
    isNormaCached,
    isNormaSummaryCached,
  };

  return (
    <NormasContext.Provider value={contextValue}>
      {children}
    </NormasContext.Provider>
  );
}

// Hook to use the context
export function useNormas(): NormasContextType {
  const context = useContext(NormasContext);
  if (context === undefined) {
    throw new Error('useNormas must be used within a NormasProvider');
  }
  return context;
}

// Export types
export type { NormasContextType, NormasState };
