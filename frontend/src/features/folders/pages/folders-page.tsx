'use client';

import React, { useState, useEffect } from 'react';
import { FolderContent, FolderTree } from '@/features/folders';
import { FolderTreeItem } from '@/features/folders/types';
import { useFoldersContext } from '@/features/folders/context/folders-context';
import { getFirstAvailableFolder } from '@/features/folders/utils/folder-utils';

export function FoldersPage() {
  const [selectedFolder, setSelectedFolder] = useState<FolderTreeItem | null>(null);
  const { folders } = useFoldersContext();

  // Auto-select the first folder when folders are loaded
  useEffect(() => {
    if (folders.length > 0 && !selectedFolder) {
      const firstFolder = getFirstAvailableFolder(folders);
      if (firstFolder) {
        setSelectedFolder(firstFolder);
      }
    }
  }, [folders, selectedFolder]);

  return (
    <div className='flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden'>
      {/* Header Section - Fixed */}
      <div className='flex-shrink-0 border-b bg-background px-4 md:px-6 py-4'>
        <div className='text-start space-y-1'>
          <h1 className='text-2xl md:text-3xl font-bold font-serif'>
            Mis Carpetas
          </h1>
          <p className='text-muted-foreground text-xs md:text-sm'>
            Organizá y gestioná tus normas en carpetas personalizadas
          </p>
        </div>
      </div>

      {/* Main Content - Different layouts for mobile vs desktop */}
      <div className='flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0'>
        {/* Folder Tree Section - Top on mobile, Sidebar on desktop */}
        <div className='lg:w-80 lg:flex-shrink-0 lg:border-r bg-muted flex flex-col overflow-hidden'>
          {/* Mobile: Collapsible at top */}
          <div className='lg:hidden border-b flex-1 overflow-hidden'>
            <FolderTree
              onFolderSelect={setSelectedFolder}
              selectedFolderId={selectedFolder?.id}
            />
          </div>

          {/* Desktop: Sticky sidebar */}
          <div className='hidden lg:flex flex-col flex-1 overflow-hidden'>
            <FolderTree
              onFolderSelect={setSelectedFolder}
              selectedFolderId={selectedFolder?.id}
            />
          </div>
        </div>

        {/* Folder Content Section - Fills remaining space */}
        <div className='flex-1 overflow-hidden min-w-0'>
          <FolderContent 
            folder={selectedFolder} 
            onFolderSelect={setSelectedFolder}
          />
        </div>
      </div>
    </div>
  );
}
