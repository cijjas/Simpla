'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useApi } from '@/features/auth/hooks/use-api';
import { getNormaDetalladaResumen } from '@/features/infoleg/utils/api';
import type { NormaItem } from '@/features/infoleg/utils/types';

interface FavoriteResponse {
  id: string;
  user_id: string;
  norma_id: number;
  added_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at?: string;
}

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [favorites, setFavorites] = useState<NormaItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated || fetchingRef.current) {
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      console.log('Fetching favorites from API...');
      const data = await api.get<FavoriteResponse[]>('/api/favorites/');
      console.log('Favorites API response:', data);
      
      const normaIds = data.map(favorite => favorite.norma_id);
      setFavoriteIds(normaIds);
      
      // Now fetch the actual norma data for each ID using the infoleg API
      if (normaIds.length > 0) {
        console.log('Fetching norma data for IDs:', normaIds);
        
        const normaPromises = normaIds.map(async (normaId) => {
          try {
            const normaData = await getNormaDetalladaResumen(normaId);
            return normaData;
          } catch (error) {
            console.error(`Error fetching norma ${normaId}:`, error);
            return null; // Skip failed normas
          }
        });
        
        const normaResults = await Promise.all(normaPromises);
        // Filter out null results (failed fetches)
        const validNormas = normaResults.filter((norma): norma is NormaItem => norma !== null);
        
        console.log('Fetched normas:', validNormas);
        setFavorites(validNormas);
      } else {
        setFavorites([]);
      }
    } catch (err: any) {
      console.error('Favorites API error:', err);
      console.error('Error status:', err.status);
      console.error('Error message:', err.message);
      
      setError('Error al cargar los favoritos');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [api, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    } else {
      // Clear favorites when not authenticated
      setFavorites([]);
      setFavoriteIds([]);
      setLoading(false);
    }
  }, [fetchFavorites, isAuthenticated]);

  const addToFavorites = useCallback(async (norma: NormaItem) => {
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para agregar favoritos');
      return;
    }

    try {
      setError(null);
      await api.post('/api/favorites/toggle', { norma_id: norma.id });
      // Refresh favorites list
      await fetchFavorites();
    } catch (err) {
      setError('Error al agregar a favoritos');
      console.error('Error adding to favorites:', err);
    }
  }, [api, isAuthenticated, fetchFavorites]);

  const removeFromFavorites = useCallback(async (normaId: number) => {
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para quitar favoritos');
      return;
    }

    try {
      setError(null);
      await api.post('/api/favorites/toggle', { norma_id: normaId });
      // Refresh favorites list
      await fetchFavorites();
    } catch (err) {
      setError('Error al quitar de favoritos');
      console.error('Error removing from favorites:', err);
    }
  }, [api, isAuthenticated, fetchFavorites]);

  const isFavorite = useCallback((normaId: number) => {
    return favoriteIds.includes(normaId);
  }, [favoriteIds]);

  return {
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    isFavorite
  };
}
