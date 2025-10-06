'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { FileText, Folder, FolderPlus, Archive, BookOpen, Star, Tag, Users, Loader2 } from 'lucide-react';
import { useFolderNormas } from '../hooks/use-folders';
import { useFolderNormasWithData } from '../hooks/use-folder-normas-with-data';
import { useFoldersContext } from '../context/folders-context';
import { FolderTreeItem } from '../types';
import { buildFolderPath, findFolderById } from '../utils/folder-utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface FolderContentProps {
  folder: FolderTreeItem | null;
  onFolderSelect?: (folder: FolderTreeItem | null) => void;
}

export function FolderContent({ folder, onFolderSelect }: FolderContentProps) {
  const { folderWithNormas, loading: folderLoading, error: folderError, removeNormaFromFolder, updateFolderNorma } = useFolderNormas(folder?.id || '');
  const { normas: normasWithDetails, loading: normasDetailsLoading } = useFolderNormasWithData(folder?.id || '');
  const { folders } = useFoldersContext();
  const [editingNorma, setEditingNorma] = useState<{ id: string; normaId: number; notes: string } | null>(null);
  const [isEditNotesOpen, setIsEditNotesOpen] = useState(false);
  
  const loading = folderLoading || normasDetailsLoading;
  const error = folderError;

  // Get the updated folder from context to ensure we have the latest data
  const currentFolder = folder ? findFolderById(folders, folder.id) : null;
  
  // Build breadcrumb path
  const folderPath = currentFolder ? buildFolderPath(folders, currentFolder.id) : [];

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

  if (!currentFolder) {
    return (
      <div className="bg-background text-foreground flex flex-col gap-6 rounded-xl py-6">
        <div className="px-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm">Selecciona una carpeta para ver su contenido</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-background text-foreground flex flex-col gap-6 rounded-xl py-6">
        <div className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 space-y-4">
          {/* Breadcrumb Navigation */}
          {folderPath.length > 1 && (
            <Breadcrumb>
              <BreadcrumbList>
                {folderPath.map((pathFolder, index) => {
                  const IconComponent = getIcon(pathFolder.icon);
                  return (
                    <React.Fragment key={pathFolder.id}>
                      <BreadcrumbItem>
                        {index === folderPath.length - 1 ? (
                          <BreadcrumbPage className="text-xs text-muted-foreground flex items-center gap-1">
                            <IconComponent className="h-3 w-3" />
                            {pathFolder.name}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink 
                            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
                            onClick={() => onFolderSelect?.(pathFolder)}
                          >
                            <IconComponent className="h-3 w-3" />
                            {pathFolder.name}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < folderPath.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          )}
          
          {/* Header with title and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentFolder?.color && (
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: currentFolder.color }}
                />
              )}
              <div>
                <div className="text-xl flex items-center leading-none font-semibold">
                  <span className="font-bold pe-2" >{currentFolder?.name}</span>
                  <Badge variant="secondary" className="mt-1">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Cargando...
                  </Badge>  
                </div>
                 {/* Description */}
                  {currentFolder?.description && (
                      <p className="text-sm text-muted-foreground">{currentFolder.description}</p>
                  )}
                
              </div>
            </div>
          </div>
        </div>
        <div className="px-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Cargando normas...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background text-foreground flex flex-col gap-6 rounded-xl py-6">
        <div className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 space-y-4">
          {/* Breadcrumb Navigation */}
          {folderPath.length > 1 && (
            <Breadcrumb>
              <BreadcrumbList>
                {folderPath.map((pathFolder, index) => {
                  const IconComponent = getIcon(pathFolder.icon);
                  return (
                    <React.Fragment key={pathFolder.id}>
                      <BreadcrumbItem>
                        {index === folderPath.length - 1 ? (
                          <BreadcrumbPage className="text-xs text-muted-foreground flex items-center gap-1">
                            <IconComponent className="h-3 w-3" />
                            {pathFolder.name}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink 
                            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
                            onClick={() => onFolderSelect?.(pathFolder)}
                          >
                            <IconComponent className="h-3 w-3" />
                            {pathFolder.name}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < folderPath.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          )}
          
          {/* Header with title and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentFolder?.color && (
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: currentFolder.color }}
                />
              )}
              <div>
                <div className="text-xl flex items-center leading-none font-semibold">
                  <span className="font-bold pe-2" >{currentFolder?.name}</span>
                  <Badge variant="destructive" className="mt-1">
                    Error
                  </Badge>  
                </div>
                 {/* Description */}
                  {currentFolder?.description && (
                      <p className="text-sm text-muted-foreground">{currentFolder.description}</p>
                  )}
                
              </div>
            </div>
          </div>
        </div>
        <div className="px-6">
          <div className="text-center text-destructive py-8">
            <p className="text-sm">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  const _handleRemoveNorma = async (normaId: number, normaTitle: string) => {
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

  // Combine folder normas metadata with detailed norma data
  const combinedNormas = (folderWithNormas?.normas || []).map(folderNorma => {
    const normaDetails = normasWithDetails.find(detail => detail.id === folderNorma.norma.id);
    return {
      ...folderNorma,
      normaDetails
    };
  });

  return (
    <>
      <div className="bg-background text-foreground flex flex-col gap-6 rounded-xl py-6">
        <div className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 space-y-4">
          {/* Breadcrumb Navigation */}
          {folderPath.length > 1 && (
            <Breadcrumb>
              <BreadcrumbList>
                {folderPath.map((pathFolder, index) => {
                  const IconComponent = getIcon(pathFolder.icon);
                  return (
                    <React.Fragment key={pathFolder.id}>
                      <BreadcrumbItem>
                        {index === folderPath.length - 1 ? (
                          <BreadcrumbPage className="text-xs text-muted-foreground flex items-center gap-1">
                            <IconComponent className="h-3 w-3" />
                            {pathFolder.name}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink 
                            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
                            onClick={() => onFolderSelect?.(pathFolder)}
                          >
                            <IconComponent className="h-3 w-3" />
                            {pathFolder.name}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < folderPath.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          )}
          
          {/* Header with title and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentFolder?.color && (
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: currentFolder.color }}
                />
              )}
              <div>
                <div className="text-xl flex items-center leading-none font-semibold">
                  <span className="font-bold pe-2" >{currentFolder?.name}</span>
                  <Badge variant="secondary" className="mt-1">
                                  <span className="text-xs text-muted-foreground">
                  {combinedNormas.length} norma{combinedNormas.length !== 1 ? 's' : ''}
                </span>
                </Badge>  
                </div>
                 {/* Description */}
                  {currentFolder?.description && (
                      <p className="text-sm text-muted-foreground">{currentFolder.description}</p>
                  )}
                
              </div>
            </div>
          </div>
          
         
        </div>
        <div className="px-6 space-y-6">
          {/* Subfolders Section */}
          {currentFolder?.subfolders && currentFolder.subfolders.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">Subcarpetas</h3>
                <div className="flex-1 h-px bg-border"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {currentFolder.subfolders.map((subfolder) => {
                  const IconComponent = getIcon(subfolder.icon);
                  return (
                    <Card 
                      key={subfolder.id} 
                      className="shadow-none py-0 g-0 cursor-pointer bg-muted/30 hover:bg-muted/70 transition-colors aspect-[4/3]"
                      onClick={() => onFolderSelect?.(subfolder)}
                    >
                      <CardContent className="p-3 flex flex-col g-0">
                        <div className="flex items-center gap-2 mb-2">
                          <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <h4 className="font-medium text-sm truncate flex-1">{subfolder.name}</h4>
                          {subfolder.color && (
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: subfolder.color }}
                            />
                          )}
                        </div>
                        <div className="">
                          <span className="text-xs text-muted-foreground">
                            {subfolder.norma_count} documentos
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Normas Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">Normas</h3>
              <div className="flex-1 h-px bg-border"></div>
            </div>
            {combinedNormas.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm">No hay normas en esta carpeta</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Agrega normas para organizarlas
                </p>
              </div>
            ) : (
            <div className="space-y-2">
              {combinedNormas.map((item) => {
                const normaDetails = item.normaDetails;
                const folderNorma = item;
                
                return (
                  <Link 
                    key={folderNorma.id}
                    href={`/norma/${normaDetails?.id || folderNorma.norma.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between px-4 py-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Document icon */}
                        <div className="w-8 h-8 rounded-lg border border-muted-foreground/30 bg-muted/30 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* First line: Title */}
                          <div className="font-medium text-sm line-clamp-1">
                            {normaDetails?.tituloSumarioFormateado || 
                             normaDetails?.tituloResumidoFormateado || 
                             folderNorma.norma.titulo_resumido}
                          </div>
                          
                          {/* Second line: Document info */}
                          <div className="text-xs text-muted-foreground mt-1">
                            {normaDetails?.tipoNorma || folderNorma.norma.tipo_norma || 'Documento'} • 
                            {normaDetails?.jurisdiccion || folderNorma.norma.jurisdiccion} • 
                            Agregada el {format(new Date(folderNorma.added_at), 'dd/MM/yyyy', { locale: es })}
                          </div>
                          
                          {/* Third line: Notes if available */}
                          {folderNorma.notes && (
                            <div className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">
                              📝 {folderNorma.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Right indicator/color dot */}
                      {currentFolder?.color && (
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: currentFolder.color }}
                        />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Notes Dialog */}
      <Dialog open={isEditNotesOpen} onOpenChange={setIsEditNotesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Notas</DialogTitle>
          </DialogHeader>
          {editingNorma && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={editingNorma.notes}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 500) {
                      setEditingNorma(prev => prev ? { ...prev, notes: value } : null);
                    }
                  }}
                  placeholder="Agrega tus notas sobre esta norma..."
                  maxLength={500}
                  rows={4}
                  className="w-full resize-none break-words whitespace-pre-wrap"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Máximo 500 caracteres</span>
                  <span className={editingNorma.notes.length > 450 ? 'text-orange-500' : editingNorma.notes.length > 480 ? 'text-red-500' : ''}>
                    {editingNorma.notes.length}/500
                  </span>
                </div>
              </div>
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
