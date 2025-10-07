'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Calendar, 
  MapPin, 
  Tag, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNormasSearch } from '../hooks/use-normas-search';

interface NormasListProps {
  // No props needed - uses context
}

export function NormasList({}: NormasListProps) {
  const {
    results: data,
    loading,
    handlePageChange: onPageChange,
    hasResults,
    totalCount,
    hasMore,
    currentPage,
    totalPages
  } = useNormasSearch();


  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificada';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getStatusColor = (estado?: string) => {
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

  const getTypeColor = (tipo?: string) => {
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

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

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
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Normas Encontradas</h2>
          <p className="text-muted-foreground">
            {totalCount.toLocaleString()} norma{totalCount !== 1 ? 's' : ''} encontrada{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Página {currentPage} de {totalPages}
        </div>
      </div>

      {/* Normas List */}
      <div className="space-y-4">
        {data.normas.map((norma) => (
          <Card 
            key={norma.id} 
            className="transition-all hover:shadow-md"
          >
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                      {norma.titulo_resumido || norma.titulo_sumario || 'Sin título'}
                    </h3>
                    {norma.titulo_sumario && norma.titulo_sumario !== norma.titulo_resumido && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                        {norma.titulo_sumario}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/normas/${norma.infoleg_id}`;
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalle
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://www.argentina.gob.ar/normativa/nacional/${norma.infoleg_id}`, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {norma.tipo_norma && (
                    <Badge className={getTypeColor(norma.tipo_norma)}>
                      <Tag className="h-3 w-3 mr-1" />
                      {norma.tipo_norma}
                    </Badge>
                  )}
                  {norma.clase_norma && norma.clase_norma.trim() && (
                    <Badge variant="outline">
                      {norma.clase_norma}
                    </Badge>
                  )}
                  {norma.estado && (
                    <Badge className={getStatusColor(norma.estado)}>
                      {norma.estado}
                    </Badge>
                  )}
                  {norma.jurisdiccion && (
                    <Badge variant="secondary">
                      <MapPin className="h-3 w-3 mr-1" />
                      {norma.jurisdiccion}
                    </Badge>
                  )}
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Sanción:</span>
                    <span>{formatDate(norma.sancion)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Publicación:</span>
                    <span>{formatDate(norma.publicacion)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Infoleg ID:</span>
                    <span className="font-mono">{norma.infoleg_id}</span>
                  </div>
                </div>

                {/* Observations */}
                {norma.observaciones && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {norma.observaciones}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(0, (data.offset || 0) - (data.limit || 50)))}
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
                  onClick={() => onPageChange((pageNum - 1) * (data.limit || 50))}
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
            onClick={() => onPageChange((data.offset || 0) + (data.limit || 50))}
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
