'use client';

/**
 * Favorites Context and Provider
 * Manages favorite states efficiently with bulk loading and caching
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useApi } from '@/features/auth/hooks/use-api';

interface FavoritesContextValue {
  favoriteNormas: Set<number>;
  loading: boolean;
  error: string | null;
  checkFavorites: (normaIds: number[]) => Promise<void>;
  toggleFavorite: (normaId: number) => Promise<void>;
  isFavorite: (normaId: number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [favoriteNormas, setFavoriteNormas] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedNormas, setCheckedNormas] = useState<Set<number>>(new Set());

  // Batch check favorites for multiple normas
  const checkFavorites = useCallback(async (normaIds: number[]) => {
    if (!isAuthenticated || normaIds.length === 0) {
      return;
    }

    // Filter out normas we've already checked
    const uncheckedNormas = normaIds.filter(id => !checkedNormas.has(id));
    if (uncheckedNormas.length === 0) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check each norma individually for now - TODO: implement bulk endpoint
      const checks = await Promise.all(
        uncheckedNormas.map(async (normaId) => {
          try {
            const response = await api.get<{ is_favorite: boolean }>(`/api/favorites/check/${normaId}`);
            return { normaId, isFavorite: response.is_favorite };
          } catch (err) {
            console.error(`Error checking favorite status for norma ${normaId}:`, err);
            return { normaId, isFavorite: false };
          }
        })
      );

      // Update state with results
      setFavoriteNormas(prev => {
        const newFavorites = new Set(prev);
        checks.forEach(({ normaId, isFavorite }) => {
          if (isFavorite) {
            newFavorites.add(normaId);
          } else {
            newFavorites.delete(normaId);
          }
        });
        return newFavorites;
      });

      // Mark these normas as checked
      setCheckedNormas(prev => {
        const newChecked = new Set(prev);
        uncheckedNormas.forEach(id => newChecked.add(id));
        return newChecked;
      });

    } catch (err) {
      console.error('Error checking favorites:', err);
      setError('Error al verificar guardados');
    } finally {
      setLoading(false);
    }
  }, [api, isAuthenticated, checkedNormas]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (normaId: number) => {
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para guardar');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await api.post('/api/favorites/toggle', { norma_id: normaId });
      
      // Update local state immediately for better UX
      setFavoriteNormas(prev => {
        const newFavorites = new Set(prev);
        if (newFavorites.has(normaId)) {
          newFavorites.delete(normaId);
        } else {
          newFavorites.add(normaId);
        }
        return newFavorites;
      });

    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Error al actualizar guardados');
      
      // Refresh the specific norma's status on error
      await checkFavorites([normaId]);
    } finally {
      setLoading(false);
    }
  }, [api, isAuthenticated, checkFavorites]);

  // Check if a norma is favorite
  const isFavorite = useCallback((normaId: number): boolean => {
    return favoriteNormas.has(normaId);
  }, [favoriteNormas]);

  // Clear cache when authentication status changes
  useEffect(() => {
    if (!isAuthenticated) {
      setFavoriteNormas(new Set());
      setCheckedNormas(new Set());
      setError(null);
    }
  }, [isAuthenticated]);

  const value: FavoritesContextValue = {
    favoriteNormas,
    loading,
    error,
    checkFavorites,
    toggleFavorite,
    isFavorite,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider');
  }
  return context;
}
