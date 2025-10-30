'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { ConversationNormaCard } from './conversation-norma-card';
import { type NormaSummary } from '@/features/normas';
import { useNormasApi } from '@/features/normas/api/use-normas-api';
import { Skeleton } from '@/components/ui/skeleton';

interface ConversationNormasDisplayProps {
  normaIds: number[];
}

// Global cache for batch requests to prevent duplicate fetches
const batchCache = new Map<string, Promise<{ normas: NormaSummary[]; not_found_ids: number[] }>>();
const cachedNormas = new Map<string, NormaSummary[]>();

export function ConversationNormasDisplay({ normaIds }: ConversationNormasDisplayProps) {
  const [normas, setNormas] = useState<NormaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const normasApi = useNormasApi();
  const isMountedRef = useRef(true);

  // Normalize normaIds to a stable string key for caching
  const normalizedIds = useMemo(() => {
    if (!normaIds || normaIds.length === 0) return '';
    // Sort and create a unique key for this set of IDs
    return [...normaIds].sort((a, b) => a - b).join(',');
  }, [normaIds]);

  useEffect(() => {
    // Reset mounted ref on mount
    isMountedRef.current = true;

    const fetchNormas = async () => {
      if (!normalizedIds || normalizedIds.length === 0) {
        if (isMountedRef.current) {
          setLoading(false);
          setNormas([]);
        }
        return;
      }

      // Check if we already have cached results for these IDs
      if (cachedNormas.has(normalizedIds)) {
        if (isMountedRef.current) {
          setNormas(cachedNormas.get(normalizedIds)!);
          setLoading(false);
        }
        return;
      }

      // Check if there's an ongoing request for these IDs
      let requestPromise = batchCache.get(normalizedIds);
      
      if (!requestPromise) {
        // Create new request
        const idsArray = normalizedIds.split(',').map(Number);
        requestPromise = normasApi.getNormasBatch(idsArray).then(response => {
          // Cache the results
          cachedNormas.set(normalizedIds, response.normas);
          // Clean up the promise cache
          batchCache.delete(normalizedIds);
          return response;
        }).catch(err => {
          // Clean up on error
          batchCache.delete(normalizedIds);
          throw err;
        });
        
        batchCache.set(normalizedIds, requestPromise);
      }

      try {
        if (isMountedRef.current) {
          setLoading(true);
          setError(null);
        }

        const response = await requestPromise;

        if (!isMountedRef.current) return;

        setNormas(response.normas);
        
        // Log any IDs that were not found
        if (response.not_found_ids.length > 0) {
          console.warn('Some normas were not found:', response.not_found_ids);
        }
      } catch (error) {
        if (!isMountedRef.current) return;
        console.error('Error fetching normas:', error);
        setError('Error al cargar las normas');
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchNormas();

    return () => {
      isMountedRef.current = false;
    };
  }, [normalizedIds, normasApi]);

  if (!normaIds || normaIds.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className='mt-4'>
        <div className='text-sm font-medium text-muted-foreground mb-3'>
          Normas relevantes:
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
          {normaIds.map((id) => (
            <Skeleton key={id} className='h-32 rounded-lg' />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='mt-4'>
        <div className='text-sm font-medium text-muted-foreground mb-3'>
          Normas relevantes:
        </div>
        <div className='text-sm text-red-500'>
          {error}
        </div>
      </div>
    );
  }

  if (normas.length === 0) {
    return null;
  }

  return (
    <div className='mt-4'>
      <div className='text-sm font-medium text-muted-foreground mb-3'>
        Normas relevantes:
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
        {normas.map((norma) => (
          <ConversationNormaCard key={norma.id} norma={norma} />
        ))}
      </div>
    </div>
  );
}
