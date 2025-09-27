'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

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

  const clearAuth = useCallback(() => {
    setAuthState({
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAuthState(prev => ({
          ...prev,
          accessToken: data.access_token,
          user: data.user,
          isAuthenticated: true,
        }));
        return true;
      } else {
        clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuth();
      return false;
    }
  }, [clearAuth]);

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
        setAuthState({
          user: data.user,
          accessToken: data.access_token,
          isLoading: false,
          isAuthenticated: true,
        });
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
  }, []);

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
        setAuthState({
          user: data.user,
          accessToken: data.access_token,
          isLoading: false,
          isAuthenticated: true,
        });
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
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call backend logout to revoke refresh token
      if (authState.accessToken) {
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
      clearAuth();
    }
  }, [authState.accessToken, clearAuth]);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const success = await refreshToken();
        if (!success) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, [refreshToken]);

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (!authState.accessToken) return;

    const refreshInterval = setInterval(async () => {
      const success = await refreshToken();
      if (!success) {
        clearInterval(refreshInterval);
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes (tokens expire in 15)

    return () => clearInterval(refreshInterval);
  }, [authState.accessToken, refreshToken]);

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
