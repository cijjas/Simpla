/* Hook for making authenticated API calls to the FastAPI backend. */

import { useSession } from 'next-auth/react';
import { useCallback } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

export function useBackendApi() {
  const { data: session } = useSession();

  const apiCall = useCallback(async (
    endpoint: string, 
    options: ApiOptions = {}
  ) => {
    const { requireAuth = true, headers = {}, ...fetchOptions } = options;

    // Prepare headers
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add authorization header if required and available
    if (requireAuth && session?.user?.accessToken) {
      requestHeaders['Authorization'] = `Bearer ${session.user.accessToken}`;
    }

    // Make the request
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...fetchOptions,
      headers: requestHeaders,
      credentials: 'include', // Important for refresh token cookies
    });

    // Handle token refresh if needed
    if (response.status === 401 && requireAuth) {
      // Token might be expired, try to refresh
      try {
        const refreshResponse = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          
          // Retry original request with new token
          requestHeaders['Authorization'] = `Bearer ${refreshData.access_token}`;
          
          return fetch(`${BACKEND_URL}${endpoint}`, {
            ...fetchOptions,
            headers: requestHeaders,
            credentials: 'include',
          });
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }

    return response;
  }, [session]);

  const get = useCallback((endpoint: string, options?: ApiOptions) => {
    return apiCall(endpoint, { ...options, method: 'GET' });
  }, [apiCall]);

  const post = useCallback((endpoint: string, data?: any, options?: ApiOptions) => {
    return apiCall(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }, [apiCall]);

  const put = useCallback((endpoint: string, data?: any, options?: ApiOptions) => {
    return apiCall(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }, [apiCall]);

  const del = useCallback((endpoint: string, options?: ApiOptions) => {
    return apiCall(endpoint, { ...options, method: 'DELETE' });
  }, [apiCall]);

  return {
    apiCall,
    get,
    post,
    put,
    delete: del,
    isAuthenticated: !!session?.user?.accessToken,
  };
}
