/**
 * Custom hooks for folder management
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useApi } from '@/features/auth/hooks/use-api';
import { FolderTreeItem, FolderCreate, FolderUpdate, FolderMove, FolderResponse, FolderWithNormasResponse, FolderNormaCreate, FolderNormaUpdate } from '../types';

export function useFolders() {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [folders, setFolders] = useState<FolderTreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.get<FolderTreeItem[]>('/api/folders');
      setFolders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching folders:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const createFolder = useCallback(async (folderData: FolderCreate): Promise<FolderResponse> => {
    const newFolder = await api.post<FolderResponse>('/api/folders', folderData);
    await fetchFolders(); // Refresh the folder list
    return newFolder;
  }, [api, fetchFolders]);

  const updateFolder = useCallback(async (folderId: string, folderData: FolderUpdate): Promise<FolderResponse> => {
    const updatedFolder = await api.put<FolderResponse>(`/api/folders/${folderId}`, folderData);
    await fetchFolders(); // Refresh the folder list
    return updatedFolder;
  }, [api, fetchFolders]);

  const moveFolder = useCallback(async (folderId: string, moveData: FolderMove): Promise<FolderResponse> => {
    const movedFolder = await api.patch<FolderResponse>(`/api/folders/${folderId}/move`, moveData);
    await fetchFolders(); // Refresh the folder list
    return movedFolder;
  }, [api, fetchFolders]);

  const deleteFolder = useCallback(async (folderId: string): Promise<void> => {
    await api.delete(`/api/folders/${folderId}`);
    await fetchFolders(); // Refresh the folder list
  }, [api, fetchFolders]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFolders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

export function useFolderNormas(folderId: string) {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [folderWithNormas, setFolderWithNormas] = useState<FolderWithNormasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFolderNormas = useCallback(async () => {
    if (!folderId) {
      setError('No folder ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await api.get<FolderWithNormasResponse>(`/api/folders/${folderId}/normas`);
      setFolderWithNormas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching folder normas:', err);
    } finally {
      setLoading(false);
    }
  }, [folderId, api]);

  const addNormaToFolder = useCallback(async (normaData: FolderNormaCreate) => {
    const result = await api.post(`/api/folders/${folderId}/normas`, normaData);
    await fetchFolderNormas(); // Refresh the folder normas
    return result;
  }, [folderId, api, fetchFolderNormas]);

  const updateFolderNorma = useCallback(async (normaId: number, updateData: FolderNormaUpdate) => {
    const result = await api.put(`/api/folders/${folderId}/normas/${normaId}`, updateData);
    await fetchFolderNormas(); // Refresh the folder normas
    return result;
  }, [folderId, api, fetchFolderNormas]);

  const removeNormaFromFolder = useCallback(async (normaId: number) => {
    await api.delete(`/api/folders/${folderId}/normas/${normaId}`);
    await fetchFolderNormas(); // Refresh the folder normas
  }, [folderId, api, fetchFolderNormas]);

  useEffect(() => {
    if (isAuthenticated && folderId) {
      fetchFolderNormas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, folderId]);

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
