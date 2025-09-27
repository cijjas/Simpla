/**
 * Centralized API client with automatic authentication handling
 */

import { getSession } from 'next-auth/react';
import type { Session } from 'next-auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface ApiClientOptions extends RequestInit {
  requireAuth?: boolean;
}

class ApiClient {
  private sessionCache: (Session & { user: { accessToken?: string } }) | null = null;
  private sessionCacheTime: number = 0;
  private readonly SESSION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private async getAuthHeaders(requireAuth: boolean = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requireAuth) {
      try {
        const session = await this.getCachedSession();
        if (session?.user?.accessToken) {
          headers['Authorization'] = `Bearer ${session.user.accessToken}`;
        } else {
          throw new Error('No access token available');
        }
      } catch (error) {
        console.error('Failed to get session:', error);
        throw new Error('Authentication required but not available');
      }
    }

    return headers;
  }

  private async getCachedSession(): Promise<(Session & { user: { accessToken?: string } }) | null> {
    const now = Date.now();
    
    // Return cached session if it's still valid
    if (this.sessionCache && (now - this.sessionCacheTime) < this.SESSION_CACHE_DURATION) {
      return this.sessionCache;
    }

    // Fetch fresh session
    try {
      const session = await getSession() as Session & { user: { accessToken?: string } };
      this.sessionCache = session;
      this.sessionCacheTime = now;
      return session;
    } catch (error) {
      console.error('Failed to fetch session:', error);
      this.sessionCache = null;
      this.sessionCacheTime = 0;
      return null;
    }
  }

  // Method to clear session cache (useful for logout)
  public clearSessionCache(): void {
    this.sessionCache = null;
    this.sessionCacheTime = 0;
  }

  async request<T>(
    endpoint: string, 
    options: ApiClientOptions = {}
  ): Promise<T> {
    const { requireAuth = true, ...fetchOptions } = options;
    
    try {
      const authHeaders = await this.getAuthHeaders(requireAuth);
      
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        ...fetchOptions,
        headers: {
          ...authHeaders,
          ...fetchOptions.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Handle empty responses
      const text = await response.text();
      if (!text) {
        return {} as T;
      }

      return JSON.parse(text);
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', requireAuth });
  }

  async post<T>(endpoint: string, data?: unknown, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      requireAuth,
    });
  }

  async put<T>(endpoint: string, data?: unknown, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      requireAuth,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      requireAuth,
    });
  }

  async delete<T>(endpoint: string, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', requireAuth });
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();

// Export the class for testing
export { ApiClient };
