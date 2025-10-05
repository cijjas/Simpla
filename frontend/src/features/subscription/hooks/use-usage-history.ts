import { useState, useEffect, useCallback } from 'react';
import { useApi } from '@/features/auth/hooks/use-api';

export interface UsageDataPoint {
  date: string;
  tokens_used: number;
  messages_sent: number;
  period_type: string;
}

export interface UsageHistoryResponse {
  daily_usage: UsageDataPoint[];
  hourly_usage: UsageDataPoint[];
}

export function useUsageHistory(days: number = 7) {
  const { get } = useApi();
  const [data, setData] = useState<UsageHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsageHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await get<UsageHistoryResponse>(`/api/subscription/usage-history?days=${days}`);
      setData(response);
    } catch (err) {
      console.error('Failed to fetch usage history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load usage history');
    } finally {
      setIsLoading(false);
    }
  }, [get, days]);

  useEffect(() => {
    fetchUsageHistory();
  }, [fetchUsageHistory]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchUsageHistory,
  };
}

