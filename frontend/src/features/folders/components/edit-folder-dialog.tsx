'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFolders } from '../hooks/use-folders';
import { FolderTreeItem, FolderUpdate } from '../types';
import { toast } from 'sonner';
import { Folder, FolderPlus, Archive, BookOpen, FileText, Star, Tag, Users } from 'lucide-react';

interface EditFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: FolderTreeItem | null;
}

const FOLDER_ICONS = [
  { value: 'folder', label: 'Carpeta', icon: Folder },
  { value: 'folder-plus', label: 'Carpeta Plus', icon: FolderPlus },
  { value: 'archive', label: 'Archivo', icon: Archive },
  { value: 'book-open', label: 'Libro', icon: BookOpen },
  { value: 'file-text', label: 'Documento', icon: FileText },
  { value: 'star', label: 'Favoritos', icon: Star },
  { value: 'tag', label: 'Etiqueta', icon: Tag },
  { value: 'users', label: 'Equipo', icon: Users },
];

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export function EditFolderDialog({ open, onOpenChange, folder }: EditFolderDialogProps) {
  const { updateFolder } = useFolders();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FolderUpdate>({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'folder',
  });

  // Update form data when folder changes
  useEffect(() => {
    if (folder) {
      setFormData({
        name: folder.name,
        description: folder.description || '',
        color: folder.color,
        icon: folder.icon,
      });
    }
  }, [folder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folder) return;
    
    if (!formData.name?.trim()) {
      toast.error('El nombre de la carpeta es requerido');
      return;
    }

    setLoading(true);
    try {
      await updateFolder(folder.id, formData);
      toast.success('Carpeta actualizada correctamente');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar la carpeta');
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
  };

  const selectedIcon = FOLDER_ICONS.find(icon => icon.value === formData.icon);

  if (!folder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Carpeta</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nombre *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nombre de la carpeta"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Descripción</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción opcional de la carpeta"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Icono</Label>
            <Select
              value={formData.icon}
              onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center">
                    {selectedIcon && <selectedIcon.icon className="h-4 w-4 mr-2" />}
                    {selectedIcon?.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FOLDER_ICONS.map((icon) => (
                  <SelectItem key={icon.value} value={icon.value}>
                    <div className="flex items-center">
                      <icon.icon className="h-4 w-4 mr-2" />
                      {icon.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 ${
                      formData.color === color ? 'border-gray-400' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                  />
                ))}
              </div>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-8 h-8 rounded border cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={formData.color}
                onChange={(e) => handleColorChange(e.target.value)}
                placeholder="#3B82F6"
                className="flex-1 text-sm"
              />
              <div
                className="w-6 h-6 rounded border"
                style={{ backgroundColor: formData.color }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.name?.trim()}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
