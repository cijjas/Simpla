'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useFavorites } from '../hooks/use-favorites';
import { FavoritesResults } from './favorites-results';

export function FavoritesPage() {
  const { favorites, loading, error } = useFavorites();
  const [view, setView] = useState<'list' | 'grid'>('grid');

  // Load view preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('favoritesViewPreference');
    if (saved === 'list' || saved === 'grid') {
      setView(saved);
    }
  }, []);

  // Save view preference to localStorage
  const handleViewChange = (newView: 'list' | 'grid') => {
    setView(newView);
    localStorage.setItem('favoritesViewPreference', newView);
  };

  return (
    <div className="p-6 w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
            <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold">Mis Favoritos</h1>
        </div>
        <p className="text-muted-foreground">
          Accedé rápidamente a las normas que marcaste como favoritas
        </p>
      </div>

      {/* Results */}
      <div className="flex-1 min-h-0">
        <FavoritesResults
          favorites={favorites}
          view={view}
          onViewChange={handleViewChange}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
