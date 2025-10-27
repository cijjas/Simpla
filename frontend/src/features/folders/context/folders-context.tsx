'use client';

import React, { createContext, useContext, ReactNode, useRef, useCallback } from 'react';
import { useFolders } from '../hooks/use-folders';
import { FolderTreeItem, FolderCreate, FolderUpdate, FolderMove, FolderResponse, FolderWithNormasResponse } from '../types';

interface FoldersContextType {
  folders: FolderTreeItem[];
  loading: boolean;
  error: string | null;
  fetchFolders: () => Promise<void>;
  createFolder: (folderData: FolderCreate) => Promise<FolderResponse>;
  updateFolder: (folderId: string, folderData: FolderUpdate) => Promise<FolderResponse>;
  moveFolder: (folderId: string, moveData: FolderMove) => Promise<FolderResponse>;
  deleteFolder: (folderId: string) => Promise<void>;
  // Cache management
  getCachedFolderData: (folderId: string) => FolderWithNormasResponse | undefined;
  setCachedFolderData: (folderId: string, data: FolderWithNormasResponse) => void;
  clearFolderCache: (folderId?: string) => void;
}

const FoldersContext = createContext<FoldersContextType | undefined>(undefined);

interface FoldersProviderProps {
  children: ReactNode;
}

export function FoldersProvider({ children }: FoldersProviderProps) {
  const foldersData = useFolders();
  
  // Cache for folder data - persists across folder switches
  const folderCacheRef = useRef<Map<string, FolderWithNormasResponse>>(new Map());
  
  // Cache management functions
  const getCachedFolderData = useCallback((folderId: string) => {
    return folderCacheRef.current.get(folderId);
  }, []);
  
  const setCachedFolderData = useCallback((folderId: string, data: FolderWithNormasResponse) => {
    folderCacheRef.current.set(folderId, data);
  }, []);
  
  const clearFolderCache = useCallback((folderId?: string) => {
    if (folderId) {
      folderCacheRef.current.delete(folderId);
    } else {
      folderCacheRef.current.clear();
    }
  }, []);

  const contextValue: FoldersContextType = {
    ...foldersData,
    getCachedFolderData,
    setCachedFolderData,
    clearFolderCache,
  };

  return (
    <FoldersContext.Provider value={contextValue}>
      {children}
    </FoldersContext.Provider>
  );
}

export function useFoldersContext() {
  const context = useContext(FoldersContext);
  if (context === undefined) {
    throw new Error('useFoldersContext must be used within a FoldersProvider');
  }
  return context;
}
