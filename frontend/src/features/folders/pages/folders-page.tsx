'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FolderContent, FolderTree } from '@/features/folders';
import { FolderTreeItem } from '@/features/folders/types';
import { useFoldersContext } from '@/features/folders/context/folders-context';
import { getFirstAvailableFolder, findFolderById } from '@/features/folders/utils/folder-utils';

export function FoldersPage() {
  const [selectedFolder, setSelectedFolder] = useState<FolderTreeItem | null>(null);
  const { folders } = useFoldersContext();
  const params = useParams();
  const router = useRouter();
  const folderId = params?.id as string;
  const currentFolderIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  // Handle folder selection with URL update
  const handleFolderSelect = useCallback((folder: FolderTreeItem | null) => {
    setSelectedFolder(folder);
    if (folder) {
      router.push(`/carpetas/${folder.id}`);
    }
  }, [router]);

  // Single effect to handle URL-based folder selection and redirects
  useEffect(() => {
    if (folders.length === 0) return;

    const targetFolder = folderId ? findFolderById(folders, folderId) : null;
    
    if (targetFolder) {
      // Valid folder in URL
      if (currentFolderIdRef.current !== folderId) {
        currentFolderIdRef.current = folderId;
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => setSelectedFolder(targetFolder), 0);
      }
    } else if (!isInitializedRef.current) {
      // No valid folder in URL, redirect to first available (only on initial load)
      const firstFolder = getFirstAvailableFolder(folders);
      if (firstFolder) {
        router.replace(`/carpetas/${firstFolder.id}`);
      }
    }
    
    isInitializedRef.current = true;
  }, [folders, folderId, router]);

  return (
    <div className='flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden'>
      {/* Header Section - Fixed */}
      <div className='flex-shrink-0 border-b bg-background px-4 md:px-6 py-4 '>
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
              onFolderSelect={handleFolderSelect}
              selectedFolderId={selectedFolder?.id}
            />
          </div>

          {/* Desktop: Sticky sidebar */}
          <div className='hidden lg:flex flex-col flex-1 overflow-hidden'>
            <FolderTree
              onFolderSelect={handleFolderSelect}
              selectedFolderId={selectedFolder?.id}
            />
          </div>
        </div>

        {/* Folder Content Section - Fills remaining space */}
        <div className='flex-1 overflow-hidden min-w-0'>
          <FolderContent 
            folder={selectedFolder} 
            onFolderSelect={handleFolderSelect}
          />
        </div>
      </div>
    </div>
  );
}
