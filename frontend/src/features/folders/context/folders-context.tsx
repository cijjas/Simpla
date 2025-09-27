'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useFolders } from '../hooks/use-folders';
import { FolderTreeItem } from '../types';

interface FoldersContextType {
  folders: FolderTreeItem[];
  loading: boolean;
  error: string | null;
  fetchFolders: () => Promise<void>;
  createFolder: (folderData: any) => Promise<any>;
  updateFolder: (folderId: string, folderData: any) => Promise<any>;
  moveFolder: (folderId: string, moveData: any) => Promise<any>;
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
