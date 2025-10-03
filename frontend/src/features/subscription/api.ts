import { apiClient } from '@/lib/fetch';
import type { SubscriptionStatus, SubscriptionTier, UpgradeRequest, UpgradeResponse } from './types';

export const subscriptionApi = {
  /**
   * Get current user's subscription status and usage
   */
  async getStatus(accessToken: string): Promise<SubscriptionStatus> {
    return apiClient.get<SubscriptionStatus>('/api/subscription/status', accessToken);
  },

  /**
   * Get all available subscription tiers
   */
  async getTiers(accessToken: string): Promise<SubscriptionTier[]> {
    return apiClient.get<SubscriptionTier[]>('/api/subscription/tiers', accessToken);
  },

  /**
   * Upgrade user to a new subscription tier
   */
  async upgrade(request: UpgradeRequest, accessToken: string): Promise<UpgradeResponse> {
    return apiClient.post<UpgradeResponse>('/api/subscription/upgrade', request, accessToken);
  },
};

