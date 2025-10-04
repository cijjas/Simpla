'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutGrid, List, Folder } from 'lucide-react';
import ResultCard from '@/features/infoleg/busqueda/norma-card';
import ResultListItem from '@/features/infoleg/busqueda/norma-list-item';
import { useFolderNormasWithData } from '../hooks/use-folder-normas-with-data';
import { FolderTreeItem } from '../types';

interface SimpleFolderContentProps {
  folder: FolderTreeItem | null;
}

export function SimpleFolderContent({ folder }: SimpleFolderContentProps) {
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const { normas, loading, error } = useFolderNormasWithData(folder?.id || '');

  if (!folder) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Folder className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm">Selecciona una carpeta para ver su contenido</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {folder.color && (
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: folder.color }}
              />
            )}
            {folder.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {folder.color && (
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: folder.color }}
              />
            )}
            {folder.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (normas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {folder.color && (
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: folder.color }}
              />
            )}
            {folder.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Esta carpeta está vacía</h3>
            <p className="text-muted-foreground mb-4">
              Agrega normas a esta carpeta desde las páginas de normas individuales.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {folder.color && (
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: folder.color }}
              />
            )}
            {folder.name}
          </CardTitle>
          
          {/* View Toggle */}
          <ToggleGroup type="single" value={view} onValueChange={(value: 'list' | 'grid') => value && setView(value)}>
            <ToggleGroupItem value="grid" aria-label="Vista de cuadrícula">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Vista de lista">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <p className="text-sm text-muted-foreground">
          {normas.length} {normas.length === 1 ? 'norma' : 'normas'}
        </p>
      </CardHeader>
      
      <CardContent>
        {view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {normas.map((norma) => (
              <ResultCard key={norma.id} norma={norma} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {normas.map((norma) => (
              <ResultListItem key={norma.id} norma={norma} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
