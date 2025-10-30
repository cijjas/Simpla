'use client';

import { useApi } from '@/features/auth/hooks/use-api';
import type {
  NormaBatchResponse,
  NormaDetail,
  NormaFilterOptions,
  NormaFilters,
  NormaRelacionesResponse,
  NormaSearchResponse,
  NormaStats,
  NormaSummary,
} from './normas-api';

export function useNormasApi() {
  const api = useApi();

  const listNormas = async (filters: NormaFilters = {}): Promise<NormaSearchResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get<NormaSearchResponse>(`/api/normas/?${params.toString()}`);
  };

  const getNorma = async (infolegId: number): Promise<NormaDetail> => {
    return api.get<NormaDetail>(`/api/normas/${infolegId}/`);
  };

  const getNormaSummary = async (infolegId: number): Promise<NormaSummary> => {
    return api.get<NormaSummary>(`/api/normas/${infolegId}/summary/`);
  };

  const getFilterOptions = async (): Promise<NormaFilterOptions> => {
    return api.get<NormaFilterOptions>('/api/normas/filter-options/');
  };

  const getStats = async (): Promise<NormaStats> => {
    return api.get<NormaStats>('/api/normas/stats/');
  };

  const getNormasBatch = async (infolegIds: number[]): Promise<NormaBatchResponse> => {
    return api.post<NormaBatchResponse>('/api/normas/batch/', { infoleg_ids: infolegIds });
  };

  const getNormaRelaciones = async (infolegId: number): Promise<NormaRelacionesResponse> => {
    return api.get<NormaRelacionesResponse>(`/api/normas/${infolegId}/relaciones/`);
  };

  return {
    listNormas,
    getNorma,
    getNormaSummary,
    getFilterOptions,
    getStats,
    getNormasBatch,
    getNormaRelaciones,
  };
}
