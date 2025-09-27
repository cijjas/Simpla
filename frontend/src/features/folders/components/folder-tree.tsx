'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { TreeView, TreeDataItem } from '@/components/tree-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Folder, Edit, Trash2, FileText, MoreHorizontal, Search, FolderPlus, Archive, BookOpen, Star, Tag, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useFoldersContext } from '../context/folders-context';
import { FolderTreeItem } from '../types';
import { CreateFolderDialog } from './create-folder-dialog';
import { EditFolderDialog } from './edit-folder-dialog';

interface FolderTreeProps {
  onFolderSelect?: (folder: FolderTreeItem | null) => void;
  selectedFolderId?: string;
}

export function FolderTree({ onFolderSelect, selectedFolderId }: FolderTreeProps) {
  const { folders, loading, error, deleteFolder, moveFolder } = useFoldersContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderTreeItem | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<FolderTreeItem | null>(null);
  const [parentFolderForSubfolder, setParentFolderForSubfolder] = useState<FolderTreeItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<FolderTreeItem | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // Cleanup effect to ensure dialogs are closed on unmount
  useEffect(() => {
    return () => {
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingFolder(null);
      setParentFolderForSubfolder(null);
    };
  }, []);

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
    const iconMap: Record<string, any> = {
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
          actions: (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className="h-6 w-6 p-0 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Opciones</span>
                <MoreHorizontal className="h-4 w-4" />
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
              {folder.level < 2 && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setParentFolderForSubfolder(folder);
                    setIsCreateDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva subcarpeta
                </DropdownMenuItem>
              )}
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
        };
      });
    };

    return convertToTreeData(filteredFolders);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredFolders]);

  const handleDeleteFolder = (folder: FolderTreeItem) => {
    setFolderToDelete(folder);
    setDeleteConfirmationText('');
    setDeleteDialogOpen(true);
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete || deleteConfirmationText !== folderToDelete.name) {
      return;
    }

    try {
      await deleteFolder(folderToDelete.id);
      console.log('Carpeta eliminada correctamente');
      
      // Clear selection if deleted folder was selected
      if (selectedFolder?.id === folderToDelete.id) {
        setSelectedFolder(null);
        onFolderSelect?.(null);
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
    } finally {
      setDeleteDialogOpen(false);
      setFolderToDelete(null);
      setDeleteConfirmationText('');
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
      
      console.log('Carpeta movida correctamente');
    } catch (error) {
      console.error('Error moving folder:', error);
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
                className="px-2 pb-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <CreateFolderDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setParentFolderForSubfolder(null);
          }
        }}
        parentFolderId={parentFolderForSubfolder?.id}
      />

      <EditFolderDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingFolder(null);
          }
        }}
        folder={editingFolder}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar carpeta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la carpeta{' '}
              <strong>"{folderToDelete?.name}"</strong> y todas sus subcarpetas.
              <br />
              <br />
              Para confirmar, escribe el nombre de la carpeta:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder={folderToDelete?.name}
              className="w-full"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmDeleteFolder}
              disabled={deleteConfirmationText !== folderToDelete?.name}
            >
              Eliminar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
