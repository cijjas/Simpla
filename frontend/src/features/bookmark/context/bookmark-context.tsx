'use client';

/**
 * Bookmarks Context and Provider
 * Manages bookmark states efficiently with bulk loading and caching
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useApi } from '@/features/auth/hooks/use-api';

interface BookmarksContextValue {
  bookmarkedNormas: Set<number>;
  loading: boolean;
  error: string | null;
  checkBookmarks: (normaIds: number[]) => Promise<void>;
  toggleBookmark: (normaId: number) => Promise<void>;
  isBookmarked: (normaId: number) => boolean;
}

const BookmarksContext = createContext<BookmarksContextValue | undefined>(undefined);

interface BookmarksProviderProps {
  children: ReactNode;
}

export function BookmarksProvider({ children }: BookmarksProviderProps) {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [bookmarkedNormas, setBookmarkedNormas] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedNormas, setCheckedNormas] = useState<Set<number>>(new Set());
  const [pendingChecks, setPendingChecks] = useState<Set<number>>(new Set());

  // Batch check bookmarks for multiple normas
  const checkBookmarks = useCallback(async (normaIds: number[]) => {
    if (!isAuthenticated || normaIds.length === 0) {
      return;
    }

    // Filter out normas we've already checked or are currently being checked
    const uncheckedNormas = normaIds.filter(id => !checkedNormas.has(id) && !pendingChecks.has(id));
    if (uncheckedNormas.length === 0) {
      return;
    }

    // Mark these normas as pending
    setPendingChecks(prev => {
      const newPending = new Set(prev);
      uncheckedNormas.forEach(id => newPending.add(id));
      return newPending;
    });

    try {
      setLoading(true);
      setError(null);

      // Use batch endpoint - single API call for all normas
      const response = await api.post<{ bookmarked_ids: number[] }>(
        '/api/bookmarks/check-batch',
        { norma_ids: uncheckedNormas }
      );

      console.log('[BookmarksContext] Batch check response:', response);
      console.log('[BookmarksContext] Requested IDs:', uncheckedNormas);

      // Update state with results
      setBookmarkedNormas(prev => {
        const newBookmarks = new Set(prev);
        const prevSize = newBookmarks.size;
        // Add all bookmarked normas from response
        response.bookmarked_ids.forEach(id => newBookmarks.add(id));
        // Remove any unchecked normas that weren't in the response
        uncheckedNormas.forEach(id => {
          if (!response.bookmarked_ids.includes(id)) {
            newBookmarks.delete(id);
          }
        });
        console.log('[BookmarksContext] Updated bookmarks from', prevSize, 'to', newBookmarks.size);
        console.log('[BookmarksContext] Bookmarked IDs:', Array.from(newBookmarks));
        return newBookmarks;
      });

      // Mark these normas as checked and remove from pending
      setCheckedNormas(prev => {
        const newChecked = new Set(prev);
        uncheckedNormas.forEach(id => newChecked.add(id));
        return newChecked;
      });
      
      // Remove from pending checks
      setPendingChecks(prev => {
        const newPending = new Set(prev);
        uncheckedNormas.forEach(id => newPending.delete(id));
        return newPending;
      });

    } catch (err) {
      console.error('Error checking bookmarks:', err);
      setError('Error al verificar guardados');
      
      // Remove from pending checks on error
      setPendingChecks(prev => {
        const newPending = new Set(prev);
        uncheckedNormas.forEach(id => newPending.delete(id));
        return newPending;
      });
    } finally {
      setLoading(false);
    }
  }, [api, isAuthenticated, checkedNormas, pendingChecks]);

  // Toggle bookmark status
  const toggleBookmark = useCallback(async (normaId: number) => {
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para guardar');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await api.post('/api/bookmarks/toggle', { norma_id: normaId });
      
      // Update local state immediately for better UX
      setBookmarkedNormas(prev => {
        const newBookmarks = new Set(prev);
        if (newBookmarks.has(normaId)) {
          newBookmarks.delete(normaId);
        } else {
          newBookmarks.add(normaId);
        }
        return newBookmarks;
      });

    } catch (err) {
      console.error('Error toggling bookmark:', err);
      setError('Error al actualizar guardados');
      
      // Refresh the specific norma's status on error
      await checkBookmarks([normaId]);
    } finally {
      setLoading(false);
    }
  }, [api, isAuthenticated, checkBookmarks]);

  // Check if a norma is bookmarked
  const isBookmarked = useCallback((normaId: number): boolean => {
    return bookmarkedNormas.has(normaId);
  }, [bookmarkedNormas]);

  // Clear cache when authentication status changes
  useEffect(() => {
    if (!isAuthenticated) {
      setBookmarkedNormas(new Set());
      setCheckedNormas(new Set());
      setPendingChecks(new Set());
      setError(null);
    }
  }, [isAuthenticated]);

  const value: BookmarksContextValue = {
    bookmarkedNormas,
    loading,
    error,
    checkBookmarks,
    toggleBookmark,
    isBookmarked,
  };

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarksContext(): BookmarksContextValue {
  const context = useContext(BookmarksContext);
  if (context === undefined) {
    throw new Error('useBookmarksContext must be used within a BookmarksProvider');
  }
  return context;
}
