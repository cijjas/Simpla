'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { TreeView, TreeDataItem } from '@/components/tree-view-old';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Folder,
  FileText,
  Search,
  FolderPlus,
  Archive,
  BookOpen,
  Bookmark,
  Tag,
  Users,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useFoldersContext } from '../context/folders-context';
import { FolderTreeItem } from '../types';
import { findFolderById } from '../utils/folder-utils';
import { CreateFolderDialog } from './create-folder-dialog';
import { EditFolderDialog } from './edit-folder-dialog';
import { DeleteFolderDialog } from './delete-folder-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

interface FolderTreeProps {
  onFolderSelect?: (folder: FolderTreeItem | null) => void;
  selectedFolderId?: string;
}

export function FolderTree({
  onFolderSelect,
  selectedFolderId,
}: FolderTreeProps) {
  const {
    folders,
    loading,
    error,
    moveFolder,
    updateFolder: _updateFolder,
    deleteFolder,
  } = useFoldersContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateSubfolderDialogOpen, setIsCreateSubfolderDialogOpen] =
    useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderTreeItem | null>(
    null,
  );
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
    // Small delay to allow dropdown menu to fully close before opening dialog
    setTimeout(() => {
      setIsEditDialogOpen(true);
    }, 0);
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
    // Small delay to allow dropdown menu to fully close before opening dialog
    setTimeout(() => {
      setIsCreateSubfolderDialogOpen(true);
    }, 0);
  }, []);

  const confirmDeleteFolder = useCallback(
    async (folderId: string) => {
      try {
        await deleteFolder(folderId);
        toast.success('Carpeta eliminada correctamente');
        handleDeleteDialogClose(false);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Error al eliminar la carpeta',
        );
        throw error; // Re-throw so the dialog can handle it
      }
    },
    [deleteFolder, handleDeleteDialogClose],
  );

  // Filter folders based on search query
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return folders;

    const filterFolders = (folders: FolderTreeItem[]): FolderTreeItem[] => {
      return folders
        .filter(folder => {
          const matchesSearch = folder.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
          const filteredSubfolders = filterFolders(folder.subfolders);

          // Include folder if it matches search or has matching subfolders
          return matchesSearch || filteredSubfolders.length > 0;
        })
        .map(folder => ({
          ...folder,
          subfolders: filterFolders(folder.subfolders),
        }));
    };

    return filterFolders(folders);
  }, [folders, searchQuery]);

  // Icon mapping
  const getIcon = (iconName: string) => {
    const iconMap: Record<
      string,
      React.ComponentType<{ className?: string }>
    > = {
      folder: Folder,
      'folder-plus': FolderPlus,
      archive: Archive,
      'book-open': BookOpen,
      'file-text': FileText,
      bookmark: Bookmark,
      tag: Tag,
      users: Users,
    };
    return iconMap[iconName] || Folder;
  };

  // Convert folder tree to TreeDataItem format with enhanced styling
  const treeData = useMemo(() => {
    const convertToTreeData = (folders: FolderTreeItem[]): TreeDataItem[] => {
      return folders.map(folder => {
        const IconComponent = getIcon(folder.icon);
        return {
          id: folder.id,
          name: (
            <div className='flex items-center gap-2'>
              <span>{folder.name}</span>
              {folder.color && (
                <div
                  className='w-2 h-2 rounded-full'
                  style={{ backgroundColor: folder.color }}
                />
              )}
            </div>
          ),
          icon: IconComponent,
          selectedIcon: IconComponent,
          openIcon: IconComponent,
          children:
            folder.subfolders.length > 0
              ? convertToTreeData(folder.subfolders)
              : undefined,
          draggable: true,
          droppable: true,
          onClick: () => {
            onFolderSelect?.(folder);
          },
          actions: (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6 cursor-pointer'
                  onClick={e => e.stopPropagation()}
                >
                  <MoreHorizontal className='h-3 w-3' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => handleEditFolder(folder)}>
                  <Edit className='size-4 mr-2' />
                  Editar carpeta
                </DropdownMenuItem>
                {folder.level < 2 && (
                  <DropdownMenuItem
                    onClick={() => handleCreateSubfolder(folder)}
                  >
                    <FolderPlus className='size-4 mr-2' />
                    Nueva subcarpeta
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleDeleteFolder(folder)}
                  className='text-destructive focus:text-destructive'
                >
                  <Trash2 className='size-4 mr-2' />
                  Eliminar carpeta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        };
      });
    };

    return convertToTreeData(filteredFolders);
  }, [
    filteredFolders,
    onFolderSelect,
    handleEditFolder,
    handleCreateSubfolder,
    handleDeleteFolder,
  ]);

  const handleDragAndDrop = useCallback(
    async (sourceItem: TreeDataItem, targetItem: TreeDataItem) => {
      try {
        // Don't allow dropping on itself or if target is empty
        if (sourceItem.id === targetItem.id || !targetItem.id) {
          return;
        }

        await moveFolder(sourceItem.id, {
          parent_folder_id:
            targetItem.id === 'parent_div' ? undefined : targetItem.id,
        });

        console.log('Carpeta movida correctamente');
      } catch (error) {
        console.error('Error moving folder:', error);
      }
    },
    [moveFolder],
  );

  // Enhanced loading skeleton
  if (loading) {
    return (
      <div className='h-full flex flex-col gap-0'>
        <div className='p-4 border-b border-border/50'>
          <div className='flex items-center gap-2'>
            <div className='relative flex-1'>
              <Skeleton className='h-8 w-full' />
            </div>
            <Skeleton className='h-8 w-8 rounded-md' />
          </div>
        </div>
        <div className='p-4 flex-1 space-y-3'>
          {/* Skeleton folder items */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className='flex items-center gap-3 px-2 py-2.5'>
              <Skeleton className='size-4 rounded-sm' />
              <Skeleton className='h-4 flex-1 max-w-[180px]' />
              <Skeleton className='size-4 rounded-full ml-auto' />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Enhanced error state
  if (error) {
    return (
      <div className='h-full flex flex-col gap-0'>
        <div className='p-6 flex-1 flex items-center justify-center'>
          <div className='text-center max-w-sm'>
            <div className='mb-4 flex justify-center'>
              <div className='rounded-full bg-destructive/10 p-3'>
                <FileText className='h-8 w-8 text-destructive' />
              </div>
            </div>
            <h3 className='text-sm font-semibold mb-2'>
              Error al cargar carpetas
            </h3>
            <p className='text-xs text-muted-foreground mb-4'>{error}</p>
            <Button
              variant='outline'
              size='sm'
              onClick={() => window.location.reload()}
              className='gap-2'
            >
              <Loader2 className='h-3.5 w-3.5' />
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='h-full flex flex-col gap-0 overflow-hidden'>
        {/* Enhanced Header */}
        <div className='p-4 border-b border-border'>
          {/* Compact toolbar: search + create button */}
          <div className='flex items-center gap-2'>
  <InputGroup className="h-8">
    <InputGroupInput
      placeholder='Buscar carpetas...'
      value={searchQuery}
      onChange={e => setSearchQuery(e.target.value)}
      aria-label='Buscar carpetas'
      className=""
    />
    <InputGroupAddon>
      <Search className="size-4 text-muted-foreground" />
    </InputGroupAddon>
  </InputGroup>
  
  <Button
    size='icon'
    variant='default'
    className='size-8'
    onClick={() => setIsCreateDialogOpen(true)}
    title='Nueva carpeta'
    aria-label='Crear carpeta'
  >
    <Plus className='size-4' />
  </Button>
</div>

        </div>

        {/* Content Area */}
        <div className='p-4 flex-1 flex flex-col min-h-0 overflow-y-auto'>
          {treeData.length === 0 ? (
            <div className='flex-1 flex items-center justify-center p-6'>
              <div className='text-center max-w-xs'>
                <div className='mb-4 flex justify-center'>
                  <div className='rounded-full bg-primary/10 p-4'>
                    {searchQuery.trim() ? (
                      <Search className='h-8 w-8 text-primary/60' />
                    ) : (
                      <Sparkles className='h-8 w-8 text-primary/60' />
                    )}
                  </div>
                </div>
                <h3 className='text-sm font-semibold mb-2'>
                  {searchQuery.trim()
                    ? 'No se encontraron carpetas'
                    : '¡Comienza a organizar!'}
                </h3>
                <p className='text-xs text-muted-foreground mb-4'>
                  {searchQuery.trim()
                    ? 'Intenta con otro término de búsqueda'
                    : 'Crea tu primera carpeta para organizar tus documentos de forma eficiente'}
                </p>
                {!searchQuery.trim() && (
                  <Button
                    size='sm'
                    onClick={() => setIsCreateDialogOpen(true)}
                    className='gap-2'
                  >
                    <Plus className='h-3.5 w-3.5' />
                    Crear carpeta
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className='flex-1 overflow-auto custom-scrollbar'>
              <TreeView
                data={treeData}
                initialSelectedItemId={selectedFolderId}
                expandAll={true}
                onSelectChange={item => {
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
                className=''
              />
            </div>
          )}
        </div>
      </div>

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
