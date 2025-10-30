'use client';

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/fetch';
import { useAuth } from './use-auth';

export function useApi() {
  const { accessToken } = useAuth();
  const tokenRef = useRef(accessToken);

  // Keep the ref in sync with the current token
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const get = useCallback(async <T>(endpoint: string, requireAuth: boolean = true) => {
    return apiClient.get<T>(endpoint, tokenRef.current, requireAuth);
  }, []);

  const post = useCallback(async <T>(endpoint: string, data?: unknown, requireAuth: boolean = true) => {
    return apiClient.post<T>(endpoint, data, tokenRef.current, requireAuth);
  }, []);

  const put = useCallback(async <T>(endpoint: string, data?: unknown, requireAuth: boolean = true) => {
    return apiClient.put<T>(endpoint, data, tokenRef.current, requireAuth);
  }, []);

  const patch = useCallback(async <T>(endpoint: string, data?: unknown, requireAuth: boolean = true) => {
    return apiClient.patch<T>(endpoint, data, tokenRef.current, requireAuth);
  }, []);

  const del = useCallback(async <T>(endpoint: string, requireAuth: boolean = true) => {
    return apiClient.delete<T>(endpoint, tokenRef.current, requireAuth);
  }, []);

  return useMemo(() => ({
    get,
    post,
    put,
    patch,
    delete: del,
  }), [get, post, put, patch, del]);
}
