'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeVariant = 'slate' | 'nano';

interface ThemeContextType {
  themeVariant: ThemeVariant;
  setThemeVariant: (variant: ThemeVariant) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeVariant, setThemeVariantState] = useState<ThemeVariant>('slate');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-variant') as ThemeVariant;
    if (savedTheme && ['slate', 'nano'].includes(savedTheme)) {
      setThemeVariantState(savedTheme);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const html = document.documentElement;
    
    // Remove existing theme classes
    html.classList.remove('slate', 'nano');
    
    // Add the current theme class
    html.classList.add(themeVariant);
    
    // Save to localStorage
    localStorage.setItem('theme-variant', themeVariant);
  }, [themeVariant]);

  const setThemeVariant = (variant: ThemeVariant) => {
    setThemeVariantState(variant);
  };

  return (
    <ThemeContext.Provider value={{ themeVariant, setThemeVariant }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeVariant() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeVariant must be used within a ThemeProvider');
  }
  return context;
}

