'use client';

import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { useBookmarks } from '../hooks/use-bookmarks';
import { BookmarkResults } from './bookmark-results';

export function BookmarkPage() {
  const { bookmarks, loading, error } = useBookmarks();
  const [view, setView] = useState<'list' | 'grid'>('grid');

  // Load view preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bookmarkViewPreference');
    if (saved === 'list' || saved === 'grid') {
      setView(saved);
    }
  }, []);

  // Save view preference to localStorage
  const handleViewChange = (newView: 'list' | 'grid') => {
    setView(newView);
    localStorage.setItem('bookmarkViewPreference', newView);
  };

  return (
    <div className='p-6 w-full h-full flex flex-col'>
      {/* Header */}
      <div className='mb-6'>
        <div className='flex items-center gap-3 mb-2'>
          <div className='p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20'>
            <Bookmark className='h-6 w-6 text-yellow-600 dark:text-yellow-400' />
          </div>
          <h1 className='text-2xl font-bold'>Mis Guardados</h1>
        </div>
        <p className='text-muted-foreground'>
          Accedé rápidamente a las normas que guardaste
        </p>
      </div>

      {/* Results */}
      <div className='flex-1 min-h-0'>
        <BookmarkResults
          bookmarks={bookmarks}
          view={view}
          onViewChange={handleViewChange}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
