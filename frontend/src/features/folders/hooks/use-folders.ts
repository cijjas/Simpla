/**
 * Custom hooks for folder management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useApi } from '@/features/auth/hooks/use-api';
import { FolderTreeItem, FolderCreate, FolderUpdate, FolderMove, FolderResponse, FolderWithNormasResponse, FolderNormaCreate, FolderNormaUpdate } from '../types';

export function useFolders() {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [folders, setFolders] = useState<FolderTreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const operationRef = useRef(false);

  const fetchFolders = useCallback(async () => {
    if (fetchingRef.current) {
      return; // Prevent duplicate calls
    }
    
    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      const data = await api.get<FolderTreeItem[]>('/api/folders/');
      setFolders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching folders:', err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [api]);

  const createFolder = useCallback(async (folderData: FolderCreate): Promise<FolderResponse> => {
    if (operationRef.current) {
      throw new Error('Another operation is in progress');
    }
    
    try {
      operationRef.current = true;
      const newFolder = await api.post<FolderResponse>('/api/folders/', folderData);
      await fetchFolders(); // Refresh the folder list
      return newFolder;
    } finally {
      operationRef.current = false;
    }
  }, [api, fetchFolders]);

  const updateFolder = useCallback(async (folderId: string, folderData: FolderUpdate): Promise<FolderResponse> => {
    if (operationRef.current) {
      throw new Error('Another operation is in progress');
    }
    
    try {
      operationRef.current = true;
      const updatedFolder = await api.put<FolderResponse>(`/api/folders/${folderId}/`, folderData);
      await fetchFolders(); // Refresh the folder list
      return updatedFolder;
    } finally {
      operationRef.current = false;
    }
  }, [api, fetchFolders]);

  const moveFolder = useCallback(async (folderId: string, moveData: FolderMove): Promise<FolderResponse> => {
    if (operationRef.current) {
      throw new Error('Another operation is in progress');
    }
    
    try {
      operationRef.current = true;
      const movedFolder = await api.patch<FolderResponse>(`/api/folders/${folderId}/move/`, moveData);
      await fetchFolders(); // Refresh the folder list
      return movedFolder;
    } finally {
      operationRef.current = false;
    }
  }, [api, fetchFolders]);

  const deleteFolder = useCallback(async (folderId: string): Promise<void> => {
    if (operationRef.current) {
      throw new Error('Another operation is in progress');
    }
    
    try {
      operationRef.current = true;
      await api.delete(`/api/folders/${folderId}/`);
      await fetchFolders(); // Refresh the folder list
    } finally {
      operationRef.current = false;
    }
  }, [api, fetchFolders]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFolders();
    }
  }, [isAuthenticated, fetchFolders]);

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

export function useFolderNormas(folderId: string) {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [folderWithNormas, setFolderWithNormas] = useState<FolderWithNormasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchFolderNormas = useCallback(async () => {
    if (!folderId || folderId.trim() === '') {
      setFolderWithNormas(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (fetchingRef.current) {
      return; // Prevent duplicate calls
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      const data = await api.get<FolderWithNormasResponse>(`/api/folders/${folderId}/normas/`);
      setFolderWithNormas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching folder normas:', err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [folderId, api]);

  const addNormaToFolder = useCallback(async (normaData: FolderNormaCreate) => {
    const result = await api.post(`/api/folders/${folderId}/normas/`, normaData);
    await fetchFolderNormas(); // Refresh the folder normas
    return result;
  }, [folderId, api, fetchFolderNormas]);

  const updateFolderNorma = useCallback(async (normaId: number, updateData: FolderNormaUpdate) => {
    const result = await api.put(`/api/folders/${folderId}/normas/${normaId}/`, updateData);
    await fetchFolderNormas(); // Refresh the folder normas
    return result;
  }, [folderId, api, fetchFolderNormas]);

  const removeNormaFromFolder = useCallback(async (normaId: number) => {
    await api.delete(`/api/folders/${folderId}/normas/${normaId}/`);
    await fetchFolderNormas(); // Refresh the folder normas
  }, [folderId, api, fetchFolderNormas]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFolderNormas();
    }
  }, [isAuthenticated, folderId, fetchFolderNormas]);

  return {
    folderWithNormas,
    loading,
    error,
    fetchFolderNormas,
    addNormaToFolder,
    updateFolderNorma,
    removeNormaFromFolder,
  };
}
