/**
 * Custom hooks for folder management - Simplified version
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useApi } from '@/features/auth/hooks/use-api';
import { useFoldersContext } from '../context/folders-context';
import { 
  FolderTreeItem, 
  FolderCreate, 
  FolderUpdate, 
  FolderMove, 
  FolderResponse, 
  FolderWithNormasResponse, 
  FolderNormaCreate, 
  FolderNormaUpdate 
} from '../types';

export function useFolders() {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [folders, setFolders] = useState<FolderTreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  const apiRef = useRef(api);
  
  // Update api ref when api changes
  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<FolderTreeItem[]>('/api/folders/');
      setFolders(data);
      hasFetchedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching folders:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const createFolder = useCallback(async (folderData: FolderCreate): Promise<FolderResponse> => {
    const newFolder = await api.post<FolderResponse>('/api/folders/', folderData);
    // Refetch folders after creation
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<FolderTreeItem[]>('/api/folders/');
      setFolders(data);
      hasFetchedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching folders:', err);
    } finally {
      setLoading(false);
    }
    return newFolder;
  }, [api]);

  const updateFolder = useCallback(async (folderId: string, folderData: FolderUpdate): Promise<FolderResponse> => {
    const updatedFolder = await api.put<FolderResponse>(`/api/folders/${folderId}/`, folderData);
    // Refetch folders after update
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<FolderTreeItem[]>('/api/folders/');
      setFolders(data);
      hasFetchedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching folders:', err);
    } finally {
      setLoading(false);
    }
    return updatedFolder;
  }, [api]);

  const moveFolder = useCallback(async (folderId: string, moveData: FolderMove): Promise<FolderResponse> => {
    const movedFolder = await api.patch<FolderResponse>(`/api/folders/${folderId}/move/`, moveData);
    // Refetch folders after move
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<FolderTreeItem[]>('/api/folders/');
      setFolders(data);
      hasFetchedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching folders:', err);
    } finally {
      setLoading(false);
    }
    return movedFolder;
  }, [api]);

  const deleteFolder = useCallback(async (folderId: string): Promise<void> => {
    await api.delete(`/api/folders/${folderId}/`);
    // Refetch folders after deletion
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<FolderTreeItem[]>('/api/folders/');
      setFolders(data);
      hasFetchedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching folders:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (isAuthenticated && !hasFetchedRef.current) {
      hasFetchedRef.current = true; // Set immediately to prevent duplicate calls
      const fetchData = async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await apiRef.current.get<FolderTreeItem[]>('/api/folders/');
          setFolders(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
          console.error('Error fetching folders:', err);
          hasFetchedRef.current = false; // Reset on error to allow retry
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated]);

  return {
    folders,
    loading,
    error,
    fetchFolders,
    createFolder,
    updateFolder,
    moveFolder,
    deleteFolder,
  };
}

export function useFolderNormas(folderId: string | null) {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const { getCachedFolderData, setCachedFolderData } = useFoldersContext();
  const [folderWithNormas, setFolderWithNormas] = useState<FolderWithNormasResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousFolderIdRef = useRef<string | null>(null);
  const hasFetchedRef = useRef<string | null>(null);
  const apiRef = useRef(api);
  
  // Update api ref when api changes
  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const fetchFolderNormas = useCallback(async () => {
    if (!folderId || folderId.trim() === '') {
      // Only clear data when explicitly setting to null/empty
      setFolderWithNormas(null);
      setError(null);
      setLoading(false);
      setIsTransitioning(false);
      previousFolderIdRef.current = null;
      hasFetchedRef.current = null;
      return;
    }

    // Check if we have cached data for this folder
    const cachedData = getCachedFolderData(folderId);
    if (cachedData) {
      setFolderWithNormas(cachedData);
      setError(null);
      setLoading(false);
      setIsTransitioning(false);
      previousFolderIdRef.current = folderId;
      hasFetchedRef.current = folderId;
      return;
    }

    // If we're changing folders, keep previous data during transition
    if (previousFolderIdRef.current && previousFolderIdRef.current !== folderId) {
      setIsTransitioning(true);
    }

    try {
      setLoading(true);
      setError(null);
      const data = await api.get<FolderWithNormasResponse>(`/api/folders/${folderId}/normas/`);
      
      // Cache the data
      setCachedFolderData(folderId, data);
      
      setFolderWithNormas(data);
      previousFolderIdRef.current = folderId;
      hasFetchedRef.current = folderId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching folder normas:', err);
    } finally {
      setLoading(false);
      setIsTransitioning(false);
    }
  }, [api, folderId, getCachedFolderData, setCachedFolderData]);

  const addNormaToFolder = useCallback(async (normaData: FolderNormaCreate) => {
    if (!folderId) throw new Error('Folder ID is required');
    await api.post(`/api/folders/${folderId}/normas/`, normaData);
    // Refetch folder normas after adding
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<FolderWithNormasResponse>(`/api/folders/${folderId}/normas/`);
      
      // Update cache
      setCachedFolderData(folderId, data);
      
      setFolderWithNormas(data);
      hasFetchedRef.current = folderId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching folder normas:', err);
    } finally {
      setLoading(false);
    }
  }, [folderId, api, setCachedFolderData]);

  const updateFolderNorma = useCallback(async (normaId: number, updateData: FolderNormaUpdate) => {
    if (!folderId) throw new Error('Folder ID is required');
    await api.put(`/api/folders/${folderId}/normas/${normaId}/`, updateData);
    // Refetch folder normas after update
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<FolderWithNormasResponse>(`/api/folders/${folderId}/normas/`);
      
      // Update cache
      setCachedFolderData(folderId, data);
      
      setFolderWithNormas(data);
      hasFetchedRef.current = folderId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching folder normas:', err);
    } finally {
      setLoading(false);
    }
  }, [folderId, api, setCachedFolderData]);

  const removeNormaFromFolder = useCallback(async (normaId: number) => {
    if (!folderId) throw new Error('Folder ID is required');
    await api.delete(`/api/folders/${folderId}/normas/${normaId}/`);
    // Refetch folder normas after removal
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<FolderWithNormasResponse>(`/api/folders/${folderId}/normas/`);
      
      // Update cache
      setCachedFolderData(folderId, data);
      
      setFolderWithNormas(data);
      hasFetchedRef.current = folderId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching folder normas:', err);
    } finally {
      setLoading(false);
    }
  }, [folderId, api, setCachedFolderData]);

  useEffect(() => {
    // Handle null/empty folderId
    if (!folderId || folderId.trim() === '') {
      setFolderWithNormas(null);
      setError(null);
      setLoading(false);
      setIsTransitioning(false);
      previousFolderIdRef.current = null;
      hasFetchedRef.current = null;
      return;
    }
    
    // Check if we have cached data for this folder first
    const cachedData = getCachedFolderData(folderId);
    if (cachedData) {
      setFolderWithNormas(cachedData);
      setError(null);
      setLoading(false);
      setIsTransitioning(false);
      previousFolderIdRef.current = folderId;
      hasFetchedRef.current = folderId;
      return;
    }
    
    // Only fetch if we haven't fetched this folder yet
    if (isAuthenticated && hasFetchedRef.current !== folderId) {
      hasFetchedRef.current = folderId; // Set immediately to prevent duplicate calls
      const fetchData = async () => {
        // If we're changing folders, keep previous data during transition
        if (previousFolderIdRef.current && previousFolderIdRef.current !== folderId) {
          setIsTransitioning(true);
        }

        try {
          setLoading(true);
          setError(null);
          const data = await apiRef.current.get<FolderWithNormasResponse>(`/api/folders/${folderId}/normas/`);
          
          // Cache the data
          setCachedFolderData(folderId, data);
          
          setFolderWithNormas(data);
          previousFolderIdRef.current = folderId;
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
          console.error('Error fetching folder normas:', err);
          hasFetchedRef.current = null; // Reset on error to allow retry
        } finally {
          setLoading(false);
          setIsTransitioning(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated, folderId, getCachedFolderData, setCachedFolderData]);

  return {
    folderWithNormas,
    loading,
    error,
    isTransitioning,
    fetchFolderNormas,
    addNormaToFolder,
    updateFolderNorma,
    removeNormaFromFolder,
  };
}
