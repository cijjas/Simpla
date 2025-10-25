'use client';

import { createContext, useContext, useEffect } from 'react';

interface LightThemeContextType {
  theme: 'light';
  setTheme: (theme: 'light') => void;
  resolvedTheme: 'light';
  systemTheme: 'light' | 'dark';
}

const LightThemeContext = createContext<LightThemeContextType | undefined>(undefined);

/**
 * LightThemeProvider - Forces light mode on public pages
 * 
 * This provider:
 * - Ignores all theme detection (localStorage, system preference)
 * - Forces light mode statically without any conditional logic
 * - Ensures no flash of dark content on page load
 * - Completely bypasses the theme system used in authenticated routes
 */
export function LightThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Force light mode on mount and ensure it stays that way
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
    
    // Clear any theme stored by next-themes to prevent conflicts
    // This ensures when user logs out from dark mode, they see light mode
    if (typeof window !== 'undefined') {
      // Remove the theme key used by next-themes
      localStorage.removeItem('theme');
    }
  }, []);

  const contextValue: LightThemeContextType = {
    theme: 'light',
    setTheme: () => {}, // No-op since we always want light mode
    resolvedTheme: 'light',
    systemTheme: 'light',
  };

  return (
    <LightThemeContext.Provider value={contextValue}>
      {children}
    </LightThemeContext.Provider>
  );
}

export function useLightTheme() {
  const context = useContext(LightThemeContext);
  if (context === undefined) {
    throw new Error('useLightTheme must be used within a LightThemeProvider');
  }
  return context;
}
