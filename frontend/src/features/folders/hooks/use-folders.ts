/**
 * Custom hooks for folder management
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/fetch';
import { FolderTreeItem, FolderCreate, FolderUpdate, FolderMove, FolderResponse, FolderWithNormasResponse, FolderNormaCreate, FolderNormaUpdate } from '../types';
// Import auth types to ensure module augmentation is applied
import '@/features/auth/utils/auth';

export function useFolders() {
  const { data: session } = useSession();
  const [folders, setFolders] = useState<FolderTreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiClient.get<FolderTreeItem[]>('/api/folders');
      setFolders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching folders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createFolder = useCallback(async (folderData: FolderCreate): Promise<FolderResponse> => {
    const newFolder = await apiClient.post<FolderResponse>('/api/folders', folderData);
    await fetchFolders(); // Refresh the folder list
    return newFolder;
  }, [fetchFolders]);

  const updateFolder = useCallback(async (folderId: string, folderData: FolderUpdate): Promise<FolderResponse> => {
    const updatedFolder = await apiClient.put<FolderResponse>(`/api/folders/${folderId}`, folderData);
    await fetchFolders(); // Refresh the folder list
    return updatedFolder;
  }, [fetchFolders]);

  const moveFolder = useCallback(async (folderId: string, moveData: FolderMove): Promise<FolderResponse> => {
    const movedFolder = await apiClient.patch<FolderResponse>(`/api/folders/${folderId}/move`, moveData);
    await fetchFolders(); // Refresh the folder list
    return movedFolder;
  }, [fetchFolders]);

  const deleteFolder = useCallback(async (folderId: string): Promise<void> => {
    await apiClient.delete(`/api/folders/${folderId}`);
    await fetchFolders(); // Refresh the folder list
  }, [fetchFolders]);

  useEffect(() => {
    if (session?.user && 'accessToken' in session.user && session.user.accessToken) {
      fetchFolders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user]);

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
  const { data: session } = useSession();
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

      const data = await apiClient.get<FolderWithNormasResponse>(`/api/folders/${folderId}/normas`);
      setFolderWithNormas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching folder normas:', err);
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  const addNormaToFolder = useCallback(async (normaData: FolderNormaCreate) => {
    const result = await apiClient.post(`/api/folders/${folderId}/normas`, normaData);
    await fetchFolderNormas(); // Refresh the folder normas
    return result;
  }, [folderId, fetchFolderNormas]);

  const updateFolderNorma = useCallback(async (normaId: number, updateData: FolderNormaUpdate) => {
    const result = await apiClient.put(`/api/folders/${folderId}/normas/${normaId}`, updateData);
    await fetchFolderNormas(); // Refresh the folder normas
    return result;
  }, [folderId, fetchFolderNormas]);

  const removeNormaFromFolder = useCallback(async (normaId: number) => {
    await apiClient.delete(`/api/folders/${folderId}/normas/${normaId}`);
    await fetchFolderNormas(); // Refresh the folder normas
  }, [folderId, fetchFolderNormas]);

  useEffect(() => {
    if (session?.user && 'accessToken' in session.user && session.user.accessToken && folderId) {
      fetchFolderNormas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user, folderId]);

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
