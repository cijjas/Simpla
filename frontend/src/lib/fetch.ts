/**
 * Centralized API client with automatic authentication handling
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface ApiClientOptions extends RequestInit {
  requireAuth?: boolean;
  accessToken?: string | null;
}

class ApiClient {
  private getAuthHeaders(requireAuth: boolean = true, accessToken?: string | null): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requireAuth) {
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      } else {
        throw new Error('Authentication required but no access token provided');
      }
    }

    return headers;
  }

  async request<T>(
    endpoint: string, 
    options: ApiClientOptions = {}
  ): Promise<T> {
    const { requireAuth = true, accessToken, ...fetchOptions } = options;
    
    try {
      const authHeaders = this.getAuthHeaders(requireAuth, accessToken);
      
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        ...fetchOptions,
        headers: {
          ...authHeaders,
          ...fetchOptions.headers,
        },
        credentials: 'include', // Important for refresh token cookies
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle 401 specifically - this might indicate token expiration
        if (response.status === 401) {
          // Don't throw immediately for 401s, let the calling code handle it
          const error = new Error(errorData.detail || errorData.error || 'Unauthorized');
          (error as any).status = 401;
          throw error;
        }
        
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
  async get<T>(endpoint: string, accessToken?: string | null, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', requireAuth, accessToken });
  }

  async post<T>(endpoint: string, data?: unknown, accessToken?: string | null, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      requireAuth,
      accessToken,
    });
  }

  async put<T>(endpoint: string, data?: unknown, accessToken?: string | null, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      requireAuth,
      accessToken,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, accessToken?: string | null, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      requireAuth,
      accessToken,
    });
  }

  async delete<T>(endpoint: string, accessToken?: string | null, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', requireAuth, accessToken });
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();

// Export the class for testing
export { ApiClient };
