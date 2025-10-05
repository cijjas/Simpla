import { useState, useEffect, useCallback } from 'react';
import { useApi } from '@/features/auth/hooks/use-api';

export interface UsageEvent {
  id: string;
  date: string;
  model: string;
  kind: 'Included' | 'Errored' | 'On-Demand';
  tokens: number;
  cost: number;
  status: 'success' | 'error' | 'pending';
}

export function useUsageEvents(days: number = 7) {
  const { get } = useApi();
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsageEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await get<{events: UsageEvent[], total_tokens: number, total_cost: number, total_events: number}>(`/api/subscription/usage-events?days=${days}`);
      setEvents(response.events);
    } catch (err) {
      console.error('Failed to fetch usage events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load usage events');
    } finally {
      setIsLoading(false);
    }
  }, [get, days]);

  useEffect(() => {
    fetchUsageEvents();
  }, [days, fetchUsageEvents]);

  return {
    events,
    isLoading,
    error,
    refetch: fetchUsageEvents,
  };
}
