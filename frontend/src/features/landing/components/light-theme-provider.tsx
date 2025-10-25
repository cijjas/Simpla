'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface LightThemeContextType {
  theme: 'light';
  setTheme: (theme: 'light') => void;
  resolvedTheme: 'light';
  systemTheme: 'light' | 'dark';
}

const LightThemeContext = createContext<LightThemeContextType | undefined>(undefined);

export function LightThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Force light mode by adding the class to the document
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);

  const contextValue: LightThemeContextType = {
    theme: 'light',
    setTheme: () => {}, // No-op since we always want light mode
    resolvedTheme: 'light',
    systemTheme: 'light',
  };

  if (!mounted) {
    return <div className="light">{children}</div>;
  }

  return (
    <LightThemeContext.Provider value={contextValue}>
      <div className="light">
        {children}
      </div>
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
