'use client';

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/fetch';
import { useAuth } from './use-auth';

export function useApi() {
  const { accessToken, refreshToken } = useAuth();
  const tokenRef = useRef(accessToken);
  const isRefreshingRef = useRef(false);

  // Keep the ref in sync with the current token
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  // Helper function to retry request with token refresh on 401
  const retryWithRefresh = useCallback(async <T>(
    requestFn: (token: string | null) => Promise<T>
  ): Promise<T> => {
    try {
      return await requestFn(tokenRef.current);
    } catch (error: unknown) {
      // Check if it's a 401 error
      const err = error as Error & { status?: number };
      if (err.status === 401 && !isRefreshingRef.current) {
        // Attempt to refresh token and retry once
        isRefreshingRef.current = true;
        try {
          const refreshed = await refreshToken();
          if (refreshed) {
            // After successful refresh, get the new token from localStorage
            // since saveAuthState stores it there immediately
            let newToken: string | null = null;
            try {
              newToken = localStorage.getItem('access_token');
            } catch {
              // localStorage might not be available
            }
            
            // Fallback: wait a tick for React state update
            if (!newToken) {
              await new Promise(resolve => setTimeout(resolve, 50));
              newToken = tokenRef.current;
            }
            
            // Retry with the new token
            const result = await requestFn(newToken);
            isRefreshingRef.current = false;
            return result;
          } else {
            // Refresh failed - rethrow original error
            isRefreshingRef.current = false;
            throw error;
          }
        } catch (refreshError) {
          isRefreshingRef.current = false;
          throw error;
        }
      }
      // Not a 401 or already refreshing, just rethrow
      throw error;
    }
  }, [refreshToken]);

  const get = useCallback(async <T>(endpoint: string, requireAuth: boolean = true) => {
    return retryWithRefresh(async (token) => {
      return apiClient.get<T>(endpoint, token, requireAuth);
    });
  }, [retryWithRefresh]);

  const post = useCallback(async <T>(endpoint: string, data?: unknown, requireAuth: boolean = true) => {
    return retryWithRefresh(async (token) => {
      return apiClient.post<T>(endpoint, data, token, requireAuth);
    });
  }, [retryWithRefresh]);

  const put = useCallback(async <T>(endpoint: string, data?: unknown, requireAuth: boolean = true) => {
    return retryWithRefresh(async (token) => {
      return apiClient.put<T>(endpoint, data, token, requireAuth);
    });
  }, [retryWithRefresh]);

  const patch = useCallback(async <T>(endpoint: string, data?: unknown, requireAuth: boolean = true) => {
    return retryWithRefresh(async (token) => {
      return apiClient.patch<T>(endpoint, data, token, requireAuth);
    });
  }, [retryWithRefresh]);

  const del = useCallback(async <T>(endpoint: string, requireAuth: boolean = true) => {
    return retryWithRefresh(async (token) => {
      return apiClient.delete<T>(endpoint, token, requireAuth);
    });
  }, [retryWithRefresh]);

  return useMemo(() => ({
    get,
    post,
    put,
    patch,
    delete: del,
  }), [get, post, put, patch, del]);
}
