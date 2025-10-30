'use client';

import { useState, useEffect } from 'react';
import { ConversationNormaCard } from './conversation-norma-card';
import { type NormaSummary } from '@/features/normas';
import { useNormasApi } from '@/features/normas/api/use-normas-api';
import { Skeleton } from '@/components/ui/skeleton';

interface ConversationNormasDisplayProps {
  normaIds: number[];
}

export function ConversationNormasDisplay({ normaIds }: ConversationNormasDisplayProps) {
  const [normas, setNormas] = useState<NormaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const normasApi = useNormasApi();

  useEffect(() => {
    const fetchNormas = async () => {
      if (!normaIds || normaIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Use authenticated API to fetch normas in batch
        const response = await normasApi.getNormasBatch(normaIds);
        setNormas(response.normas);
        
        // Log any IDs that were not found
        if (response.not_found_ids.length > 0) {
          console.warn('Some normas were not found:', response.not_found_ids);
        }
      } catch (error) {
        console.error('Error fetching normas:', error);
        setError('Error al cargar las normas');
      } finally {
        setLoading(false);
      }
    };

    fetchNormas();
  }, [normaIds]);

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
