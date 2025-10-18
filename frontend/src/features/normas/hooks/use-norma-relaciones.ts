'use client';

import { useState, useEffect, useRef } from 'react';
import { normasAPI, NormaRelacionesResponse } from '../api/normas-api';

export interface UseNormaRelacionesState {
  data: NormaRelacionesResponse | null;
  loading: boolean;
  error: string | null;
}

// Global cache to prevent duplicate requests
const cache = new Map<number, Promise<NormaRelacionesResponse>>();

export function useNormaRelaciones(infolegId: number): UseNormaRelacionesState {
  const [data, setData] = useState<NormaRelacionesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchRelaciones() {
      if (!infolegId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Check if we already have a request in progress for this infolegId
        let requestPromise = cache.get(infolegId);
        
        if (!requestPromise) {
          console.log('Creating new request for infolegId:', infolegId);
          requestPromise = normasAPI.getNormaRelaciones(infolegId);
          cache.set(infolegId, requestPromise);
        } else {
          console.log('Reusing existing request for infolegId:', infolegId);
        }

        const response = await requestPromise;
        
        if (isMounted) {
          setData(response);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching norma relaciones:', err);
          setError(err instanceof Error ? err.message : 'Error al cargar relaciones');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
        // Clean up cache after request completes
        cache.delete(infolegId);
      }
    }

    fetchRelaciones();

    return () => {
      isMounted = false;
    };
  }, [infolegId]);

  return { data, loading, error };
}

