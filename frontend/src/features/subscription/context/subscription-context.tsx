'use client';

import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { subscriptionApi } from '../api';
import { useApi } from '@/features/auth/hooks/use-api';
import type { SubscriptionStatus, SubscriptionTier } from '../types';

interface UsageDataPoint {
  date: string;
  tokens_used: number;
  messages_sent: number;
  period_type: string;
}

interface UsageHistoryResponse {
  daily_usage: UsageDataPoint[];
  hourly_usage: UsageDataPoint[];
}

interface SubscriptionContextType {
  status: SubscriptionStatus | null;
  tiers: SubscriptionTier[];
  usageHistory: UsageHistoryResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: (force?: boolean) => Promise<void>;
  upgrade: (tierName: string) => Promise<boolean>;
  invalidateCache: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { accessToken } = useAuth();
  const { get } = useApi();
  const [status, setStatus] = React.useState<SubscriptionStatus | null>(null);
  const [tiers, setTiers] = React.useState<SubscriptionTier[]>([]);
  const [usageHistory, setUsageHistory] = React.useState<UsageHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const isLoadingRef = React.useRef(false);
  const lastFetchRef = React.useRef<number>(0);
  const lastTokenRef = React.useRef<string | null>(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  const fetchStatus = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const subscriptionStatus = await subscriptionApi.getStatus(accessToken);
      setStatus(subscriptionStatus);
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription status');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const fetchTiers = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      const availableTiers = await subscriptionApi.getTiers(accessToken);
      setTiers(availableTiers);
    } catch (err) {
      console.error('Failed to fetch subscription tiers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription tiers');
    }
  }, [accessToken]);

  const fetchUsageHistory = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      const response = await get<UsageHistoryResponse>('/api/subscription/usage-history?days=7');
      setUsageHistory(response);
    } catch (err) {
      console.error('Failed to fetch usage history:', err);
      // Don't set error for usage history as it's not critical
    }
  }, [accessToken, get]);

  const refresh = useCallback(async (force: boolean = false) => {
    if (isLoadingRef.current) return; // Prevent multiple simultaneous calls
    
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;
    
    // If not forced and we have data cached within the cache duration, skip refresh
    if (!force && timeSinceLastFetch < CACHE_DURATION) {
      console.log('Using cached subscription data');
      return;
    }
    
    isLoadingRef.current = true;
    lastFetchRef.current = now;
    
    try {
      await Promise.all([fetchStatus(), fetchTiers(), fetchUsageHistory()]);
    } finally {
      isLoadingRef.current = false;
    }
  }, [fetchStatus, fetchTiers, fetchUsageHistory, CACHE_DURATION]);

  const upgrade = useCallback(async (tierName: string): Promise<boolean> => {
    if (!accessToken) return false;
    
    try {
      const response = await subscriptionApi.upgrade({ tier_name: tierName }, accessToken);
      if (response.success) {
        // Force refresh status after successful upgrade (bypass cache)
        lastFetchRef.current = 0; // Reset cache timestamp
        await refresh(true); // Force refresh
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to upgrade subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to upgrade subscription');
      return false;
    }
  }, [accessToken, refresh]);

  const invalidateCache = useCallback(() => {
    lastFetchRef.current = 0;
    console.log('Cache invalidated - next refresh will fetch fresh data');
  }, []);

  React.useEffect(() => {
    // Only run if token value actually changed (not just reference)
    if (accessToken && accessToken !== lastTokenRef.current) {
      lastTokenRef.current = accessToken;
      refresh();
    } else if (!accessToken && lastTokenRef.current !== null) {
      // Token was cleared (logout)
      lastTokenRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]); // Only run when accessToken changes, not when refresh changes

  const value: SubscriptionContextType = useMemo(() => ({
    status,
    tiers,
    usageHistory,
    isLoading,
    error,
    refresh,
    upgrade,
    invalidateCache,
  }), [status, tiers, usageHistory, isLoading, error, refresh, upgrade, invalidateCache]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}
