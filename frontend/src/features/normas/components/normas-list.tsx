'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  ExternalLink,
  LayoutGrid,
  List
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNormasSearch } from '../hooks/use-normas-search';
import { NormaCard } from './norma-card';

export function NormasList() {
  const {
    results: data,
    loading,
    handlePageChange: onPageChange,
    hasResults: _hasResults,
    totalCount,
    hasMore,
    currentPage,
    totalPages
  } = useNormasSearch();

  // View state management with localStorage persistence
  const STORAGE_KEY = 'normasViewPreference';
  const [view, setView] = useState<'list' | 'grid'>('grid');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'list' || saved === 'grid') {
      setView(saved);
    }
  }, []);

  const handleViewChange = (v: 'list' | 'grid') => {
    setView(v);
    localStorage.setItem(STORAGE_KEY, v);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificada';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const _getStatusColor = (estado?: string) => {
    switch (estado?.toLowerCase()) {
      case 'vigente':
        return 'bg-green-100 text-green-800';
      case 'derogada':
        return 'bg-red-100 text-red-800';
      case 'modificada':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const _getTypeColor = (tipo?: string) => {
    switch (tipo?.toLowerCase()) {
      case 'ley':
        return 'bg-blue-100 text-blue-800';
      case 'decreto':
        return 'bg-purple-100 text-purple-800';
      case 'resolución':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading skeletons
  if (loading) {
    if (view === 'grid') {
      return (
        <div className="px-6 py-4">
          <section
            className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
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
      );
    }

    // List skeleton - table rows
    return (
      <div className="h-full overflow-hidden">
        {/* Header skeleton */}
        <div className="bg-muted/50 border-b">
          <div className="grid grid-cols-12 gap-4 px-4 py-3">
            <Skeleton className="h-4 w-20 col-span-5" />
            <Skeleton className="h-4 w-16 col-span-2" />
            <Skeleton className="h-4 w-16 col-span-2" />
            <Skeleton className="h-4 w-16 col-span-2" />
            <Skeleton className="h-4 w-16 col-span-1" />
          </div>
        </div>
        
        {/* Row skeletons */}
        <div className="divide-y divide-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 px-4 py-3">
              <div className="col-span-5 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-4 w-24 col-span-2" />
              <Skeleton className="h-4 w-20 col-span-2" />
              <div className="col-span-1 flex justify-end gap-1">
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.normas.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No se encontraron normas</h3>
          <p className="text-muted-foreground">
            Intenta ajustar los filtros de búsqueda para encontrar más resultados.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasNextPage = hasMore;
  const hasPrevPage = (data?.offset || 0) > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Results Header with View Toggle and Pagination - Fixed */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b bg-background">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-sm font-medium">
              {totalCount.toLocaleString()} norma{totalCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Página {currentPage} de {totalPages}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Pagination Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={!hasPrevPage}
              onClick={() => onPageChange(0)}
              title="Primera página"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={!hasPrevPage}
              onClick={() => onPageChange(Math.max(0, (data?.offset || 0) - (data?.limit || 12)))}
              title="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={!hasNextPage}
              onClick={() => onPageChange((data?.offset || 0) + (data?.limit || 12))}
              title="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={!hasNextPage}
              onClick={() => onPageChange((totalPages - 1) * (data?.limit || 12))}
              title="Última página"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* View Toggle */}
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) => {
              if (value) handleViewChange(value as 'list' | 'grid');
            }}
          >
            <ToggleGroupItem value="grid" aria-label="Vista en cuadrícula">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Vista en lista">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Results Container - Fills space */}
      {view === 'grid' ? (
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.normas.map((norma) => (
              <NormaCard key={norma.id} norma={norma} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          {/* Normas List View - Table Rows */}
          <div className="h-full overflow-y-auto">
            {/* Table Header */}
            <div className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm border-b">
              <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-5">Título</div>
                <div className="col-span-2">Fecha Publicación</div>
                <div className="col-span-2">Tipo</div>
                <div className="col-span-2">Boletín Oficial</div>
                <div className="col-span-1 text-right">Acciones</div>
              </div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-border">
              {data.normas.map((norma, index) => (
                <div
                  key={norma.id}
                  className={`grid grid-cols-12 gap-4 px-4 py-3 transition-colors cursor-pointer group ${
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/80'
                  } hover:bg-muted/50`}
                  onClick={() => window.location.href = `/normas/${norma.infoleg_id}`}
                >
                  {/* Title Column */}
                  <div className="col-span-5 flex flex-col gap-1 min-w-0">
                    <h3 className="text-sm font-serif font-bold text-foreground truncate group-hover:text-primary">
                      {norma.titulo_resumido || norma.titulo_sumario || 'Sin título'}
                    </h3>
                   
                  </div>

                  {/* Date Column */}
                  <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                    {norma.publicacion ? (
                      <span>{formatDate(norma.publicacion)}</span>
                    ) : (
                      <span className="text-xs">-</span>
                    )}
                  </div>

                  {/* Type Column */}
                  <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                    {norma.tipo_norma ? (
                      <span>{norma.tipo_norma}</span>
                    ) : (
                      <span className="text-xs">-</span>
                    )}
                  </div>

                  {/* Boletín Column */}
                  <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                    {norma.nro_boletin ? (
                      <span className="truncate">
                        B.O. {norma.nro_boletin}{norma.pag_boletin ? ` • pág. ${norma.pag_boletin}` : ''}
                      </span>
                    ) : (
                      <span className="text-xs">-</span>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/normas/${norma.infoleg_id}`;
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://www.argentina.gob.ar/normativa/nacional/${norma.infoleg_id}`, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pagination - Fixed at bottom */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3 border-t bg-background">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(0, (data.offset || 0) - (data.limit || 12)))}
            disabled={!hasPrevPage}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange((pageNum - 1) * (data.limit || 12))}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange((data.offset || 0) + (data.limit || 12))}
            disabled={!hasNextPage}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
