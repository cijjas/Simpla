'use client';

import React, { useState } from 'react';
import { FolderTree, FolderContent } from '@/features/folders';
import { FolderTreeItem } from '@/features/folders/types';

export function FoldersPage() {
  const [selectedFolder, setSelectedFolder] = useState<FolderTreeItem | null>(null);

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
