/**
 * API client for newspaper daily digest functionality
 */

import { useApi } from '@/features/auth/hooks/use-api';

export interface NormaMetadata {
  tipo_norma: string;
  numero: string | null;
}

export interface DigestSection {
  section_type: string;
  content: string;
  norma_ids: number[];
  order: number;
}

export interface NewspaperDigestResponse {
  date: string;
  sections: DigestSection[];
  total_sections: number;
  norma_metadata: Record<number, NormaMetadata>;
}

export class DailyDigestAPI {
  constructor(private api: ReturnType<typeof useApi>) {}

  /**
   * Get newspaper-style daily digest for a specific date
   */
  async getNewspaperDigest(targetDate?: string): Promise<NewspaperDigestResponse> {
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