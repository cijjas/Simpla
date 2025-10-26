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
      
      // Optimistically update local state instead of refetching
      setFolders(prevFolders => {
        const addFolderToTree = (folders: FolderTreeItem[], parentId?: string): FolderTreeItem[] => {
          if (!parentId) {
            // Add as root folder
            return [...folders, {
              id: newFolder.id,
              name: newFolder.name,
              description: newFolder.description,
              color: newFolder.color,
              icon: newFolder.icon,
              level: 0,
              order_index: newFolder.order_index,
              norma_count: 0,
              subfolders: [],
            }];
          }
          
          // Add as subfolder
          return folders.map(folder => {
            if (folder.id === parentId) {
              return {
                ...folder,
                subfolders: [...folder.subfolders, {
                  id: newFolder.id,
                  name: newFolder.name,
                  description: newFolder.description,
                  color: newFolder.color,
                  icon: newFolder.icon,
                  level: folder.level + 1,
                  order_index: newFolder.order_index,
                  norma_count: 0,
                  subfolders: [],
                }]
              };
            }
            return {
              ...folder,
              subfolders: addFolderToTree(folder.subfolders, parentId)
            };
          });
        };
        
        return addFolderToTree(prevFolders, folderData.parent_folder_id);
      });
      
      return newFolder;
    } catch (error) {
      // On error, refetch to ensure consistency
      await fetchFolders();
      throw error;
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
      
      // Optimistically update local state instead of refetching
      setFolders(prevFolders => {
        const updateFolderInTree = (folders: FolderTreeItem[]): FolderTreeItem[] => {
          return folders.map(folder => {
            if (folder.id === folderId) {
              return {
                ...folder,
                name: updatedFolder.name,
                description: updatedFolder.description,
                color: updatedFolder.color,
                icon: updatedFolder.icon,
                updated_at: updatedFolder.updated_at,
              };
            }
            return {
              ...folder,
              subfolders: updateFolderInTree(folder.subfolders)
            };
          });
        };
        
        return updateFolderInTree(prevFolders);
      });
      
      return updatedFolder;
    } catch (error) {
      // On error, refetch to ensure consistency
      await fetchFolders();
      throw error;
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
      
      // Optimistically update local state instead of refetching
      setFolders(prevFolders => {
        // First, remove the folder from its current location
        const removeFolderFromTree = (folders: FolderTreeItem[]): { folders: FolderTreeItem[], removedFolder: FolderTreeItem | null } => {
          for (let i = 0; i < folders.length; i++) {
            if (folders[i].id === folderId) {
              const removedFolder = folders[i];
              return {
                folders: [...folders.slice(0, i), ...folders.slice(i + 1)],
                removedFolder
              };
            }
            const result = removeFolderFromTree(folders[i].subfolders);
            if (result.removedFolder) {
              return {
                folders: folders.map((folder, index) => 
                  index === i 
                    ? { ...folder, subfolders: result.folders }
                    : folder
                ),
                removedFolder: result.removedFolder
              };
            }
          }
          return { folders, removedFolder: null };
        };
        
        const { folders: foldersWithoutMoved, removedFolder } = removeFolderFromTree(prevFolders);
        
        if (!removedFolder) {
          // If folder not found, fallback to refetch
          return prevFolders;
        }
        
        // Update the removed folder's properties
        const updatedFolder = {
          ...removedFolder,
          parent_folder_id: moveData.parent_folder_id || null,
          level: moveData.parent_folder_id ? 
            (prevFolders.find(f => f.id === moveData.parent_folder_id)?.level || 0) + 1 : 0,
          updated_at: movedFolder.updated_at,
        };
        
        // Add the folder to its new location
        const addFolderToTree = (folders: FolderTreeItem[], parentId?: string): FolderTreeItem[] => {
          if (!parentId) {
            // Add as root folder
            return [...folders, updatedFolder];
          }
          
          // Add as subfolder
          return folders.map(folder => {
            if (folder.id === parentId) {
              return {
                ...folder,
                subfolders: [...folder.subfolders, updatedFolder]
              };
            }
            return {
              ...folder,
              subfolders: addFolderToTree(folder.subfolders, parentId)
            };
          });
        };
        
        return addFolderToTree(foldersWithoutMoved, moveData.parent_folder_id);
      });
      
      return movedFolder;
    } catch (error) {
      // On error, refetch to ensure consistency
      await fetchFolders();
      throw error;
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
      
      // Optimistically update local state instead of refetching
      setFolders(prevFolders => {
        const removeFolderFromTree = (folders: FolderTreeItem[]): FolderTreeItem[] => {
          return folders
            .filter(folder => folder.id !== folderId)
            .map(folder => ({
              ...folder,
              subfolders: removeFolderFromTree(folder.subfolders)
            }));
        };
        
        return removeFolderFromTree(prevFolders);
      });
    } catch (error) {
      // On error, refetch to ensure consistency
      await fetchFolders();
      throw error;
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
  const currentFolderIdRef = useRef<string | null>(null);

  const fetchFolderNormas = useCallback(async () => {
    const currentFolderId = folderId;
    
    if (!currentFolderId || currentFolderId.trim() === '') {
      setFolderWithNormas(null);
      setError(null);
      setLoading(false);
      currentFolderIdRef.current = null;
      return;
    }

    // Prevent duplicate calls for the same folder
    if (fetchingRef.current || currentFolderIdRef.current === currentFolderId) {
      return;
    }

    try {
      fetchingRef.current = true;
      currentFolderIdRef.current = currentFolderId;
      setLoading(true);
      setError(null);

      const data = await api.get<FolderWithNormasResponse>(`/api/folders/${currentFolderId}/normas/`);
      setFolderWithNormas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching folder normas:', err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [api]); // Remove folderId from dependencies to prevent unnecessary re-creation

  const addNormaToFolder = useCallback(async (normaData: FolderNormaCreate) => {
    const result = await api.post(`/api/folders/${folderId}/normas/`, normaData);
    await fetchFolderNormas(); // Refresh the folder normas
    return result;
  }, [folderId, api]); // Remove fetchFolderNormas from dependencies

  const updateFolderNorma = useCallback(async (normaId: number, updateData: FolderNormaUpdate) => {
    const result = await api.put(`/api/folders/${folderId}/normas/${normaId}/`, updateData);
    await fetchFolderNormas(); // Refresh the folder normas
    return result;
  }, [folderId, api]); // Remove fetchFolderNormas from dependencies

  const removeNormaFromFolder = useCallback(async (normaId: number) => {
    await api.delete(`/api/folders/${folderId}/normas/${normaId}/`);
    await fetchFolderNormas(); // Refresh the folder normas
  }, [folderId, api]); // Remove fetchFolderNormas from dependencies

  useEffect(() => {
    if (isAuthenticated && folderId) {
      fetchFolderNormas();
    }
  }, [isAuthenticated, folderId]); // Remove fetchFolderNormas from dependencies

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
