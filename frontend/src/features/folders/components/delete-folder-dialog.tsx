'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { FolderTreeItem } from '../types';

interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: FolderTreeItem | null;
  onConfirm: (folderId: string) => Promise<void>;
}

export function DeleteFolderDialog({ 
  open, 
  onOpenChange, 
  folder, 
  onConfirm 
}: DeleteFolderDialogProps) {
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const handleOpenChange = useCallback((newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      // Reset state when dialog closes with a small delay to prevent race conditions
      setTimeout(() => {
        setDeleteConfirmationText('');
      }, 100);
    }
  }, [onOpenChange]);

  const handleConfirm = async () => {
    if (!folder || deleteConfirmationText !== folder.name) {
      return;
    }

    try {
      await onConfirm(folder.id);
    } catch (error) {
      // Error handling is done in the parent component
      // Re-throw the error so the parent can handle it
      throw error;
    }
  };

  const handleCancel = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        handleCancel();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, handleCancel]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleCancel}
    >
      <Card 
        className="w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>¿Eliminar carpeta?</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta acción no se puede deshacer. Se eliminará permanentemente la carpeta{' '}
            <strong>&quot;{folder?.name}&quot;</strong> y todas sus subcarpetas.
          </p>
          <p className="text-sm text-muted-foreground">
            Para confirmar, escribe el nombre de la carpeta:
          </p>
          <Input
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
            placeholder={folder?.name}
            className="w-full"
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={deleteConfirmationText !== folder?.name}
            >
              Eliminar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
