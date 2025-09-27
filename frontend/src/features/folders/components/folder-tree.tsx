'use client';

import React, { useState, useMemo } from 'react';
import { TreeView, TreeDataItem } from '@/components/tree-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Folder, FolderOpen, Edit, Trash2, Move, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useFolders } from '../hooks/use-folders';
import { FolderTreeItem } from '../types';
import { CreateFolderDialog } from './create-folder-dialog';
import { EditFolderDialog } from './edit-folder-dialog';
import { toast } from 'sonner';

interface FolderTreeProps {
  onFolderSelect?: (folder: FolderTreeItem | null) => void;
  selectedFolderId?: string;
}

export function FolderTree({ onFolderSelect, selectedFolderId }: FolderTreeProps) {
  const { folders, loading, error, deleteFolder, moveFolder } = useFolders();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderTreeItem | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<FolderTreeItem | null>(null);

  // Convert folder tree to TreeDataItem format
  const treeData = useMemo(() => {
    const convertToTreeData = (folders: FolderTreeItem[]): TreeDataItem[] => {
      return folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        icon: Folder,
        selectedIcon: FolderOpen,
        openIcon: FolderOpen,
        children: folder.subfolders.length > 0 ? convertToTreeData(folder.subfolders) : undefined,
        draggable: true,
        droppable: true,
        actions: (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className="h-6 w-6 p-0 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Opciones</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingFolder(folder);
                  setIsEditDialogOpen(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreateDialogOpen(true);
                  // Set this folder as parent for new folder
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva subcarpeta
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(folder);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        onClick: () => {
          setSelectedFolder(folder);
          onFolderSelect?.(folder);
        },
      }));
    };

    return convertToTreeData(folders);
  }, [folders, onFolderSelect]);

  const handleDeleteFolder = async (folder: FolderTreeItem) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la carpeta "${folder.name}" y todas sus subcarpetas?`)) {
      return;
    }

    try {
      await deleteFolder(folder.id);
      toast.success('Carpeta eliminada correctamente');
      
      // Clear selection if deleted folder was selected
      if (selectedFolder?.id === folder.id) {
        setSelectedFolder(null);
        onFolderSelect?.(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la carpeta');
    }
  };

  const handleDragAndDrop = async (sourceItem: TreeDataItem, targetItem: TreeDataItem) => {
    try {
      // Don't allow dropping on itself or if target is empty
      if (sourceItem.id === targetItem.id || !targetItem.id) {
        return;
      }

      await moveFolder(sourceItem.id, {
        parent_folder_id: targetItem.id === 'parent_div' ? undefined : targetItem.id,
      });
      
      toast.success('Carpeta movida correctamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al mover la carpeta');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
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
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Mis Carpetas</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nueva
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {treeData.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 px-6">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm">No tienes carpetas aún</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Crea tu primera carpeta para organizar tus normas
              </p>
            </div>
          ) : (
            <TreeView
              data={treeData}
              initialSelectedItemId={selectedFolderId}
              onSelectChange={(item) => {
                if (item) {
                  const folder = findFolderById(folders, item.id);
                  setSelectedFolder(folder);
                  onFolderSelect?.(folder);
                } else {
                  setSelectedFolder(null);
                  onFolderSelect?.(null);
                }
              }}
              onDocumentDrag={handleDragAndDrop}
              defaultNodeIcon={Folder}
              defaultLeafIcon={Folder}
              className="px-2 pb-2"
            />
          )}
        </CardContent>
      </Card>

      <CreateFolderDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        parentFolderId={selectedFolder?.id}
      />

      <EditFolderDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        folder={editingFolder}
      />
    </>
  );
}

// Helper function to find folder by ID in the tree
function findFolderById(folders: FolderTreeItem[], id: string): FolderTreeItem | null {
  for (const folder of folders) {
    if (folder.id === id) {
      return folder;
    }
    if (folder.subfolders.length > 0) {
      const found = findFolderById(folder.subfolders, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}
