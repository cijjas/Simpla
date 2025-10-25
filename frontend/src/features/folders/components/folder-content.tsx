'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  FileText,
  Folder,
  FolderPlus,
  Archive,
  BookOpen,
  Bookmark,
  Tag,
  Users,
  Info,
  Plus,
} from 'lucide-react';
import { useFolderNormasWithData } from '../hooks/use-folder-normas-with-data';
import { useFoldersContext } from '../context/folders-context';
import { FolderTreeItem, FolderNormaWithNorma } from '../types';
import { buildFolderPath, findFolderById } from '../utils/folder-utils';
import { toast } from 'sonner';
import { NormaCard } from '@/features/normas/components/list/norma-card';

interface FolderContentProps {
  folder: FolderTreeItem | null;
  onFolderSelect?: (folder: FolderTreeItem | null) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  folder: Folder,
  'folder-plus': FolderPlus,
  archive: Archive,
  'book-open': BookOpen,
  'file-text': FileText,
  bookmark: Bookmark,
  tag: Tag,
  users: Users,
};

const getIcon = (iconName: string) => ICON_MAP[iconName] || Folder;

// Extracted reusable components
const FolderInfoPopover = ({ 
  folderPath, 
  currentFolder, 
  onFolderSelect 
}: { 
  folderPath: FolderTreeItem[]; 
  currentFolder: FolderTreeItem;
  onFolderSelect?: (folder: FolderTreeItem | null) => void;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8'
        title='Información de la carpeta'
      >
        <Info className='h-4 w-4' />
      </Button>
    </PopoverTrigger>
    <PopoverContent className='w-80'>
      <div className='space-y-3'>
        <h3 className='font-medium text-sm text-foreground'>Información de carpeta</h3>
        {folderPath.length > 0 && (
          <div className='space-y-2'>
            <h4 className='font-medium text-sm'>Ruta de carpeta</h4>
            <Breadcrumb>
              <BreadcrumbList>
                {folderPath.map((pathFolder, index) => {
                  const IconComponent = getIcon(pathFolder.icon);
                  const isLast = index === folderPath.length - 1;
                  
                  return (
                    <React.Fragment key={pathFolder.id}>
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage className='text-xs text-muted-foreground flex items-center gap-1'>
                            <IconComponent className='h-3 w-3' />
                            {pathFolder.name}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink
                            className='text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1'
                            onClick={() => onFolderSelect?.(pathFolder)}
                          >
                            <IconComponent className='h-3 w-3' />
                            {pathFolder.name}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}
        
        {currentFolder?.description && (
          <div className='space-y-2'>
            <h4 className='font-medium text-sm'>Descripción</h4>
            <p className='text-sm text-muted-foreground'>
              {currentFolder.description}
            </p>
          </div>
        )}
      </div>
    </PopoverContent>
  </Popover>
);

const FolderHeader = ({ 
  currentFolder,
  folderPath,
  badge,
  onFolderSelect,
  addButtonDisabled = false
}: { 
  currentFolder: FolderTreeItem;
  folderPath: FolderTreeItem[];
  badge: React.ReactNode;
  onFolderSelect?: (folder: FolderTreeItem | null) => void;
  addButtonDisabled?: boolean;
}) => (
  <div className='flex-shrink-0 border-b bg-background p-4'>
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-3'>
        {currentFolder?.color && (
          <div
            className='w-4 h-4 rounded-full'
            style={{ backgroundColor: currentFolder.color }}
          />
        )}
        <div>
          <div className='text-xl flex items-center leading-none font-semibold'>
            <span className='font-bold font-serif pe-4'>{currentFolder?.name}</span>
            {badge}
          </div>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <FolderInfoPopover 
          folderPath={folderPath} 
          currentFolder={currentFolder}
          onFolderSelect={onFolderSelect}
        />
        
      </div>
    </div>
  </div>
);

const EmptyFolderState = () => (
  <div className='flex flex-col items-center justify-center min-h-[400px] text-center py-8'>
    <div className='space-y-3 max-w-md'>
      <h2 className='text-2xl font-serif font-bold tracking-tight'>
        Selecciona una carpeta
      </h2>
      
      <p className='text-sm leading-relaxed text-muted-foreground'>
        Elige una carpeta del panel lateral para ver su contenido y las normas organizadas dentro de ella.
      </p>
    </div>
  </div>
);

export function FolderContent({ folder, onFolderSelect }: FolderContentProps) {
  const { 
    normas: normasWithDetails, 
    folderWithNormas,
    loading: normasDetailsLoading,
    error: folderError,
    removeNormaFromFolder: _removeNormaFromFolder,
    addNormaToFolder: _addNormaToFolder,
    updateFolderNorma
  } = useFolderNormasWithData(folder?.id || '');
    
  const { folders } = useFoldersContext();
  
  const [editingNorma, setEditingNorma] = useState<{
    id: string;
    normaId: number;
    notes: string;
  } | null>(null);
  const [isEditNotesOpen, setIsEditNotesOpen] = useState(false);

  const loading = normasDetailsLoading;
  const error = folderError;

  const currentFolder = folder ? findFolderById(folders, folder.id) : null;
  const folderPath = currentFolder ? buildFolderPath(folders, currentFolder.id) : [];

  // Map normas with details - normasWithDetails is already NormaSummary[]
  const normasById = new Map(normasWithDetails.map(norma => [norma.infoleg_id, norma]));
  const combinedNormas = (folderWithNormas?.normas || [])
    .map((folderNorma: FolderNormaWithNorma) => ({
      folderNormaId: folderNorma.id,
      addedAt: folderNorma.added_at,
      notes: folderNorma.notes,
      norma: normasById.get(folderNorma.norma.id),
    }))
    .filter((item) => item.norma); // Only include normas that were successfully fetched

  const handleUpdateNotes = async (
    folderNormaId: string,
    normaId: number,
    notes: string,
  ) => {
    try {
      await updateFolderNorma(normaId, { notes });
      toast.success('Notas actualizadas');
      setIsEditNotesOpen(false);
      setEditingNorma(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al actualizar las notas'
      );
    }
  };

  if (!currentFolder) {
    return <EmptyFolderState />;
  }

  // Unified layout with different content based on state
  const getContentBadge = () => {
    if (loading) {
      return <Skeleton className='h-5 w-20 mt-1' />;
    }
    if (error) {
      return <Badge variant='destructive' className='mt-1'>Error</Badge>;
    }
    return (
      <Badge variant='secondary' className=''>
        <span className='text-xs'>
          {combinedNormas.length} norma{combinedNormas.length !== 1 ? 's' : ''}
        </span>
      </Badge>
    );
  };

  const getMainContent = () => {
    if (loading) {
      return (
        <div className='space-y-6 '>
          {/* Subfolders skeleton */}
          <div>
            <div className='bg-background border-b'>
              <Skeleton className='h-5 w-24 mx-4 my-2' />
            </div>
            <div className='p-4'>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2'>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className='aspect-[4/3] rounded-lg border bg-muted/30 animate-pulse'>
                    <div className='p-3 flex flex-col h-full'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Skeleton className='h-4 w-4 rounded' />
                        <Skeleton className='h-4 flex-1' />
                      </div>
                      <Skeleton className='h-3 w-20 mt-auto' />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Normas skeleton */}
          <div>
            <div className='bg-background border-t border-b'>
              <Skeleton className='h-5 w-40 mx-4 my-2' />
            </div>
            <div className='p-4'>
              <section
                className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                style={{
                  WebkitMaskImage:
                    'linear-gradient(to bottom, black 70%, transparent 100%)',
                  maskImage:
                    'linear-gradient(to bottom, black 70%, transparent 100%)',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                }}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card
                    key={i}
                    className='flex h-full flex-col bg-card rounded-xl animate-pulse'
                  >
                    <CardContent className='flex grow flex-col gap-3 p-4'>
                      <div className='h-36 w-full bg-muted rounded-lg mt-auto' />
                      <div className='flex-1' />
                      <div className='h-7 w-3/4 mb-2 bg-muted rounded' />
                      <div className='h-4 w-1/2 bg-muted rounded' />
                    </CardContent>
                  </Card>
                ))}
              </section>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className='text-center text-destructive py-8 px-4'>
          <p className='text-sm'>Error: {error}</p>
        </div>
      );
    }

    return (
      <>
        {/* Subfolders Section */}
        {currentFolder?.subfolders && currentFolder.subfolders.length > 0 && (
          <>
            <div className='sticky top-0 z-10 bg-background border-b'>
              <h3 className='text-md font-medium font-serif text-start px-4 py-2'>
                Carpetas hijas
              </h3>
            </div>
            <div className='p-4'>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2'>
                {currentFolder.subfolders.map(subfolder => {
                  const IconComponent = getIcon(subfolder.icon);
                  return (
                    <Card
                      key={subfolder.id}
                      className='shadow-none py-0 g-0 cursor-pointer bg-muted/30 hover:bg-muted/70 transition-colors aspect-[4/3]'
                      onClick={() => onFolderSelect?.(subfolder)}
                    >
                      <CardContent className='p-3 flex flex-col g-0'>
                        <div className='flex items-center gap-2 mb-2'>
                          <IconComponent className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                          <h4 className='font-medium text-sm truncate flex-1'>
                            {subfolder.name}
                          </h4>
                          {subfolder.color && (
                            <div
                              className='w-3 h-3 rounded-full flex-shrink-0'
                              style={{ backgroundColor: subfolder.color }}
                            />
                          )}
                        </div>
                        <div className=''>
                          <span className='text-xs text-muted-foreground'>
                            {subfolder.norma_count} documentos
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Normas Section */}
        <>
          <div className='sticky top-0 z-10 bg-background border-b border-t'>
            <h3 className='text-md font-medium font-serif text-start px-4 py-2'>
              Normas en esta carpeta
            </h3>
          </div>
          <div className='p-4'>
            {combinedNormas.length === 0 ? (
              <div className='flex flex-col items-center justify-center min-h-[400px] text-center py-8'>
                
                <div className='space-y-3 max-w-md mt-6'>
                  <h2 className='text-2xl font-serif font-bold tracking-tight'>
                    No hay normas en esta carpeta
                  </h2>
                  
                  <p className='text-sm leading-relaxed text-muted-foreground'>
                    Esta carpeta está vacía. Agrega normas para organizarlas y poder acceder a ellas fácilmente.
                  </p>
                </div>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {combinedNormas.map((item) => (
                  <div key={item.folderNormaId}>
                    <NormaCard norma={item.norma!} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      </>
    );
  };

  return (
    <>
      <div className='h-full flex flex-col overflow-hidden'>
        <FolderHeader
          currentFolder={currentFolder}
          folderPath={folderPath}
          badge={getContentBadge()}
          onFolderSelect={onFolderSelect}
          addButtonDisabled={loading || !!error}
        />

        <div className='flex-1 overflow-y-auto bg-muted/30'>
          {getMainContent()}
        </div>
      </div>

      {/* Edit Notes Dialog */}
      <Dialog open={isEditNotesOpen} onOpenChange={setIsEditNotesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Notas</DialogTitle>
          </DialogHeader>
          {editingNorma && (
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Textarea
                  value={editingNorma.notes}
                  onChange={e => {
                    const value = e.target.value;
                    if (value.length <= 500) {
                      setEditingNorma(prev =>
                        prev ? { ...prev, notes: value } : null
                      );
                    }
                  }}
                  placeholder='Agrega tus notas sobre esta norma...'
                  maxLength={500}
                  rows={4}
                  className='w-full resize-none break-words whitespace-pre-wrap'
                />
                <div className='flex justify-between text-xs text-muted-foreground'>
                  <span>Máximo 500 caracteres</span>
                  <span
                    className={
                      editingNorma.notes.length > 450
                        ? 'text-orange-500'
                        : editingNorma.notes.length > 480
                          ? 'text-red-500'
                          : ''
                    }
                  >
                    {editingNorma.notes.length}/500
                  </span>
                </div>
              </div>
              <div className='flex justify-end gap-2'>
                <Button
                  variant='outline'
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
                      handleUpdateNotes(
                        editingNorma.id,
                        editingNorma.normaId,
                        editingNorma.notes
                      );
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