'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, FileText, MoreHorizontal, Edit, Trash2, ExternalLink, StickyNote } from 'lucide-react';
import { useFolderNormas } from '../hooks/use-folders';
import { FolderTreeItem } from '../types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FolderContentProps {
  folder: FolderTreeItem | null;
}

export function FolderContent({ folder }: FolderContentProps) {
  const { folderWithNormas, loading, error, removeNormaFromFolder, updateFolderNorma } = useFolderNormas(folder?.id || '');
  const [editingNorma, setEditingNorma] = useState<{ id: string; normaId: number; notes: string } | null>(null);
  const [isEditNotesOpen, setIsEditNotesOpen] = useState(false);

  if (!folder) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm">Selecciona una carpeta para ver su contenido</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: folder.color }}
            />
            {folder.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Cargando normas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: folder.color }}
            />
            {folder.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive py-8">
            <p className="text-sm">Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleRemoveNorma = async (normaId: number, normaTitle: string) => {
    if (!confirm(`¿Estás seguro de que quieres quitar "${normaTitle}" de esta carpeta?`)) {
      return;
    }

    try {
      await removeNormaFromFolder(normaId);
      toast.success('Norma quitada de la carpeta');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al quitar la norma');
    }
  };

  const handleUpdateNotes = async (folderNormaId: string, normaId: number, notes: string) => {
    try {
      await updateFolderNorma(normaId, { notes });
      toast.success('Notas actualizadas');
      setIsEditNotesOpen(false);
      setEditingNorma(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar las notas');
    }
  };

  const normas = folderWithNormas?.normas || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: folder.color }}
              />
              {folder.name}
              <Badge variant="secondary" className="ml-2">
                {normas.length} norma{normas.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Agregar Norma
            </Button>
          </div>
          {folder.description && (
            <p className="text-sm text-muted-foreground mt-2">{folder.description}</p>
          )}
        </CardHeader>
        <CardContent>
          {normas.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm">Esta carpeta está vacía</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Agrega normas para organizarlas
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {normas.map((folderNorma) => (
                <Card key={folderNorma.id} className="border-l-4" style={{ borderLeftColor: folder.color }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm leading-tight mb-1">
                          {folderNorma.norma.titulo_resumido}
                        </h4>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                          {folderNorma.norma.tipo_norma && (
                            <Badge variant="outline" className="text-xs">
                              {folderNorma.norma.tipo_norma}
                            </Badge>
                          )}
                          {folderNorma.norma.jurisdiccion && (
                            <span>{folderNorma.norma.jurisdiccion}</span>
                          )}
                          {folderNorma.norma.sancion && (
                            <span>Sanción: {format(new Date(folderNorma.norma.sancion), 'dd/MM/yyyy', { locale: es })}</span>
                          )}
                        </div>
                        {folderNorma.notes && (
                          <div className="bg-muted/50 rounded p-2 mt-2">
                            <div className="flex items-center gap-1 mb-1">
                              <StickyNote className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">Notas:</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{folderNorma.notes}</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Agregada el {format(new Date(folderNorma.added_at), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a
                              href={`/norma/${folderNorma.norma.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ver norma
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingNorma({
                                id: folderNorma.id,
                                normaId: folderNorma.norma.id,
                                notes: folderNorma.notes || '',
                              });
                              setIsEditNotesOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar notas
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRemoveNorma(folderNorma.norma.id, folderNorma.norma.titulo_resumido)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Quitar de carpeta
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Notes Dialog */}
      <Dialog open={isEditNotesOpen} onOpenChange={setIsEditNotesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Notas</DialogTitle>
          </DialogHeader>
          {editingNorma && (
            <div className="space-y-4">
              <Textarea
                value={editingNorma.notes}
                onChange={(e) => setEditingNorma(prev => prev ? { ...prev, notes: e.target.value } : null)}
                placeholder="Agrega tus notas sobre esta norma..."
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditNotesOpen(false);
                    setEditingNorma(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (editingNorma) {
                      handleUpdateNotes(editingNorma.id, editingNorma.normaId, editingNorma.notes);
                    }
                  }}
                >
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
