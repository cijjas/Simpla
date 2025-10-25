'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNormas } from '../contexts/normas-context';
import { NormaDetail } from '../api/normas-api';

export interface UseNormaDetailState {
  norma: NormaDetail | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useNormaDetail(infolegId: number): UseNormaDetailState {
  const { getNorma } = useNormas();
  const [norma, setNorma] = useState<NormaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadNormaDetail = useCallback(async (id: number) => {
    // Prevent duplicate calls
    if (loadingRef.current) {
      return;
    }
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      // Get the norma (cached or fresh)
      const normaDetail = await getNorma(id);
      
      // Validate the response
      if (!normaDetail || typeof normaDetail !== 'object') {
        throw new Error('Respuesta inválida del servidor');
      }
      
      if (!normaDetail.id) {
        throw new Error('Norma no encontrada');
      }
      
      setNorma(normaDetail);
    } catch (err) {
      console.error('Error loading norma detail:', err);
      
      let errorMessage = 'Error al cargar la norma';
      if (err instanceof Error) {
        if (err.message.includes('fetch')) {
          errorMessage = 'Error de conexión. Verifique su conexión a internet.';
        } else if (err.message.includes('404')) {
          errorMessage = 'Norma no encontrada';
        } else if (err.message.includes('500')) {
          errorMessage = 'Error interno del servidor. Intente más tarde.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [getNorma]);

  const retry = useCallback(() => {
    loadNormaDetail(infolegId);
  }, [loadNormaDetail, infolegId]);

  useEffect(() => {
    loadNormaDetail(infolegId);
  }, [loadNormaDetail, infolegId]);

  return {
    norma,
    loading,
    error,
    retry,
  };
}
