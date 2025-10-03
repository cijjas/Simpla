'use client';

import React, { useState, useEffect } from 'react';
import { FolderContent, FolderTree } from '@/features/folders';
import { FolderTreeItem } from '@/features/folders/types';
import { useFoldersContext } from '@/features/folders/context/folders-context';

export function FoldersPage() {
  const [selectedFolder, setSelectedFolder] = useState<FolderTreeItem | null>(null);
  const { folders } = useFoldersContext();

  // Helper function to get the first available folder
  const getFirstFolder = (folders: FolderTreeItem[]): FolderTreeItem | null => {
    if (folders.length === 0) return null;
    
    // Return the first root folder (level 0)
    const rootFolders = folders.filter(folder => folder.level === 0);
    return rootFolders.length > 0 ? rootFolders[0] : folders[0];
  };

  // Auto-select the first folder when folders are loaded
  useEffect(() => {
    if (folders.length > 0 && !selectedFolder) {
      const firstFolder = getFirstFolder(folders);
      if (firstFolder) {
        setSelectedFolder(firstFolder);
      }
    }
  }, [folders, selectedFolder]);

  return (
    <div className=" p-6 w-full h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mis Carpetas</h1>
        <p className="text-muted-foreground">
          Organiza y gestiona tus normas en carpetas personalizadas
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Folder Tree Sidebar */}
        <div className="lg:col-span-1 flex flex-col">
          <FolderTree
            onFolderSelect={setSelectedFolder}
            selectedFolderId={selectedFolder?.id}
          />
        </div>
        
        {/* Folder Content */}
        <div className="lg:col-span-3 overflow-auto">
          <FolderContent folder={selectedFolder} />
        </div>
      </div>
    </div>
  );
}
