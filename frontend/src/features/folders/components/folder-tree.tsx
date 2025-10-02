'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { TreeView, TreeDataItem } from '@/components/tree-view-old';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Folder, FileText, Search, FolderPlus, Archive, BookOpen, Star, Tag, Users, Edit, Trash2, MoreHorizontal, Loader2 } from 'lucide-react';
import { useFoldersContext } from '../context/folders-context';
import { FolderTreeItem } from '../types';
import { findFolderById } from '../utils/folder-utils';
import { CreateFolderDialog } from './create-folder-dialog';
import { EditFolderDialog } from './edit-folder-dialog';
import { DeleteFolderDialog } from './delete-folder-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface FolderTreeProps {
  onFolderSelect?: (folder: FolderTreeItem | null) => void;
  selectedFolderId?: string;
}

export function FolderTree({ onFolderSelect, selectedFolderId }: FolderTreeProps) {
  const { folders, loading, error, moveFolder, updateFolder: _updateFolder, deleteFolder } = useFoldersContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateSubfolderDialogOpen, setIsCreateSubfolderDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderTreeItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Cleanup effect to ensure dialogs are closed on unmount
  useEffect(() => {
    return () => {
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      setIsDeleteDialogOpen(false);
      setIsCreateSubfolderDialogOpen(false);
    };
  }, []);

  // Handler functions for folder operations
  const handleEditFolder = useCallback((folder: FolderTreeItem) => {
    setSelectedFolder(folder);
    setIsEditDialogOpen(true);
  }, []);

  const handleDeleteFolder = useCallback((folder: FolderTreeItem) => {
    setSelectedFolder(folder);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteDialogClose = useCallback((open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      // Reset selected folder when dialog closes
      setSelectedFolder(null);
    }
  }, []);

  const handleCreateSubfolder = useCallback((folder: FolderTreeItem) => {
    setSelectedFolder(folder);
    setIsCreateSubfolderDialogOpen(true);
  }, []);

  const confirmDeleteFolder = useCallback(async (folderId: string) => {
    try {
      await deleteFolder(folderId);
      toast.success('Carpeta eliminada correctamente');
      handleDeleteDialogClose(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la carpeta');
      throw error; // Re-throw so the dialog can handle it
    }
  }, [deleteFolder, handleDeleteDialogClose]);

  // Filter folders based on search query
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return folders;
    
    const filterFolders = (folders: FolderTreeItem[]): FolderTreeItem[] => {
      return folders.filter(folder => {
        const matchesSearch = folder.name.toLowerCase().includes(searchQuery.toLowerCase());
        const filteredSubfolders = filterFolders(folder.subfolders);
        
        // Include folder if it matches search or has matching subfolders
        return matchesSearch || filteredSubfolders.length > 0;
      }).map(folder => ({
        ...folder,
        subfolders: filterFolders(folder.subfolders)
      }));
    };
    
    return filterFolders(folders);
  }, [folders, searchQuery]);

  // Icon mapping
  const getIcon = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      'folder': Folder,
      'folder-plus': FolderPlus,
      'archive': Archive,
      'book-open': BookOpen,
      'file-text': FileText,
      'star': Star,
      'tag': Tag,
      'users': Users,
    };
    return iconMap[iconName] || Folder;
  };

  // Convert folder tree to TreeDataItem format
  const treeData = useMemo(() => {
    const convertToTreeData = (folders: FolderTreeItem[]): TreeDataItem[] => {
      return folders.map((folder) => {
        const IconComponent = getIcon(folder.icon);
        return {
          id: folder.id,
          name: (
            <div className="flex items-center gap-2">
              <span>{folder.name}</span>
              {folder.color !== '#FFFFFF' && (
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: folder.color }}
                />
              )}
            </div>
          ),
          icon: IconComponent,
          selectedIcon: IconComponent,
          openIcon: IconComponent,
          children: folder.subfolders.length > 0 ? convertToTreeData(folder.subfolders) : undefined,
          draggable: true,
          droppable: true,
          onClick: () => {
            onFolderSelect?.(folder);
          },
          actions: (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="inline-flex items-center justify-center h-6 w-6 p-0 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer">
                  <MoreHorizontal className="h-3 w-3" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditFolder(folder)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar carpeta
                </DropdownMenuItem>
                {folder.level < 2 && (
                  <DropdownMenuItem onClick={() => handleCreateSubfolder(folder)}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Nueva subcarpeta
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => handleDeleteFolder(folder)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar carpeta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        };
      });
    };

    return convertToTreeData(filteredFolders);
  }, [filteredFolders, onFolderSelect, handleEditFolder, handleCreateSubfolder, handleDeleteFolder]);


  const handleDragAndDrop = useCallback(async (sourceItem: TreeDataItem, targetItem: TreeDataItem) => {
    try {
      // Don't allow dropping on itself or if target is empty
      if (sourceItem.id === targetItem.id || !targetItem.id) {
        return;
      }

      await moveFolder(sourceItem.id, {
        parent_folder_id: targetItem.id === 'parent_div' ? undefined : targetItem.id,
      });
      
      console.log('Carpeta movida correctamente');
    } catch (error) {
      console.error('Error moving folder:', error);
    }
  }, [moveFolder]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Cargando carpetas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p className="text-sm">Error: {error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full flex flex-col gap-0">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar carpetas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-base"
              />
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setIsCreateDialogOpen(true)}
              className="h-10 w-10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col">
          
          {treeData.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 px-6">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm">
                {searchQuery.trim() ? 'No se encontraron carpetas' : 'No tienes carpetas aún'}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {searchQuery.trim() 
                  ? 'Intenta con otro término de búsqueda' 
                  : 'Crea tu primera carpeta para organizar tus normas'
                }
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <TreeView
                data={treeData}
                initialSelectedItemId={selectedFolderId}
                expandAll={true}
                onSelectChange={(item) => {
                  if (item) {
                    const folder = findFolderById(folders, item.id);
                    onFolderSelect?.(folder);
                  } else {
                    onFolderSelect?.(null);
                  }
                }}
                onDocumentDrag={handleDragAndDrop}
                defaultNodeIcon={Folder}
                defaultLeafIcon={Folder}
                className="px-2 pb-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <CreateFolderDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* Edit Folder Dialog */}
      <EditFolderDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        folder={selectedFolder}
      />

      {/* Create Subfolder Dialog */}
      <CreateFolderDialog
        open={isCreateSubfolderDialogOpen}
        onOpenChange={setIsCreateSubfolderDialogOpen}
        parentFolderId={selectedFolder?.id}
      />

      {/* Delete Folder Confirmation Dialog */}
      <DeleteFolderDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogClose}
        folder={selectedFolder}
        onConfirm={confirmDeleteFolder}
      />
    </>
  );
}

