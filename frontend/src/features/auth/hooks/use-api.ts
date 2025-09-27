'use client';

import { useCallback } from 'react';
import { apiClient } from '@/lib/fetch';
import { useAuth } from './use-auth';

export function useApi() {
  const { accessToken } = useAuth();

  const get = useCallback(async <T>(endpoint: string, requireAuth: boolean = true) => {
    return apiClient.get<T>(endpoint, accessToken, requireAuth);
  }, [accessToken]);

  const post = useCallback(async <T>(endpoint: string, data?: unknown, requireAuth: boolean = true) => {
    return apiClient.post<T>(endpoint, data, accessToken, requireAuth);
  }, [accessToken]);

  const put = useCallback(async <T>(endpoint: string, data?: unknown, requireAuth: boolean = true) => {
    return apiClient.put<T>(endpoint, data, accessToken, requireAuth);
  }, [accessToken]);

  const patch = useCallback(async <T>(endpoint: string, data?: unknown, requireAuth: boolean = true) => {
    return apiClient.patch<T>(endpoint, data, accessToken, requireAuth);
  }, [accessToken]);

  const del = useCallback(async <T>(endpoint: string, requireAuth: boolean = true) => {
    return apiClient.delete<T>(endpoint, accessToken, requireAuth);
  }, [accessToken]);

  return {
    get,
    post,
    put,
    patch,
    delete: del,
  };
}
