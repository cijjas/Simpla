'use client';

import React, { useState } from 'react';
import { FolderTree, FolderContent } from '@/features/folders';
import { FolderTreeItem } from '@/features/folders/types';

export default function CarpetasPage() {
  const [selectedFolder, setSelectedFolder] = useState<FolderTreeItem | null>(null);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mis Carpetas</h1>
        <p className="text-muted-foreground">
          Organiza y gestiona tus normas en carpetas personalizadas
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Folder Tree Sidebar */}
        <div className="lg:col-span-1">
          <FolderTree
            onFolderSelect={setSelectedFolder}
            selectedFolderId={selectedFolder?.id}
          />
        </div>
        
        {/* Folder Content */}
        <div className="lg:col-span-2">
          <FolderContent folder={selectedFolder} />
        </div>
      </div>
    </div>
  );
}
