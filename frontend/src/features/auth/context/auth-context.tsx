'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface User {
  id: string;
  email: string;
  name?: string;
  provider: string;
  email_verified: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (idToken: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
    isAuthenticated: false,
  });
  
  // Flag to prevent refresh attempts during logout
  const isLoggingOutRef = useRef(false);
  
  // Flag to prevent multiple simultaneous refresh attempts
  const isRefreshingRef = useRef(false);
  
  // Utility function to check if we have a valid refresh token cookie
  const hasValidRefreshToken = useCallback((): boolean => {
    if (typeof document === 'undefined') return false; // SSR safety
    const refreshTokenMatch = document.cookie.match(/refresh_token=([^;]+)/);
    return !!(refreshTokenMatch && refreshTokenMatch[1] && refreshTokenMatch[1].trim() !== '');
  }, []);

  // Utility functions for localStorage persistence
  const saveAuthState = useCallback((accessToken: string, user: User) => {
    try {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('user_data', JSON.stringify(user));
    } catch (error) {
      console.warn('Failed to save auth state to localStorage:', error);
    }
  }, []);

  const restoreAuthState = useCallback((): { accessToken: string | null; user: User | null } => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user_data');
      const user = userData ? JSON.parse(userData) : null;
      
      // Basic validation - if we have both token and user, consider it valid
      // The backend will validate the actual token when we make requests
      if (accessToken && user && user.id && user.email) {
        return { accessToken, user };
      }
      
      return { accessToken: null, user: null };
    } catch (error) {
      console.warn('Failed to restore auth state from localStorage:', error);
      return { accessToken: null, user: null };
    }
  }, []);

  const clearAuth = useCallback(() => {
    setAuthState({
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,
    });
    // Clear any stored tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      // Don't attempt refresh if we're in the middle of logging out
      if (isLoggingOutRef.current) {
        console.log('Skipping refresh token attempt - logout in progress');
        return false;
      }
      
      // Don't attempt refresh if we're already refreshing
      if (isRefreshingRef.current) {
        console.log('Skipping refresh token attempt - already refreshing');
        return false;
      }
      
      // Set refreshing flag
      isRefreshingRef.current = true;
      
      console.log('Attempting to refresh token...');
      
      // Check if backend URL is available
      if (!BACKEND_URL) {
        console.error('Backend URL not configured');
        setAuthState(prev => ({ ...prev, isLoading: false }));
        isRefreshingRef.current = false;
        return false;
      }
      
      // Note: We don't check for refresh token cookie here because the backend
      // will handle token validation and rotation. The cookie check can cause
      // race conditions with token rotation.

      const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Refresh token response:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('Token refresh successful, updating auth state');
        const newAuthState = {
          accessToken: data.access_token,
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
        };
        setAuthState(prev => ({ ...prev, ...newAuthState }));
        // Save to localStorage for persistence
        saveAuthState(data.access_token, data.user);
        isRefreshingRef.current = false;
        return true;
      } else if (response.status === 401) {
        // No refresh token or invalid token - user needs to login
        console.log('No valid refresh token, user needs to login');
        clearAuth();
        isRefreshingRef.current = false;
        return false;
      } else {
        console.error('Token refresh failed with status:', response.status);
        // Try to get error details
        try {
          const errorData = await response.json();
          console.error('Refresh error details:', errorData);
        } catch {
          console.error('Could not parse error response');
        }
        clearAuth();
        isRefreshingRef.current = false;
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed with error:', error);
      // For network errors, don't clear auth state immediately
      // Just set loading to false and return false
      setAuthState(prev => ({ ...prev, isLoading: false }));
      isRefreshingRef.current = false;
      return false;
    }
  }, [clearAuth, saveAuthState]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const newAuthState = {
          user: data.user,
          accessToken: data.access_token,
          isLoading: false,
          isAuthenticated: true,
        };
        setAuthState(newAuthState);
        // Save to localStorage for persistence
        saveAuthState(data.access_token, data.user);
        return { success: true };
      } else {
        const errorData = await response.json();
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: errorData.detail || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Network error' };
    }
  }, [saveAuthState]);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await fetch(`${BACKEND_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_token: idToken }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const newAuthState = {
          user: data.user,
          accessToken: data.access_token,
          isLoading: false,
          isAuthenticated: true,
        };
        setAuthState(newAuthState);
        // Save to localStorage for persistence
        saveAuthState(data.access_token, data.user);
        return { success: true };
      } else {
        const errorData = await response.json();
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: errorData.detail || 'Google login failed' };
      }
    } catch (error) {
      console.error('Google login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Network error' };
    }
  }, [saveAuthState]);

  const logout = useCallback(async () => {
    try {
      // Set logout flag to prevent refresh attempts
      isLoggingOutRef.current = true;
      
      // Call backend logout to revoke refresh token
      if (authState.accessToken && BACKEND_URL) {
        await fetch(`${BACKEND_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authState.accessToken}`,
          },
          credentials: 'include',
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear auth state, even if backend call fails
      clearAuth();
      
      // Manually clear the refresh token cookie as a fallback
      if (typeof document !== 'undefined') {
        document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
      
      // Reset logout flag after a short delay
      setTimeout(() => {
        isLoggingOutRef.current = false;
      }, 1000);
    }
  }, [authState.accessToken, clearAuth]);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth with backend URL:', BACKEND_URL);
        
        // First, try to restore from localStorage for immediate UI feedback
        const { accessToken, user } = restoreAuthState();
        if (accessToken && user) {
          console.log('Found stored auth state, restoring immediately');
          setAuthState({
            user,
            accessToken,
            isLoading: true, // Still loading while we verify with backend
            isAuthenticated: true,
          });
        }
        
        // Check if we have any stored auth state first
        // Note: We'll attempt refresh even without a visible cookie, as the backend
        // will handle validation and the cookie might be httpOnly
        
        // Only attempt refresh if we're not already logging out
        if (!isLoggingOutRef.current) {
          console.log('Attempting to restore session...');
          
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise<boolean>((_, reject) => {
            setTimeout(() => reject(new Error('Auth initialization timeout')), 10000); // 10 second timeout
          });
          
          try {
            const success = await Promise.race([refreshToken(), timeoutPromise]);
            if (!success) {
              // No valid refresh token - user needs to login
              console.log('Auth initialization complete - user needs to login');
              setAuthState(prev => ({ ...prev, isLoading: false }));
            } else {
              console.log('Session restored successfully');
            }
          } catch (timeoutError) {
            console.error('Auth initialization timeout:', timeoutError);
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        } else {
          console.log('Skipping auth initialization - logout in progress');
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, [refreshToken, hasValidRefreshToken, restoreAuthState]);

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (!authState.accessToken || !authState.isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      // Only refresh if we're still authenticated and not logging out
      if (authState.isAuthenticated && !isLoggingOutRef.current) {
        const success = await refreshToken();
        if (!success) {
          clearInterval(refreshInterval);
        }
      } else {
        clearInterval(refreshInterval);
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes (tokens expire in 15)

    return () => clearInterval(refreshInterval);
  }, [authState.accessToken, authState.isAuthenticated, refreshToken]);

  const value: AuthContextType = {
    ...authState,
    login,
    loginWithGoogle,
    logout,
    refreshToken,
    clearAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
