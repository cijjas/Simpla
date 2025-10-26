/**
 * API client for newspaper daily digest functionality
 */

import { useApi } from '@/features/auth/hooks/use-api';

export class DailyDigestAPI {
  constructor(private api: ReturnType<typeof useApi>) {}

  /**
   * Get newspaper-style daily digest for a specific date
   */
  async getNewspaperDigest(targetDate?: string): Promise<any> {
    const url = targetDate 
      ? `/api/daily-digest/newspaper/?target_date=${targetDate}`
      : '/api/daily-digest/newspaper/';
    return this.api.get(url, false); // No auth required for reading digest
  }

  /**
   * Generate newspaper-style daily digest (admin function)
   */
  async generateNewspaperDigest(targetDate?: string): Promise<any> {
    const url = targetDate 
      ? `/api/daily-digest/generate-newspaper/?target_date=${targetDate}`
      : '/api/daily-digest/generate-newspaper/';
    return this.api.post(url, {});
  }
}