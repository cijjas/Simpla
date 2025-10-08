'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  FileText, 
  FolderOpen, 
  File,
  TrendingUp,
  MapPin,
  Tag,
  CheckCircle
} from 'lucide-react';
import { useNormasStats } from '../hooks/use-normas-stats';

interface NormasStatsProps {
  className?: string;
}

export function NormasStats({ className }: NormasStatsProps) {
  const {
    stats,
    loading,
    error,
    hasStats: _hasStats,
    totalNormas: _totalNormas,
    totalDivisions: _totalDivisions,
    totalArticles: _totalArticles,
    normasByJurisdiction: _normasByJurisdiction,
    normasByType: _normasByType,
    normasByStatus: _normasByStatus
  } = useNormasStats();

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Estadísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error al cargar estadísticas</h3>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const topJurisdictions = Object.entries(stats.normas_by_jurisdiction)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topTypes = Object.entries(stats.normas_by_type)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topStatuses = Object.entries(stats.normas_by_status)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estadísticas Generales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.total_normas.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Normas</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
                <FolderOpen className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {stats.total_divisions.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Divisiones</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
                <File className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.total_articles.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Artículos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* By Jurisdiction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              Por Jurisdicción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topJurisdictions.map(([jurisdiccion, count]) => {
                const percentage = (count / stats.total_normas) * 100;
                return (
                  <div key={jurisdiccion} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate">{jurisdiccion}</span>
                      <span className="font-medium">{count.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* By Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4" />
              Por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTypes.map(([tipo, count]) => {
                const percentage = (count / stats.total_normas) * 100;
                return (
                  <div key={tipo} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate">{tipo}</span>
                      <span className="font-medium">{count.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* By Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4" />
              Por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topStatuses.map(([estado, count]) => {
                const percentage = (count / stats.total_normas) * 100;
                const color = estado.toLowerCase() === 'vigente' ? 'bg-green-600' : 
                             estado.toLowerCase() === 'derogada' ? 'bg-red-600' : 'bg-yellow-600';
                return (
                  <div key={estado} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate">{estado}</span>
                      <span className="font-medium">{count.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <h3 className="text-lg font-semibold mb-2">Resumen del Sistema</h3>
            <p className="text-muted-foreground">
              El sistema contiene <strong>{stats.total_normas.toLocaleString()}</strong> normas 
              organizadas en <strong>{stats.total_divisions.toLocaleString()}</strong> divisiones 
              con un total de <strong>{stats.total_articles.toLocaleString()}</strong> artículos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
