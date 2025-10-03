'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Folder, FolderPlus, Archive, BookOpen, Star, Tag, Users, Loader2 } from 'lucide-react';
import { useFoldersContext } from '../context/folders-context';
import { useApi } from '@/features/auth/hooks/use-api';
import { FolderTreeItem } from '../types';
import { toast } from 'sonner';

interface AddToFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  normaId: number;
  normaTitle?: string;
}

export function AddToFolderDialog({ isOpen, onClose, normaId, normaTitle }: AddToFolderDialogProps) {
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const [originalFolderIds, setOriginalFolderIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const { folders, fetchFolders } = useFoldersContext();
  const api = useApi();

  // Icon mapping
  const getIcon = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      'folder': Folder,
      'folder-plus': FolderPlus,
      'archive': Archive,
      'book-open': BookOpen,
      'star': Star,
      'tag': Tag,
      'users': Users,
    };
    return iconMap[iconName] || Folder;
  };

  // Load which folders currently contain this norma and refresh folder list
  useEffect(() => {
    if (isOpen && normaId) {
      const loadData = async () => {
        console.log('AddToFolderDialog: Refreshing folders...');
        // Refresh the folders list to ensure we have the latest folders
        await fetchFolders();
        console.log('AddToFolderDialog: Folders refreshed, current count:', folders.length);
        await loadCurrentFolders();
      };
      loadData();
    }
  }, [isOpen, normaId, fetchFolders]);

  const loadCurrentFolders = async () => {
    try {
      setLoadingFolders(true);
      const folderIds = await api.get<string[]>(`/api/folders/normas/${normaId}/`);
      const folderIdSet = new Set(folderIds);
      setOriginalFolderIds(folderIdSet);
      setSelectedFolderIds(new Set(folderIdSet)); // Start with current folders selected
    } catch (error) {
      console.error('Error loading current folders:', error);
      toast.error('Error al cargar las carpetas actuales');
    } finally {
      setLoadingFolders(false);
    }
  };

  // Flatten folders for easier iteration (including subfolders)
  const flattenFolders = (folders: FolderTreeItem[], level = 0): Array<FolderTreeItem & { level: number }> => {
    const result: Array<FolderTreeItem & { level: number }> = [];
    
    for (const folder of folders) {
      result.push({ ...folder, level });
      if (folder.subfolders && folder.subfolders.length > 0) {
        result.push(...flattenFolders(folder.subfolders, level + 1));
      }
    }
    
    return result;
  };

  const flatFolders = flattenFolders(folders);

  // Handle checkbox toggle
  const handleFolderToggle = (folderId: string, checked: boolean) => {
    setSelectedFolderIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(folderId);
      } else {
        newSet.delete(folderId);
      }
      return newSet;
    });
  };

  // Build folder display with checkboxes
  const buildFolderDisplay = () => {
    if (loadingFolders) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Cargando carpetas...</span>
        </div>
      );
    }

    console.log('AddToFolderDialog: Building folder display with', flatFolders.length, 'folders:', flatFolders.map(f => f.name));
    return flatFolders.map((folder) => {
      const IconComponent = getIcon(folder.icon);
      const isSelected = selectedFolderIds.has(folder.id);
      const wasOriginallySelected = originalFolderIds.has(folder.id);
      
      return (
        <div
          key={folder.id}
          className={`flex items-center gap-3 p-2 mb-1 rounded-md cursor-pointer transition-colors hover:bg-accent/50 ${
            isSelected ? 'bg-accent/30' : ''
          }`}
          style={{ marginLeft: `${folder.level * 16}px` }}
          onClick={() => handleFolderToggle(folder.id, !isSelected)}
        >
          <Checkbox
            id={`folder-${folder.id}`}
            checked={isSelected}
            onCheckedChange={(checked: boolean) => handleFolderToggle(folder.id, checked)}
            onClick={(e) => e.stopPropagation()} // Prevent double toggle
          />
          {folder.color && (
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: folder.color }}
            />
          )}
          <IconComponent className="h-4 w-4 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{folder.name}</span>
              {wasOriginallySelected && (
                <span className="text-xs text-blue-600 font-medium whitespace-nowrap">
                  (en carpeta)
                </span>
              )}
            </div>
            {folder.description && (
              <span className="text-xs text-muted-foreground truncate block">
                {folder.description}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
            {folder.norma_count}
          </span>
        </div>
      );
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Calculate what needs to be added and removed
      const foldersToAdd = Array.from(selectedFolderIds).filter(id => !originalFolderIds.has(id));
      const foldersToRemove = Array.from(originalFolderIds).filter(id => !selectedFolderIds.has(id));
      
      if (foldersToAdd.length === 0 && foldersToRemove.length === 0) {
        toast.info('No hay cambios para aplicar');
        return;
      }

      let addedCount = 0;
      let removedCount = 0;
      let errors: string[] = [];

      // Remove from folders first
      for (const folderId of foldersToRemove) {
        try {
          await api.delete(`/api/folders/${folderId}/normas/${normaId}/`);
          removedCount++;
          console.log(`Successfully removed norma ${normaId} from folder ${folderId}`);
        } catch (error) {
          console.error(`Error removing from folder ${folderId}:`, error);
          errors.push(`Error removiendo de una carpeta`);
        }
      }

      // Add to folders
      for (const folderId of foldersToAdd) {
        try {
          await api.post(`/api/folders/${folderId}/normas/`, {
            norma_id: normaId,
            notes: notes || undefined
          });
          addedCount++;
          console.log(`Successfully added norma ${normaId} to folder ${folderId}`);
        } catch (error) {
          console.error(`Error adding to folder ${folderId}:`, error);
          errors.push(`Error agregando a una carpeta`);
        }
      }

      // Show results
      if (errors.length > 0) {
        toast.error(`Algunas operaciones fallaron: ${errors.join(', ')}`);
      }

      if (addedCount > 0 && removedCount > 0) {
        toast.success(`Norma agregada a ${addedCount} carpeta(s) y removida de ${removedCount} carpeta(s)`);
      } else if (addedCount > 0) {
        toast.success(`Norma agregada a ${addedCount} carpeta(s)`);
      } else if (removedCount > 0) {
        toast.success(`Norma removida de ${removedCount} carpeta(s)`);
      }

      onClose();
      setSelectedFolderIds(new Set());
      setOriginalFolderIds(new Set());
      setNotes('');
    } catch (error) {
      console.error('Error updating folder assignments:', error);
      toast.error('Error al actualizar las carpetas');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedFolderIds(new Set());
    setOriginalFolderIds(new Set());
    setNotes('');
  };

  // Calculate summary for button text
  const addCount = Array.from(selectedFolderIds).filter(id => !originalFolderIds.has(id)).length;
  const removeCount = Array.from(originalFolderIds).filter(id => !selectedFolderIds.has(id)).length;
  const hasChanges = addCount > 0 || removeCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gestionar Carpetas</DialogTitle>
          <DialogDescription>
            {normaTitle ? `Gestiona las carpetas de "${normaTitle}"` : 'Selecciona o deselecciona carpetas para esta norma'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Folder Selection */}
          <div>
            <Label htmlFor="folder-selection">Carpetas</Label>
            <ScrollArea className="h-48 w-full border rounded-md p-2 mt-2">
              {folders.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Folder className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No tienes carpetas creadas</p>
                </div>
              ) : (
                <div>{buildFolderDisplay()}</div>
              )}
            </ScrollArea>
          </div>

          {/* Notes - only show for new additions */}
          {addCount > 0 && (
            <div>
              <Label htmlFor="notes">Notas para nuevas adiciones (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Agrega notas sobre esta norma..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
              />
            </div>
          )}

          {/* Summary */}
          {hasChanges && (
            <div className="text-sm text-muted-foreground bg-accent/50 p-3 rounded-md">
              {addCount > 0 && removeCount > 0 && (
                <p>Se agregará a {addCount} carpeta(s) y se quitará de {removeCount} carpeta(s)</p>
              )}
              {addCount > 0 && removeCount === 0 && (
                <p>Se agregará a {addCount} carpeta(s)</p>
              )}
              {addCount === 0 && removeCount > 0 && (
                <p>Se quitará de {removeCount} carpeta(s)</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading || loadingFolders}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!hasChanges || loading || loadingFolders}
          >
            {loading ? 'Actualizando...' : hasChanges ? 'Aplicar Cambios' : 'Sin Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
