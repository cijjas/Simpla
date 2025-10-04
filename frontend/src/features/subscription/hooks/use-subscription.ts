import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { subscriptionApi } from '../api';
import type { SubscriptionStatus, SubscriptionTier } from '../types';

export function useSubscription() {
  const { accessToken } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
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
  };

  const fetchTiers = async () => {
    if (!accessToken) return;
    
    try {
      const availableTiers = await subscriptionApi.getTiers(accessToken);
      setTiers(availableTiers);
    } catch (err) {
      console.error('Failed to fetch subscription tiers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription tiers');
    }
  };

  const upgrade = async (tierName: string): Promise<boolean> => {
    if (!accessToken) return false;
    
    try {
      const response = await subscriptionApi.upgrade({ tier_name: tierName }, accessToken);
      if (response.success) {
        // Refresh status after successful upgrade
        await fetchStatus();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to upgrade subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to upgrade subscription');
      return false;
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchStatus();
      fetchTiers();
    }
  }, [accessToken]);

  return {
    status,
    tiers,
    isLoading,
    error,
    refresh: fetchStatus,
    upgrade,
  };
}

