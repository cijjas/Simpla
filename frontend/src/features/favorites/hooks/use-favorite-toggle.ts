import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useApi } from '@/features/auth/hooks/use-api';

interface UseFavoriteToggleResult {
  isFavorite: boolean;
  loading: boolean;
  error: string | null;
  toggleFavorite: () => Promise<void>;
}

export function useFavoriteToggle(normaId: number): UseFavoriteToggleResult {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if norma is favorited
  const checkFavoriteStatus = useCallback(async () => {
    if (!isAuthenticated || !normaId) {
      setIsFavorite(false);
      return;
    }

    try {
      setError(null);
      const response = await api.get<{ is_favorite: boolean }>(`/api/favorites/check/${normaId}`);
      setIsFavorite(response.is_favorite);
    } catch (err) {
      console.error('Error checking favorite status:', err);
      setError('Error al verificar favoritos');
      setIsFavorite(false);
    }
  }, [api, isAuthenticated, normaId]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para agregar favoritos');
      return;
    }

    if (loading) return; // Prevent multiple simultaneous requests

    try {
      setLoading(true);
      setError(null);

      await api.post('/api/favorites/toggle', { norma_id: normaId });
      
      // Update local state immediately for better UX
      setIsFavorite(prev => !prev);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Error al actualizar favoritos');
      // Revert optimistic update on error
      await checkFavoriteStatus();
    } finally {
      setLoading(false);
    }
  }, [api, isAuthenticated, normaId, loading, checkFavoriteStatus]);

  // Check favorite status on mount and when normaId/auth changes
  useEffect(() => {
    checkFavoriteStatus();
  }, [checkFavoriteStatus]);

  return {
    isFavorite,
    loading,
    error,
    toggleFavorite
  };
}
