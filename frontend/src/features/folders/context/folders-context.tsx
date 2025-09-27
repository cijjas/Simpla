'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useFolders } from '../hooks/use-folders';
import { FolderTreeItem, FolderCreate, FolderUpdate, FolderMove, FolderResponse } from '../types';

interface FoldersContextType {
  folders: FolderTreeItem[];
  loading: boolean;
  error: string | null;
  fetchFolders: () => Promise<void>;
  createFolder: (folderData: FolderCreate) => Promise<FolderResponse>;
  updateFolder: (folderId: string, folderData: FolderUpdate) => Promise<FolderResponse>;
  moveFolder: (folderId: string, moveData: FolderMove) => Promise<FolderResponse>;
  deleteFolder: (folderId: string) => Promise<void>;
}

const FoldersContext = createContext<FoldersContextType | undefined>(undefined);

interface FoldersProviderProps {
  children: ReactNode;
}

export function FoldersProvider({ children }: FoldersProviderProps) {
  const foldersData = useFolders();

  return (
    <FoldersContext.Provider value={foldersData}>
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
