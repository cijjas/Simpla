'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, Plus, MoreHorizontal, Trash2, Edit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { useSession } from 'next-auth/react';

// Types
interface FolderTreeItem {
  id: string;
  name: string;
  description?: string;
  level: number;
  color: string;
  icon: string;
  order_index: number;
  norma_count: number;
  subfolders: FolderTreeItem[];
}

interface CreateFolderData {
  name: string;
  description?: string;
  parent_folder_id?: string;
  color: string;
  icon: string;
}

export default function FolderTreeComponent() {
  const { data: session, status } = useSession();
  const [folders, setFolders] = useState<FolderTreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderTreeItem | null>(null);
  const [createForm, setCreateForm] = useState<CreateFolderData>({
    name: '',
    description: '',
    parent_folder_id: undefined,
    color: '#3B82F6',
    icon: 'folder'
  });

  // Fetch folders from API
  const fetchFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching folders with token:', session?.user?.accessToken ? 'Present' : 'Missing');
      
      // For now, use test endpoint that doesn't require authentication
      const response = await fetch('/api/test-folders');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setFolders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching folders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create new folder
  const createFolder = async (folderData: CreateFolderData) => {
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.accessToken}`,
        },
        body: JSON.stringify(folderData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await fetchFolders(); // Refresh the folder list
      setIsCreateDialogOpen(false);
      setCreateForm({
        name: '',
        description: '',
        parent_folder_id: undefined,
        color: '#3B82F6',
        icon: 'folder'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
      console.error('Error creating folder:', err);
    }
  };

  // Delete folder
  const deleteFolder = async (folderId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta carpeta y todas sus subcarpetas?')) {
      return;
    }

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await fetchFolders(); // Refresh the folder list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete folder');
      console.error('Error deleting folder:', err);
    }
  };

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }
    
    if (status === 'unauthenticated') {
      setError('Debes iniciar sesión para ver tus carpetas');
      setLoading(false);
      return;
    }
    
    if (session?.user?.accessToken) {
      fetchFolders();
    }
  }, [session?.user?.accessToken, status]);


  const handleCreateFolder = () => {
    createFolder(createForm);
  };

  const handleEditFolder = () => {
    // TODO: Implement edit functionality
    setIsEditDialogOpen(false);
  };

  const renderFolder = (folder: FolderTreeItem, depth: number = 0, isSubfolder: boolean = false): React.JSX.Element => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasSubfolders = folder.subfolders.length > 0;
    const isActive = selectedFolder === folder.id;

    const folderContent = (
      <>
        <Folder className="h-4 w-4" />
        <span className="truncate">{folder.name}</span>
        <div 
          className="ml-auto w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: folder.color }}
        />
        {hasSubfolders && (
          <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              setEditingFolder(folder);
              setIsEditDialogOpen(true);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => deleteFolder(folder.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );

    // If folder has no subfolders, render as direct menu item
    if (!hasSubfolders) {
      const MenuComponent = isSubfolder ? SidebarMenuSubItem : SidebarMenuItem;
      const ButtonComponent = isSubfolder ? SidebarMenuSubButton : SidebarMenuButton;
      
      return (
        <MenuComponent key={folder.id}>
          <ButtonComponent 
            isActive={isActive}
            onClick={() => setSelectedFolder(folder.id)}
            className="group"
          >
            {folderContent}
          </ButtonComponent>
        </MenuComponent>
      );
    }

    // If folder has subfolders, render as collapsible
    const MenuComponent = isSubfolder ? SidebarMenuSubItem : SidebarMenuItem;
    
    return (
      <MenuComponent key={folder.id}>
        <Collapsible
          open={isExpanded}
          onOpenChange={(open) => {
            const newExpanded = new Set(expandedFolders);
            if (open) {
              newExpanded.add(folder.id);
            } else {
              newExpanded.delete(folder.id);
            }
            setExpandedFolders(newExpanded);
          }}
          className="group/collapsible"
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuButton 
              isActive={isActive}
              onClick={() => setSelectedFolder(folder.id)}
              className="group"
            >
              {folderContent}
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {folder.subfolders.map((subfolder) => renderFolder(subfolder, depth + 1, true))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </MenuComponent>
    );
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando carpetas...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-center text-red-600">
          <p className="text-sm">Error: {error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchFolders}
            className="mt-2"
          >
            Reintentar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Mis Carpetas</h3>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Nueva
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Carpeta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Nombre de la carpeta"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Descripción de la carpeta"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="color"
                    value={createForm.color}
                    onChange={(e) => setCreateForm({ ...createForm, color: e.target.value })}
                    className="w-10 h-8 rounded border"
                  />
                  <Input
                    value={createForm.color}
                    onChange={(e) => setCreateForm({ ...createForm, color: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateFolder} disabled={!createForm.name.trim()}>
                  Crear Carpeta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <SidebarMenu>
        {folders.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm">No tienes carpetas aún</p>
            <p className="text-xs text-muted-foreground/70">Crea tu primera carpeta para organizar tus normas</p>
          </div>
        ) : (
          folders.map(folder => renderFolder(folder))
        )}
      </SidebarMenu>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Carpeta</DialogTitle>
          </DialogHeader>
          {editingFolder && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  defaultValue={editingFolder.name}
                  placeholder="Nombre de la carpeta"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  defaultValue={editingFolder.description}
                  placeholder="Descripción de la carpeta"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleEditFolder}>
                  Guardar Cambios
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
